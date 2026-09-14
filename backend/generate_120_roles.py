import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.db import get_db

def seed_120_roles():
    db = get_db()
    
    # 1. Drop existing job_roles collection to start fresh
    print("Dropping existing job_roles collection...")
    db.job_roles.drop()
    
    # 2. Define the 120 job roles
    roles = [
        # 1. Software Development
        {
            "title": "Software Developer",
            "desc": "Design, build, and maintain software applications using various programming languages.",
            "cat": "Software Development",
            "icon": "fas fa-code",
            "domain": "IT",
            "skills": ["Programming", "Object-Oriented Design", "Data Structures", "Algorithms", "Git"],
            "soft_skills": ["Problem Solving", "Teamwork", "Communication"],
            "tools": ["VS Code", "GitHub", "Jira"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Software Engineer",
            "desc": "Apply engineering principles to software creation and solve complex technical problems.",
            "cat": "Software Development",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["System Design", "Algorithms", "Java/C++", "Python", "Testing"],
            "soft_skills": ["Analytical Thinking", "Attention to Detail"],
            "tools": ["Docker", "Jenkins", "Git"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Full Stack Developer",
            "desc": "Develop both client and server software, working with databases, servers, and frontend technologies.",
            "cat": "Software Development",
            "icon": "fas fa-layer-group",
            "domain": "IT",
            "skills": ["HTML/CSS", "JavaScript", "React/Angular", "Node.js/Python", "SQL/NoSQL", "REST APIs"],
            "soft_skills": ["Adaptability", "Time Management"],
            "tools": ["Git", "Docker", "VS Code"],
            "experience": "Mid-Level"
        },
        {
            "title": "Frontend Developer",
            "desc": "Implement visual elements that users see and interact with in a web application.",
            "cat": "Software Development",
            "icon": "fas fa-desktop",
            "domain": "IT",
            "skills": ["HTML", "CSS", "JavaScript", "React/Vue", "Responsive Design", "Web Performance"],
            "soft_skills": ["Creativity", "Empathy for User"],
            "tools": ["Figma", "Webpack", "Chrome DevTools"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Backend Developer",
            "desc": "Build and maintain the server-side logic, databases, and APIs.",
            "cat": "Software Development",
            "icon": "fas fa-server",
            "domain": "IT",
            "skills": ["Python/Java", "Node.js", "SQL", "REST APIs", "Microservices", "Caching"],
            "soft_skills": ["Logical Thinking", "Problem Solving"],
            "tools": ["Postman", "Docker", "Redis"],
            "experience": "Mid-Level"
        },
        {
            "title": "Web Developer",
            "desc": "Create and maintain websites, ensuring performance, capacity, and responsive layout.",
            "cat": "Software Development",
            "icon": "fas fa-globe",
            "domain": "IT",
            "skills": ["HTML", "CSS", "JavaScript", "PHP/Ruby", "CMS (WordPress)"],
            "soft_skills": ["Communication", "Client Management"],
            "tools": ["FTP", "cPanel", "Git"],
            "experience": "Entry Level"
        },
        {
            "title": "Mobile App Developer",
            "desc": "Design and develop applications for mobile devices.",
            "cat": "Software Development",
            "icon": "fas fa-mobile-alt",
            "domain": "IT",
            "skills": ["Mobile UI Design", "REST APIs", "App Store Guidelines", "Cross-Platform Development"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["React Native", "Flutter", "Firebase"],
            "experience": "Mid-Level"
        },
        {
            "title": "Android Developer",
            "desc": "Specialize in creating applications for the Android operating system.",
            "cat": "Software Development",
            "icon": "fab fa-android",
            "domain": "IT",
            "skills": ["Java", "Kotlin", "Android SDK", "Material Design", "Room DB"],
            "soft_skills": ["Analytical Thinking", "Attention to Detail"],
            "tools": ["Android Studio", "Gradle", "Postman"],
            "experience": "Mid-Level"
        },
        {
            "title": "iOS Developer",
            "desc": "Specialize in creating applications for Apple's iOS operating system.",
            "cat": "Software Development",
            "icon": "fab fa-apple",
            "domain": "IT",
            "skills": ["Swift", "Objective-C", "iOS SDK", "Core Data", "UIKIT/SwiftUI"],
            "soft_skills": ["Creativity", "Precision"],
            "tools": ["Xcode", "TestFlight", "CocoaPods"],
            "experience": "Mid-Level"
        },
        {
            "title": "Java Developer",
            "desc": "Build scalable enterprise-level applications using Java technologies.",
            "cat": "Software Development",
            "icon": "fab fa-java",
            "domain": "IT",
            "skills": ["Java", "Spring Boot", "Hibernate", "Microservices", "SQL"],
            "soft_skills": ["Logical Thinking", "Teamwork"],
            "tools": ["IntelliJ IDEA", "Maven", "Docker"],
            "experience": "Mid-Level"
        },
        {
            "title": "Python Developer",
            "desc": "Develop backend components, connect the application with third-party web services.",
            "cat": "Software Development",
            "icon": "fab fa-python",
            "domain": "IT",
            "skills": ["Python", "Django/Flask", "REST APIs", "SQL", "Unit Testing"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["PyCharm", "Docker", "Postman"],
            "experience": "Mid-Level"
        },
        {
            "title": ".NET Developer",
            "desc": "Design and build applications using the Microsoft .NET framework.",
            "cat": "Software Development",
            "icon": "fab fa-windows",
            "domain": "IT",
            "skills": ["C#", ".NET Core", "ASP.NET", "Entity Framework", "SQL Server"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Visual Studio", "Azure", "Git"],
            "experience": "Mid-Level"
        },
        {
            "title": "PHP Developer",
            "desc": "Develop server-side web application logic and integrate work with frontend.",
            "cat": "Software Development",
            "icon": "fab fa-php",
            "domain": "IT",
            "skills": ["PHP", "Laravel/Symfony", "MySQL", "JavaScript", "API Integration"],
            "soft_skills": ["Problem Solving", "Time Management"],
            "tools": ["Composer", "Docker", "Git"],
            "experience": "Mid-Level"
        },
        {
            "title": "React Developer",
            "desc": "Develop user interface components using React.js workflows.",
            "cat": "Software Development",
            "icon": "fab fa-react",
            "domain": "IT",
            "skills": ["React.js", "JavaScript/ES6", "Redux/Context API", "HTML/CSS", "Webpack"],
            "soft_skills": ["Creativity", "Teamwork"],
            "tools": ["VS Code", "Chrome DevTools", "Git"],
            "experience": "Mid-Level"
        },
        {
            "title": "Angular Developer",
            "desc": "Create single-page applications and responsive web apps using Angular.",
            "cat": "Software Development",
            "icon": "fab fa-angular",
            "domain": "IT",
            "skills": ["Angular", "TypeScript", "RxJS", "HTML/CSS", "REST APIs"],
            "soft_skills": ["Analytical Thinking", "Attention to Detail"],
            "tools": ["Angular CLI", "VS Code", "Jasmine"],
            "experience": "Mid-Level"
        },
        {
            "title": "Node.js Developer",
            "desc": "Manage the interchange of data between servers and users using Node.js.",
            "cat": "Software Development",
            "icon": "fab fa-node-js",
            "domain": "IT",
            "skills": ["Node.js", "Express.js", "JavaScript", "MongoDB/SQL", "REST APIs"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["npm", "Docker", "Postman"],
            "experience": "Mid-Level"
        },
        {
            "title": "Flutter Developer",
            "desc": "Build cross-platform mobile apps using Google's Flutter framework.",
            "cat": "Software Development",
            "icon": "fas fa-mobile",
            "domain": "IT",
            "skills": ["Flutter", "Dart", "State Management", "REST APIs", "UI/UX Design principles"],
            "soft_skills": ["Creativity", "Problem Solving"],
            "tools": ["VS Code", "Android Studio", "Firebase"],
            "experience": "Mid-Level"
        },
        {
            "title": "Embedded Software Developer",
            "desc": "Write code that controls devices and machines that are not traditional computers.",
            "cat": "Software Development",
            "icon": "fas fa-microchip",
            "domain": "IT",
            "skills": ["C/C++", "RTOS", "Microcontrollers", "Hardware Interfaces", "Debugging"],
            "soft_skills": ["Analytical Thinking", "Patience"],
            "tools": ["Oscilloscope", "JTAG", "Git"],
            "experience": "Mid to Senior Level"
        },
        
        # 2. AI / ML / Data
        {
            "title": "AI Engineer",
            "desc": "Develop AI models and applications that simulate human intelligence.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-brain",
            "domain": "IT",
            "skills": ["Python", "Machine Learning", "Neural Networks", "NLP/Computer Vision", "Math/Statistics"],
            "soft_skills": ["Problem Solving", "Continuous Learning"],
            "tools": ["TensorFlow", "PyTorch", "Docker"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Machine Learning Engineer",
            "desc": "Design and build machine learning systems and data pipelines.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-robot",
            "domain": "IT",
            "skills": ["Python", "Machine Learning Algorithms", "Data Modeling", "MLOps", "Software Engineering"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Scikit-learn", "AWS SageMaker", "Kubernetes"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Deep Learning Engineer",
            "desc": "Specialize in designing and deploying deep neural networks.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-network-wired",
            "domain": "IT",
            "skills": ["Python", "Deep Learning", "CNN/RNN", "GPU Optimization", "Math/Calculus"],
            "soft_skills": ["Research Skills", "Problem Solving"],
            "tools": ["PyTorch", "TensorFlow", "CUDA"],
            "experience": "Senior Level"
        },
        {
            "title": "NLP Engineer",
            "desc": "Develop systems that understand and process human language.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-language",
            "domain": "IT",
            "skills": ["Python", "NLP", "Text Processing", "Transformers (BERT/GPT)", "Machine Learning"],
            "soft_skills": ["Analytical Thinking", "Creativity"],
            "tools": ["Hugging Face", "NLTK", "Spacy"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Computer Vision Engineer",
            "desc": "Develop algorithms that allow computers to extract information from digital images.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-eye",
            "domain": "IT",
            "skills": ["Python/C++", "Computer Vision", "Image Processing", "Deep Learning", "OpenCV"],
            "soft_skills": ["Attention to Detail", "Problem Solving"],
            "tools": ["OpenCV", "PyTorch", "Docker"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Data Scientist",
            "desc": "Analyze and interpret complex data to help organizations make better decisions.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-chart-pie",
            "domain": "IT",
            "skills": ["Python/R", "Statistics", "Machine Learning", "Data Visualization", "SQL"],
            "soft_skills": ["Storytelling", "Business Acumen"],
            "tools": ["Jupyter", "Tableau", "Pandas"],
            "experience": "Mid-Level"
        },
        {
            "title": "Data Analyst",
            "desc": "Collect, process, and perform statistical analyses on data.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-chart-line",
            "domain": "IT",
            "skills": ["SQL", "Excel", "Data Visualization", "Statistics", "Python"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Power BI", "Tableau", "Excel"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Data Engineer",
            "desc": "Build and maintain data architectures, databases, and large-scale processing systems.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-database",
            "domain": "IT",
            "skills": ["Python/Java", "SQL/NoSQL", "ETL Processes", "Big Data (Hadoop/Spark)", "Cloud Platforms"],
            "soft_skills": ["Problem Solving", "Teamwork"],
            "tools": ["Apache Spark", "Airflow", "AWS/GCP"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Data Architect",
            "desc": "Design data architecture, management strategies, and database blueprints.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-sitemap",
            "domain": "IT",
            "skills": ["Data Architecture", "Data Modeling", "Database Design", "Cloud Computing", "Big Data"],
            "soft_skills": ["Strategic Thinking", "Leadership"],
            "tools": ["AWS Redshift", "Snowflake", "Erwin"],
            "experience": "Senior Level"
        },
        {
            "title": "AI Research Scientist",
            "desc": "Conduct cutting-edge research in AI to invent new algorithms and approaches.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-flask",
            "domain": "IT",
            "skills": ["Advanced Mathematics", "Machine Learning", "Research Methodology", "Python", "Deep Learning"],
            "soft_skills": ["Innovation", "Scientific Writing"],
            "tools": ["PyTorch", "LaTeX", "Jupyter"],
            "experience": "Senior Level"
        },
        {
            "title": "Generative AI Engineer",
            "desc": "Specialize in developing and deploying generative AI models like LLMs.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-magic",
            "domain": "IT",
            "skills": ["Python", "LLMs (GPT/Llama)", "Prompt Engineering", "Fine-Tuning", "API Integration"],
            "soft_skills": ["Creativity", "Problem Solving"],
            "tools": ["LangChain", "OpenAI API", "Hugging Face"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Prompt Engineer",
            "desc": "Design and optimize prompts to effectively interact with Generative AI models.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-comment-dots",
            "domain": "IT",
            "skills": ["Prompt Design", "Understanding of LLMs", "Basic Scripting", "Testing/Evaluation"],
            "soft_skills": ["Creativity", "Analytical Thinking", "Communication"],
            "tools": ["ChatGPT", "Midjourney", "OpenAI Playground"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "MLOps Engineer",
            "desc": "Focus on the deployment, monitoring, and lifecycle management of ML models.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["Python", "CI/CD", "Docker/Kubernetes", "Cloud Platforms", "Model Monitoring"],
            "soft_skills": ["Problem Solving", "Collaboration"],
            "tools": ["MLflow", "Jenkins", "AWS/Azure"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Business Intelligence Developer",
            "desc": "Develop and manage BI solutions, including dashboards and data warehouses.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-chart-bar",
            "domain": "IT",
            "skills": ["SQL", "Data Modeling", "ETL", "BI Tools", "Data Warehousing"],
            "soft_skills": ["Business Acumen", "Communication"],
            "tools": ["Power BI", "Tableau", "SSIS"],
            "experience": "Mid-Level"
        },
        {
            "title": "BI Analyst",
            "desc": "Analyze data to provide actionable business insights through reports.",
            "cat": "AI / ML / Data",
            "icon": "fas fa-search-dollar",
            "domain": "IT",
            "skills": ["SQL", "Data Visualization", "Data Analysis", "Business Strategy"],
            "soft_skills": ["Communication", "Problem Solving"],
            "tools": ["Power BI", "Excel", "Tableau"],
            "experience": "Entry to Mid-Level"
        },

        # 3. Cloud / DevOps
        {
            "title": "Cloud Engineer",
            "desc": "Design, implement, and manage cloud-based systems and processes.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-cloud",
            "domain": "IT",
            "skills": ["Cloud Platforms (AWS/Azure/GCP)", "Networking", "Linux", "Security", "Scripting"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["AWS", "Terraform", "Docker"],
            "experience": "Mid-Level"
        },
        {
            "title": "Cloud Architect",
            "desc": "Oversee a company's cloud computing strategy, adoption, and design.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-sitemap",
            "domain": "IT",
            "skills": ["Cloud Architecture", "System Design", "Security", "Networking", "Migration Strategies"],
            "soft_skills": ["Leadership", "Strategic Thinking"],
            "tools": ["AWS Architecture", "Kubernetes", "Terraform"],
            "experience": "Senior Level"
        },
        {
            "title": "AWS Cloud Engineer",
            "desc": "Specialize in Amazon Web Services infrastructure and deployment.",
            "cat": "Cloud / DevOps",
            "icon": "fab fa-aws",
            "domain": "IT",
            "skills": ["AWS Services (EC2, S3, IAM, VPC)", "Python/Bash", "Infrastructure as Code", "CI/CD"],
            "soft_skills": ["Attention to Detail", "Problem Solving"],
            "tools": ["AWS CloudFormation", "Terraform", "Jenkins"],
            "experience": "Mid-Level"
        },
        {
            "title": "Azure Cloud Engineer",
            "desc": "Specialize in Microsoft Azure infrastructure and deployment.",
            "cat": "Cloud / DevOps",
            "icon": "fab fa-microsoft",
            "domain": "IT",
            "skills": ["Azure Services", "PowerShell", "Active Directory", "Infrastructure as Code"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Azure Resource Manager", "Azure DevOps", "Docker"],
            "experience": "Mid-Level"
        },
        {
            "title": "Google Cloud Engineer",
            "desc": "Specialize in Google Cloud Platform infrastructure and deployment.",
            "cat": "Cloud / DevOps",
            "icon": "fab fa-google",
            "domain": "IT",
            "skills": ["GCP Services", "Kubernetes", "Python/Bash", "Networking"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["GCP Deployment Manager", "GKE", "Terraform"],
            "experience": "Mid-Level"
        },
        {
            "title": "DevOps Engineer",
            "desc": "Bridge the gap between development and operations through automation.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-infinity",
            "domain": "IT",
            "skills": ["CI/CD", "Linux", "Scripting (Python/Bash)", "Containerization", "Infrastructure as Code"],
            "soft_skills": ["Collaboration", "Problem Solving"],
            "tools": ["Jenkins", "Docker", "Kubernetes", "Terraform"],
            "experience": "Mid-Level"
        },
        {
            "title": "Site Reliability Engineer (SRE)",
            "desc": "Ensure systems are highly available, scalable, and reliable.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-tools",
            "domain": "IT",
            "skills": ["Linux/Unix", "Programming (Go/Python)", "Monitoring", "Incident Response", "Distributed Systems"],
            "soft_skills": ["Calm Under Pressure", "Analytical Thinking"],
            "tools": ["Prometheus", "Grafana", "Kubernetes"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Platform Engineer",
            "desc": "Build and maintain the internal developer platform and tools.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-layer-group",
            "domain": "IT",
            "skills": ["Kubernetes", "CI/CD pipelines", "Automation", "Software Engineering", "Cloud Architecture"],
            "soft_skills": ["Empathy for Developers", "Problem Solving"],
            "tools": ["ArgoCD", "Kubernetes", "Terraform"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Infrastructure Engineer",
            "desc": "Design, build, and maintain IT infrastructure (servers, network).",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-server",
            "domain": "IT",
            "skills": ["Linux/Windows Administration", "Networking", "Virtualization", "Scripting"],
            "soft_skills": ["Attention to Detail", "Troubleshooting"],
            "tools": ["VMware", "Ansible", "Linux"],
            "experience": "Mid-Level"
        },
        {
            "title": "Release Engineer",
            "desc": "Manage the software release lifecycle and automated build processes.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-rocket",
            "domain": "IT",
            "skills": ["Version Control", "Build Tools", "CI/CD", "Scripting", "Release Management"],
            "soft_skills": ["Communication", "Organization"],
            "tools": ["Git", "Jenkins", "Maven"],
            "experience": "Mid-Level"
        },
        {
            "title": "Kubernetes Engineer",
            "desc": "Specialize in deploying and managing Kubernetes clusters.",
            "cat": "Cloud / DevOps",
            "icon": "fas fa-dharmachakra",
            "domain": "IT",
            "skills": ["Kubernetes Architecture", "Containerization", "Networking", "Security", "Linux"],
            "soft_skills": ["Problem Solving", "Analytical Thinking"],
            "tools": ["Kubernetes", "Helm", "Docker"],
            "experience": "Mid to Senior Level"
        },

        # 4. Cybersecurity
        {
            "title": "Cybersecurity Analyst",
            "desc": "Protect company hardware, software, and networks from cyber threats.",
            "cat": "Cybersecurity",
            "icon": "fas fa-shield-alt",
            "domain": "IT",
            "skills": ["Network Security", "Threat Detection", "Risk Assessment", "SIEM", "Incident Response"],
            "soft_skills": ["Analytical Thinking", "Attention to Detail"],
            "tools": ["Splunk", "Wireshark", "Nmap"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Cybersecurity Engineer",
            "desc": "Design and implement secure network solutions to defend against hacking.",
            "cat": "Cybersecurity",
            "icon": "fas fa-lock",
            "domain": "IT",
            "skills": ["Security Architecture", "Firewall Administration", "Cryptography", "Penetration Testing"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["Palo Alto", "Cisco ASA", "Kali Linux"],
            "experience": "Mid-Level"
        },
        {
            "title": "Security Engineer",
            "desc": "Build and maintain secure systems and software.",
            "cat": "Cybersecurity",
            "icon": "fas fa-key",
            "domain": "IT",
            "skills": ["Secure Coding", "Vulnerability Management", "Cloud Security", "Identity & Access Management"],
            "soft_skills": ["Communication", "Analytical Thinking"],
            "tools": ["Burp Suite", "SonarQube", "AWS IAM"],
            "experience": "Mid-Level"
        },
        {
            "title": "Information Security Analyst",
            "desc": "Monitor networks for security breaches and investigate violations.",
            "cat": "Cybersecurity",
            "icon": "fas fa-user-shield",
            "domain": "IT",
            "skills": ["Information Assurance", "Security Auditing", "Compliance (ISO 27001)", "Risk Management"],
            "soft_skills": ["Attention to Detail", "Ethics"],
            "tools": ["Nessus", "SIEM tools", "Excel"],
            "experience": "Mid-Level"
        },
        {
            "title": "SOC Analyst",
            "desc": "Monitor and analyze security events as part of a Security Operations Center.",
            "cat": "Cybersecurity",
            "icon": "fas fa-desktop",
            "domain": "IT",
            "skills": ["Log Analysis", "Threat Hunting", "Incident Triage", "Networking"],
            "soft_skills": ["Fast Paced Decision Making", "Teamwork"],
            "tools": ["Splunk", "QRadar", "ELK Stack"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Ethical Hacker",
            "desc": "Legally hack into systems to find and fix security vulnerabilities.",
            "cat": "Cybersecurity",
            "icon": "fas fa-user-secret",
            "domain": "IT",
            "skills": ["Penetration Testing", "Networking", "Scripting", "Web Application Security", "OSINT"],
            "soft_skills": ["Creative Thinking", "Ethics"],
            "tools": ["Kali Linux", "Metasploit", "Burp Suite"],
            "experience": "Mid-Level"
        },
        {
            "title": "Penetration Tester",
            "desc": "Perform simulated cyberattacks on computer systems to check for vulnerabilities.",
            "cat": "Cybersecurity",
            "icon": "fas fa-bug",
            "domain": "IT",
            "skills": ["Network Exploitation", "Web App Exploitation", "Social Engineering", "Report Writing"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Metasploit", "Nmap", "Wireshark"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Security Consultant",
            "desc": "Advise organizations on how to protect their physical capital and data.",
            "cat": "Cybersecurity",
            "icon": "fas fa-user-tie",
            "domain": "IT",
            "skills": ["Risk Assessment", "Compliance", "Security Strategy", "Auditing"],
            "soft_skills": ["Client Management", "Communication"],
            "tools": ["Risk Assessment Frameworks", "Compliance Tools"],
            "experience": "Senior Level"
        },
        {
            "title": "Cloud Security Engineer",
            "desc": "Secure cloud-based infrastructure and applications.",
            "cat": "Cybersecurity",
            "icon": "fas fa-cloud-meatball",
            "domain": "IT",
            "skills": ["Cloud Architecture", "IAM", "Encryption", "Compliance in Cloud", "Automation"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["AWS Security Hub", "Azure Security Center", "Terraform"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Application Security Engineer",
            "desc": "Ensure that software applications are designed and implemented securely.",
            "cat": "Cybersecurity",
            "icon": "fas fa-file-code",
            "domain": "IT",
            "skills": ["Secure SDLC", "SAST/DAST", "Threat Modeling", "Web Security (OWASP)"],
            "soft_skills": ["Collaboration with Developers", "Attention to Detail"],
            "tools": ["Checkmarx", "Veracode", "Burp Suite"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Security Architect",
            "desc": "Design robust security structures for IT systems.",
            "cat": "Cybersecurity",
            "icon": "fas fa-network-wired",
            "domain": "IT",
            "skills": ["Security Architecture Design", "Network Security", "Cryptography", "Identity Management"],
            "soft_skills": ["Leadership", "Strategic Thinking"],
            "tools": ["Enterprise Architecture Tools", "Firewalls"],
            "experience": "Senior Level"
        },
        {
            "title": "Digital Forensics Analyst",
            "desc": "Investigate cybercrimes by collecting and analyzing digital evidence.",
            "cat": "Cybersecurity",
            "icon": "fas fa-search",
            "domain": "IT",
            "skills": ["Data Recovery", "Malware Analysis", "Chain of Custody", "OS Forensics"],
            "soft_skills": ["Analytical Thinking", "Ethics"],
            "tools": ["EnCase", "FTK", "Autopsy"],
            "experience": "Mid-Level"
        },

        # 5. Database
        {
            "title": "Database Administrator (DBA)",
            "desc": "Maintain and secure databases, ensuring optimal performance and uptime.",
            "cat": "Database",
            "icon": "fas fa-database",
            "domain": "IT",
            "skills": ["Database Maintenance", "Backup & Recovery", "Performance Tuning", "Security", "SQL"],
            "soft_skills": ["Attention to Detail", "Problem Solving"],
            "tools": ["Oracle DB", "SQL Server", "MySQL"],
            "experience": "Mid-Level"
        },
        {
            "title": "Database Developer",
            "desc": "Design and develop database architectures and write complex queries.",
            "cat": "Database",
            "icon": "fas fa-table",
            "domain": "IT",
            "skills": ["SQL", "PL/SQL or T-SQL", "Data Modeling", "Stored Procedures", "ETL"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["SSMS", "Toad", "PostgreSQL"],
            "experience": "Mid-Level"
        },
        {
            "title": "SQL Developer",
            "desc": "Specialize in writing SQL scripts, views, and functions.",
            "cat": "Database",
            "icon": "fas fa-code",
            "domain": "IT",
            "skills": ["Advanced SQL", "Query Optimization", "Relational Databases", "Data Analysis"],
            "soft_skills": ["Problem Solving", "Attention to Detail"],
            "tools": ["SQL Server", "MySQL Workbench", "Git"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Database Engineer",
            "desc": "Build and maintain database systems, focusing on scalability and reliability.",
            "cat": "Database",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["Database Architecture", "NoSQL", "High Availability", "Automation", "Python/Bash"],
            "soft_skills": ["Analytical Thinking", "Teamwork"],
            "tools": ["MongoDB", "Cassandra", "Ansible"],
            "experience": "Mid-Level"
        },
        {
            "title": "Data Warehouse Engineer",
            "desc": "Design and manage large data warehouses for BI reporting.",
            "cat": "Database",
            "icon": "fas fa-layer-group",
            "domain": "IT",
            "skills": ["Data Warehousing Concepts", "ETL", "OLAP", "SQL", "Cloud Data Platforms"],
            "soft_skills": ["Problem Solving", "Business Acumen"],
            "tools": ["Snowflake", "Redshift", "Informatica"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Database Architect",
            "desc": "Design the logical and physical structure of large databases.",
            "cat": "Database",
            "icon": "fas fa-sitemap",
            "domain": "IT",
            "skills": ["Data Modeling", "Enterprise Architecture", "Database Design", "Security", "Big Data Integration"],
            "soft_skills": ["Leadership", "Strategic Thinking"],
            "tools": ["Erwin Data Modeler", "Visio", "Oracle"],
            "experience": "Senior Level"
        },

        # 6. Networking
        {
            "title": "Network Engineer",
            "desc": "Design, implement, and manage computer networks.",
            "cat": "Networking",
            "icon": "fas fa-network-wired",
            "domain": "IT",
            "skills": ["Routing/Switching", "TCP/IP", "Firewalls", "Network Troubleshooting", "VPN"],
            "soft_skills": ["Problem Solving", "Communication"],
            "tools": ["Cisco Routers", "Wireshark", "SolarWinds"],
            "experience": "Mid-Level"
        },
        {
            "title": "Network Administrator",
            "desc": "Maintain computer networks and resolve network issues.",
            "cat": "Networking",
            "icon": "fas fa-server",
            "domain": "IT",
            "skills": ["Network Monitoring", "Hardware Configuration", "Troubleshooting", "LAN/WAN", "Security Policies"],
            "soft_skills": ["Attention to Detail", "Patience"],
            "tools": ["Nagios", "Cisco CLI", "PRTG"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Network Architect",
            "desc": "Design complex network structures for enterprise environments.",
            "cat": "Networking",
            "icon": "fas fa-sitemap",
            "domain": "IT",
            "skills": ["Network Design", "SD-WAN", "Cloud Networking", "Security Architecture"],
            "soft_skills": ["Leadership", "Strategic Thinking"],
            "tools": ["Visio", "Cisco ACI", "BGP/OSPF"],
            "experience": "Senior Level"
        },
        {
            "title": "System Administrator",
            "desc": "Install, configure, and maintain servers and IT systems.",
            "cat": "Networking",
            "icon": "fas fa-desktop",
            "domain": "IT",
            "skills": ["Linux/Windows Admin", "Active Directory", "Scripting", "Backup Management", "Virtualization"],
            "soft_skills": ["Problem Solving", "Customer Service"],
            "tools": ["VMware", "PowerShell", "Bash"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Systems Engineer",
            "desc": "Design and build complex IT systems and server infrastructure.",
            "cat": "Networking",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["System Architecture", "Cloud Integration", "Automation", "Storage Solutions", "Virtualization"],
            "soft_skills": ["Analytical Thinking", "Project Management"],
            "tools": ["Ansible", "Hyper-V", "AWS"],
            "experience": "Mid-Level"
        },
        {
            "title": "IT Infrastructure Engineer",
            "desc": "Manage the physical and virtual components of an IT environment.",
            "cat": "Networking",
            "icon": "fas fa-building",
            "domain": "IT",
            "skills": ["Datacenter Management", "Server Hardware", "Networking", "Storage Arrays", "Disaster Recovery"],
            "soft_skills": ["Problem Solving", "Adaptability"],
            "tools": ["SAN/NAS", "VMware", "Cisco UCS"],
            "experience": "Mid-Level"
        },
        {
            "title": "Network Security Engineer",
            "desc": "Focus on securing network infrastructure from external and internal threats.",
            "cat": "Networking",
            "icon": "fas fa-shield-alt",
            "domain": "IT",
            "skills": ["Firewall Configuration", "IDS/IPS", "VPN setup", "Network Access Control", "Threat Analysis"],
            "soft_skills": ["Attention to Detail", "Problem Solving"],
            "tools": ["Palo Alto", "Fortinet", "Cisco ISE"],
            "experience": "Mid to Senior Level"
        },

        # 7. Design / Product
        {
            "title": "UI Designer",
            "desc": "Design the visual layout and user interface of digital products.",
            "cat": "Design / Product",
            "icon": "fas fa-paint-brush",
            "domain": "IT",
            "skills": ["Visual Design", "Typography", "Color Theory", "Prototyping", "Design Systems"],
            "soft_skills": ["Creativity", "Attention to Detail"],
            "tools": ["Figma", "Sketch", "Adobe XD"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "UX Designer",
            "desc": "Focus on the overall experience and usability of a product.",
            "cat": "Design / Product",
            "icon": "fas fa-user-friends",
            "domain": "IT",
            "skills": ["User Research", "Wireframing", "User Journeys", "Usability Testing", "Information Architecture"],
            "soft_skills": ["Empathy", "Communication"],
            "tools": ["Figma", "Miro", "InVision"],
            "experience": "Mid-Level"
        },
        {
            "title": "UI/UX Designer",
            "desc": "Combine visual design with user experience research and strategy.",
            "cat": "Design / Product",
            "icon": "fas fa-pen-nib",
            "domain": "IT",
            "skills": ["UI Design", "UX Research", "Wireframing", "Prototyping", "Interaction Design"],
            "soft_skills": ["Creativity", "Empathy"],
            "tools": ["Figma", "Adobe CC", "Balsamiq"],
            "experience": "Mid-Level"
        },
        {
            "title": "Product Designer",
            "desc": "Oversee the entire design process of a product from conception to delivery.",
            "cat": "Design / Product",
            "icon": "fas fa-cube",
            "domain": "IT",
            "skills": ["Product Strategy", "UI/UX", "User Testing", "Prototyping", "Business Strategy"],
            "soft_skills": ["Leadership", "Problem Solving"],
            "tools": ["Figma", "Zeplin", "Jira"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "UX Researcher",
            "desc": "Conduct research to understand user behaviors, needs, and motivations.",
            "cat": "Design / Product",
            "icon": "fas fa-search",
            "domain": "IT",
            "skills": ["User Interviews", "Surveys", "A/B Testing", "Data Analysis", "Persona Creation"],
            "soft_skills": ["Empathy", "Analytical Thinking"],
            "tools": ["UserTesting", "Qualtrics", "Optimal Workshop"],
            "experience": "Mid-Level"
        },
        {
            "title": "Interaction Designer",
            "desc": "Design how users interact with a digital product, focusing on micro-interactions.",
            "cat": "Design / Product",
            "icon": "fas fa-hand-pointer",
            "domain": "IT",
            "skills": ["Animation", "Prototyping", "UI Design", "User Psychology"],
            "soft_skills": ["Creativity", "Attention to Detail"],
            "tools": ["Principle", "Framer", "Figma"],
            "experience": "Mid-Level"
        },
        {
            "title": "Graphic Designer",
            "desc": "Create visual concepts to communicate ideas that inspire and inform.",
            "cat": "Design / Product",
            "icon": "fas fa-image",
            "domain": "IT",
            "skills": ["Illustration", "Branding", "Typography", "Layout Design"],
            "soft_skills": ["Creativity", "Communication"],
            "tools": ["Adobe Illustrator", "Photoshop", "InDesign"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Web Designer",
            "desc": "Design the visual aesthetics and layout of websites.",
            "cat": "Design / Product",
            "icon": "fas fa-globe",
            "domain": "IT",
            "skills": ["Web Design", "HTML/CSS basics", "Responsive Design", "UI Design"],
            "soft_skills": ["Creativity", "Time Management"],
            "tools": ["Figma", "Webflow", "Adobe XD"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Product Manager",
            "desc": "Define product strategy and roadmap, bridging business and technology.",
            "cat": "Design / Product",
            "icon": "fas fa-briefcase",
            "domain": "IT",
            "skills": ["Product Strategy", "Agile/Scrum", "Market Research", "Roadmapping", "Data Analysis"],
            "soft_skills": ["Leadership", "Communication", "Decision Making"],
            "tools": ["Jira", "Confluence", "Productboard"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Technical Product Manager",
            "desc": "Manage products with a deep technical focus, working closely with engineering.",
            "cat": "Design / Product",
            "icon": "fas fa-laptop-code",
            "domain": "IT",
            "skills": ["Technical Architecture", "API Design", "Agile Methodologies", "Product Management"],
            "soft_skills": ["Analytical Thinking", "Stakeholder Management"],
            "tools": ["Jira", "Postman", "GitHub"],
            "experience": "Senior Level"
        },

        # 8. Testing / Quality
        {
            "title": "QA Engineer",
            "desc": "Ensure software quality through manual and automated testing.",
            "cat": "Testing / Quality",
            "icon": "fas fa-vial",
            "domain": "IT",
            "skills": ["Test Planning", "Manual Testing", "Defect Tracking", "Basic Automation", "SQL"],
            "soft_skills": ["Attention to Detail", "Communication"],
            "tools": ["Jira", "TestRail", "Selenium"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Software Tester",
            "desc": "Execute test cases and report defects in software.",
            "cat": "Testing / Quality",
            "icon": "fas fa-bug",
            "domain": "IT",
            "skills": ["Manual Testing", "Regression Testing", "Bug Reporting", "Exploratory Testing"],
            "soft_skills": ["Attention to Detail", "Patience"],
            "tools": ["Jira", "Bugzilla", "Excel"],
            "experience": "Entry Level"
        },
        {
            "title": "Automation Tester",
            "desc": "Write scripts to automate software testing processes.",
            "cat": "Testing / Quality",
            "icon": "fas fa-robot",
            "domain": "IT",
            "skills": ["Test Automation Frameworks", "Programming (Java/Python)", "API Testing", "CI/CD"],
            "soft_skills": ["Analytical Thinking", "Problem Solving"],
            "tools": ["Selenium", "Cypress", "Jenkins"],
            "experience": "Mid-Level"
        },
        {
            "title": "Manual Tester",
            "desc": "Manually test software for bugs and usability issues.",
            "cat": "Testing / Quality",
            "icon": "fas fa-hand-paper",
            "domain": "IT",
            "skills": ["Test Case Creation", "Functional Testing", "UI Testing", "Bug Tracking"],
            "soft_skills": ["Attention to Detail", "Communication"],
            "tools": ["Jira", "Trello", "BrowserStack"],
            "experience": "Entry Level"
        },
        {
            "title": "Test Engineer",
            "desc": "Design and implement tests, debug and define corrective actions.",
            "cat": "Testing / Quality",
            "icon": "fas fa-tachometer-alt",
            "domain": "IT",
            "skills": ["Test Strategy", "Integration Testing", "Performance Testing", "Automation"],
            "soft_skills": ["Problem Solving", "Analytical Thinking"],
            "tools": ["JMeter", "Selenium", "Postman"],
            "experience": "Mid-Level"
        },
        {
            "title": "Performance Tester",
            "desc": "Test software under load to ensure it performs well under stress.",
            "cat": "Testing / Quality",
            "icon": "fas fa-stopwatch",
            "domain": "IT",
            "skills": ["Load Testing", "Stress Testing", "Performance Monitoring", "Scripting"],
            "soft_skills": ["Analytical Thinking", "Attention to Detail"],
            "tools": ["JMeter", "LoadRunner", "Gatling"],
            "experience": "Mid-Level"
        },
        {
            "title": "QA Automation Engineer",
            "desc": "Design and build advanced automated testing frameworks.",
            "cat": "Testing / Quality",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["Advanced Programming", "Framework Design", "CI/CD Integration", "API Automation"],
            "soft_skills": ["Problem Solving", "Collaboration"],
            "tools": ["Appium", "Playwright", "Selenium"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "SDET",
            "desc": "Software Development Engineer in Test: write code to test code.",
            "cat": "Testing / Quality",
            "icon": "fas fa-code-branch",
            "domain": "IT",
            "skills": ["Software Engineering", "Test Automation Architecture", "CI/CD", "Cloud Technologies"],
            "soft_skills": ["Analytical Thinking", "Teamwork"],
            "tools": ["Java/Python", "Docker", "Jenkins"],
            "experience": "Senior Level"
        },
        {
            "title": "Security Tester",
            "desc": "Test applications for security vulnerabilities.",
            "cat": "Testing / Quality",
            "icon": "fas fa-shield-alt",
            "domain": "IT",
            "skills": ["Vulnerability Scanning", "Penetration Testing", "OWASP Top 10", "Web Security"],
            "soft_skills": ["Analytical Thinking", "Ethics"],
            "tools": ["Burp Suite", "ZAP", "Nmap"],
            "experience": "Mid-Level"
        },

        # 9. IT Management / Business
        {
            "title": "IT Project Manager",
            "desc": "Plan, execute, and deliver IT projects on time and within budget.",
            "cat": "IT Management / Business",
            "icon": "fas fa-tasks",
            "domain": "IT",
            "skills": ["Project Planning", "Risk Management", "Agile Methodologies", "Budgeting", "Resource Allocation"],
            "soft_skills": ["Leadership", "Communication"],
            "tools": ["Jira", "MS Project", "Asana"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "IT Manager",
            "desc": "Oversee IT operations, infrastructure, and technical teams.",
            "cat": "IT Management / Business",
            "icon": "fas fa-users-cog",
            "domain": "IT",
            "skills": ["IT Strategy", "Team Management", "Budgeting", "Vendor Management", "ITIL"],
            "soft_skills": ["Leadership", "Decision Making"],
            "tools": ["ServiceNow", "ERP Systems"],
            "experience": "Senior Level"
        },
        {
            "title": "Technical Project Manager",
            "desc": "Manage IT projects with a deep understanding of the technical details.",
            "cat": "IT Management / Business",
            "icon": "fas fa-laptop-code",
            "domain": "IT",
            "skills": ["Software Development Lifecycle", "Agile/Scrum", "Technical Architecture", "Risk Management"],
            "soft_skills": ["Communication", "Problem Solving"],
            "tools": ["Jira", "Confluence", "GitHub"],
            "experience": "Senior Level"
        },
        {
            "title": "Program Manager",
            "desc": "Manage a group of related IT projects to achieve strategic goals.",
            "cat": "IT Management / Business",
            "icon": "fas fa-sitemap",
            "domain": "IT",
            "skills": ["Program Management", "Strategic Planning", "Stakeholder Management", "Budgeting"],
            "soft_skills": ["Leadership", "Negotiation"],
            "tools": ["Smartsheet", "MS Project", "Jira"],
            "experience": "Senior Level"
        },
        {
            "title": "Scrum Master",
            "desc": "Facilitate Agile ceremonies and remove impediments for the development team.",
            "cat": "IT Management / Business",
            "icon": "fas fa-sync-alt",
            "domain": "IT",
            "skills": ["Agile Framework", "Scrum", "Kanban", "Facilitation", "Metrics Tracking"],
            "soft_skills": ["Empathy", "Servant Leadership"],
            "tools": ["Jira", "Trello", "Mural"],
            "experience": "Mid-Level"
        },
        {
            "title": "Agile Coach",
            "desc": "Train and coach teams and organizations on Agile practices.",
            "cat": "IT Management / Business",
            "icon": "fas fa-chalkboard-teacher",
            "domain": "IT",
            "skills": ["Agile Transformation", "Coaching", "Scaled Agile Framework (SAFe)", "Organizational Design"],
            "soft_skills": ["Mentoring", "Public Speaking"],
            "tools": ["Agile Tools", "Miro"],
            "experience": "Senior Level"
        },
        {
            "title": "Business Analyst",
            "desc": "Analyze business needs and translate them into IT requirements.",
            "cat": "IT Management / Business",
            "icon": "fas fa-chart-line",
            "domain": "IT",
            "skills": ["Requirements Gathering", "Process Modeling", "Data Analysis", "UML", "Agile"],
            "soft_skills": ["Communication", "Problem Solving"],
            "tools": ["Visio", "Jira", "Excel"],
            "experience": "Mid-Level"
        },
        {
            "title": "Technical Business Analyst",
            "desc": "Bridge the gap between business and IT, focusing on system specifications.",
            "cat": "IT Management / Business",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["System Analysis", "SQL", "API Documentation", "Data Mapping"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Postman", "Swagger", "Jira"],
            "experience": "Mid-Level"
        },
        {
            "title": "Systems Analyst",
            "desc": "Analyze and design IT systems to solve business problems.",
            "cat": "IT Management / Business",
            "icon": "fas fa-desktop",
            "domain": "IT",
            "skills": ["System Design", "Troubleshooting", "Requirements Analysis", "Testing"],
            "soft_skills": ["Problem Solving", "Attention to Detail"],
            "tools": ["UML Tools", "ServiceNow", "SQL"],
            "experience": "Mid-Level"
        },
        {
            "title": "IT Consultant",
            "desc": "Advise organizations on how to use IT to meet their business objectives.",
            "cat": "IT Management / Business",
            "icon": "fas fa-user-tie",
            "domain": "IT",
            "skills": ["IT Strategy", "Digital Transformation", "Business Process Re-engineering", "Client Management"],
            "soft_skills": ["Communication", "Presentation Skills"],
            "tools": ["Consulting Frameworks", "PowerPoint"],
            "experience": "Senior Level"
        },
        {
            "title": "Solutions Architect",
            "desc": "Design comprehensive IT solutions tailored to business needs.",
            "cat": "IT Management / Business",
            "icon": "fas fa-project-diagram",
            "domain": "IT",
            "skills": ["System Architecture", "Cloud Computing", "Integration Design", "Software Engineering"],
            "soft_skills": ["Leadership", "Communication"],
            "tools": ["AWS/Azure", "UML", "Enterprise Architect"],
            "experience": "Senior Level"
        },
        {
            "title": "Enterprise Architect",
            "desc": "Align IT strategy with business goals across the entire organization.",
            "cat": "IT Management / Business",
            "icon": "fas fa-city",
            "domain": "IT",
            "skills": ["Enterprise Architecture Frameworks (TOGAF)", "IT Strategy", "Governance", "Cloud Architecture"],
            "soft_skills": ["Strategic Thinking", "Leadership"],
            "tools": ["Archimate", "TOGAF Tools"],
            "experience": "Senior Level"
        },

        # 10. IT Support
        {
            "title": "IT Support Engineer",
            "desc": "Provide technical assistance and support for computer systems and hardware.",
            "cat": "IT Support",
            "icon": "fas fa-headset",
            "domain": "IT",
            "skills": ["Windows/Mac OS Troubleshooting", "Hardware Repair", "Network Basics", "Active Directory"],
            "soft_skills": ["Customer Service", "Patience"],
            "tools": ["ServiceNow", "TeamViewer", "Zendesk"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "Technical Support Engineer",
            "desc": "Resolve complex technical issues related to software and systems.",
            "cat": "IT Support",
            "icon": "fas fa-wrench",
            "domain": "IT",
            "skills": ["Software Troubleshooting", "Log Analysis", "Basic Networking", "SQL Basics"],
            "soft_skills": ["Problem Solving", "Communication"],
            "tools": ["Jira Service Desk", "Splunk", "Remote Desktop"],
            "experience": "Mid-Level"
        },
        {
            "title": "Help Desk Technician",
            "desc": "Provide first-line support for IT issues and user queries.",
            "cat": "IT Support",
            "icon": "fas fa-phone",
            "domain": "IT",
            "skills": ["Ticketing Systems", "Basic Troubleshooting", "Password Resets", "Software Installation"],
            "soft_skills": ["Customer Service", "Empathy"],
            "tools": ["Freshservice", "Active Directory"],
            "experience": "Entry Level"
        },
        {
            "title": "Desktop Support Engineer",
            "desc": "Manage and support end-user devices, including desktops and laptops.",
            "cat": "IT Support",
            "icon": "fas fa-desktop",
            "domain": "IT",
            "skills": ["OS Deployment", "Hardware Troubleshooting", "Printer Setup", "O365 Administration"],
            "soft_skills": ["Communication", "Patience"],
            "tools": ["SCCM", "Intune", "Remote Tools"],
            "experience": "Entry to Mid-Level"
        },
        {
            "title": "System Support Engineer",
            "desc": "Support and maintain server and infrastructure systems.",
            "cat": "IT Support",
            "icon": "fas fa-server",
            "domain": "IT",
            "skills": ["Server Maintenance", "Linux/Windows Admin", "Backup Management", "Virtualization Support"],
            "soft_skills": ["Problem Solving", "Attention to Detail"],
            "tools": ["VMware", "Veeam", "Monitoring Tools"],
            "experience": "Mid-Level"
        },
        {
            "title": "Application Support Engineer",
            "desc": "Support and troubleshoot specific enterprise applications.",
            "cat": "IT Support",
            "icon": "fas fa-window-restore",
            "domain": "IT",
            "skills": ["Application Troubleshooting", "SQL Queries", "API Support", "Log Analysis"],
            "soft_skills": ["Analytical Thinking", "Communication"],
            "tools": ["Postman", "Splunk", "AppDynamics"],
            "experience": "Mid-Level"
        },
        {
            "title": "IT Service Manager",
            "desc": "Manage IT service delivery and support operations.",
            "cat": "IT Support",
            "icon": "fas fa-user-shield",
            "domain": "IT",
            "skills": ["ITIL Framework", "Service Level Management", "Team Management", "Incident Management"],
            "soft_skills": ["Leadership", "Customer Focus"],
            "tools": ["ServiceNow", "ITSM Tools"],
            "experience": "Senior Level"
        },
        {
            "title": "IT Operations Engineer",
            "desc": "Monitor and maintain the day-to-day operations of IT infrastructure.",
            "cat": "IT Support",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["System Monitoring", "Batch Processing", "Incident Triage", "Automation Basics"],
            "soft_skills": ["Reliability", "Attention to Detail"],
            "tools": ["Nagios", "SolarWinds", "Cron"],
            "experience": "Mid-Level"
        },

        # 11. Emerging / Specialized IT
        {
            "title": "Blockchain Developer",
            "desc": "Develop decentralized applications and smart contracts.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-link",
            "domain": "IT",
            "skills": ["Solidity", "Smart Contracts", "Cryptography", "Web3.js", "Ethereum/Hyperledger"],
            "soft_skills": ["Analytical Thinking", "Problem Solving"],
            "tools": ["Truffle", "Hardhat", "Ganache"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Web3 Developer",
            "desc": "Build applications that interact with blockchain networks.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-globe",
            "domain": "IT",
            "skills": ["JavaScript/TypeScript", "React", "Web3.js/Ethers.js", "Smart Contract Integration"],
            "soft_skills": ["Adaptability", "Creativity"],
            "tools": ["MetaMask", "Next.js", "IPFS"],
            "experience": "Mid-Level"
        },
        {
            "title": "IoT Engineer",
            "desc": "Develop and manage Internet of Things devices and systems.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-network-wired",
            "domain": "IT",
            "skills": ["Embedded C/C++", "Python", "IoT Protocols (MQTT, CoAP)", "Cloud IoT Platforms", "Hardware Interfacing"],
            "soft_skills": ["Problem Solving", "Innovation"],
            "tools": ["Arduino", "Raspberry Pi", "AWS IoT"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Robotics Engineer",
            "desc": "Design, build, and program robots for various applications.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-robot",
            "domain": "IT",
            "skills": ["C++/Python", "ROS (Robot Operating System)", "Computer Vision", "Kinematics", "Machine Learning"],
            "soft_skills": ["Analytical Thinking", "Creativity"],
            "tools": ["ROS", "Gazebo", "OpenCV"],
            "experience": "Senior Level"
        },
        {
            "title": "AR/VR Developer",
            "desc": "Create immersive Augmented and Virtual Reality applications.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-vr-cardboard",
            "domain": "IT",
            "skills": ["C# / C++", "Unity / Unreal Engine", "3D Math", "UI/UX for Spatial Computing", "Shader Programming"],
            "soft_skills": ["Creativity", "Problem Solving"],
            "tools": ["Unity3D", "Unreal Engine", "ARCore/ARKit"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Game Developer",
            "desc": "Design and develop interactive video games.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-gamepad",
            "domain": "IT",
            "skills": ["C++ / C#", "Game Engines (Unity/Unreal)", "3D Mathematics", "Gameplay Programming", "Optimization"],
            "soft_skills": ["Creativity", "Teamwork"],
            "tools": ["Unity", "Unreal Engine", "Git"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "Salesforce Developer",
            "desc": "Customize and develop solutions on the Salesforce platform.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-cloud",
            "domain": "IT",
            "skills": ["Apex", "Lightning Web Components (LWC)", "SOQL", "Salesforce CRM", "API Integration"],
            "soft_skills": ["Problem Solving", "Communication"],
            "tools": ["Salesforce DX", "VS Code", "Data Loader"],
            "experience": "Mid-Level"
        },
        {
            "title": "SAP Consultant",
            "desc": "Implement and customize SAP ERP solutions for businesses.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-building",
            "domain": "IT",
            "skills": ["SAP Modules (FICO/MM/SD)", "ABAP Basics", "Business Process Knowledge", "ERP Implementation"],
            "soft_skills": ["Client Management", "Analytical Thinking"],
            "tools": ["SAP GUI", "S/4HANA"],
            "experience": "Mid to Senior Level"
        },
        {
            "title": "RPA Developer",
            "desc": "Automate repetitive business processes using Robotic Process Automation.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-cogs",
            "domain": "IT",
            "skills": ["RPA Tools", "Process Mapping", "C# or VB.NET", "Workflow Automation", "API Integration"],
            "soft_skills": ["Attention to Detail", "Problem Solving"],
            "tools": ["UiPath", "Automation Anywhere", "Blue Prism"],
            "experience": "Mid-Level"
        },
        {
            "title": "Automation Engineer",
            "desc": "Design software or systems to automate tasks and processes.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-sync",
            "domain": "IT",
            "skills": ["Scripting (Python/PowerShell)", "CI/CD", "Infrastructure Automation", "Testing Automation"],
            "soft_skills": ["Analytical Thinking", "Efficiency Driven"],
            "tools": ["Jenkins", "Ansible", "Terraform"],
            "experience": "Mid-Level"
        },
        {
            "title": "Solutions Engineer",
            "desc": "Bridge sales and technology by designing solutions for clients.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-lightbulb",
            "domain": "IT",
            "skills": ["Technical Presentations", "System Architecture", "Sales Acumen", "API Knowledge", "Cloud Platforms"],
            "soft_skills": ["Communication", "Persuasion", "Empathy"],
            "tools": ["CRM", "Postman", "Diagramming Tools"],
            "experience": "Senior Level"
        },
        {
            "title": "Technical Writer",
            "desc": "Create documentation for technical products, APIs, and software.",
            "cat": "Emerging / Specialized IT",
            "icon": "fas fa-pen",
            "domain": "IT",
            "skills": ["Technical Writing", "API Documentation", "Markdown", "Understanding of Code", "Content Structuring"],
            "soft_skills": ["Communication", "Attention to Detail"],
            "tools": ["Confluence", "Swagger", "GitBook"],
            "experience": "Mid-Level"
        }
    ]

    print(f"Prepared {len(roles)} roles to insert.")
    
    # Generate unique IDs based on title and category
    for role in roles:
        # e.g. software_developer
        role_id = role["title"].lower().replace(" ", "_").replace("/", "").replace(".", "")
        role["id"] = role_id
        
    db.job_roles.insert_many(roles)
    print(f"Successfully inserted {len(roles)} job roles into the database!")

if __name__ == "__main__":
    seed_120_roles()
