from flask import Blueprint, request, jsonify
from backend.db import get_db
from datetime import datetime
from bson import ObjectId

report_bp = Blueprint("report", __name__)

@report_bp.route("", methods=["POST"])
def save_report():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    report_name = data.get("report_name", "Skill Gap Report")
    report_data = data.get("report_data", {})
    report_type = data.get("report_type", "skill-gap") # extra for dashboard
    report_format = data.get("report_format", "PDF") # extra for dashboard

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    db = get_db()
    user = db.users.find_one({"user_id": user_id})
    if not user:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None
    user_name = user.get("name", "Unknown User") if user else "Unknown User"

    new_report = {
        "user_id": user_id,
        "user_name": user_name,
        "report_name": report_name,
        "report_data": report_data,
        "report_type": report_type,
        "report_format": report_format,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

    result = db.reports.insert_one(new_report)
    new_report["_id"] = str(result.inserted_id)

    return jsonify({"message": "Report saved successfully", "report": new_report}), 201

@report_bp.route("/user/<user_id>", methods=["GET"])
def get_user_reports(user_id):
    db = get_db()
    reports = list(db.reports.find({"user_id": user_id}))
    for r in reports:
        r["_id"] = str(r["_id"])
    return jsonify(reports), 200

@report_bp.route("/all", methods=["GET"])
def get_all_reports():
    db = get_db()
    reports = list(db.reports.find())
    for r in reports:
        r["_id"] = str(r["_id"])
        # Format for frontend compatibility
        r["id"] = r["_id"]
        r["name"] = r.get("report_name")
        r["type"] = r.get("report_type")
        r["userName"] = r.get("user_name")
        r["date"] = r.get("generated_at")
        r["format"] = r.get("report_format")
    return jsonify(reports), 200
