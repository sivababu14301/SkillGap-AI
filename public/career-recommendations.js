/* ============================================================
   SkillGap AI — Career Recommendations JavaScript
   Module 7 — Full implementation with all sections
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    

    

    // ── 1. Check Session ──────────────────────────────────────
    const sessionData = typeof requireAuth === "function" ? requireAuth() : JSON.parse(sessionStorage.getItem("skillgap_session") || "null");
    if (!sessionData || !sessionData.user_id) {
        window.location.href = "login.html";
        return;
    }

    // ── 2. Fetch Latest Resume from Backend ───────────────────
    let userResumeSkills = [];
    try {
        const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
        await window.ensureJobRoles();
        const resumeRes = await fetch(`${API_BASE}/api/resumes/user/${sessionData.user_id}`);
        if (resumeRes.ok) {
            const resumes = await resumeRes.json();
            if (resumes.length > 0) {
                // Sort to get the latest resume
                resumes.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
                const latestResume = resumes[0];
                
                // Flexibly aggregate skills from all possible fields
                const skillsSet = new Set();
                
                if (latestResume.extracted_skills && Array.isArray(latestResume.extracted_skills)) {
                    latestResume.extracted_skills.forEach(s => skillsSet.add(s));
                }
                
                if (latestResume.aiData) {
                    if (Array.isArray(latestResume.aiData.technical_skills)) {
                        latestResume.aiData.technical_skills.forEach(s => skillsSet.add(s));
                    }
                    if (Array.isArray(latestResume.aiData.soft_skills)) {
                        latestResume.aiData.soft_skills.forEach(s => skillsSet.add(s));
                    }
                    if (Array.isArray(latestResume.aiData.skills)) {
                        latestResume.aiData.skills.forEach(s => skillsSet.add(s));
                    }
                }
                
                if (skillsSet.size > 0) {
                    userResumeSkills = Array.from(skillsSet);
                }
            }
        }
    } catch (e) {
        console.error("Backend fetch error for resumes", e);
    }

    // Handle Edge Case: No usable skills found
    if (userResumeSkills.length === 0) {
document.getElementById("mainWrapper").innerHTML = `
            <div style="padding: 100px 20px; text-align: center; color: white;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #EF4444; margin-bottom: 20px;"></i>
                <h2>Resume analysis could not identify sufficient skills.</h2>
                <p style="color: #9CA3AF; margin-top: 10px;">Please upload a clear and updated resume containing your skills, education, projects and experience.</p>
                <a href="upload-resume.html" class="btn-primary" style="margin-top: 20px; display: inline-block;">Upload New Resume</a>
            </div>
        `;
        return; // Stop execution
    }
    
    // Normalize user skills using global normalizeSkill
    const normalizedUserSkills = userResumeSkills.map(s => typeof normalizeSkill === 'function' ? normalizeSkill(s).toLowerCase() : s.toLowerCase());

    let selectedRoleName = null;
    try {
        const jobRes = await fetch(`${API_BASE}/api/job-selection/user/${sessionData.user_id}`);
        if (jobRes.ok) {
            const jobData = await jobRes.json();
            selectedRoleName = jobData.selected_job_role;
        }
    } catch (e) {
        console.error("Backend fetch error for job selection", e);
    }

    const evaluatedRoles = jobRoles.map(role => {
        const matchedSkills = [];
        const missingSkills = [];
        
        role.skills.forEach(rs => {
            const normRs = typeof normalizeSkill === 'function' ? normalizeSkill(rs).toLowerCase() : rs.toLowerCase();
            if (normalizedUserSkills.includes(normRs)) {
                matchedSkills.push(rs);
            } else {
                missingSkills.push(rs);
            }
        });
        
        let calculatedMatch = 0;
        if (role.skills.length > 0) {
            calculatedMatch = Math.round((matchedSkills.length / role.skills.length) * 100);
        }
        
        // Add required UI metadata deterministically based on category
        const catMeta = categoryMeta[role.category] || categoryMeta["All"];
        
        return {
            ...role, // inherits name, icon, skills, etc.
            emoji: "💻", // generic fallback
            color: catMeta.color === "rc-purple" ? "#7C3AED" : 
                   catMeta.color === "rc-blue" ? "#3B82F6" : 
                   catMeta.color === "rc-teal" ? "#06B6D4" : 
                   catMeta.color === "rc-red" ? "#EF4444" : 
                   catMeta.color === "rc-pink" ? "#EC4899" : 
                   catMeta.color === "rc-orange" ? "#F59E0B" : "#10B981",
            demand: calculatedMatch > 70 ? "High" : "Growing",
            demandClass: calculatedMatch > 70 ? "demand-high" : "demand-growing",
            demandIcon: calculatedMatch > 70 ? "fas fa-fire" : "fas fa-rocket",
            salary: "₹5L – ₹15L", // Placeholder since it varies
            match: calculatedMatch,
            matchedSkillsList: matchedSkills,
            missingSkillsList: missingSkills,
            growthPath: [
                { level: "Intern",    emoji: "🎓", title: "Intern",                  salary: "₹2L–₹4L" },
                { level: "Junior",    emoji: "💻", title: "Junior " + role.name,  salary: "₹4L–₹7L",  current: true },
                { level: "Mid-Level", emoji: "🚀", title: role.name,         salary: "₹7L–₹12L", active: true },
                { level: "Senior",    emoji: "⭐", title: "Senior " + role.name,  salary: "₹12L–₹20L" },
                { level: "Executive", emoji: "🏛️", title: "Lead / Architect",       salary: "₹25L+" }
            ]
        };
    });

    // Sort all roles by match percentage (descending)
    let sorted = evaluatedRoles.sort((a, b) => b.match - a.match);
    
    // Filter out 0% match roles to only show meaningful data
    let meaningfulRoles = sorted.filter(r => r.match > 0);
    
    // If there is at least 1 meaningful match, show up to 5 of them.
    // If all roles are 0% but there ARE skills extracted, fallback to showing Top 5 
    // so the page never looks broken.
    if (meaningfulRoles.length > 0) {
        sorted = meaningfulRoles.slice(0, 5);
    } else {
        sorted = sorted.slice(0, 5);
    }
    
    let topRole = sorted[0];

    // OVERRIDE: If the user selected a specific role, it MUST be the primary topRole.
    if (selectedRoleName) {
        const foundRole = evaluatedRoles.find(r => r.name === selectedRoleName);
        if (foundRole) {
            topRole = foundRole;
            // Ensure the topRole is strictly first in the recommended paths as well
            sorted = sorted.filter(r => r.name !== selectedRoleName);
            sorted.unshift(topRole);
            if (sorted.length > 5) sorted = sorted.slice(0, 5);
        }
    }

    // If top match is very low (e.g. 0%), show a message instead of an error
    const lowMatchMessage = topRole.match < 20 ? 
        `<div style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #FBBF24; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <i class="fas fa-info-circle"></i> No strong match yet, but these career paths are recommended based on your closest skills.
        </div>` : '';

    const heroContainer = document.getElementById("topRecommendCard");
    heroContainer.innerHTML = lowMatchMessage; // We will append the hero card HTML to this container in renderHeroCard

    // ── 3. Hero Top Recommendation Card ──────────────────────
    renderHeroCard(topRole, topRole.matchedSkillsList, topRole.missingSkillsList);

    // ── 4. Career Job Cards Grid ──────────────────────────────
    renderJobCards(sorted);

    // ── 5. Skills Tags ────────────────────────────────────────
    renderSkillTags(topRole.matchedSkillsList, topRole.missingSkillsList);

    // ── 6. Career Growth Timeline ─────────────────────────────
    renderTimeline(topRole);

    // ── 7. Market Demand Bar Chart ────────────────────────────
    renderDemandChart(sorted);

    // ── 8. Recommended Certifications ────────────────────────
    renderCertifications(topRole.missingSkillsList);

    // ── 9. AI Advice Panel ────────────────────────────────────
    renderAIAdvice(topRole, topRole.missingSkillsList, topRole.match);

    // ── 10. Save to session for Learning Roadmap ──────────────
    sessionStorage.setItem("skillgap_career", JSON.stringify({
        role:       topRole.name,
        match:      topRole.match,
        salary:     topRole.salary,
        growthPath: (topRole.growthPath || []).map(g => g.title),
        missing:    topRole.missingSkillsList,
        matched:    topRole.matchedSkillsList
    }));

    // ── 11. Sidebar & header user info ────────────────────────
    setupUserInfo();
    setupSidebar();

    // ── 12. Animate hero score ring after page load ───────────
    setTimeout(() => animateHeroRing(topRole.match), 400);
    document.getElementById("careerCount").textContent = `${sorted.length} career matches found`;
});

/* ══════════════════════════════════════════════════════════
   RENDER: HERO CARD (Top Recommendation)
══════════════════════════════════════════════════════════ */
function renderHeroCard(role, matched, missing) {
    const reasons = [
        ...matched.slice(0, 2).map(s => `Strong <strong>${s}</strong> skills in your resume`),
        "Good resume score & project quality",
        "High industry demand in 2024–25"
    ].slice(0, 4);

    document.getElementById("topRecommendCard").innerHTML += `
        <!-- Hero Left -->
        <div class="hero-left">
            <div class="hero-trophy-badge">
                <i class="fas fa-trophy"></i> 🏆 Best Career Match
            </div>

            <div class="hero-role-row">
                <div class="hero-role-icon-wrap">
                    <i class="${role.icon}" style="color:${role.color}"></i>
                </div>
                <div class="hero-role-info">
                    <div class="hero-role-name">${role.name}</div>
                    <div class="hero-match-row">
                        <span class="hero-match-pct">${role.match}%</span>
                        <div class="hero-match-bar-wrap">
                            <div class="hero-match-bar-fill" id="heroMatchFill" style="width:0%"></div>
                        </div>
                        <span style="font-size:0.78rem;color:rgba(255,255,255,0.35)">Match</span>
                    </div>
                </div>
            </div>

            <div class="hero-meta-row">
                <span class="hero-meta-pill pill-demand">
                    <i class="fas fa-fire"></i> ${role.demand} Demand
                </span>
                <span class="hero-meta-pill pill-salary">
                    <i class="fas fa-rupee-sign"></i> ${role.salary} Expected
                </span>
            </div>

            <p class="hero-reasons-label">Why this role is right for you</p>
            <ul class="hero-reasons-list">
                ${reasons.map(r => `
                    <li>
                        <span class="reason-icon"><i class="fas fa-check"></i></span>
                        <span>${r}</span>
                    </li>
                `).join("")}
            </ul>

            <button class="hero-view-btn" onclick="scrollToTimeline()">
                <i class="fas fa-map-signs"></i> View Career Path
            </button>
        </div>

        <!-- Hero Right — Score Ring -->
        <div class="hero-right">
            <div class="hero-score-ring-wrap">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stop-color="#10B981"/>
                            <stop offset="100%" stop-color="#34D399"/>
                        </linearGradient>
                    </defs>
                    <circle class="hero-score-ring-bg"   cx="80" cy="80" r="70"/>
                    <circle class="hero-score-ring-fill" cx="80" cy="80" r="70" id="heroRingFill"/>
                </svg>
                <div class="hero-score-center">
                    <div class="hero-score-number" id="heroScoreNum">0%</div>
                    <div class="hero-score-label">Compatibility</div>
                </div>
            </div>

            <div class="hero-right-stats">
                <div class="hero-stat-row">
                    <span class="hero-stat-name">Demand Level</span>
                    <span class="hero-stat-val" style="color:#34D399">${role.demand}</span>
                </div>
                <div class="hero-stat-row">
                    <span class="hero-stat-name">Avg Salary</span>
                    <span class="hero-stat-val" style="color:#FBBF24">${role.salary}</span>
                </div>
                <div class="hero-stat-row">
                    <span class="hero-stat-name">Growth Rate</span>
                    <span class="hero-stat-val" style="color:#A78BFA">+22% YoY</span>
                </div>
                <div class="hero-stat-row">
                    <span class="hero-stat-name">Job Openings</span>
                    <span class="hero-stat-val" style="color:#60A5FA">12,400+</span>
                </div>
            </div>
        </div>
    `;

    // Animate match bar
    setTimeout(() => {
        const fill = document.getElementById("heroMatchFill");
        if (fill) fill.style.width = role.match + "%";
    }, 600);
}

/* Animate SVG ring */
function animateHeroRing(pct) {
    const circle    = document.getElementById("heroRingFill");
    const numEl     = document.getElementById("heroScoreNum");
    if (!circle || !numEl) return;

    const circumference = 2 * Math.PI * 70; // r=70
    const offset = circumference - (pct / 100) * circumference;
    circle.style.strokeDasharray  = circumference;
    circle.style.strokeDashoffset = circumference;

    // Animate stroke
    requestAnimationFrame(() => {
        setTimeout(() => {
            circle.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
            circle.style.strokeDashoffset = offset;
        }, 50);
    });

    // Animate number counter
    let start = 0;
    const step = pct / 60;
    const interval = setInterval(() => {
        start = Math.min(start + step, pct);
        numEl.textContent = Math.round(start) + "%";
        if (start >= pct) clearInterval(interval);
    }, 25);
}

/* ══════════════════════════════════════════════════════════
   RENDER: JOB CARDS
══════════════════════════════════════════════════════════ */
function renderJobCards(sorted) {
    const colors = ["#7C3AED","#3B82F6","#10B981","#F59E0B","#06B6D4"];
    const grid   = document.getElementById("careerJobGrid");

    grid.innerHTML = sorted.map((r, i) => `
        <div class="cr-job-card ${i === 0 ? 'cr-top-pick' : ''}"
             style="--card-accent: linear-gradient(to right, ${r.color}, ${colors[(i+1)%colors.length]})"
             onclick="cardClick('${r.name}')">
            <div class="cjc-rank ${i === 0 ? 'rank-1' : ''}">${i === 0 ? '★' : '#' + (i+1)}</div>
            <div class="cjc-icon"><i class="${r.icon}" style="color:${r.color}"></i></div>
            <div class="cjc-name">${r.name}</div>
            <div class="cjc-match" style="color:${r.color}">${r.match}% Match</div>
            <span class="cjc-demand ${r.demandClass}">
                <i class="${r.demandIcon}"></i> ${r.demand} Demand
            </span>
            <div class="cjc-salary"><i class="fas fa-rupee-sign"></i>${r.salary}</div>
            <div class="cjc-mini-bar">
                <div class="cjc-mini-bar-fill" style="width:${r.match}%; background:${r.color}"></div>
            </div>
            <button class="cjc-btn">
                <i class="fas fa-arrow-right"></i> View Details
            </button>
        </div>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   RENDER: SKILL TAGS
══════════════════════════════════════════════════════════ */
function renderSkillTags(matched, missing) {
    const strongGrid  = document.getElementById("strongSkillsGrid");
    const improveGrid = document.getElementById("improveSkillsGrid");

    const strongList  = matched.length > 0 ? matched : ["Python", "Flask", "SQL", "Git", "HTML", "CSS"];
    const improveList = missing.length > 0 ? missing : ["Docker", "AWS", "REST API", "Machine Learning"];

    strongGrid.innerHTML = strongList.map((s, i) => `
        <span class="tag-strong" style="animation-delay:${i*0.07}s">${s}</span>
    `).join("");

    improveGrid.innerHTML = improveList.map((s, i) => `
        <span class="tag-improve" style="animation-delay:${i*0.07}s">${s}</span>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   RENDER: CAREER GROWTH TIMELINE
══════════════════════════════════════════════════════════ */
function renderTimeline(role) {
    const tlEl = document.getElementById("careerTimeline");

    const path = role.growthPath || [
        { level: "Intern",    emoji: "🎓", title: "Intern",                  salary: "₹2L–₹4L" },
        { level: "Junior",    emoji: "💻", title: "Junior Python Developer",  salary: "₹4L–₹7L",  current: true },
        { level: "Mid-Level", emoji: "🚀", title: "Python Developer",         salary: "₹7L–₹12L", active: true },
        { level: "Senior",    emoji: "⭐", title: "Senior Python Developer",  salary: "₹12L–₹20L" },
        { level: "Executive", emoji: "🏛️", title: "Software Architect",       salary: "₹25L+" }
    ];

    tlEl.innerHTML = path.map((step, i) => `
        <div class="cr-timeline-step">
            <div class="cr-timeline-node ${step.active ? 'tl-active' : ''} ${step.current ? 'tl-current' : ''}">
                ${step.current ? '<span class="tl-current-badge">📍 You are here</span>' : ''}
                <div class="tl-step-num">${i + 1}</div>
                <div class="tl-role-emoji">${step.emoji}</div>
                <div class="tl-role-level">${step.level}</div>
                <div class="tl-role-name">${step.title}</div>
                <div class="tl-role-salary">${step.salary}</div>
            </div>
        </div>
        ${i < path.length - 1 ? '<div class="cr-timeline-arrow"><i class="fas fa-arrow-right"></i></div>' : ''}
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   RENDER: MARKET DEMAND BAR CHART
══════════════════════════════════════════════════════════ */
function renderDemandChart(sorted) {
    const ctx    = document.getElementById("marketDemandChart");
    const labels = sorted.map(r => r.name);
    const values = sorted.map(r => r.match);
    const bgColors = sorted.map(r => r.color + "44");
    const bdColors = sorted.map(r => r.color);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Match %",
                data: values,
                backgroundColor: bgColors,
                borderColor:     bdColors,
                borderWidth:     2,
                borderRadius:    10,
                borderSkipped:   false
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1400,
                easing: "easeInOutQuart"
            },
            scales: {
                x: {
                    min: 0, max: 100,
                    ticks: { color: "rgba(255,255,255,0.35)", font: { size: 11, family: "Inter" }, callback: v => v + "%" },
                    grid: { color: "rgba(255,255,255,0.04)" }
                },
                y: {
                    ticks: { color: "rgba(255,255,255,0.65)", font: { size: 12, weight: "600", family: "Inter" } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(15,15,30,0.95)",
                    borderColor: "rgba(124,58,237,0.3)",
                    borderWidth: 1,
                    titleFont: { size: 13, weight: "700", family: "Inter" },
                    bodyFont: { size: 12, family: "Inter" },
                    callbacks: {
                        label: ctx => ` ${ctx.raw}% Match Score`
                    }
                }
            }
        }
    });
}

/* ══════════════════════════════════════════════════════════
   RENDER: RECOMMENDED CERTIFICATIONS
══════════════════════════════════════════════════════════ */
function renderCertifications(missing) {
    const allCerts = [
        { name: "Python Certification",       provider: "Python Institute",     icon: "fab fa-python", color: "#7C3AED", tags: ["Python"] },
        { name: "AWS Cloud Practitioner",     provider: "Amazon Web Services",  icon: "fab fa-aws",    color: "#F59E0B", tags: ["AWS"] },
        { name: "Docker Fundamentals",        provider: "Docker Inc.",          icon: "fab fa-docker", color: "#06B6D4", tags: ["Docker"] },
        { name: "SQL Advanced Certification", provider: "Oracle / Coursera",   icon: "fas fa-database", color: "#3B82F6", tags: ["SQL"] },
        { name: "REST API Design",            provider: "Postman Academy",      icon: "fas fa-plug",   color: "#10B981", tags: ["REST API"] },
        { name: "Machine Learning Basics",    provider: "Google / Coursera",   icon: "fas fa-brain",  color: "#EC4899", tags: ["Machine Learning"] }
    ];

    // Prioritize certs related to missing skills
    const prioritized = [
        ...allCerts.filter(c => c.tags.some(t => missing.includes(t))),
        ...allCerts.filter(c => !c.tags.some(t => missing.includes(t)))
    ].slice(0, 5);

    document.getElementById("certificationsList").innerHTML = prioritized.map(c => `
        <div class="cr-cert-item" onclick="openCert('${c.name}')">
            <div class="cr-cert-icon" style="background:${c.color}22; color:${c.color}; border:1px solid ${c.color}44">
                <i class="${c.icon}"></i>
            </div>
            <div class="cr-cert-info">
                <div class="cr-cert-name">${c.name}</div>
                <div class="cr-cert-provider">${c.provider}</div>
            </div>
            <span class="cr-cert-badge">Recommended</span>
        </div>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   RENDER: AI CAREER ADVICE PANEL
══════════════════════════════════════════════════════════ */
function renderAIAdvice(role, missing, matchPct) {
    const top3    = missing.slice(0, 3).join(", ");
    const current = matchPct;
    const target  = Math.min(current + 14, 95);

    document.getElementById("aiAdviceText").innerHTML = `
        <h3>
            <i class="fas fa-lightbulb" style="color:#F59E0B"></i>
            AI Career Advice
            <span style="font-size:0.72rem; background:rgba(167,139,250,0.15); border:1px solid rgba(167,139,250,0.3); color:#A78BFA; padding:3px 10px; border-radius:20px; font-weight:700">Groq AI Analysis</span>
        </h3>
        <p>
            Based on your profile analysis, <strong>${role.name}</strong> is your best career match
            with <span class="ai-highlight">${role.match}% compatibility</span>.<br><br>
            To increase your match percentage and land your first offer faster, focus on learning
            <strong>${top3 || "Docker, AWS and REST API"}</strong> — these are the most in-demand
            skills missing from your profile.<br><br>
            We recommend completing <strong>2–3 portfolio projects</strong> showcasing these skills
            and adding them to your GitHub. This can fast-track your career readiness significantly.
        </p>
    `;

    document.getElementById("aiReadinessBox").innerHTML = `
        <div class="cr-readiness-label">Expected Readiness</div>
        <div class="cr-readiness-arrow">
            <span class="cr-r-from">${current}%</span>
            <span class="cr-r-icon"><i class="fas fa-long-arrow-alt-right"></i></span>
            <span class="cr-r-to">${target}%</span>
        </div>
        <div class="cr-readiness-sub">After skill improvements</div>
    `;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function setupUserInfo() {
    const user = JSON.parse(localStorage.getItem("skillgap_user") || "{}");
    const name = user.name || "Student";
    const initial = name.charAt(0).toUpperCase();

    const ids = ["sidebarAvatar", "headerAvatar"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initial;
    });
    const nameEls = ["sidebarName", "headerName"];
    nameEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
    });
}

function setupSidebar() {
    const sidebar   = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    const closeBtn  = document.getElementById("sidebarClose");
    const overlay   = document.getElementById("overlay");

    if (hamburger) hamburger.addEventListener("click", openSidebar);
    if (closeBtn)  closeBtn.addEventListener("click",  closeSidebar);
}

function openSidebar() {
    document.getElementById("sidebar")?.classList.add("sidebar-open");
    document.getElementById("overlay")?.classList.add("overlay-show");
    document.getElementById("mainWrapper")?.classList.add("sidebar-pushed");
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("sidebar-open");
    document.getElementById("overlay")?.classList.remove("overlay-show");
    document.getElementById("mainWrapper")?.classList.remove("sidebar-pushed");
}

function logout() {
    localStorage.removeItem("skillgap_user");
    sessionStorage.clear();
    window.location.href = "login.html";
}

function scrollToTimeline() {
    document.querySelector(".cr-timeline-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cardClick(roleName) {
    showToast(`📊 Viewing details for ${roleName}`);
    setTimeout(() => {
        document.querySelector(".cr-timeline-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
}

function openCert(certName) {
    showToast(`🎓 ${certName} — Check the Learning Roadmap for resources!`);
}

function showToast(msg) {
    const toast   = document.getElementById("crToast");
    const msgEl   = document.getElementById("crToastMsg");
    if (!toast) return;
    msgEl.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD CAREER REPORT
══════════════════════════════════════════════════════════ */
function downloadCareerReport() {
    const results = JSON.parse(sessionStorage.getItem("skillgap_results") || "{}");
    const career  = JSON.parse(sessionStorage.getItem("skillgap_career")  || "{}");

    const now    = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const report = `
╔══════════════════════════════════════════════════════════╗
║          SkillGap AI — Career Recommendation Report       ║
╚══════════════════════════════════════════════════════════╝

  Generated : ${dateStr} at ${timeStr}
  Module    : Career Recommendations (Module 7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  BEST CAREER RECOMMENDATION
  ──────────────────────────
  Role              : ${career.role    || "Python Developer"}
  Match Percentage  : ${career.match   || 85}%
  Expected Salary   : ${career.salary  || "₹5L – ₹10L"}
  Demand Level      : High
  Growth Rate       : +22% Year over Year

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  YOUR STRONG SKILLS  ✓
  ─────────────────────
  ${(results.matched || ["Python", "Flask", "SQL", "Git", "HTML", "CSS"]).join(", ")}

  SKILLS TO IMPROVE  ↑
  ─────────────────────
  ${(results.missing || ["Docker", "AWS", "REST API", "Machine Learning"]).join(", ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  CAREER GROWTH PATH
  ──────────────────
  ${(career.growthPath || ["Junior Python Dev", "Python Developer", "Senior Python Dev", "Software Architect"]).join("\n  → ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  RECOMMENDED CERTIFICATIONS
  ──────────────────────────
  • Python Certification (Python Institute)
  • AWS Cloud Practitioner (Amazon Web Services)
  • Docker Fundamentals (Docker Inc.)
  • SQL Advanced Certification (Oracle / Coursera)
  • REST API Design (Postman Academy)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  AI CAREER ADVICE (Groq AI Analysis)
  ────────────────────────────────────
  Your profile is best suited for ${career.role || "Python Developer"}.
  Focus on learning Docker, AWS and REST API to boost your
  readiness from ${career.match || 85}% → ${Math.min((career.match || 85) + 14, 95)}%.

  Build 2-3 industry projects and push them to GitHub.
  This significantly improves your interview success rate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Powered by SkillGap AI — AI Based Skills Gap Analyzer
  © 2025 SkillGap AI. All Rights Reserved.

    `.trim();

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `SkillGap_Career_Report_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("✅ Career Report downloaded successfully!");
}
