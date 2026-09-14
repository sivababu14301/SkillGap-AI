from flask import Blueprint, request, jsonify, session
from backend.db import get_db
import bcrypt
from datetime import datetime
from bson import ObjectId

auth_bp = Blueprint("auth", __name__)

def generate_next_user_id(db):
    count = db.users.count_documents({})
    idx = count + 1
    while True:
        candidate_id = f"USR{idx:03d}"
        if not db.users.find_one({"user_id": candidate_id}):
            return candidate_id
        idx += 1

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "user").strip()
    remember_key = data.get("remember_key", "").strip()

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email is already registered"}), 400

    # Generate unique custom User ID (e.g. USR001)
    user_id = generate_next_user_id(db)

    # Hash password
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": role,
        "status": "active",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    if remember_key:
        hashed_key = bcrypt.hashpw(remember_key.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user["recovery_token_hash"] = hashed_key

    result = db.users.insert_one(new_user)
    
    # Create simple session response
    user_session = {
        "mongo_id": str(result.inserted_id),
        "user_id": user_id,
        "user_name": name,
        "email": email,
        "role": role
    }

    return jsonify({"message": "Registration successful", "session": user_session}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    selected_role = data.get("role", "user").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user.get("status") == "inactive":
        return jsonify({"error": "Your account has been deactivated. Please contact support."}), 403

    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        return jsonify({"error": "Invalid email or password"}), 401

    # Role is determined by the database, no need to strictly enforce selected_role from frontend

    user_session = {
        "mongo_id": str(user["_id"]),
        "user_id": user.get("user_id", f"USR{str(user['_id'])[:4]}"),
        "user_name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }

    return jsonify({"message": "Login successful", "session": user_session}), 200
@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # We no longer rely on the simple boolean flag, we will verify the token in the next step.
    return jsonify({"message": "Email verified"}), 200

@auth_bp.route("/verify-recovery-token", methods=["POST"])
def verify_recovery_token():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    token = data.get("token", "")

    if not email or not token:
        return jsonify({"error": "Email and token are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user or "recovery_token_hash" not in user:
        return jsonify({"error": "Remember Access not configured or invalid"}), 403

    if not bcrypt.checkpw(token.encode('utf-8'), user["recovery_token_hash"].encode('utf-8')):
        return jsonify({"error": "Invalid recovery token. Remember Access verification failed."}), 403

    return jsonify({"message": "Remember Access verified"}), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    new_password = data.get("password", "")
    token = data.get("token", "")

    if not email or not new_password or not token:
        return jsonify({"error": "Email, new password, and recovery token are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user or "recovery_token_hash" not in user:
        return jsonify({"error": "Remember Access not configured or invalid"}), 403

    # Verify token before resetting
    if not bcrypt.checkpw(token.encode('utf-8'), user["recovery_token_hash"].encode('utf-8')):
        return jsonify({"error": "Invalid recovery token. Cannot reset password."}), 403

    # Hash new password
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Update in DB and clear the recovery token so it can only be used to recover once? 
    # Or keep it so they can use it again. The prompt says "Enable this device to recover your password". 
    # Let's just update the password and keep the token valid.
    db.users.update_one(
        {"email": email},
        {"$set": {"password": hashed_pw}}
    )

    return jsonify({"message": "Password reset successful!"}), 200
