const fs = require('fs');

const newCategories = {
    "MARKETING / MEDIA": { icon: "fas fa-bullhorn", color: "rc-pink" },
    "LAW": { icon: "fas fa-balance-scale", color: "rc-blue" },
    "AGRICULTURE": { icon: "fas fa-leaf", color: "rc-green" },
    "SCIENCE / RESEARCH": { icon: "fas fa-flask", color: "rc-teal" },
    "EDUCATION": { icon: "fas fa-chalkboard-teacher", color: "rc-orange" },
    "BIOTECH / BIO": { icon: "fas fa-dna", color: "rc-purple" },
    "MEDICAL / HEALTHCARE": { icon: "fas fa-heartbeat", color: "rc-red" },
    "COMMERCE / FINANCE": { icon: "fas fa-chart-pie", color: "rc-blue" },
    "MANAGEMENT": { icon: "fas fa-tasks", color: "rc-orange" }
};

const rolesData = {
    "MARKETING / MEDIA": [
        {name: "Digital Marketing Executive", skills: ["SEO", "Social Media", "Google Analytics", "Content Strategy", "Email Marketing"]},
        {name: "SEO Specialist", skills: ["SEO", "Keyword Research", "Link Building", "Google Search Console", "Google Analytics"]},
        {name: "Social Media Manager", skills: ["Social Media Strategy", "Content Creation", "Community Management", "Facebook Ads", "Instagram Ads"]},
        {name: "Content Writer", skills: ["Copywriting", "SEO Writing", "Content Strategy", "Blogging", "Editing"]},
        {name: "Copywriter", skills: ["Copywriting", "Creative Writing", "Advertising", "Brand Messaging", "Proofreading"]},
        {name: "Brand Executive", skills: ["Brand Strategy", "Market Research", "Public Relations", "Marketing Campaigns", "Brand Positioning"]},
        {name: "Public Relations Executive", skills: ["Public Relations", "Media Relations", "Press Releases", "Corporate Communications", "Event Management"]},
        {name: "Media Planner", skills: ["Media Strategy", "Advertising Campaigns", "Market Research", "Media Buying", "Budget Management"]}
    ],
    "LAW": [
        {name: "Legal Assistant", skills: ["Legal Research", "Document Drafting", "Case Management", "Contract Review", "Litigation Support"]},
        {name: "Legal Advisor", skills: ["Corporate Law", "Legal Compliance", "Contract Negotiation", "Risk Management", "Dispute Resolution"]},
        {name: "Corporate Legal Executive", skills: ["Corporate Governance", "Mergers & Acquisitions", "Regulatory Compliance", "Drafting Agreements", "Legal Advice"]},
        {name: "Paralegal", skills: ["Legal Documentation", "Case Prep", "Filing", "Legal Research", "Client Communication"]}
    ],
    "AGRICULTURE": [
        {name: "Agricultural Officer", skills: ["Crop Management", "Soil Science", "Pest Control", "Farming Techniques", "Agricultural Policies"]},
        {name: "Agronomist", skills: ["Soil Analysis", "Crop Production", "Plant Genetics", "Fertilizer Management", "Sustainability"]},
        {name: "Agricultural Engineer", skills: ["Farm Machinery", "Irrigation Systems", "Agricultural Infrastructure", "Equipment Maintenance", "Water Management"]},
        {name: "Horticulture Officer", skills: ["Plant Breeding", "Greenhouse Management", "Landscaping", "Crop Cultivation", "Pest Management"]},
        {name: "Food Technologist", skills: ["Food Safety", "Quality Control", "Food Processing", "Product Development", "Nutrition Analysis"]},
        {name: "Agricultural Consultant", skills: ["Agribusiness", "Farm Management", "Market Analysis", "Advisory Services", "Crop Planning"]}
    ],
    "SCIENCE / RESEARCH": [
        {name: "Research Scientist", skills: ["Data Analysis", "Experimental Design", "Laboratory Techniques", "Scientific Writing", "Hypothesis Testing"]},
        {name: "Laboratory Technician", skills: ["Lab Equipment", "Sample Preparation", "Quality Control", "Safety Protocols", "Data Recording"]},
        {name: "Chemist", skills: ["Chemical Analysis", "Spectroscopy", "Chromatography", "Formulation", "Safety Compliance"]},
        {name: "Physicist", skills: ["Data Modeling", "Mathematics", "Experimentation", "Statistical Analysis", "Research"]},
        {name: "Environmental Scientist", skills: ["Environmental Impact", "Data Collection", "Sustainability", "Pollution Control", "Regulatory Compliance"]},
        {name: "Scientific Research Assistant", skills: ["Literature Review", "Data Collection", "Data Entry", "Assisting Experiments", "Report Writing"]}
    ],
    "EDUCATION": [
        {name: "School Teacher", skills: ["Lesson Planning", "Classroom Management", "Curriculum Development", "Student Assessment", "Communication"]},
        {name: "College Lecturer", skills: ["Higher Education", "Research", "Curriculum Design", "Mentoring", "Public Speaking"]},
        {name: "Academic Coordinator", skills: ["Educational Administration", "Curriculum Planning", "Teacher Training", "Student Performance", "Scheduling"]},
        {name: "Education Counselor", skills: ["Student Counseling", "Career Guidance", "Admissions", "Psychology", "Interpersonal Skills"]},
        {name: "Training & Development Executive", skills: ["Corporate Training", "Instructional Design", "Employee Development", "Workshops", "Presentation Skills"]}
    ],
    "BIOTECH / BIO": [
        {name: "Biotechnology Engineer", skills: ["Genetic Engineering", "Cell Culture", "Bioprocessing", "Molecular Biology", "Laboratory Skills"]},
        {name: "Bioprocess Engineer", skills: ["Fermentation", "Process Optimization", "Scale-up", "Purification", "GMP"]},
        {name: "Biotech Clinical Research Associate", skills: ["Clinical Trials", "GCP", "Monitoring", "Regulatory Compliance", "Data Management"]},
        {name: "Biotech Research Assistant", skills: ["Lab Operations", "Data Analysis", "Assay Development", "Literature Review", "Sample Testing"]},
        {name: "Microbiology Technician", skills: ["Microbiology", "Sterile Techniques", "Pathogen Testing", "Culture Media", "Quality Control"]},
        {name: "Biochemist", skills: ["Protein Chemistry", "Enzymology", "Metabolism", "Spectrophotometry", "Research Design"]}
    ],
    "MEDICAL / HEALTHCARE": [
        {name: "Medical Laboratory Technician", skills: ["Clinical Testing", "Phlebotomy", "Quality Control", "Microbiology", "Data Entry"]},
        {name: "Medical Coder", skills: ["ICD-10", "CPT Coding", "Medical Terminology", "Anatomy", "Billing"]},
        {name: "Clinical Research Associate", skills: ["Clinical Trials", "GCP", "Regulatory Compliance", "Data Management", "Monitoring"]},
        {name: "Biomedical Engineer", skills: ["Medical Devices", "Biomechanics", "FDA Regulations", "Testing", "Signal Processing"]},
        {name: "Healthcare Data Analyst", skills: ["Data Analysis", "SQL", "EHR/EMR", "Healthcare Compliance", "Statistics"]},
        {name: "Radiology Technician", "skills": ["X-Ray", "MRI", "CT Scan", "Patient Care", "Radiation Safety"]},
        {name: "Pharmacy Assistant", "skills": ["Prescription Filling", "Inventory Management", "Customer Service", "Medication Knowledge", "Pharmacy Software"]},
        {name: "Healthcare Administrator", "skills": ["Healthcare Management", "Budgeting", "Staff Management", "Regulatory Compliance", "Operations"]},
        {name: "Clinical Data Manager", "skills": ["Data Management", "Clinical Trials", "EDC Systems", "Database Design", "Quality Assurance"]},
        {name: "Medical Transcriptionist", "skills": ["Transcription", "Medical Terminology", "Typing Speed", "Listening Skills", "Attention to Detail"]}
    ],
    "COMMERCE / FINANCE": [
        {name: "Accountant", skills: ["Accounting", "Bookkeeping", "Taxation", "Financial Reporting", "Tally/QuickBooks"]},
        {name: "Financial Analyst", skills: ["Financial Modeling", "Data Analysis", "Forecasting", "Excel", "Valuation"]},
        {name: "Banking Executive", skills: ["Retail Banking", "Customer Service", "Financial Products", "Sales", "Compliance"]},
        {name: "Investment Analyst", skills: ["Investment Research", "Portfolio Management", "Risk Analysis", "Financial Markets", "Asset Allocation"]},
        {name: "Tax Consultant", skills: ["Tax Planning", "Compliance", "Income Tax", "Corporate Tax", "Tax Laws"]},
        {name: "Auditor", skills: ["Auditing", "Compliance", "Risk Assessment", "Financial Statements", "Internal Controls"]},
        {name: "Finance Executive", skills: ["Accounts Payable", "Accounts Receivable", "Reconciliation", "Budgeting", "Invoicing"]},
        {name: "Insurance Executive", skills: ["Insurance Sales", "Claims Processing", "Underwriting", "Customer Relationship", "Risk Management"]}
    ],
    "MANAGEMENT": [
        {name: "HR Executive", skills: ["Recruitment", "Employee Relations", "Onboarding", "HR Policies", "Payroll"]},
        {name: "HR Manager", skills: ["Talent Management", "Performance Appraisal", "Strategic HR", "Compensation", "Conflict Resolution"]},
        {name: "Operations Executive", skills: ["Operations Management", "Process Optimization", "Logistics", "Vendor Management", "Reporting"]},
        {name: "Operations Manager", skills: ["Strategic Planning", "Team Leadership", "Cost Reduction", "Supply Chain", "Quality Assurance"]},
        {name: "Supply Chain Analyst", skills: ["Supply Chain Management", "Data Analysis", "Inventory Management", "Forecasting", "Logistics"]},
        {name: "Logistics Executive", skills: ["Transportation", "Warehouse Management", "Inventory Control", "Freight Forwarding", "Supply Chain"]},
        {name: "Business Development Executive", skills: ["Sales", "B2B Sales", "Lead Generation", "Negotiation", "Client Relationship"]},
        {name: "Project Manager", skills: ["Project Planning", "Agile/Scrum", "Risk Management", "Budgeting", "Stakeholder Management"]},
        {name: "Product Manager", skills: ["Product Strategy", "Market Research", "Roadmapping", "Agile", "User Experience"]},
        {name: "Marketing Manager", skills: ["Marketing Strategy", "Digital Marketing", "Brand Management", "Campaign Planning", "Budgeting"]}
    ]
};

const toId = (name, cat) => `${cat.split(' ')[0].toLowerCase()}_${name.split(' ').slice(0,2).join('').toLowerCase()}`;

let nonItRoles = [];

// Keep ECE, EEE, MECH, CIVIL
const existingRoles = [
    // ECE
    { id: "ece_elec", name: "Electronics Engineer", icon: "fas fa-microchip", colorClass: "rc-teal", category: "ECE", domain: "NON-IT", description: "Design, develop and test electronic systems and components.", skills: ["Circuit Design", "PCB Design", "Microcontrollers", "C/C++", "Verilog/VHDL"] },
    { id: "ece_embed", name: "Embedded Systems Engineer", icon: "fas fa-microchip", colorClass: "rc-teal", category: "ECE", domain: "NON-IT", description: "Design and implement software of embedded devices and systems.", skills: ["C/C++", "RTOS", "Microcontrollers", "ARM", "Python"] },
    { id: "ece_vlsi", name: "VLSI Engineer", icon: "fas fa-microchip", colorClass: "rc-teal", category: "ECE", domain: "NON-IT", description: "Design and verify integrated circuits and chips.", skills: ["Verilog/VHDL", "SystemVerilog", "ASIC Design", "FPGA", "CMOS"] },
    { id: "ece_iot", name: "IoT Engineer", icon: "fas fa-network-wired", colorClass: "rc-teal", category: "ECE", domain: "NON-IT", description: "Develop and manage Internet of Things devices and systems.", skills: ["IoT Platforms", "Sensors", "Wireless Protocols", "Python", "C++"] },
    { id: "ece_hw", name: "Hardware Engineer", icon: "fas fa-memory", colorClass: "rc-teal", category: "ECE", domain: "NON-IT", description: "Research, design, develop, and test computer systems and components.", skills: ["Hardware Design", "Testing", "Circuit Analysis", "Soldering", "CAD"] },

    // EEE
    { id: "eee_elec", name: "Electrical Engineer", icon: "fas fa-bolt", colorClass: "rc-orange", category: "EEE", domain: "NON-IT", description: "Design, develop, test, and supervise the manufacturing of electrical equipment.", skills: ["Electrical Systems", "Power Systems", "AutoCAD Electrical", "Circuit Design", "Testing"] },
    { id: "eee_power", name: "Power Systems Engineer", icon: "fas fa-plug", colorClass: "rc-orange", category: "EEE", domain: "NON-IT", description: "Design and maintain systems that generate and distribute power.", skills: ["Power Distribution", "MATLAB", "ETAP", "Switchgear", "Transformer Design"] },
    { id: "eee_control", name: "Control Systems Engineer", icon: "fas fa-sliders-h", colorClass: "rc-orange", category: "EEE", domain: "NON-IT", description: "Design and manage systems that control machinery and processes.", skills: ["Control Theory", "PLC", "SCADA", "Automation", "Instrumentation"] },
    { id: "eee_auto", name: "Automation Engineer", icon: "fas fa-cogs", colorClass: "rc-orange", category: "EEE", domain: "NON-IT", description: "Design and implement automated manufacturing processes.", skills: ["PLC Programming", "Robotics", "Industrial Automation", "HMI", "AutoCAD"] },
    { id: "eee_plc", name: "PLC/SCADA Engineer", icon: "fas fa-desktop", colorClass: "rc-orange", category: "EEE", domain: "NON-IT", description: "Develop and implement PLC programs and SCADA systems.", skills: ["PLC", "SCADA", "HMI", "Industrial Protocols", "Troubleshooting"] },

    // MECH
    { id: "mech_mech", name: "Mechanical Engineer", icon: "fas fa-tools", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Design, develop, build, and test mechanical and thermal sensors and devices.", skills: ["Thermodynamics", "Fluid Mechanics", "CAD", "SolidWorks", "Manufacturing"] },
    { id: "mech_design", name: "Design Engineer", icon: "fas fa-drafting-compass", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Create detailed mechanical designs and specifications.", skills: ["AutoCAD", "SolidWorks", "CATIA", "GD&T", "Product Design"] },
    { id: "mech_prod", name: "Production Engineer", icon: "fas fa-industry", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Oversee the production process and optimize manufacturing.", skills: ["Lean Manufacturing", "Six Sigma", "Process Optimization", "Quality Control", "Supply Chain"] },
    { id: "mech_mfg", name: "Manufacturing Engineer", icon: "fas fa-industry", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Design and operate manufacturing systems and processes.", skills: ["CNC Programming", "CAM", "Tooling", "Material Science", "Automation"] },
    { id: "mech_auto", name: "Automotive Engineer", icon: "fas fa-car", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Design, develop and manufacture vehicles and their components.", skills: ["Vehicle Dynamics", "IC Engines", "CAD", "CAE", "Testing"] },
    { id: "mech_cad", name: "CAD Engineer", icon: "fas fa-pencil-ruler", colorClass: "rc-blue", category: "MECH", domain: "NON-IT", description: "Create technical drawings and plans for products and parts.", skills: ["AutoCAD", "2D/3D Modeling", "Drafting", "GD&T", "SolidWorks"] },

    // CIVIL
    { id: "civil_civil", name: "Civil Engineer", icon: "fas fa-building", colorClass: "rc-orange", category: "CIVIL", domain: "NON-IT", description: "Design, construct, and maintain infrastructure projects and systems.", skills: ["AutoCAD Civil 3D", "Structural Analysis", "Project Management", "Surveying", "Materials"] },
    { id: "civil_struct", name: "Structural Engineer", icon: "fas fa-cubes", colorClass: "rc-orange", category: "CIVIL", domain: "NON-IT", description: "Design structures to withstand stresses and pressures of their environment.", skills: ["STAAD Pro", "ETABS", "Structural Design", "AutoCAD", "Concrete/Steel Design"] },
    { id: "civil_site", name: "Site Engineer", icon: "fas fa-hard-hat", colorClass: "rc-orange", category: "CIVIL", domain: "NON-IT", description: "Manage site operations, supervise construction workers and ensure safety.", skills: ["Site Management", "Quality Assurance", "Surveying", "Health & Safety", "Estimation"] },
    { id: "civil_plan", name: "Planning Engineer", icon: "fas fa-calendar-alt", colorClass: "rc-orange", category: "CIVIL", domain: "NON-IT", description: "Develop and monitor construction project plans and schedules.", skills: ["Primavera P6", "MS Project", "Scheduling", "Cost Estimation", "Project Management"] }
];

nonItRoles.push(...existingRoles);

for (const cat in rolesData) {
    const icon = newCategories[cat].icon;
    const colorClass = newCategories[cat].color;
    for (const job of rolesData[cat]) {
        nonItRoles.push({
            id: toId(job.name, cat),
            name: job.name,
            icon: icon,
            colorClass: colorClass,
            category: cat,
            domain: "NON-IT",
            description: "Professional role as a " + job.name + " in the " + cat + " sector.",
            skills: job.skills
        });
    }
}

let jsContent = fs.readFileSync("job-roles-data.js", "utf-8");

let newMetaStr = "    \"ECE\":                  { icon: \"fas fa-microchip\",    color: \"rc-teal\"   },\n";
newMetaStr += "    \"EEE\":                  { icon: \"fas fa-bolt\",         color: \"rc-orange\" },\n";
newMetaStr += "    \"MECH\":                 { icon: \"fas fa-cogs\",         color: \"rc-blue\"   },\n";
newMetaStr += "    \"CIVIL\":                { icon: \"fas fa-building\",     color: \"rc-orange\" },\n";
for (const k in newCategories) {
    newMetaStr += `    "${k}": { icon: "${newCategories[k].icon}", color: "${newCategories[k].color}" },\n`;
}
newMetaStr = newMetaStr.replace(/,\n$/, '\n');

// replace categoryMeta
jsContent = jsContent.replace(/(const categoryMeta = \{[\s\S]*?"Business & Management":\{ icon: "fas fa-briefcase",\s*color: "rc-orange" \},)[\s\S]*?(\};)/, `$1\n${newMetaStr}$2`);

// remove existing nonItRoles block
jsContent = jsContent.replace(/const nonItRoles = \[[\s\S]*?\];\n\njobRoles\.push\(\.\.\.nonItRoles\);/g, '');

jsContent += "\nconst nonItRoles = " + JSON.stringify(nonItRoles, null, 4) + ";\n";
jsContent += "jobRoles.push(...nonItRoles);\n";

fs.writeFileSync("job-roles-data.js", jsContent);

// Now generate seed.py updates
let seedContent = fs.readFileSync("backend/seed.py", "utf-8");

// Parse jobRoles from JS (eval it)
const fullScript = jsContent + "\nconsole.log(JSON.stringify(jobRoles));";
const { execSync } = require('child_process');
fs.writeFileSync("temp_eval.js", "let window = {};" + fullScript);
const output = execSync("node temp_eval.js", { encoding: "utf-8" });
const allJobRoles = JSON.parse(output);

// Format for Python
const pyRoles = allJobRoles.map(r => ({
    title: r.name,
    desc: r.description,
    cat: r.category,
    icon: r.icon,
    domain: r.domain,
    skills: r.skills
}));

const pyRolesStr = "roles = " + JSON.stringify(pyRoles, null, 4);

seedContent = seedContent.replace(/roles = \[[\s\S]*?\]\n\s*db\.job_roles\.insert_many\(roles\)/, pyRolesStr + "\n        db.job_roles.insert_many(roles)");

fs.writeFileSync("backend/seed.py", seedContent);
console.log("Updated both files successfully.");
