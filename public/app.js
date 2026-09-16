/* ============================================================
   SkillGap AI — Groq API Integration (Routed via Backend)
   ============================================================ */

/* ---- Helpers ---- */
function setRole(name) {
    document.getElementById("roleInput").value = name;
}

function updateCharCount() {
    const count = document.getElementById("resumeInput").value.length;
    document.getElementById("resumeCount").textContent = count;
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("resumeInput").addEventListener("input", updateCharCount);
});

/* ---- Build the AI prompt ---- */
function buildPrompt(resume, role, options) {
    const extras = [];
    if (options.roadmap)   extras.push("a step-by-step learning roadmap");
    if (options.courses)   extras.push("top course/resource recommendations");
    if (options.salary)    extras.push("salary insights for this role");
    if (options.projects)  extras.push("2-3 beginner-friendly project ideas to build portfolio");

    return `You are an expert AI career coach and technical recruiter. Analyze the following resume against the target job role and provide a detailed skills gap analysis.

TARGET JOB ROLE: ${role}

RESUME CONTENT:
${resume}

Provide your analysis in the following STRICT JSON format (respond ONLY with valid JSON, no extra text):

{
  "readiness_score": <number 0-100>,
  "summary": "<2-3 sentence honest assessment of the candidate's fit for the role>",
  "matched_skills": ["skill1", "skill2", "skill3", "..."],
  "missing_skills": ["skill1", "skill2", "skill3", "..."],
  "roadmap": [
    { "step": 1, "title": "Step title", "description": "What to learn and why" },
    { "step": 2, "title": "Step title", "description": "What to learn and why" },
    { "step": 3, "title": "Step title", "description": "What to learn and why" },
    { "step": 4, "title": "Step title", "description": "What to learn and why" },
    { "step": 5, "title": "Step title", "description": "What to learn and why" }
  ],
  "recommendations": [
    { "category": "📚 Courses", "title": "Recommended Courses", "content": "Specific course names and platforms" },
    { "category": "🛠️ Projects", "title": "Portfolio Projects", "content": "Project ideas to demonstrate the missing skills" },
    { "category": "💰 Salary", "title": "Salary Insights", "content": "Expected salary range for this role in India" },
    { "category": "🎯 Job Strategy", "title": "Job Search Strategy", "content": "Tips to improve profile and land the role faster" }
  ]
}

Be specific, actionable, and encouraging. List at least 5 matched skills and 5 missing skills.`;
}

/* ---- Main Analysis Function ---- */
async function analyzeSkillsGap() {
    const resume = document.getElementById("resumeInput").value.trim();
    const role   = document.getElementById("roleInput").value.trim();

    // Validate inputs
    if (!resume || resume.length < 50) {
        showError("Please paste your complete resume text (at least 50 characters) to get an accurate analysis.");
        return;
    }
    if (!role) {
        showError("Please enter or select a target job role.");
        return;
    }

    clearError();
    hideResults();
    setLoading(true);

    const options = {
        roadmap:  document.getElementById("includeRoadmap").checked,
        courses:  document.getElementById("includeCourses").checked,
        salary:   document.getElementById("includeSalary").checked,
        projects: document.getElementById("includeProjects").checked,
    };

    const prompt = buildPrompt(resume, role, options);
    const startTime = Date.now();

    try {
        const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
        const response = await fetch(`${API_BASE}/api/ai/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_prompt: "You are an expert AI career coach. Always respond with valid JSON only, no markdown code blocks, no extra text.",
                user_prompt: prompt,
                temperature: 0.4,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        let raw = data.content.trim();

        // Strip any markdown code fences if present
        raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

        const result = JSON.parse(raw);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        renderResults(result, role, elapsed);

    } catch (err) {
        console.error("Analysis Error:", err);
        if (err.message.includes("JSON")) {
            showError("The AI returned an unexpected response. Please try again.");
        } else {
            showError(`Analysis failed: ${err.message}`);
        }
    } finally {
        setLoading(false);
    }
}

/* ---- Render Results ---- */
function renderResults(data, role, elapsed) {
    // Meta info
    document.getElementById("resultRole").textContent = role;
    document.getElementById("resultTime").textContent = `${elapsed}s`;

    // Score
    const score = Math.min(100, Math.max(0, data.readiness_score || 0));
    animateScore(score);

    // Summary
    document.getElementById("scoreSummary").innerHTML = `
        <p>${data.summary || ""}</p>
        <br>
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:10px;">
            <div style="text-align:center;">
                <div style="font-size:1.8rem; font-weight:800; color:#34D399;">${(data.matched_skills || []).length}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">Skills Matched</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:1.8rem; font-weight:800; color:#F87171;">${(data.missing_skills || []).length}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">Skills Missing</div>
            </div>
        </div>
    `;

    // Matched Skills
    const matchedEl = document.getElementById("matchedSkills");
    const matched = data.matched_skills || [];
    document.getElementById("matchedCount").textContent = matched.length;
    matchedEl.innerHTML = matched.map(s =>
        `<span class="skill-tag skill-matched"><i class="fas fa-check"></i>${s}</span>`
    ).join("");

    // Missing Skills
    const missingEl = document.getElementById("missingSkills");
    const missing = data.missing_skills || [];
    document.getElementById("missingCount").textContent = missing.length;
    missingEl.innerHTML = missing.map(s =>
        `<span class="skill-tag skill-missing"><i class="fas fa-times"></i>${s}</span>`
    ).join("");

    // Roadmap
    const roadmap = data.roadmap || [];
    document.getElementById("roadmapContent").innerHTML = roadmap.map(step => `
        <div class="roadmap-step">
            <div class="roadmap-step-num">${step.step}</div>
            <div class="roadmap-step-content">
                <h4>${step.title}</h4>
                <p>${step.description}</p>
            </div>
        </div>
    `).join("");

    // Recommendations
    const recs = data.recommendations || [];
    document.getElementById("recommendContent").innerHTML = recs.map(rec => `
        <div class="recommend-item">
            <h4>${rec.category} ${rec.title}</h4>
            <p>${rec.content}</p>
        </div>
    `).join("");

    // Show results
    document.getElementById("resultsSection").style.display = "block";
    setTimeout(() => {
        document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

/* ---- Animate Score Circle ---- */
function animateScore(score) {
    const circle = document.getElementById("scoreFill");
    const numEl  = document.getElementById("scoreNumber");
    const circumference = 314; // 2 * pi * 50

    // Inject SVG gradient
    const svg = circle.closest("svg");
    if (!svg.querySelector("defs")) {
        svg.insertAdjacentHTML("afterbegin", `
            <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#e052a0"/>
                    <stop offset="100%" stop-color="#3B82F6"/>
                </linearGradient>
            </defs>
        `);
        circle.setAttribute("stroke", "url(#scoreGrad)");
    }

    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Animate number
    let current = 0;
    const interval = setInterval(() => {
        current += 2;
        if (current >= score) { current = score; clearInterval(interval); }
        numEl.textContent = current;
    }, 20);
}

/* ---- Export Results ---- */
function exportResults() {
    const section = document.getElementById("resultsSection");
    const text    = section.innerText;
    const blob    = new Blob([text], { type: "text/plain" });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement("a");
    a.href = url;
    a.download = "skillgap-analysis.txt";
    a.click();
    URL.revokeObjectURL(url);
}

/* ---- UI Helpers ---- */
function setLoading(isLoading) {
    const btn     = document.getElementById("analyzeBtn");
    const textEl  = btn.querySelector(".btn-text");
    const loadEl  = btn.querySelector(".btn-loading");

    if (isLoading) {
        textEl.style.display  = "none";
        loadEl.style.display  = "flex";
        btn.disabled = true;
    } else {
        textEl.style.display  = "flex";
        loadEl.style.display  = "none";
        btn.disabled = false;
    }
}

function showError(msg) {
    const el = document.getElementById("errorMsg");
    document.getElementById("errorText").textContent = msg;
    el.style.display = "flex";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearError() {
    document.getElementById("errorMsg").style.display = "none";
}

function hideResults() {
    document.getElementById("resultsSection").style.display = "none";
}

function resetAnalysis() {
    document.getElementById("resumeInput").value = "";
    document.getElementById("roleInput").value   = "";
    updateCharCount();
    clearError();
    hideResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

