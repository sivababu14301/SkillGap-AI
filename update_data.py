import json

new_categories = {
    "MARKETING / MEDIA": {"icon": "fas fa-bullhorn", "color": "rc-pink"},
    "LAW": {"icon": "fas fa-balance-scale", "color": "rc-blue"},
    "AGRICULTURE": {"icon": "fas fa-leaf", "color": "rc-green"},
    "SCIENCE / RESEARCH": {"icon": "fas fa-flask", "color": "rc-teal"},
    "EDUCATION": {"icon": "fas fa-chalkboard-teacher", "color": "rc-orange"},
    "BIOTECH / BIO": {"icon": "fas fa-dna", "color": "rc-purple"},
    "MEDICAL / HEALTHCARE": {"icon": "fas fa-heartbeat", "color": "rc-red"},
    "COMMERCE / FINANCE": {"icon": "fas fa-chart-pie", "color": "rc-blue"},
    "MANAGEMENT": {"icon": "fas fa-tasks", "color": "rc-orange"}
}

roles_data = {
    "MARKETING / MEDIA": [
        {"name": "Digital Marketing Executive", "skills": ["SEO", "Social Media", "Google Analytics", "Content Strategy", "Email Marketing"]},
        {"name": "SEO Specialist", "skills": ["SEO", "Keyword Research", "Link Building", "Google Search Console", "Google Analytics"]},
        {"name": "Social Media Manager", "skills": ["Social Media Strategy", "Content Creation", "Community Management", "Facebook Ads", "Instagram Ads"]},
        {"name": "Content Writer", "skills": ["Copywriting", "SEO Writing", "Content Strategy", "Blogging", "Editing"]},
        {"name": "Copywriter", "skills": ["Copywriting", "Creative Writing", "Advertising", "Brand Messaging", "Proofreading"]},
        {"name": "Brand Executive", "skills": ["Brand Strategy", "Market Research", "Public Relations", "Marketing Campaigns", "Brand Positioning"]},
        {"name": "Public Relations Executive", "skills": ["Public Relations", "Media Relations", "Press Releases", "Corporate Communications", "Event Management"]},
        {"name": "Media Planner", "skills": ["Media Strategy", "Advertising Campaigns", "Market Research", "Media Buying", "Budget Management"]}
    ],
    "LAW": [
        {"name": "Legal Assistant", "skills": ["Legal Research", "Document Drafting", "Case Management", "Contract Review", "Litigation Support"]},
        {"name": "Legal Advisor", "skills": ["Corporate Law", "Legal Compliance", "Contract Negotiation", "Risk Management", "Dispute Resolution"]},
        {"name": "Corporate Legal Executive", "skills": ["Corporate Governance", "Mergers & Acquisitions", "Regulatory Compliance", "Drafting Agreements", "Legal Advice"]},
        {"name": "Paralegal", "skills": ["Legal Documentation", "Case Prep", "Filing", "Legal Research", "Client Communication"]}
    ],
    "AGRICULTURE": [
        {"name": "Agricultural Officer", "skills": ["Crop Management", "Soil Science", "Pest Control", "Farming Techniques", "Agricultural Policies"]},
        {"name": "Agronomist", "skills": ["Soil Analysis", "Crop Production", "Plant Genetics", "Fertilizer Management", "Sustainability"]},
        {"name": "Agricultural Engineer", "skills": ["Farm Machinery", "Irrigation Systems", "Agricultural Infrastructure", "Equipment Maintenance", "Water Management"]},
        {"name": "Horticulture Officer", "skills": ["Plant Breeding", "Greenhouse Management", "Landscaping", "Crop Cultivation", "Pest Management"]},
        {"name": "Food Technologist", "skills": ["Food Safety", "Quality Control", "Food Processing", "Product Development", "Nutrition Analysis"]},
        {"name": "Agricultural Consultant", "skills": ["Agribusiness", "Farm Management", "Market Analysis", "Advisory Services", "Crop Planning"]}
    ],
    "SCIENCE / RESEARCH": [
        {"name": "Research Scientist", "skills": ["Data Analysis", "Experimental Design", "Laboratory Techniques", "Scientific Writing", "Hypothesis Testing"]},
        {"name": "Laboratory Technician", "skills": ["Lab Equipment", "Sample Preparation", "Quality Control", "Safety Protocols", "Data Recording"]},
        {"name": "Chemist", "skills": ["Chemical Analysis", "Spectroscopy", "Chromatography", "Formulation", "Safety Compliance"]},
        {"name": "Physicist", "skills": ["Data Modeling", "Mathematics", "Experimentation", "Statistical Analysis", "Research"]},
        {"name": "Environmental Scientist", "skills": ["Environmental Impact", "Data Collection", "Sustainability", "Pollution Control", "Regulatory Compliance"]},
        {"name": "Research Assistant", "skills": ["Literature Review", "Data Collection", "Data Entry", "Assisting Experiments", "Report Writing"]}
    ],
    "EDUCATION": [
        {"name": "School Teacher", "skills": ["Lesson Planning", "Classroom Management", "Curriculum Development", "Student Assessment", "Communication"]},
        {"name": "College Lecturer", "skills": ["Higher Education", "Research", "Curriculum Design", "Mentoring", "Public Speaking"]},
        {"name": "Academic Coordinator", "skills": ["Educational Administration", "Curriculum Planning", "Teacher Training", "Student Performance", "Scheduling"]},
        {"name": "Education Counselor", "skills": ["Student Counseling", "Career Guidance", "Admissions", "Psychology", "Interpersonal Skills"]},
        {"name": "Training & Development Executive", "skills": ["Corporate Training", "Instructional Design", "Employee Development", "Workshops", "Presentation Skills"]}
    ],
    "BIOTECH / BIO": [
        {"name": "Biotechnology Engineer", "skills": ["Genetic Engineering", "Cell Culture", "Bioprocessing", "Molecular Biology", "Laboratory Skills"]},
        {"name": "Bioprocess Engineer", "skills": ["Fermentation", "Process Optimization", "Scale-up", "Purification", "GMP"]},
        {"name": "Clinical Research Associate", "skills": ["Clinical Trials", "GCP", "Monitoring", "Regulatory Compliance", "Data Management"]},
        {"name": "Research Assistant", "skills": ["Lab Operations", "Data Analysis", "Assay Development", "Literature Review", "Sample Testing"]},
        {"name": "Microbiology Technician", "skills": ["Microbiology", "Sterile Techniques", "Pathogen Testing", "Culture Media", "Quality Control"]},
        {"name": "Biochemist", "skills": ["Protein Chemistry", "Enzymology", "Metabolism", "Spectrophotometry", "Research Design"]}
    ],
    "MEDICAL / HEALTHCARE": [
        {"name": "Medical Laboratory Technician", "skills": ["Clinical Testing", "Phlebotomy", "Quality Control", "Microbiology", "Data Entry"]},
        {"name": "Medical Coder", "skills": ["ICD-10", "CPT Coding", "Medical Terminology", "Anatomy", "Billing"]},
        {"name": "Clinical Research Associate", "skills": ["Clinical Trials", "GCP", "Regulatory Compliance", "Data Management", "Monitoring"]},
        {"name": "Biomedical Engineer", "skills": ["Medical Devices", "Biomechanics", "FDA Regulations", "Testing", "Signal Processing"]},
        {"name": "Healthcare Data Analyst", "skills": ["Data Analysis", "SQL", "EHR/EMR", "Healthcare Compliance", "Statistics"]},
        {"name": "Radiology Technician", "skills": ["X-Ray", "MRI", "CT Scan", "Patient Care", "Radiation Safety"]},
        {"name": "Pharmacy Assistant", "skills": ["Prescription Filling", "Inventory Management", "Customer Service", "Medication Knowledge", "Pharmacy Software"]},
        {"name": "Healthcare Administrator", "skills": ["Healthcare Management", "Budgeting", "Staff Management", "Regulatory Compliance", "Operations"]},
        {"name": "Clinical Data Manager", "skills": ["Data Management", "Clinical Trials", "EDC Systems", "Database Design", "Quality Assurance"]},
        {"name": "Medical Transcriptionist", "skills": ["Transcription", "Medical Terminology", "Typing Speed", "Listening Skills", "Attention to Detail"]}
    ],
    "COMMERCE / FINANCE": [
        {"name": "Accountant", "skills": ["Accounting", "Bookkeeping", "Taxation", "Financial Reporting", "Tally/QuickBooks"]},
        {"name": "Financial Analyst", "skills": ["Financial Modeling", "Data Analysis", "Forecasting", "Excel", "Valuation"]},
        {"name": "Banking Executive", "skills": ["Retail Banking", "Customer Service", "Financial Products", "Sales", "Compliance"]},
        {"name": "Investment Analyst", "skills": ["Investment Research", "Portfolio Management", "Risk Analysis", "Financial Markets", "Asset Allocation"]},
        {"name": "Tax Consultant", "skills": ["Tax Planning", "Compliance", "Income Tax", "Corporate Tax", "Tax Laws"]},
        {"name": "Auditor", "skills": ["Auditing", "Compliance", "Risk Assessment", "Financial Statements", "Internal Controls"]},
        {"name": "Finance Executive", "skills": ["Accounts Payable", "Accounts Receivable", "Reconciliation", "Budgeting", "Invoicing"]},
        {"name": "Insurance Executive", "skills": ["Insurance Sales", "Claims Processing", "Underwriting", "Customer Relationship", "Risk Management"]}
    ],
    "MANAGEMENT": [
        {"name": "HR Executive", "skills": ["Recruitment", "Employee Relations", "Onboarding", "HR Policies", "Payroll"]},
        {"name": "HR Manager", "skills": ["Talent Management", "Performance Appraisal", "Strategic HR", "Compensation", "Conflict Resolution"]},
        {"name": "Operations Executive", "skills": ["Operations Management", "Process Optimization", "Logistics", "Vendor Management", "Reporting"]},
        {"name": "Operations Manager", "skills": ["Strategic Planning", "Team Leadership", "Cost Reduction", "Supply Chain", "Quality Assurance"]},
        {"name": "Supply Chain Analyst", "skills": ["Supply Chain Management", "Data Analysis", "Inventory Management", "Forecasting", "Logistics"]},
        {"name": "Logistics Executive", "skills": ["Transportation", "Warehouse Management", "Inventory Control", "Freight Forwarding", "Supply Chain"]},
        {"name": "Business Development Executive", "skills": ["Sales", "B2B Sales", "Lead Generation", "Negotiation", "Client Relationship"]},
        {"name": "Project Manager", "skills": ["Project Planning", "Agile/Scrum", "Risk Management", "Budgeting", "Stakeholder Management"]},
        {"name": "Product Manager", "skills": ["Product Strategy", "Market Research", "Roadmapping", "Agile", "User Experience"]},
        {"name": "Marketing Manager", "skills": ["Marketing Strategy", "Digital Marketing", "Brand Management", "Campaign Planning", "Budgeting"]}
    ]
}

def to_id(name, cat):
    return f"{cat.split()[0].lower()}_{''.join(name.split()[:2]).lower()}"

non_it_roles = []
for cat, jobs in roles_data.items():
    icon = new_categories[cat]["icon"]
    colorClass = new_categories[cat]["color"]
    for job in jobs:
        role = {
            "id": to_id(job["name"], cat),
            "name": job["name"],
            "icon": icon,
            "colorClass": colorClass,
            "category": cat,
            "domain": "NON-IT",
            "description": f"Professional role as a {job['name']} in the {cat} sector.",
            "skills": job["skills"]
        }
        non_it_roles.append(role)

# Now we need to update job-roles-data.js 
import re
with open("job-roles-data.js", "r", encoding="utf-8") as f:
    js_content = f.read()

# Update categoryMeta
import json
new_meta_str = "    \"ECE\":                  { icon: \"fas fa-microchip\",    color: \"rc-teal\"   },\n"
new_meta_str += "    \"EEE\":                  { icon: \"fas fa-bolt\",         color: \"rc-orange\" },\n"
new_meta_str += "    \"MECH\":                 { icon: \"fas fa-cogs\",         color: \"rc-blue\"   },\n"
new_meta_str += "    \"CIVIL\":                { icon: \"fas fa-building\",     color: \"rc-orange\" },\n"
for k, v in new_categories.items():
    new_meta_str += f"    \"{k}\": {{ icon: \"{v['icon']}\", color: \"{v['color']}\" }},\n"

# Remove the trailing comma
new_meta_str = new_meta_str.rstrip(",\n") + "\n"

# Replace categoryMeta
js_content = re.sub(r'(const categoryMeta = \{.*?"Business & Management":\{ icon: "fas fa-briefcase",\s*color: "rc-orange" \},).*?(\};)', r'\1\n' + new_meta_str + r'\2', js_content, flags=re.DOTALL)

# Now for nonItRoles
non_it_roles_js = "const nonItRoles = " + json.dumps(non_it_roles, indent=4) + ";"

# Replace existing nonItRoles
js_content = re.sub(r'const nonItRoles = \[.*?\n\];', non_it_roles_js, js_content, flags=re.DOTALL)
with open("job-roles-data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

# Update backend/seed.py
with open("backend/seed.py", "r", encoding="utf-8") as f:
    seed_content = f.read()

# Read the original IT roles and ECE, EEE, MECH, CIVIL from JS file before the update?
# It's easier to just construct the list in python and update seed.py.
# I'll just write a new list of roles and replace `roles = [ ... ]` in seed.py.
# But wait, seed.py currently only has 6 roles. Let's get ALL roles from job-roles-data.js.
import execjs
# Actually I don't have execjs. I will just parse jobRoles from JS manually.
import ast
roles_match = re.search(r'let jobRoles = (\[.*?\]);\n\njobRoles\.forEach', js_content, re.DOTALL)
if roles_match:
    roles_str = roles_match.group(1)
    # Dirty fix for JS keys without quotes
    roles_str = re.sub(r'([a-zA-Z0-9_]+):', r'"\1":', roles_str)
    # Remove comments
    roles_str = re.sub(r'//.*', '', roles_str)
    roles_str = roles_str.replace(',\n    ]', '\n    ]')
    # Still hard to parse with json.loads. Let's just generate the insert_many from jobRoles + non_it_roles.

# Instead of parsing, let's inject a Python script to dump it from node, or just generate backend/seed.py roles.
