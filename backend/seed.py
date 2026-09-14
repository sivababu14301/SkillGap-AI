import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import bcrypt
from datetime import datetime
from backend.db import get_db, init_db

def seed_data():
    db = get_db()
    print("Dropping existing job_roles collection to avoid index conflict...")
    db.job_roles.drop()
    
    # 1. Initialize DB collections and indexes
    init_db()
    
    # 2. Seed Default Admin User
    admin_email = "adminsiva@skillgap.ai"
    if not db.users.find_one({"email": admin_email}):
        hashed_pw = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_user = {
            "user_id": "USR_ADMIN_SIVA",
            "name": "Super Admin",
            "email": admin_email,
            "password": hashed_pw,
            "role": "admin",
            "status": "active",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        try:
            db.users.insert_one(admin_user)
            print("Default admin user seeded (USR_ADMIN_SIVA).")
        except Exception as e:
            print(f"Failed to seed admin: {e}")

    users = [
        {"user_id": "USR002", "name": "Siva", "email": "siva@example.com", "role": "user", "status": "active"},
        {"user_id": "USR003", "name": "Arun", "email": "arun@example.com", "role": "user", "status": "active"},
        {"user_id": "USR004", "name": "Karthik", "email": "karthik@example.com", "role": "user", "status": "inactive"}
    ]
    for u in users:
        if not db.users.find_one({"email": u["email"]}):
            hashed_pw = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            db.users.insert_one({
                "user_id": u["user_id"],
                "name": u["name"],
                "email": u["email"],
                "password": hashed_pw,
                "role": u["role"],
                "status": u["status"],
                "created_at": datetime.utcnow().isoformat() + "Z"
            })

    # 3. Seed Default Job Roles
    print("Seeding job roles...")
    
    import os
    from backend.csv_loader import load_it_roles_from_csv
    csv_path = os.path.join(os.path.dirname(__file__), "..", "IT_120_Job_Roles_Skills_Dataset.csv")
    roles = load_it_roles_from_csv(csv_path)

    from backend.csv_loader import load_non_it_roles_from_csv
    non_it_csv_path = os.path.join(os.path.dirname(__file__), "..", "non_it_job_roles_200.csv")
    roles.extend(load_non_it_roles_from_csv(non_it_csv_path))

    unique_roles = []
    seen = set()
    for role in roles:
        role_id = role["title"].lower().replace(" ", "_").replace("/", "").replace(".", "")
        role["id"] = role_id
        if role_id not in seen:
            seen.add(role_id)
            unique_roles.append(role)
    
    db.job_roles.insert_many(unique_roles)
    print("Default job roles seeded.")

    # 4. Seed Default Learning Content / Courses
    if db.learning_roadmaps.count_documents({}) == 0:
        courses = [
            { "name": "100 Days of Code: The Complete Python Pro Bootcamp", "platform": "Udemy", "skill": "Python", "level": "Beginner", "duration": "60 hours", "url": "#" },
            { "name": "AWS Certified Solutions Architect", "platform": "Coursera", "skill": "AWS", "level": "Intermediate", "duration": "40 hours", "url": "#" },
            { "name": "Docker Mastery: with Kubernetes", "platform": "Udemy", "skill": "Docker", "level": "Intermediate", "duration": "20 hours", "url": "#" }
        ]
        db.learning_roadmaps.insert_many(courses)

    # 5. Seed Default Notifications
    if db.notifications.count_documents({}) == 0:
        notifications = [
            { "type": "info", "title": "System Maintenance Scheduled", "message": "Platform will be offline for 2 hours.", "recipient": "all", "date": "2025-07-24T08:00:00Z" }
        ]
        db.notifications.insert_many(notifications)

    # 6. Seed Sample Resumes, Analyses, and Reports (for admin dashboard visual demonstration)
    siva = db.users.find_one({"name": "Siva"})
    arun = db.users.find_one({"name": "Arun"})
    karthik = db.users.find_one({"name": "Karthik"})

    if db.resumes.count_documents({}) == 0 and siva and arun and karthik:
        resumes = [
            { "user_id": siva.get("user_id", "USR002"), "user_name": "Siva", "file_name": "Siva_Resume_2025.pdf", "file_type": "pdf", "file_size": "1.2 MB", "resume_text": "Python, SQL, HTML, CSS, JavaScript, Flask, Git", "extracted_skills": ["Python", "SQL", "HTML", "CSS", "JavaScript", "Flask", "Git"], "uploaded_at": "2025-07-20T14:30:00Z" }
        ]
        db.resumes.insert_many(resumes)

    if db.skill_analysis.count_documents({}) == 0 and siva and arun and karthik:
        analyses = [
            { "user_id": siva.get("user_id", "USR002"), "user_name": "Siva", "selected_role": "Python Developer", "matched_skills": ["Python", "SQL", "Git"], "missing_skills": ["Django", "Flask"], "additional_skills": ["HTML", "CSS", "JavaScript"], "match_percentage": 60, "resume_score": 82, "created_at": "2025-07-24T10:15:00Z" }
        ]
        db.skill_analysis.insert_many(analyses)

    if db.reports.count_documents({}) == 0 and siva and arun and karthik:
        reports = [
            { "user_id": siva.get("user_id", "USR002"), "user_name": "Siva", "report_name": "Skill Gap Analysis - Python Dev", "report_type": "skill-gap", "report_format": "PDF", "report_data": {}, "generated_at": "2025-07-24T10:16:00Z" }
        ]
        db.reports.insert_many(reports)

if __name__ == "__main__":
    seed_data()

