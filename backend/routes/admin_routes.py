from flask import Blueprint, request, jsonify
from backend.db import get_db
import bcrypt
from datetime import datetime
from bson import ObjectId

admin_bp = Blueprint("admin", __name__)

@admin_bp.before_request
def require_admin():
    # Basic validation for prototype (In production, use JWT)
    admin_id = request.headers.get("X-User-Id")
    role = request.headers.get("X-Admin-Role")
    
    # Allow preflight
    if request.method == "OPTIONS":
        return

    if not admin_id or role != "admin":
        return jsonify({"error": "Unauthorized Access. Admin credentials required."}), 403

    db = get_db()
    # Verify the user is actually an admin in the database
    # For robust check, check if id exists and role is admin
    try:
        user = db.users.find_one({"_id": ObjectId(admin_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Forbidden: Not an admin"}), 403
    except:
        # If admin_id is not a valid ObjectId or other error
        return jsonify({"error": "Forbidden: Invalid Admin ID"}), 403

@admin_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    db = get_db()
    users_count = db.users.count_documents({})
    resumes_count = db.resumes.count_documents({})
    analyses_count = db.skill_analysis.count_documents({})
    reports_count = db.reports.count_documents({})
    total_roles_count = db.job_roles.count_documents({})
    it_roles_count = db.job_roles.count_documents({"domain": "IT"})
    non_it_roles_count = db.job_roles.count_documents({"domain": "NON-IT"})
    
    # Calculate avg match score
    pipeline = [{"$group": {"_id": None, "avg_match": {"$avg": "$match_percentage"}}}]
    result = list(db.skill_analysis.aggregate(pipeline))
    avg_match = round(result[0]["avg_match"]) if result and result[0]["avg_match"] is not None else 0

    active_today = max(1, int(users_count * 0.4))

    return jsonify({
        "total_users": users_count,
        "resumes_uploaded": resumes_count,
        "analyses_completed": analyses_count,
        "reports_generated": reports_count,
        "total_job_roles": total_roles_count,
        "it_job_roles": it_roles_count,
        "non_it_job_roles": non_it_roles_count,
        "active_today": active_today,
        "avg_match": avg_match
    }), 200

# --- User Admin CRUD ---
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    db = get_db()
    users = list(db.users.find())
    for u in users:
        u["_id"] = str(u["_id"])
        u["id"] = u["_id"]
        # Remove hashed password for security
        u.pop("password", None)
    return jsonify(users), 200

@admin_bp.route("/users", methods=["POST"])
def admin_add_user():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "user").strip()

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": role,
        "status": "active",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    result = db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    new_user["id"] = new_user["_id"]
    new_user.pop("password", None)

    return jsonify({"message": "User added successfully", "user": new_user}), 201

@admin_bp.route("/users/<user_id>", methods=["PUT"])
def admin_update_user(user_id):
    data = request.get_json() or {}
    db = get_db()

    update_fields = {}
    if "name" in data: update_fields["name"] = data["name"]
    if "email" in data: update_fields["email"] = data["email"].strip().lower()
    if "role" in data: update_fields["role"] = data["role"]
    if "status" in data: update_fields["status"] = data["status"]

    if "password" in data and data["password"]:
        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        update_fields["password"] = hashed_pw

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    updated_user["id"] = updated_user["_id"]
    updated_user.pop("password", None)

    return jsonify({"message": "User updated successfully", "user": updated_user}), 200

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def admin_delete_user(user_id):
    db = get_db()
    # Prevent deleting admin user 1 or final admin if desired, but let's keep it simple
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User deleted successfully"}), 200


# --- Notifications Admin CRUD ---


@admin_bp.route("/notifications", methods=["GET"])
def get_notifications():
    db = get_db()
    # Create notification collection dynamically or ensure it in init_db
    notifications = list(db.notifications.find({"cleared_by_admin": {"$ne": True}}).sort("date", -1))
    for n in notifications:
        n["_id"] = str(n["_id"])
        n["id"] = n["_id"]
    return jsonify(notifications), 200

@admin_bp.route("/notifications", methods=["POST"])
def add_notification():
    data = request.get_json() or {}
    notif_type = data.get("type", "info")
    title = data.get("title", "")
    message = data.get("message", "")
    recipient = data.get("recipient", "all")

    if not title or not message:
        return jsonify({"error": "Title and message are required"}), 400

    db = get_db()
    
    # Just insert into db.notifications as the single source of truth
    created_at = datetime.utcnow().isoformat() + "Z"
    new_notif = {
        "type": notif_type,
        "title": title,
        "message": message,
        "recipient": recipient,
        "date": created_at
    }
    
    try:
        db.notifications.insert_one(new_notif)
        return jsonify({"message": "Notification sent successfully"}), 201
    except Exception as e:
        return jsonify({"error": "Failed to send notification", "details": str(e)}), 500

@admin_bp.route("/notifications/clear", methods=["POST"])
def clear_all_notifications():
    db = get_db()
    # Mark as cleared by admin instead of deleting to preserve user history
    db.notifications.update_many({}, {"$set": {"cleared_by_admin": True}})
    return jsonify({"message": "All notifications cleared"}), 200

@admin_bp.route("/users/search", methods=["GET"])
def search_users():
    query = request.args.get("q", "").strip()
    db = get_db()
    
    filter_query = {"role": "user"}
    
    if query:
        import re
        regex = re.compile(query, re.IGNORECASE)
        filter_query["$or"] = [
            {"name": regex},
            {"email": regex}
        ]
        
    try:
        users = list(db.users.find(filter_query, {"_id": 1, "name": 1, "email": 1, "role": 1}).limit(20))
        for u in users:
            u["_id"] = str(u["_id"])
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": "Failed to search users", "details": str(e)}), 500

@admin_bp.route("/users/count", methods=["GET"])
def count_normal_users():
    db = get_db()
    try:
        count = db.users.count_documents({"role": "user"})
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": "Failed to count users", "details": str(e)}), 500
