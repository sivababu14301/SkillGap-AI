/* ============================================================
   SkillGap AI — Job Roles & Categories Data
   Fetches dynamically from MongoDB via Flask API
   ============================================================ */

/* ── Category definitions with icons & theme colors ─────────── */
const categoryMeta = {
    "All": { icon: "fas fa-th-large", color: "rc-purple" },
    "Software Development": { icon: "fas fa-laptop-code", color: "rc-purple" },
    "AI / ML / Data": { icon: "fas fa-brain", color: "rc-blue" },
    "Cloud / DevOps": { icon: "fas fa-cloud", color: "rc-teal" },
    "Cybersecurity": { icon: "fas fa-shield-alt", color: "rc-red" },
    "Database": { icon: "fas fa-database", color: "rc-blue" },
    "Networking": { icon: "fas fa-network-wired", color: "rc-orange" },
    "Design / Product": { icon: "fas fa-paint-brush", color: "rc-pink" },
    "Testing / Quality": { icon: "fas fa-vial", color: "rc-teal" },
    "IT Management / Business": { icon: "fas fa-briefcase", color: "rc-orange" },
    "IT Support": { icon: "fas fa-headset", color: "rc-blue" },
    "Emerging / Specialized IT": { icon: "fas fa-robot", color: "rc-purple" },
    
    // NON-IT Categories
    "Engineering & Manufacturing": { icon: "fas fa-cogs", color: "rc-teal" },
    "Construction & Architecture": { icon: "fas fa-building", color: "rc-orange" },
    "Finance, Accounting & Banking": { icon: "fas fa-chart-pie", color: "rc-blue" },
    "Marketing, Sales & Business": { icon: "fas fa-bullhorn", color: "rc-pink" },
    "HR & Administration": { icon: "fas fa-users", color: "rc-purple" },
    "Law": { icon: "fas fa-balance-scale", color: "rc-blue" },
    "Healthcare & Medical": { icon: "fas fa-heartbeat", color: "rc-red" },
    "Agriculture & Food": { icon: "fas fa-leaf", color: "rc-green" },
    "Science & Biotechnology": { icon: "fas fa-flask", color: "rc-teal" },
    "Education": { icon: "fas fa-chalkboard-teacher", color: "rc-orange" }
};

let jobRoles = [];

async function ensureJobRoles() {
    try {
        const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
        const response = await fetch(`${API_BASE}/api/roles`);
        if (response.ok) {
            const data = await response.json();
            // Map DB roles to frontend format
            jobRoles = data.map(r => ({
                id: r._id,
                name: r.title,
                icon: r.icon || categoryMeta[r.cat]?.icon || "fas fa-briefcase",
                colorClass: r.colorClass || categoryMeta[r.cat]?.color || "rc-blue",
                category: r.cat,
                domain: r.domain || "IT", // IT or NON-IT
                description: r.desc,
                skills: r.skills || [],
                soft_skills: r.soft_skills || [],
                tools: r.tools || [],
                experience: r.experience || "Entry Level",
                roadmap: r.roadmap
            }));
        } else {
            console.error("Failed to fetch job roles. Server returned:", response.status);
        }
    } catch (e) {
        console.error("Failed to fetch job roles from API:", e);
    }
    
    return jobRoles;
}
