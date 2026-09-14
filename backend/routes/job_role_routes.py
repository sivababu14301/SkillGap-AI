from flask import Blueprint, request, jsonify
from backend.db import get_db
from bson import ObjectId

job_role_bp = Blueprint("job_role", __name__)

@job_role_bp.route("/roles", methods=["GET"])
def get_all_roles():
    db = get_db()
    roles = list(db.job_roles.find())
    for r in roles:
        r["_id"] = str(r["_id"])
        r["id"] = r["_id"] # frontend compatibility
    return jsonify(roles), 200

@job_role_bp.route("/roles", methods=["POST"])
def add_role():
    data = request.get_json() or {}
    title = data.get("title")
    desc = data.get("desc", "")
    cat = data.get("cat", "development")
    icon = data.get("icon", "fas fa-briefcase")
    domain = data.get("domain", "IT")
    skills = data.get("skills", [])

    if not title:
        return jsonify({"error": "Role title is required"}), 400

    db = get_db()
    # Check if duplicate title
    if db.job_roles.find_one({"title": title}):
        return jsonify({"error": "Job role with this title already exists"}), 400

    new_role = {
        "title": title,
        "desc": desc,
        "cat": cat,
        "icon": icon,
        "domain": domain,
        "skills": skills
    }

    result = db.job_roles.insert_one(new_role)
    new_role["_id"] = str(result.inserted_id)
    new_role["id"] = new_role["_id"]

    return jsonify({"message": "Job role added successfully", "role": new_role}), 201

@job_role_bp.route("/roles/<role_id>", methods=["PUT"])
def update_role(role_id):
    data = request.get_json() or {}
    db = get_db()

    update_fields = {}
    if "title" in data: update_fields["title"] = data["title"]
    if "desc" in data: update_fields["desc"] = data["desc"]
    if "cat" in data: update_fields["cat"] = data["cat"]
    if "icon" in data: update_fields["icon"] = data["icon"]
    if "domain" in data: update_fields["domain"] = data["domain"]
    if "skills" in data: update_fields["skills"] = data["skills"]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    result = db.job_roles.update_one({"_id": ObjectId(role_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Job role not found"}), 404

    updated_role = db.job_roles.find_one({"_id": ObjectId(role_id)})
    updated_role["_id"] = str(updated_role["_id"])
    updated_role["id"] = updated_role["_id"]

    return jsonify({"message": "Job role updated successfully", "role": updated_role}), 200

@job_role_bp.route("/roles/<role_id>", methods=["DELETE"])
def delete_role(role_id):
    db = get_db()
    result = db.job_roles.delete_one({"_id": ObjectId(role_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Job role not found"}), 404
    return jsonify({"message": "Job role deleted successfully"}), 200


# --- Courses / Learning Content ---
@job_role_bp.route("/courses", methods=["GET"])
def get_all_courses():
    db = get_db()
    courses = list(db.learning_roadmaps.find())
    for c in courses:
        c["_id"] = str(c["_id"])
        c["id"] = c["_id"] # frontend compatibility
    return jsonify(courses), 200

@job_role_bp.route("/courses", methods=["POST"])
def add_course():
    data = request.get_json() or {}
    name = data.get("name")
    platform = data.get("platform", "Udemy")
    skill = data.get("skill", "")
    level = data.get("level", "Beginner")
    duration = data.get("duration", "")
    url = data.get("url", "#")

    if not name:
        return jsonify({"error": "Course name is required"}), 400

    db = get_db()
    new_course = {
        "name": name,
        "platform": platform,
        "skill": skill,
        "level": level,
        "duration": duration,
        "url": url
    }

    result = db.learning_roadmaps.insert_one(new_course)
    new_course["_id"] = str(result.inserted_id)
    new_course["id"] = new_course["_id"]

    return jsonify({"message": "Course added successfully", "course": new_course}), 201

@job_role_bp.route("/courses/<course_id>", methods=["PUT"])
def update_course(course_id):
    data = request.get_json() or {}
    db = get_db()

    update_fields = {}
    if "name" in data: update_fields["name"] = data["name"]
    if "platform" in data: update_fields["platform"] = data["platform"]
    if "skill" in data: update_fields["skill"] = data["skill"]
    if "level" in data: update_fields["level"] = data["level"]
    if "duration" in data: update_fields["duration"] = data["duration"]
    if "url" in data: update_fields["url"] = data["url"]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    result = db.learning_roadmaps.update_one({"_id": ObjectId(course_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Course not found"}), 404

    updated_course = db.learning_roadmaps.find_one({"_id": ObjectId(course_id)})
    updated_course["_id"] = str(updated_course["_id"])
    updated_course["id"] = updated_course["_id"]

    return jsonify({"message": "Course updated successfully", "course": updated_course}), 200

@job_role_bp.route("/courses/<course_id>", methods=["DELETE"])
def delete_course(course_id):
    db = get_db()
    result = db.learning_roadmaps.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Course not found"}), 404
    return jsonify({"message": "Course deleted successfully"}), 200
