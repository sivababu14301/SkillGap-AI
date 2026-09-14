from flask import Blueprint, jsonify, request
from bson import ObjectId
from datetime import datetime
from backend.db import get_db

notification_bp = Blueprint("notification_routes", __name__)

def get_current_user_details(db, header_id):
    """Returns (mongo_id, custom_user_id, email, role) for the current user."""
    if not header_id:
        return None, None, None, None
        
    user = None
    if len(header_id) == 24:
        user = db.users.find_one({"_id": ObjectId(header_id)})
    if not user:
        user = db.users.find_one({"user_id": header_id})
        
    if user:
        return str(user["_id"]), user.get("user_id"), user.get("email"), user.get("role")
    return None, None, None, None

@notification_bp.route("/", methods=["GET"])
def get_user_notifications():
    user_id_raw = request.headers.get("X-User-Id")
    if not user_id_raw:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    mongo_id, custom_id, email, role = get_current_user_details(db, user_id_raw)
    
    if not mongo_id:
        return jsonify({"error": "User not found"}), 404
        
    # Build OR query for recipient
    recipient_conditions = []
    
    # Normal users receive broadcast "all" notifications
    if role == "user":
        recipient_conditions.append({"recipient": "all"})
        
    if mongo_id: recipient_conditions.append({"recipient": mongo_id})
    if custom_id: recipient_conditions.append({"recipient": custom_id})
    if email: recipient_conditions.append({"recipient": email})
    
    if not recipient_conditions:
        return jsonify([]), 200

    try:
        notifications = list(db.notifications.find({
            "$or": recipient_conditions
        }).sort("date", -1))
        
        result = []
        for notif in notifications:
            if mongo_id in notif.get("cleared_by", []):
                continue
                
            notif["_id"] = str(notif["_id"])
            # Fallback for date field (old notifications might use 'date', new ones might use 'createdAt')
            if "createdAt" not in notif and "date" in notif:
                notif["createdAt"] = notif["date"]
                
            # Determine read status from read_by array
            read_by = notif.get("read_by", [])
            notif["read"] = mongo_id in read_by
            
            result.append(notif)
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch notifications", "details": str(e)}), 500

@notification_bp.route("/<notif_id>/read", methods=["POST"])
def mark_notification_read(notif_id):
    user_id_raw = request.headers.get("X-User-Id")
    if not user_id_raw:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    mongo_id, _, _, _ = get_current_user_details(db, user_id_raw)
    
    if not mongo_id:
        return jsonify({"error": "User not found"}), 404
        
    try:
        # Add user's mongo_id to the read_by array
        result = db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$addToSet": {"read_by": mongo_id}}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify({"success": True, "message": "Notification marked as read"}), 200
        else:
            return jsonify({"error": "Notification not found"}), 404
    except Exception as e:
        return jsonify({"error": "Failed to update notification", "details": str(e)}), 500

@notification_bp.route("/clear", methods=["POST"])
def clear_user_notifications():
    user_id_raw = request.headers.get("X-User-Id")
    if not user_id_raw:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    mongo_id, custom_id, email, role = get_current_user_details(db, user_id_raw)
    
    if not mongo_id:
        return jsonify({"error": "User not found"}), 404
        
    recipient_conditions = []
    if role == "user":
        recipient_conditions.append({"recipient": "all"})
    if mongo_id: recipient_conditions.append({"recipient": mongo_id})
    if custom_id: recipient_conditions.append({"recipient": custom_id})
    if email: recipient_conditions.append({"recipient": email})
    
    if not recipient_conditions:
        return jsonify({"success": True}), 200

    try:
        # Add user's ID to `cleared_by` array for all their notifications
        db.notifications.update_many(
            {"$or": recipient_conditions},
            {"$addToSet": {"cleared_by": mongo_id}}
        )
        return jsonify({"success": True, "message": "All notifications cleared."}), 200
    except Exception as e:
        return jsonify({"error": "Failed to clear notifications", "details": str(e)}), 500
