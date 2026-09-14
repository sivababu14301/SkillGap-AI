from flask import Blueprint, request, jsonify
from backend.db import get_db
from datetime import datetime
from bson import ObjectId

analysis_bp = Blueprint("analysis", __name__)

@analysis_bp.route("", methods=["POST"])
def save_analysis():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    resume_id = data.get("resume_id")
    selected_role = data.get("selected_role")
    matched_skills = data.get("matched_skills", [])
    missing_skills = data.get("missing_skills", [])
    additional_skills = data.get("additional_skills", []) # extra
    match_percentage = data.get("match_percentage", 0)
    resume_score = data.get("resume_score", 0)
    ats_score = data.get("ats_score", 0)
    placement_readiness = data.get("placement_readiness", 0)
    
    if not user_id or not selected_role:
        return jsonify({"error": "user_id and selected_role are required"}), 400

    db = get_db()
    user = db.users.find_one({"user_id": user_id})
    if not user:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None
    user_name = user.get("name", "Unknown User") if user else "Unknown User"

    new_analysis = {
        "user_id": user_id,
        "resume_id": resume_id,
        "user_name": user_name,
        "selected_role": selected_role,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "additional_skills": additional_skills,
        "match_percentage": int(match_percentage),
        "resume_score": int(resume_score),
        "ats_score": int(ats_score),
        "placement_readiness": int(placement_readiness),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    result = db.skill_analysis.insert_one(new_analysis)
    new_analysis["_id"] = str(result.inserted_id)

    return jsonify({"message": "Analysis saved successfully", "analysis": new_analysis}), 201

@analysis_bp.route("/user/<user_id>", methods=["GET"])
def get_user_analyses(user_id):
    db = get_db()
    analyses = list(db.skill_analysis.find({"user_id": user_id}))
    for a in analyses:
        a["_id"] = str(a["_id"])
    return jsonify(analyses), 200

@analysis_bp.route("/calculate", methods=["POST"])
def calculate_analysis():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    db = get_db()
    
    # Get user
    user = db.users.find_one({"user_id": user_id})
    if not user:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None
    user_name = user.get("name", "Unknown User") if user else "Unknown User"

    # Fetch latest job selection
    job_selection = db.job_selections.find_one(
        {"user_id": user_id},
        sort=[("selected_at", -1)]
    )
    if not job_selection:
        return jsonify({"error": "No job selection found for user"}), 404
        
    selected_role_name = job_selection.get("selected_job_role", "").strip()
    
    # Fetch latest resume
    resume = db.resumes.find_one(
        {"user_id": user_id},
        sort=[("uploaded_at", -1)]
    )
    if not resume:
        return jsonify({"error": "No resume found for user"}), 404
        
    resume_id = str(resume["_id"])
    extracted_skills = resume.get("extracted_skills", [])
    
    # Fetch required skills from DB
    import re
    db_role = db.job_roles.find_one({"title": re.compile(f"^{re.escape(selected_role_name)}$", re.IGNORECASE)})
    required_skills = db_role.get("skills", []) if db_role else []
    
    if not db_role or not required_skills:
        return jsonify({"error": f"Role '{selected_role_name}' not found or has no required skills in the dataset."}), 404
    
    # Calculate matched and missing
    matched_skills = []
    missing_skills = []
    
    normalized_user_skills = [s.lower().strip() for s in extracted_skills]
    
    for req in required_skills:
        if req.lower().strip() in normalized_user_skills:
            matched_skills.append(req)
        else:
            missing_skills.append(req)
            
    # Calculate additional skills
    additional_skills = []
    normalized_req_skills = [s.lower().strip() for s in required_skills]
    
    for usr in extracted_skills:
        if usr.lower().strip() not in normalized_req_skills and usr.lower().strip() not in [s.lower().strip() for s in additional_skills]:
            additional_skills.append(usr)
            
    # Percentages
    match_percentage = 0
    if len(required_skills) > 0:
        match_percentage = round((len(matched_skills) / len(required_skills)) * 100)
        
    # Scores
    has_projects = bool(resume.get("extracted_projects"))
    has_edu = bool(resume.get("extracted_education"))
    
    resume_score = min(100, round((match_percentage * 0.4) + (25 if has_projects else 5) + (15 if has_edu else 5) + 10))
    ats_score = min(100, resume_score + 4)
    placement_readiness = round((match_percentage + resume_score) / 2)
    
    new_analysis = {
        "user_id": user_id,
        "resume_id": resume_id,
        "user_name": user_name,
        "selected_role": selected_role_name,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "additional_skills": additional_skills,
        "match_percentage": match_percentage,
        "resume_score": resume_score,
        "ats_score": ats_score,
        "placement_readiness": placement_readiness,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    result = db.skill_analysis.insert_one(new_analysis)
    new_analysis["_id"] = str(result.inserted_id)

    # Return exactly what skills-gap.js expects
    return jsonify({
        "message": "Analysis calculated successfully",
        "analysis": new_analysis,
        "role": selected_role_name,
        "requiredSkills": required_skills,
        "userSkills": extracted_skills,
        "matched": matched_skills,
        "missing": missing_skills,
        "additional": additional_skills,
        "percentage": match_percentage,
        "resumeScore": resume_score,
        "atsScore": ats_score,
        "placementReadiness": placement_readiness
    }), 201

@analysis_bp.route("/user/<user_id>/role/<path:role_name>", methods=["GET"])
def get_user_role_analysis(user_id, role_name):
    db = get_db()
    # Sort by created_at DESC to get the latest
    analysis = db.skill_analysis.find_one(
        {"user_id": user_id, "selected_role": role_name},
        sort=[("created_at", -1)]
    )
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404
    analysis["_id"] = str(analysis["_id"])
    return jsonify(analysis), 200

@analysis_bp.route("/all", methods=["GET"])
def get_all_analyses():
    db = get_db()
    analyses = list(db.skill_analysis.find())
    for a in analyses:
        a["_id"] = str(a["_id"])
        # Format for frontend compatibility
        a["id"] = a["_id"]
        a["userName"] = a.get("user_name")
        a["role"] = a.get("selected_role")
        a["match"] = a.get("match_percentage")
        a["skillsFound"] = len(a.get("matched_skills", []))
        a["gapsFound"] = len(a.get("missing_skills", []))
        a["date"] = a.get("created_at")
    return jsonify(analyses), 200
