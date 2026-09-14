import csv
import os

def load_it_roles_from_csv(csv_path):
    roles = []
    
    # Helper to assign categories based on keywords in title
    def assign_metadata(title):
        t = title.lower()
        if "developer" in t or "engineer" in t and "software" in t or "programmer" in t:
            if "ai" in t or "machine learning" in t or "nlp" in t or "vision" in t or "deep learning" in t:
                return "AI / ML / Data", "fas fa-brain", "rc-blue"
            if "cloud" in t or "devops" in t or "aws" in t or "azure" in t or "platform" in t or "kubernetes" in t or "sre" in t or "reliability" in t:
                return "Cloud / DevOps", "fas fa-cloud", "rc-teal"
            if "security" in t or "cyber" in t or "hacker" in t or "soc " in t or "forensics" in t:
                return "Cybersecurity", "fas fa-shield-alt", "rc-red"
            if "data" in t and "scientist" in t or "data analyst" in t or "data engineer" in t or "bi " in t or "business intelligence" in t or "mlops" in t:
                return "AI / ML / Data", "fas fa-brain", "rc-blue"
            if "database" in t or "sql" in t:
                return "Database", "fas fa-database", "rc-blue"
            if "network" in t:
                return "Networking", "fas fa-network-wired", "rc-orange"
            if "test" in t or "qa " in t or "quality" in t or "sdet" in t or "automation" in t:
                return "Testing / Quality", "fas fa-vial", "rc-teal"
            return "Software Development", "fas fa-laptop-code", "rc-purple"
        
        if "data" in t or "ai " in t or "machine learning" in t or "bi " in t or "prompt" in t:
            return "AI / ML / Data", "fas fa-brain", "rc-blue"
        
        if "cloud" in t or "devops" in t or "sre" in t or "infrastructure" in t or "release" in t:
            return "Cloud / DevOps", "fas fa-cloud", "rc-teal"
            
        if "security" in t or "cyber" in t or "hacker" in t or "soc" in t or "forensics" in t or "penetration" in t:
            return "Cybersecurity", "fas fa-shield-alt", "rc-red"
            
        if "database" in t or "sql" in t:
            return "Database", "fas fa-database", "rc-blue"
            
        if "network" in t or "system administrator" in t or "systems engineer" in t:
            return "Networking", "fas fa-network-wired", "rc-orange"
            
        if "design" in t or "ux" in t or "ui" in t or "product manager" in t:
            return "Design / Product", "fas fa-paint-brush", "rc-pink"
            
        if "test" in t or "qa" in t or "sdet" in t:
            return "Testing / Quality", "fas fa-vial", "rc-teal"
            
        if "manager" in t or "scrum" in t or "agile" in t or "business analyst" in t or "architect" in t or "consultant" in t:
            if "cloud" in t:
                return "Cloud / DevOps", "fas fa-cloud", "rc-teal"
            if "security" in t:
                return "Cybersecurity", "fas fa-shield-alt", "rc-red"
            if "data" in t:
                return "Database", "fas fa-database", "rc-blue"
            if "network" in t:
                return "Networking", "fas fa-network-wired", "rc-orange"
            return "IT Management / Business", "fas fa-briefcase", "rc-orange"
            
        if "support" in t or "help desk" in t:
            return "IT Support", "fas fa-headset", "rc-blue"
            
        if "blockchain" in t or "web3" in t or "iot" in t or "robotics" in t or "ar/" in t or "vr " in t or "game" in t or "rpa" in t or "salesforce" in t or "sap" in t:
            return "Emerging / Specialized IT", "fas fa-robot", "rc-purple"
            
        # Fallback
        return "Software Development", "fas fa-laptop-code", "rc-purple"

    try:
        with open(csv_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                title = row.get("job_role", "").strip()
                if not title:
                    continue
                
                import re
                raw_skills = row.get("required_skills", "")
                skills_list = [s.strip() for s in re.split(r'[,;/]', raw_skills) if s.strip()]
                
                cat, icon, color = assign_metadata(title)
                
                role = {
                    "title": title,
                    "cat": cat,
                    "desc": f"Professional IT role as a {title}.",
                    "icon": icon,
                    "colorClass": color,
                    "domain": "IT",
                    "skills": skills_list,
                    "soft_skills": ["Communication", "Problem Solving"], # Generic
                    "tools": [],
                    "experience": "Mid-Level",
                    "roadmap": [
                        {"title": f"Master Core {title} Concepts", "desc": "Understand the fundamentals."}
                    ]
                }
                roles.append(role)
    except Exception as e:
        print(f"Error loading CSV {csv_path}: {e}")
        
    return roles

def load_non_it_roles_from_csv(csv_path):
    roles = []
    
    # Import the skills map
    try:
        from backend.non_it_roles import get_non_it_roles
        skills_map_roles = get_non_it_roles()
        skills_map = { r["title"].lower(): r["skills"] for r in skills_map_roles }
    except Exception as e:
        print(f"Error loading non-IT skills map: {e}")
        skills_map = {}

    try:
        with open(csv_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                title = row.get("job_role", "").strip()
                if not title:
                    continue
                
                cat = row.get("category", "General").strip()
                
                # Assign generic icon/color based on category
                icon = "fas fa-briefcase"
                color = "rc-blue"
                
                if "Engineering" in cat:
                    icon = "fas fa-cogs"
                    color = "rc-teal"
                elif "Construction" in cat:
                    icon = "fas fa-building"
                    color = "rc-orange"
                elif "Finance" in cat:
                    icon = "fas fa-chart-pie"
                    color = "rc-blue"
                elif "Marketing" in cat:
                    icon = "fas fa-bullhorn"
                    color = "rc-pink"
                elif "HR" in cat:
                    icon = "fas fa-users"
                    color = "rc-purple"
                elif "Law" in cat:
                    icon = "fas fa-balance-scale"
                    color = "rc-blue"
                elif "Healthcare" in cat:
                    icon = "fas fa-heartbeat"
                    color = "rc-red"
                elif "Agriculture" in cat:
                    icon = "fas fa-leaf"
                    color = "rc-green"
                elif "Science" in cat:
                    icon = "fas fa-flask"
                    color = "rc-teal"
                elif "Education" in cat:
                    icon = "fas fa-chalkboard-teacher"
                    color = "rc-orange"

                # Look up skills from our dedicated map, fallback if missing
                skills_list = skills_map.get(title.lower(), ["Communication", "Problem Solving"])

                role = {
                    "title": title,
                    "cat": cat,
                    "desc": f"Professional role as a {title} in the {cat} sector.",
                    "icon": icon,
                    "colorClass": color,
                    "domain": "NON-IT",
                    "skills": skills_list,
                    "soft_skills": ["Teamwork", "Adaptability"], 
                    "tools": [],
                    "experience": "Mid-Level",
                    "roadmap": [
                        {"title": f"Master Core {title} Concepts", "desc": "Understand the fundamentals."}
                    ]
                }
                roles.append(role)
    except Exception as e:
        print(f"Error loading CSV {csv_path}: {e}")
        
    return roles
