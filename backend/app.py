import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.routes.auth_routes import auth_bp
from backend.routes.resume_routes import resume_bp
from backend.routes.analysis_routes import analysis_bp
from backend.routes.report_routes import report_bp
from backend.routes.job_role_routes import job_role_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.roadmap_routes import roadmap_bp
from backend.routes.job_selection_routes import job_selection_bp
from backend.routes.dashboard_routes import dashboard_bp
from backend.routes.ai_routes import ai_bp
from backend.seed import seed_data

from backend.routes.profile_routes import profile_bp
from backend.routes.notification_routes import notification_bp
# Initialize Flask app, pointing to the parent directory as static folder
app = Flask(__name__, static_folder="../", static_url_path="")
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "skillgap-secret-key-2025")

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(resume_bp, url_prefix="/api/resumes")
app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
app.register_blueprint(report_bp, url_prefix="/api/reports")
app.register_blueprint(job_role_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(profile_bp, url_prefix="/api/profile")
app.register_blueprint(roadmap_bp, url_prefix="/api/roadmap")
app.register_blueprint(job_selection_bp, url_prefix="/api/job-selection")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(notification_bp, url_prefix="/api/user/messages")
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Default fallback to serve index.html if the file doesn't exist
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    # Seed data on start
    try:
        seed_data()
    except Exception as e:
        print(f"Error seeding database: {e}")
        
    app.run(host="0.0.0.0", port=5000, debug=True)
