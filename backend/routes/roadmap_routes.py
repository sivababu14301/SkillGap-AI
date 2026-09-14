from flask import Blueprint, request, jsonify
from backend.db import get_db
import math
from datetime import datetime
from bson import ObjectId
import os
import json
from groq import Groq, APIError, APIConnectionError, RateLimitError, AuthenticationError

roadmap_bp = Blueprint("roadmap", __name__)

def generate_dynamic_phases(skills, missing_skills, matched_skills, role_name):
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    if not groq_api_key:
        raise Exception("GROQ_API_KEY is not set.")
        
    system_prompt = f"""You are an expert Career Mentor and Technical Instructor. Your job is to create a 100% job-specific and highly accurate learning roadmap for the role of '{role_name}'.

You MUST return the output EXACTLY as a valid json object matching this exact schema:
{{
  "beginner": [
    {{ "name": "Skill Name", "topics": ["Topic 1", "Topic 2"], "why_it_matters": "Reason...", "difficulty": "Beginner", "duration": "1 Week", "task": "Task description", "resource": "Official Documentation Link" }}
  ],
  "intermediate": [ ... ],
  "advanced": [ ... ],
  "placement": [ ... ]
}}

CRITICAL RULES:
1. YOU MUST STRICTLY USE THESE FOUR PHASES: "beginner", "intermediate", "advanced", and "placement".
2. PRIORITIZE MISSING SKILLS: The skills listed in "Missing Skills to learn" are the most critical. You must break them down and teach them across the Beginner, Intermediate, and Advanced phases depending on their complexity.
3. MATCHED SKILLS (ALREADY KNOWN): For skills listed in "Skills already matched/known", do NOT make the user relearn them from scratch. If you include them, mark them clearly as "Review [Skill]" or "Advanced [Skill] Deep Dive" and keep them brief.
4. ABSOLUTELY NO GENERIC CONTENT: Do NOT add generic skills like Docker, Kubernetes, GraphQL, or TypeScript UNLESS they are explicitly listed in the Missing or Matched skills for this role, or are universally mandatory for this specific job role (e.g. Accountant does NOT need Docker).
5. NON-IT SUPPORT: If the role is Non-IT (e.g., Accountant, Mechanical Engineer, Nurse), the roadmap MUST strictly contain tools and concepts for that specific industry (e.g., Tally, AutoCAD). DO NOT force IT skills.
6. PLACEMENT PHASE: The "placement" phase must contain role-specific placement preparation. For example: "Portfolio Case Studies", "Technical Mock Interviews", "Resume Polish", "Role-specific Interview Questions".
7. RESOURCE LINKS: Provide realistic and specific resource names (e.g., "React Official Docs", "Tally ERP Guide", "MDN Web Docs").
8. Do NOT leave any of the 4 arrays empty.
9. Output ONLY valid json, without any markdown formatting, backticks, or extra text."""

    user_prompt = f"Role: {role_name}\nAll Required Skills for Role: {', '.join(skills)}\nMissing Skills to learn: {', '.join(missing_skills) if missing_skills else 'None'}\nSkills already matched/known: {', '.join(matched_skills) if matched_skills else 'None'}"
    
    try:
        client = Groq(api_key=groq_api_key)
        response = client.chat.completions.create(
            model=groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=8000,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if "{" in content and "}" in content:
            start = content.find("{")
            end = content.rfind("}") + 1
            clean_json = content[start:end]
            parsed = json.loads(clean_json)
            return parsed
            
    except Exception as e:
        print("Error generating detailed roadmap:", str(e))
        raise e

@roadmap_bp.route("/generate", methods=["POST"])
def generate_roadmap():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    role_name = data.get("selected_role")
    
    if not user_id or not role_name:
        return jsonify({"error": "user_id and selected_role are required"}), 400
        
    db = get_db()
    
    # 1. Get exact job role from MongoDB
    job_role = db.job_roles.find_one({"title": {"$regex": f"^{role_name}$", "$options": "i"}})
    
    required_skills = []
    roadmap_structure = None
    
    if job_role:
        required_skills = job_role.get("skills", [])
        roadmap_structure = job_role.get("roadmap")
    else:
        required_skills = data.get("skills", [])
        roadmap_structure = data.get("roadmap")
        
    if not required_skills or len(required_skills) == 0:
        return jsonify({"error": f"Required skills for '{role_name}' could not be loaded."}), 404
    
    # 2. Get user's skill analysis to know what they have/miss
    analysis = db.skill_analysis.find_one(
        {"user_id": user_id, "selected_role": role_name},
        sort=[("created_at", -1)]
    )
    
    if not analysis:
        analysis = db.skill_analysis.find_one({"user_id": user_id}, sort=[("created_at", -1)])
        
    user_skills = analysis.get("matched_skills", []) + analysis.get("missing_skills", []) + analysis.get("additional_skills", []) if analysis else []
    
    # 3. Compare required skills with user's detected skills
    matched_skills = []
    missing_skills = []
    
    user_skills_lower = [s.lower() for s in user_skills]
    for req_skill in required_skills:
        req_lower = req_skill.lower()
        is_matched = any(
            (u == req_lower or u in req_lower or req_lower in u) 
            for u in user_skills_lower
        )
        if is_matched:
            matched_skills.append(req_skill)
        else:
            missing_skills.append(req_skill)
            
    match_percentage = round((len(matched_skills) / len(required_skills) * 100)) if required_skills else 0
    
    # 4. Generate the roadmap structure dynamically based on missing skills
    roadmap_structure = generate_dynamic_phases(required_skills, missing_skills, matched_skills, role_name)
        
    # Save the generated roadmap back to DB to fulfill requirement
    roadmap_record = {
        "user_id": user_id,
        "selected_role": role_name,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
        "phases": roadmap_structure,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    db.learning_roadmaps.update_one(
        {"user_id": user_id, "selected_role": role_name, "type": "user_roadmap"},
        {"$set": {**roadmap_record, "type": "user_roadmap"}},
        upsert=True
    )
    
    return jsonify({
        "message": "Roadmap generated successfully",
        "role": role_name,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
        "roadmap": roadmap_structure
    }), 200

@roadmap_bp.route("/user/<user_id>", methods=["GET"])
def get_roadmap(user_id):
    role_name = request.args.get("role")
    db = get_db()
    
    query = {"user_id": user_id, "type": "user_roadmap"}
    if role_name:
        query["selected_role"] = role_name
        
    roadmap = db.learning_roadmaps.find_one(query, sort=[("created_at", -1)])
    if not roadmap:
        return jsonify({"error": "Roadmap not found"}), 404
        
    roadmap["_id"] = str(roadmap["_id"])
    return jsonify(roadmap), 200

@roadmap_bp.route("/progress", methods=["PUT"])
def update_progress():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    role_name = data.get("role_name")
    skill_name = data.get("skill_name")
    completed = data.get("completed", False)
    
    if not user_id or not role_name or not skill_name:
        return jsonify({"error": "Missing required fields"}), 400
        
    db = get_db()
    
    progress_entry = {
        "user_id": user_id,
        "role_name": role_name,
        "skill_name": skill_name
    }
    
    if completed:
        db.roadmap_progress.update_one(
            progress_entry,
            {"$set": {**progress_entry, "completed_at": datetime.utcnow().isoformat() + "Z"}},
            upsert=True
        )
    else:
        db.roadmap_progress.delete_one(progress_entry)
        
    total_completed = db.roadmap_progress.count_documents({"user_id": user_id, "role_name": role_name})
    
    return jsonify({"message": "Progress updated", "skill": skill_name, "completed": completed, "total_completed": total_completed}), 200

@roadmap_bp.route("/progress/user/<user_id>", methods=["GET"])
def get_progress(user_id):
    role_name = request.args.get("role")
    db = get_db()
    
    query = {"user_id": user_id}
    if role_name:
        query["role_name"] = role_name
        
    completed_skills = list(db.roadmap_progress.find(query))
    for s in completed_skills:
        s["_id"] = str(s["_id"])
        
    return jsonify(completed_skills), 200
