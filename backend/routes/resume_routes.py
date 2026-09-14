import os
import json
import re
from flask import Blueprint, request, jsonify
from backend.db import get_db
from datetime import datetime
from bson import ObjectId
from groq import Groq, APIError, APIConnectionError, RateLimitError, AuthenticationError

resume_bp = Blueprint("resume", __name__)

def parse_groq_json(content):
    json_str = re.sub(r'```json|```', '', content).strip()
    try:
        return json.loads(json_str)
    except Exception:
        match = re.search(r'\{[\s\S]*\}', json_str)
        if match:
            return json.loads(match.group(0))
        return {}

def test_groq_connection(client, model):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Reply with OK"}],
            max_tokens=10
        )
        print("[RESUME] Groq connection successful")
        return True, None
    except AuthenticationError as e:
        return False, {"error": "INVALID_API_KEY", "details": "Groq API key is invalid or missing.", "raw": str(e), "status": 401}
    except RateLimitError as e:
        return False, {"error": "RATE_LIMIT_EXCEEDED", "details": "Groq rate limit reached. Please try again shortly.", "raw": str(e), "status": 429}
    except APIConnectionError as e:
        return False, {"error": "CONNECTION_FAILED", "details": "Failed to connect to Groq API.", "raw": str(e), "status": 502}
    except APIError as e:
        # This covers model not found, etc.
        return False, {"error": "GROQ_API_ERROR", "details": f"Configured Groq model error: {str(e)}", "raw": str(e), "status": 400}
    except Exception as e:
        return False, {"error": "INTERNAL_ERROR", "details": "Unexpected error connecting to Groq.", "raw": str(e), "status": 500}


@resume_bp.route("", methods=["POST"])
def save_resume():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    file_name = data.get("file_name", "resume.pdf")
    file_type = data.get("file_type", "pdf")
    file_size = data.get("file_size", "0 KB")
    resume_text = data.get("resume_text", "")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    print(f"[RESUME] Extracted text length: {len(resume_text)}")

    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    if not groq_api_key:
        print("[RESUME] Groq API key loaded: NO")
        return jsonify({"error": "INVALID_API_KEY", "details": "GROQ_API_KEY is missing"}), 401
    
    print(f"[RESUME] Calling Groq API with model: {groq_model}")
    client = Groq(api_key=groq_api_key)

    # 1. Health Test Connection
    success, error_data = test_groq_connection(client, groq_model)
    if not success:
        print(f"[RESUME] GROQ ERROR\nStatus: {error_data['status']}\nMessage: {error_data['raw']}")
        return jsonify(error_data), error_data["status"]
    
    ai_data = {}
    extracted_skills = []
    
    if resume_text.strip():
        system_prompt = (
            "You are an expert HR AI assistant. Extract information from the resume text below and output it EXACTLY in the following JSON structure. "
            "CRITICAL INSTRUCTION: You MUST extract ALL occurrences of each category. For example, if the resume lists 3 education entries, 4 certifications, and 4 projects, your JSON arrays MUST contain 3, 4, and 4 objects respectively. Do NOT stop after extracting just the first one.\n"
            "If sections aren't explicitly named, infer them from context.\n"
            "Output ONLY valid json.\n\n"
            "{\n"
            "  \"skills\": [\"...\"],\n"
            "  \"education\": [\n"
            "    {\"degree\": \"...\", \"institution\": \"...\", \"start_year\": \"...\", \"end_year\": \"...\", \"score\": \"...\"}\n"
            "  ],\n"
            "  \"experience\": [\n"
            "    {\"title\": \"...\", \"company\": \"...\", \"duration\": \"...\", \"description\": \"...\"}\n"
            "  ],\n"
            "  \"projects\": [\n"
            "    {\"name\": \"...\", \"year\": \"...\", \"institution\": \"...\", \"duration\": \"...\", \"description\": \"...\", \"technologies\": [\"...\"]}\n"
            "  ],\n"
            "  \"certifications\": [\n"
            "    {\"name\": \"...\", \"issuer\": \"...\", \"date\": \"\"}\n"
            "  ],\n"
            "  \"resume_text\": \"...\"\n"
            "}"
        )
        
        user_prompt = f"Resume text:\n\n{resume_text}"
        
        print("[RESUME] Extracting resume data...")
        try:
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
            print(f"[RESUME] AI Response length: {len(content)}")
            ai_data = parse_groq_json(content)
            
            if not ai_data.get("resume_text"):
                ai_data["resume_text"] = resume_text
            
            tech = ai_data.get("skills", [])
            soft = ai_data.get("soft_skills", [])
            if not isinstance(tech, list):
                tech = [tech] if tech else []
            if not isinstance(soft, list):
                soft = [soft] if soft else []
            extracted_skills = tech + soft
                
        except AuthenticationError as e:
            err_msg = str(e)
            print(f"[RESUME] GROQ ERROR\nStatus: 401\nMessage: {err_msg}")
            return jsonify({"error": "INVALID_API_KEY", "details": "Groq API key is invalid or missing."}), 401
        except RateLimitError as e:
            err_msg = str(e)
            print(f"[RESUME] GROQ ERROR\nStatus: 429\nMessage: {err_msg}")
            return jsonify({"error": "RATE_LIMIT_EXCEEDED", "details": "Groq rate limit reached. Please try again shortly."}), 429
        except APIConnectionError as e:
            err_msg = str(e)
            print(f"[RESUME] GROQ ERROR\nStatus: 502\nMessage: {err_msg}")
            return jsonify({"error": "CONNECTION_FAILED", "details": "Failed to connect to Groq API."}), 502
        except APIError as e:
            err_msg = str(e)
            print(f"[RESUME] GROQ ERROR\nStatus: 400\nMessage: {err_msg}")
            return jsonify({"error": "GROQ_API_ERROR", "details": f"Groq API Error: {err_msg}"}), 400
        except Exception as e:
            err_msg = str(e)
            print(f"[RESUME] GROQ ERROR\nStatus: 500\nMessage: {err_msg}")
            return jsonify({"error": "INTERNAL_ERROR", "details": f"Groq request exception: {err_msg}"}), 500
    else:
        return jsonify({"error": "NO_TEXT", "details": "Resume text is empty or missing."}), 400

    db = get_db()
    user = db.users.find_one({"user_id": user_id})
    if not user:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None
    user_name = user.get("name", "Unknown User") if user else "Unknown User"

    new_resume = {
        "user_id": user_id,
        "user_name": user_name,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size,
        "resume_text": resume_text,
        "extracted_skills": extracted_skills,
        "aiData": ai_data,
        "uploaded_at": datetime.utcnow().isoformat() + "Z"
    }

    result = db.resumes.insert_one(new_resume)
    new_resume["_id"] = str(result.inserted_id)

    print("[RESUME] Saved to MongoDB successfully.")
    return jsonify({"message": "Resume analyzed and saved", "resume": new_resume}), 201

@resume_bp.route("/user/<user_id>", methods=["GET"])
def get_user_resumes(user_id):
    db = get_db()
    resumes = list(db.resumes.find({"user_id": user_id}))
    for r in resumes:
        r["_id"] = str(r["_id"])
    return jsonify(resumes), 200

@resume_bp.route("/single/<resume_id>", methods=["GET"])
def get_single_resume(resume_id):
    db = get_db()
    try:
        resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
        if not resume:
            return jsonify({"error": "Resume not found"}), 404
        resume["_id"] = str(resume["_id"])
        return jsonify(resume), 200
    except Exception:
        return jsonify({"error": "Invalid resume ID"}), 400

@resume_bp.route("/<resume_id>", methods=["DELETE"])
def delete_resume(resume_id):
    db = get_db()
    result = db.resumes.delete_one({"_id": ObjectId(resume_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Resume not found"}), 404
    return jsonify({"message": "Resume deleted successfully"}), 200

@resume_bp.route("/all", methods=["GET"])
def get_all_resumes():
    db = get_db()
    resumes = list(db.resumes.find())
    for r in resumes:
        r["_id"] = str(r["_id"])
        r["id"] = r["_id"]
        r["date"] = r.get("uploaded_at")
        r["userName"] = r.get("user_name")
        r["fileName"] = r.get("file_name")
        r["type"] = r.get("file_type")
        r["size"] = r.get("file_size")
    return jsonify(resumes), 200
