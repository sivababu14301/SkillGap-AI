from flask import Blueprint, request, jsonify
import os
import json
from backend.db import get_db
from groq import Groq, APIError, APIConnectionError, RateLimitError, AuthenticationError

ai_bp = Blueprint("ai", __name__)

def handle_groq_exception(e, cache_key=None):
    err_msg = str(e)
    if isinstance(e, AuthenticationError):
        print(f"[AI] GROQ ERROR\nStatus: 401\nMessage: {err_msg}")
        return jsonify({"error": "INVALID_API_KEY", "details": "Groq API key is invalid or missing."}), 401
    elif isinstance(e, RateLimitError):
        print(f"[AI] GROQ ERROR\nStatus: 429\nMessage: {err_msg}")
        return jsonify({"error": "RATE_LIMIT_EXCEEDED", "details": "Groq rate limit reached. Please try again shortly."}), 429
    elif isinstance(e, APIConnectionError):
        print(f"[AI] GROQ ERROR\nStatus: 502\nMessage: {err_msg}")
        return jsonify({"error": "CONNECTION_FAILED", "details": "Failed to connect to Groq API."}), 502
    elif isinstance(e, APIError):
        print(f"[AI] GROQ ERROR\nStatus: 400\nMessage: {err_msg}")
        return jsonify({"error": "GROQ_API_ERROR", "details": f"Groq API Error: {err_msg}"}), 400
    else:
        print(f"[AI] GROQ ERROR\nStatus: 500\nMessage: {err_msg}")
        return jsonify({"error": "INTERNAL_ERROR", "details": f"Unexpected error: {err_msg}"}), 500

@ai_bp.route("/generate", methods=["POST"])
def generate_ai():
    data = request.get_json() or {}
    system_prompt = data.get("system_prompt", "")
    user_prompt = data.get("user_prompt", "")
    max_tokens = data.get("max_tokens", 1024)
    temperature = data.get("temperature", 0.5)
    
    # Optional Caching
    cache_key = data.get("cache_key") # A unique string to identify if we already ran this
    user_id = data.get("user_id")
    
    db = get_db()
    if cache_key and user_id:
        existing = db.ai_cache.find_one({"user_id": user_id, "cache_key": cache_key})
        if existing:
            return jsonify({"content": existing["content"]}), 200

    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    if groq_api_key:
        print("[AI] Groq API key loaded: YES")
    else:
        print("[AI] Groq API key loaded: NO")
        return jsonify({"error": "INVALID_API_KEY", "details": "No API key found on server."}), 401
    
    print(f"[AI] Calling Groq API with model: {groq_model}")

    client = Groq(api_key=groq_api_key)

    try:
        response = client.chat.completions.create(
            model=groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        content = response.choices[0].message.content
        
        # Extract JSON if needed
        if "{" in content and "}" in content:
            start = content.find("{")
            end = content.rfind("}") + 1
            content = content[start:end]
            
        if cache_key and user_id:
            db.ai_cache.update_one(
                {"user_id": user_id, "cache_key": cache_key},
                {"$set": {"content": content}},
                upsert=True
            )
        return jsonify({"content": content}), 200
        
    except Exception as e:
        return handle_groq_exception(e, cache_key)

@ai_bp.route("/health", methods=["GET"])
def health_check():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return jsonify({"status": "error", "message": "Missing GROQ_API_KEY"}), 500
        
    client = Groq(api_key=groq_api_key)
    try:
        # Instead of generic models fetch, run a tiny connection check to the actual model we will use
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Reply with OK"}],
            max_tokens=10
        )
        return jsonify({"status": "ok", "message": "Groq API connection successful"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Groq Error: {str(e)}"}), 502
