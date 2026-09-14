from flask import Blueprint, jsonify
from backend.db import get_db

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/user/<user_id>", methods=["GET"])
def get_dashboard_stats(user_id):
    db = get_db()
    
    # Get resumes count
    resumes_count = db.resumes.count_documents({"user_id": user_id})
    
    # Get latest analysis
    analysis = db.skill_analysis.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    
    if analysis:
        match_percentage = analysis.get("match_percentage", 0)
        skills_detected = len(analysis.get("matched_skills", []))
        readiness = analysis.get("placement_readiness", 0)
        recent_role = analysis.get("selected_role", "Unknown")
        recent_date = analysis.get("created_at", "")
        analysis["_id"] = str(analysis["_id"])
    else:
        match_percentage = 0
        skills_detected = 0
        readiness = 0
        recent_role = None
        recent_date = None

    return jsonify({
        "resumes_uploaded": resumes_count,
        "skills_detected": skills_detected,
        "match_percentage": match_percentage,
        "placement_readiness": readiness,
        "recent_role": recent_role,
        "recent_date": recent_date,
        "latest_analysis": analysis
    }), 200
