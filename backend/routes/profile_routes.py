from flask import Blueprint, request, jsonify
from backend.db import get_db

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/<user_id>", methods=["GET"])
def get_profile(user_id):
    db = get_db()
    user = db.users.find_one({"user_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Remove sensitive fields
    user.pop("password", None)
    user.pop("_id", None)
    
    return jsonify({"profile": user}), 200

@profile_bp.route("/<user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json() or {}
    db = get_db()
    
    user = db.users.find_one({"user_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Fields allowed to update
    update_data = {}
    allowed_fields = [
        "name", "email", "phone", "location", "education", 
        "college", "graduationYear", "careerGoal", 
        "linkedin", "github", "bio", "profilePhoto"
    ]
    
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
            
    if update_data:
        db.users.update_one({"user_id": user_id}, {"$set": update_data})
        
    # Fetch updated user
    updated_user = db.users.find_one({"user_id": user_id})
    updated_user.pop("password", None)
    updated_user.pop("_id", None)
    
    return jsonify({"message": "Profile updated successfully", "profile": updated_user}), 200
