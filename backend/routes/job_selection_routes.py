from flask import Blueprint, request, jsonify
from backend.db import get_db
from datetime import datetime

job_selection_bp = Blueprint("job_selection", __name__)

@job_selection_bp.route("", methods=["POST"])
def save_job_selection():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    selected_job_role = data.get("selected_job_role")
    resume_id = data.get("resume_id")
    
    if not user_id or not selected_job_role:
        return jsonify({"error": "user_id and selected_job_role are required"}), 400

    db = get_db()
    
    job_role = db.job_roles.find_one({"title": selected_job_role})
    required_skills = job_role.get("skills", []) if job_role else []

    selection = {
        "user_id": user_id,
        "selected_job_role": selected_job_role,
        "resume_id": resume_id,
        "required_skills": required_skills,
        "selected_at": datetime.utcnow().isoformat() + "Z"
    }

    db.job_selections.update_one(
        {"user_id": user_id},
        {"$set": selection},
        upsert=True
    )
    
    return jsonify({"message": "Job selection saved", "selection": selection}), 201

@job_selection_bp.route("/user/<user_id>", methods=["GET"])
def get_job_selection(user_id):
    db = get_db()
    selection = db.job_selections.find_one({"user_id": user_id}, sort=[("selected_at", -1)])
    if not selection:
        return jsonify({"error": "No job selection found"}), 404
        
    selection["_id"] = str(selection["_id"])
    return jsonify(selection), 200
