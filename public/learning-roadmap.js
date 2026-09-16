/* ============================================================
   SkillGap AI — Learning Roadmap JavaScript
   Module 8 — Full dynamic implementation
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

        const sessionData = typeof requireAuth === "function" ? requireAuth() : JSON.parse(sessionStorage.getItem("skillgap_session") || "null");
    if (!sessionData) {
        window.location.href = "login.html";
        return;
    }

    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
    let roleName = null;
    try {
        const jobRes = await fetch(`${API_BASE}/api/job-selection/user/${sessionData.user_id}`);
        if (jobRes.ok) {
            const jobData = await jobRes.json();
            roleName = jobData.selected_job_role;
        }
    } catch (e) {
        console.error("Backend fetch error", e);
    }
    
    if (!roleName) {
        console.warn("No role selected. Please start from the Job Role Selection page.");
        const tl = document.getElementById("roadmapTimeline");
        if(tl) tl.innerHTML = "<div class='glass-card p-4 text-center'>Please select a Job Role to generate your roadmap.</div>";
        return;
    }

    // FETCH DYNAMIC ROADMAP FROM BACKEND
    try {
        let roadmapPayload = { user_id: sessionData.user_id, selected_role: roleName };
        
        if (window.ensureJobRoles) {
            const allRoles = await window.ensureJobRoles();
            const roleObj = allRoles.find(r => r.name === roleName);
            if (roleObj) {
                roadmapPayload.skills = roleObj.skills;
                if (roleObj.roadmap) {
                    roadmapPayload.roadmap = roleObj.roadmap;
                }
            }
        }

        const response = await fetch(`${API_BASE}/api/roadmap/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(roadmapPayload)
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to generate roadmap");
        }
        const roadmapData = await response.json();
        
        const missing = roadmapData.missing_skills || [];
        const matched = roadmapData.matched_skills || [];
        const matchPct = roadmapData.match_percentage || 0;
        const targetPct = Math.min(matchPct + 14, 95);
        const readiness = Math.min(matchPct + 17, 98);

        renderStatusGrid(roleName, matchPct, missing, matched);
        renderPhasesFromBackend(roadmapData.roadmap, missing, matched, roleName);
        renderSkillBars(matched, missing);
        renderImprovement(matchPct, targetPct, readiness);
        renderCourses(missing);
        renderProjects(roleName, missing);
        renderAIAdvice(roleName, missing, matchPct, targetPct);
        
        setupUserInfo();
        if (typeof setupSidebar === "function") setupSidebar();
        observePhases();
        setTimeout(animateSkillBars,  500);
        setTimeout(() => animateImprovementRing(targetPct), 700);
    } catch (err) {
        console.error(err);
const container = document.getElementById("phasesContainer");
        const statusGrid = document.getElementById("statusGrid");
        
        if(container) {
            container.innerHTML = `
                <div class="glass-card p-6 text-center" style="border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); max-width:600px; margin: 40px auto; border-radius: 16px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #EF4444; margin-bottom: 16px;"></i>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 8px;">Roadmap Generation Failed</h3>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 24px;">${err.message || 'Required skills for this job role could not be loaded.'}</p>
                    <a href="job-role.html" class="btn btn-primary" style="padding: 10px 24px; border-radius: 30px;"><i class="fas fa-arrow-left"></i> Go back to Job Selection</a>
                </div>
            `;
        }
        if(statusGrid) statusGrid.innerHTML = "";
    }
});

/* ══════════════════════════════════════════════════════════
   STATUS GRID
══════════════════════════════════════════════════════════ */
function renderStatusGrid(role, match, missing, matched) {
    const grid = document.getElementById("statusGrid");
    if (!grid) return;
    const stats = [
        {
            label: "Current Match Score",
            value: match + "%",
            icon: "fas fa-percentage",
            iconStyle: "--stat-accent:linear-gradient(to right,#7C3AED,#3B82F6);",
            iconBg: "background:rgba(124,58,237,0.15);color:#A78BFA;border:1px solid rgba(124,58,237,0.3)",
            pill: `<span class="lr-stat-pill pill-info"><i class="fas fa-rocket"></i> Target: ${Math.min(match+14,95)}%</span>`,
            sub: "Your current readiness"
        },
        {
            label: "Target Role",
            value: role,
            icon: "fas fa-briefcase",
            iconStyle: "--stat-accent:linear-gradient(to right,#3B82F6,#06B6D4);",
            iconBg: "background:rgba(59,130,246,0.15);color:#60A5FA;border:1px solid rgba(59,130,246,0.3)",
            pill: `<span class="lr-stat-pill pill-up"><i class="fas fa-fire"></i> High Demand</span>`,
            sub: "Best matched job role",
            small: true
        },
        {
            label: "Missing Skills",
            value: missing.length,
            icon: "fas fa-exclamation-triangle",
            iconStyle: "--stat-accent:linear-gradient(to right,#F59E0B,#EF4444);",
            iconBg: "background:rgba(245,158,11,0.15);color:#FBBF24;border:1px solid rgba(245,158,11,0.3)",
            pill: `<span class="lr-stat-pill pill-warn"><i class="fas fa-tools"></i> Skills to learn</span>`,
            sub: missing.slice(0,3).join(", ") + (missing.length > 3 ? "…" : "")
        },
        {
            label: "Strong Skills",
            value: matched.length,
            icon: "fas fa-bolt",
            iconStyle: "--stat-accent:linear-gradient(to right,#10B981,#34D399);",
            iconBg: "background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.3)",
            pill: `<span class="lr-stat-pill pill-up"><i class="fas fa-check"></i> Already mastered</span>`,
            sub: matched.slice(0,3).join(", ") + (matched.length > 3 ? "…" : "")
        }
    ];

    grid.innerHTML = stats.map(s => `
        <div class="lr-stat-card" style="${s.iconStyle}">
            <div class="lr-stat-icon" style="${s.iconBg}">
                <i class="${s.icon}"></i>
            </div>
            <div class="lr-stat-label">${s.label}</div>
            <div class="lr-stat-value" ${s.small ? 'style="font-size:1.1rem"' : ''}>${s.value}</div>
            <div class="lr-stat-sub">${s.sub}</div>
            ${s.pill}
        </div>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   ROLE ROADMAP TEMPLATES (From Backend)
══════════════════════════════════════════════════════════ */
function renderPhasesFromBackend(template, missing, matched, roleName) {
    sessionStorage.setItem("roadmap_template", JSON.stringify(template));
    const missingLower = missing.map(s => s.toLowerCase());
    const matchedLower = matched.map(s => s.toLowerCase());

    let globalStepCounter = 1;
    let totalSteps = 0;
    
    function buildPhaseSkills(skillNames) {
        return skillNames.map(skillObj => {
            const isObject = typeof skillObj === "object";
            const skillName = isObject ? skillObj.name : skillObj;
            const topics = isObject && skillObj.topics ? skillObj.topics : ["Basics", "Advanced concepts"];
            const difficulty = isObject && skillObj.difficulty ? skillObj.difficulty : "Intermediate";
            const durationStr = isObject && skillObj.duration ? skillObj.duration : "1 week";
            const task = isObject && skillObj.task ? skillObj.task : `Practice ${skillName} concepts`;
            const resource = isObject && skillObj.resource ? skillObj.resource : "Official Documentation";
            const whyItMatters = isObject && skillObj.why_it_matters ? skillObj.why_it_matters : "Crucial for this role.";
            
            const meta = window.getSkillMeta ? getSkillMeta(skillName) : { icon:"fas fa-code", bg:"rgba(59,130,246,0.15)", color:"#60A5FA" };
            
            const stepNum = globalStepCounter++;
            totalSteps++;
            
            return { 
                stepNum: stepNum,
                name: skillName, 
                topics: topics,
                difficulty: difficulty,
                whyItMatters: whyItMatters,
                task: task,
                resource: resource,
                icon: meta.icon, 
                bg: meta.bg, 
                color: meta.color, 
                time: durationStr
            };
        });
    }

    const p1Skills = buildPhaseSkills(template.beginner || template.phase1 || template.foundation || []);
    const p2Skills = buildPhaseSkills(template.intermediate || template.phase2 || template.core || []);
    const p3Skills = buildPhaseSkills(template.advanced || template.phase3 || []);
    
    // Phase 4 tasks
    const p4Skills = buildPhaseSkills(template.placement || template.phase4 || []);
    
    // Check if skill is already known
    function checkKnown(skillName) {
        const lowerName = skillName.toLowerCase();
        return matchedLower.some(m => lowerName.includes(m) || m.includes(lowerName));
    }
    
    // Helper to calculate total duration in weeks for a phase
    function calculatePhaseDuration(skillsArray) {
        if (skillsArray.length === 0) return 0;
        let totalDays = 0;
        skillsArray.forEach(s => {
            const t = s.time.toLowerCase();
            if (t.includes("day")) {
                const match = t.match(/\\d+/);
                totalDays += match ? parseInt(match[0]) : 3;
            } else if (t.includes("week")) {
                const match = t.match(/\\d+/);
                totalDays += match ? parseInt(match[0]) * 7 : 7;
            } else if (t.includes("month")) {
                const match = t.match(/\\d+/);
                totalDays += match ? parseInt(match[0]) * 30 : 30;
            } else {
                totalDays += 7; // default 1 week
            }
        });
        const wks = Math.round(totalDays / 7);
        return wks < 1 ? 1 : wks;
    }

    const phases = [];
    
    phases.push({
        num: "Phase 1",
        title: "🌱 Beginner — Foundation Skills",
        color: "#10B981",
        dotColor: "#10B981",
        duration: calculatePhaseDuration(p1Skills) + " Weeks",
        status: "status-ready",
        statusText: "✅ Ready to Start",
        skills: p1Skills,
        phaseId: "beginner"
    });
    
    phases.push({
        num: "Phase 2",
        title: "⚡ Intermediate — Core Skills",
        color: "#7C3AED",
        dotColor: "#7C3AED",
        duration: calculatePhaseDuration(p2Skills) + " Weeks",
        status: "status-upcoming",
        statusText: "🔵 Upcoming",
        skills: p2Skills,
        phaseId: "intermediate"
    });
    
    phases.push({
        num: "Phase 3",
        title: "🚀 Advanced — Professional Skills",
        color: "#F59E0B",
        dotColor: "#F59E0B",
        duration: calculatePhaseDuration(p3Skills) + " Weeks",
        status: "status-advanced",
        statusText: "🟡 Advanced Level",
        skills: p3Skills,
        phaseId: "advanced"
    });
    
    phases.push({
        num: "Phase 4",
        title: "🏆 Placement Ready — Final Sprint",
        color: "#3B82F6",
        dotColor: "#3B82F6",
        duration: calculatePhaseDuration(p4Skills) + " Weeks",
        status: "status-final",
        statusText: "🎯 Goal: Placement",
        skills: p4Skills,
        phaseId: "placement"
    });
const container = document.getElementById("phasesContainer");
    container.innerHTML = phases.map((p, idx) => `
        <div class="lr-phase-block" data-idx="${idx}">
            <div class="lr-phase-dot ${idx===2?'dot-active':''}"
                 style="--dot-color:${p.dotColor}"></div>
            <div class="lr-phase-card" style="--phase-color:${p.color}">
                <div class="lr-phase-top">
                    <div>
                        <div class="lr-phase-num">${p.num}</div>
                        <div class="lr-phase-title">${p.title}</div>
                    </div>
                    <div class="lr-phase-meta">
                        <span class="lr-phase-pill" style="background:${p.color}22;border:1px solid ${p.color}44;color:${p.color}">
                            <i class="fas fa-clock"></i> ${p.duration}
                        </span>
                    </div>
                </div>
                
                <div class="lr-phase-skills-detailed" style="margin-top:20px; display:flex; flex-direction:column; gap:16px;">
                    ${p.skills.map(s => {
                        const isKnown = checkKnown(s.name);
                        return `
                        <div class="detailed-skill-card ${isKnown ? 'skill-known' : ''}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px; position:relative; overflow:hidden; ${isKnown ? 'opacity: 0.8;' : ''}">
                            ${isKnown ? '<div style="position:absolute; top:12px; right:12px; background:rgba(16,185,129,0.15); color:#10B981; border:1px solid rgba(16,185,129,0.3); padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;"><i class="fas fa-check-circle"></i> Already Known</div>' : ''}
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="background:${s.bg}; color:${s.color}; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                                        <i class="${s.icon}"></i>
                                    </div>
                                    <div>
                                        <div style="font-size:0.75rem; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Step ${s.stepNum}</div>
                                        <div style="font-size:1.2rem; font-weight:700; color:white;">${s.name}</div>
                                    </div>
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <span style="font-size:0.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; color:#A78BFA;"><i class="fas fa-tachometer-alt"></i> ${s.difficulty}</span>
                                    <span style="font-size:0.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; color:#60A5FA;"><i class="fas fa-clock"></i> ${s.time}</span>
                                </div>
                            </div>
                            
                            <div style="font-size:0.9rem; color:rgba(255,255,255,0.7); margin-bottom:16px;">
                                <strong>Why you need it:</strong> ${s.whyItMatters}
                            </div>
                            
                            <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:12px; margin-bottom:16px;">
                                <div style="font-size:0.85rem; font-weight:600; color:#A78BFA; margin-bottom:8px;"><i class="fas fa-list-ul"></i> Topics to Learn:</div>
                                <ul style="margin:0; padding-left:20px; font-size:0.85rem; color:rgba(255,255,255,0.8); line-height:1.6;">
                                    ${s.topics.map(t => `<li>${t}</li>`).join("")}
                                </ul>
                            </div>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                                <div style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:12px;">
                                    <div style="font-size:0.75rem; color:#10B981; margin-bottom:4px; text-transform:uppercase;"><i class="fas fa-laptop-code"></i> Practical Task</div>
                                    <div style="font-size:0.85rem; color:white;">${s.task}</div>
                                </div>
                                <div style="background:rgba(59,130,246,0.05); border:1px solid rgba(59,130,246,0.2); border-radius:8px; padding:12px;">
                                    <div style="font-size:0.75rem; color:#60A5FA; margin-bottom:4px; text-transform:uppercase;"><i class="fas fa-book"></i> Resource</div>
                                    <div style="font-size:0.85rem; color:white;">${s.resource}</div>
                                </div>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px; margin-top:auto;">
                                <button class="btn btn-primary" style="padding:6px 16px; font-size:0.85rem;" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(s.name + ' tutorial ' + roleName)}', '_blank')"><i class="fas fa-play"></i> Start Learning</button>
                                <button class="btn mark-complete-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:6px 16px; border-radius:20px; font-size:0.85rem; transition:all 0.3s;" data-step="${s.stepNum}" data-phase="${p.phaseId}" data-skill="${s.name}"><i class="fas fa-check"></i> Mark as Completed</button>
                            </div>
                        </div>
                    `}).join("")}
                </div>
                
            </div>
        </div>
    `).join("");

    // Initialize Progress Tracking
    setupProgressTracking(totalSteps, roleName);
}

async function setupProgressTracking(totalSteps, roleName) {
    let completedSteps = 0;
    const phaseSteps = { beginner: 0, intermediate: 0, advanced: 0, placement: 0 };
    const phaseCompleted = { beginner: 0, intermediate: 0, advanced: 0, placement: 0 };
    
    // Count total steps per phase
    document.querySelectorAll(".mark-complete-btn").forEach(btn => {
        const pId = btn.getAttribute("data-phase");
        if (pId && phaseSteps[pId] !== undefined) {
            phaseSteps[pId]++;
        }
    });

    const phasesContainer = document.getElementById("phasesContainer");
    
    const progressHtml = `
        <div class="lr-card" style="margin-bottom:30px;">
            <div style="text-align:center; margin-bottom:20px;">
                <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:12px;">Overall Roadmap Progress</h3>
                <div style="font-size:2rem; font-weight:800; color:#10B981; margin-bottom:4px;" id="progressPercentageText">0%</div>
                <div style="font-size:0.9rem; color:rgba(255,255,255,0.5); margin-bottom:16px;" id="progressStepsText">0 / ${totalSteps} Steps Completed</div>
                
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                    <div id="progressFillBar" style="width:0%; height:100%; background:linear-gradient(to right, #10B981, #34D399); transition:width 0.5s ease;"></div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:16px; border-top:1px solid rgba(255,255,255,0.1); padding-top:20px;">
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">Beginner</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#10B981;" id="prog-beginner">0%</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">Intermediate</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#7C3AED;" id="prog-intermediate">0%</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">Advanced</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#F59E0B;" id="prog-advanced">0%</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">Placement</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#3B82F6;" id="prog-placement">0%</div>
                </div>
            </div>
        </div>
    `;
    phasesContainer.insertAdjacentHTML('beforebegin', progressHtml);

    // Fetch existing progress from backend
    const sessionData = JSON.parse(sessionStorage.getItem("skillgap_session") || "null");
    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
    let completedSkillNames = [];
    
    if (sessionData && sessionData.user_id) {
        try {
            const progRes = await fetch(`${API_BASE}/api/roadmap/progress/user/${sessionData.user_id}?role=${encodeURIComponent(roleName)}`);
            if (progRes.ok) {
                const progData = await progRes.json();
                completedSkillNames = progData.map(p => p.skill_name);
            }
        } catch (e) {
            console.error("Failed to load progress:", e);
        }
    }
    
    function updateProgressUI() {
        const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        document.getElementById("progressPercentageText").textContent = pct + "%";
        document.getElementById("progressStepsText").textContent = completedSteps + " / " + totalSteps + " Steps Completed";
        document.getElementById("progressFillBar").style.width = pct + "%";
        
        ["beginner", "intermediate", "advanced", "placement"].forEach(pid => {
            const el = document.getElementById("prog-" + pid);
            if (el) {
                const pTot = phaseSteps[pid];
                const pCur = phaseCompleted[pid];
                const pPct = pTot > 0 ? Math.round((pCur / pTot) * 100) : 0;
                el.textContent = pPct + "%";
            }
        });
    }

    // Attach event listeners to all buttons and initialize state
    document.querySelectorAll(".mark-complete-btn").forEach(btn => {
        const pId = btn.getAttribute("data-phase");
        const skillName = btn.getAttribute("data-skill");
        
        // Initialize based on fetched progress
        if (completedSkillNames.includes(skillName)) {
            btn.classList.add("completed");
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
            btn.style.background = 'rgba(16,185,129,0.2)';
            btn.style.color = '#10B981';
            btn.style.borderColor = 'rgba(16,185,129,0.4)';
            completedSteps++;
            if (pId) phaseCompleted[pId]++;
        }
        
        btn.addEventListener("click", async function() {
            const isCompleting = !this.classList.contains("completed");
            
            // Optimistic UI Update
            if (isCompleting) {
                this.classList.add("completed");
                this.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
                this.style.background = 'rgba(16,185,129,0.2)';
                this.style.color = '#10B981';
                this.style.borderColor = 'rgba(16,185,129,0.4)';
                completedSteps++;
                if (pId) phaseCompleted[pId]++;
            } else {
                this.classList.remove("completed");
                this.innerHTML = '<i class="fas fa-check"></i> Mark as Completed';
                this.style.background = 'rgba(255,255,255,0.1)';
                this.style.color = 'white';
                this.style.borderColor = 'rgba(255,255,255,0.2)';
                completedSteps--;
                if (pId) phaseCompleted[pId]--;
            }
            
            updateProgressUI();
            
            // Save to backend
            if (sessionData && sessionData.user_id) {
                try {
                    await fetch(`${API_BASE}/api/roadmap/progress`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: sessionData.user_id,
                            role_name: roleName,
                            skill_name: skillName,
                            completed: isCompleting
                        })
                    });
                } catch (e) {
                    console.error("Failed to save progress:", e);
                }
            }
        });
    });
    
    // Initial UI Update
    updateProgressUI();
}

/* IntersectionObserver — animate phases on scroll */
function observePhases() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add("visible"),
                    parseInt(e.target.dataset.idx || 0) * 120);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".lr-phase-block").forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════════════════════
   SKILL PROGRESS BARS
══════════════════════════════════════════════════════════ */
function renderSkillBars(matched, missing) {
    const allSkillData = [];
    matched.forEach((skill, i) => {
        const meta = window.getSkillMeta ? getSkillMeta(skill) : { color: "#10B981", gradient: "linear-gradient(to right,#10B981,#34D399)" };
        allSkillData.push({ name: skill, pct: 95 - (i % 5)*4, color: meta.color, gradient: meta.gradient });
    });
    missing.forEach((skill, i) => {
        const meta = window.getSkillMeta ? getSkillMeta(skill) : { color: "#F59E0B", gradient: "linear-gradient(to right,#F59E0B,#FBBF24)" };
        allSkillData.push({ name: skill, pct: 15 + (i % 5)*5, color: meta.color, gradient: meta.gradient });
    });

    const container = document.getElementById("skillBarsContainer");
    container.innerHTML = allSkillData.map(s => {
        const isStrong = s.pct >= 60;
        const level    = s.pct >= 80 ? "Expert" : s.pct >= 60 ? "Intermediate" : s.pct >= 30 ? "Beginner" : "Learning";
        return `
        <div class="lr-skill-bar-row">
            <div class="lr-skill-bar-top">
                <span class="lr-skill-bar-name">
                    <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block;"></span>
                    ${s.name}
                </span>
                <span class="lr-skill-bar-pct" style="color:${s.color}">${s.pct}%</span>
            </div>
            <div class="lr-skill-bar-track">
                <div class="lr-skill-bar-fill" data-pct="${s.pct}"
                     style="background:${s.gradient}"></div>
            </div>
            <div class="lr-skill-bar-sublabel">${level} ${isStrong ? '✓' : '— needs improvement'}</div>
        </div>
        `;
    }).join("");
}

function animateSkillBars() {
    document.querySelectorAll(".lr-skill-bar-fill").forEach(el => {
        const pct = el.dataset.pct;
        el.style.width = pct + "%";
    });
}

/* ══════════════════════════════════════════════════════════
   EXPECTED IMPROVEMENT CARD
══════════════════════════════════════════════════════════ */
function renderImprovement(current, target, readiness) {
    const body = document.getElementById("improvementBody");
    body.innerHTML = `
        <!-- Ring -->
        <div class="lr-imp-ring-wrap">
            <div class="lr-imp-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <defs>
                        <linearGradient id="impGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stop-color="#10B981"/>
                            <stop offset="100%" stop-color="#34D399"/>
                        </linearGradient>
                    </defs>
                    <circle class="lr-imp-ring-bg"   cx="60" cy="60" r="54"/>
                    <circle class="lr-imp-ring-fill" cx="60" cy="60" r="54" id="impRingFill"/>
                </svg>
                <div class="lr-imp-center">
                    <div class="lr-imp-num" id="impRingNum">${current}%</div>
                    <div class="lr-imp-lbl">→ ${target}%</div>
                </div>
            </div>
            <div class="lr-imp-stats">
                <div class="lr-imp-stat-row">
                    <span class="lr-imp-stat-name">Current Match</span>
                    <span class="lr-imp-stat-val" style="color:#FBBF24">${current}%</span>
                </div>
                <div class="lr-imp-stat-row">
                    <span class="lr-imp-stat-name">After Roadmap</span>
                    <span class="lr-imp-stat-val" style="color:#34D399">${target}%</span>
                </div>
                <div class="lr-imp-stat-row">
                    <span class="lr-imp-stat-name">Placement Ready</span>
                    <span class="lr-imp-stat-val" style="color:#A78BFA">${readiness}%</span>
                </div>
                <div class="lr-imp-stat-row">
                    <span class="lr-imp-stat-name">Gain</span>
                    <span class="lr-imp-stat-val" style="color:#34D399">+${target - current}%</span>
                </div>
            </div>
        </div>

        <!-- Timeline rows -->
        <div class="lr-imp-timeline">
            <div class="lr-imp-tl-row">
                <span class="lr-imp-tl-label">🌱 Phase 1 Complete</span>
                <span class="lr-imp-tl-arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="lr-imp-tl-val" style="color:#34D399">${current + 4}%</span>
            </div>
            <div class="lr-imp-tl-row">
                <span class="lr-imp-tl-label">⚡ Phase 2 Complete</span>
                <span class="lr-imp-tl-arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="lr-imp-tl-val" style="color:#60A5FA">${current + 8}%</span>
            </div>
            <div class="lr-imp-tl-row">
                <span class="lr-imp-tl-label">🚀 Phase 3 Complete</span>
                <span class="lr-imp-tl-arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="lr-imp-tl-val" style="color:#FBBF24">${target - 2}%</span>
            </div>
            <div class="lr-imp-tl-row" style="border-color:rgba(16,185,129,0.2)">
                <span class="lr-imp-tl-label">🏆 Placement Ready</span>
                <span class="lr-imp-tl-arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="lr-imp-tl-val" style="color:#34D399;font-size:1.05rem">${readiness}%</span>
            </div>
        </div>
    `;
}

function animateImprovementRing(target) {
    const ring  = document.getElementById("impRingFill");
    const numEl = document.getElementById("impRingNum");
    if (!ring || !numEl) return;

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (target / 100) * circumference;
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = circumference;

    setTimeout(() => {
        ring.style.transition = "stroke-dashoffset 1.5s ease";
        ring.style.strokeDashoffset = offset;
    }, 100);

    // counter
    const start = parseInt(numEl.textContent);
    const steps = 50;
    const diff  = target - start;
    let i = 0;
    const timer = setInterval(() => {
        i++;
        numEl.textContent = Math.round(start + (diff * i) / steps) + "%";
        if (i >= steps) clearInterval(timer);
    }, 25);
}

/* ══════════════════════════════════════════════════════════
   RECOMMENDED COURSES
══════════════════════════════════════════════════════════ */
function renderCourses(missing) {
    const sorted = missing.map(skill => {
        const meta = window.getSkillMeta ? getSkillMeta(skill) : { icon:"fas fa-graduation-cap", bg:"rgba(59,130,246,0.15)", color:"#60A5FA", gradient:"linear-gradient(to right,#3B82F6,#60A5FA)" };
        return {
            name: `${skill} Mastery Course`,
            icon: meta.icon, iconBg: meta.bg, iconColor: meta.color,
            level: "Intermediate", levelTag: "tag-intermediate",
            duration: "4 Weeks", platform: "SkillGap Learning", platformIcon: "fas fa-play-circle",
            accent: meta.gradient
        };
    });

    document.getElementById("coursesGrid").innerHTML = sorted.map(c => `
        <div class="lr-course-card" style="--course-accent:${c.accent}">
            <div class="lr-course-icon-wrap" style="background:${c.iconBg};color:${c.iconColor}">
                <i class="${c.icon}"></i>
            </div>
            <div class="lr-course-name">${c.name}</div>
            <div class="lr-course-tags">
                <span class="lr-course-tag ${c.levelTag}">${c.level}</span>
                <span class="lr-course-tag tag-duration"><i class="fas fa-clock"></i> ${c.duration}</span>
            </div>
            <div class="lr-course-platform">
                <i class="${c.platformIcon}"></i> ${c.platform}
            </div>
            <button class="lr-course-btn" onclick="startCourse('${c.name}')">
                <i class="fas fa-play"></i> Start Learning
            </button>
        </div>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   PROJECT RECOMMENDATIONS
══════════════════════════════════════════════════════════ */
function renderProjects(role, missing) {
    const projects = window.getRoleProjects ? getRoleProjects(role) : [
        { emoji:"🏢", name:"Portfolio Project 1", desc:"A practical project applying your learned skills.", tags:missing.slice(0,3), purpose:"Skill Demonstration", num:"Project 01" },
        { emoji:"🚀", name:"Portfolio Project 2", desc:"Advanced implementation for your resume.", tags:missing.slice(0,2), purpose:"Skill Demonstration", num:"Project 02" }
    ];

    document.getElementById("projectsGrid").innerHTML = projects.map(p => `
        <div class="lr-project-card" onclick="viewProject('${p.name}')">
            <div class="lr-proj-num">${p.num}</div>
            <div class="lr-proj-icon">${p.emoji}</div>
            <div class="lr-proj-name">${p.name}</div>
            <div class="lr-proj-desc">${p.desc}</div>
            <div class="lr-proj-tags">
                ${p.tags.map(t => `<span class="lr-proj-tag">${t}</span>`).join("")}
            </div>
            <div class="lr-proj-purpose">
                <i class="fas fa-star"></i> ${p.purpose}
            </div>
        </div>
    `).join("");
}

/* ══════════════════════════════════════════════════════════
   AI LEARNING ADVICE
══════════════════════════════════════════════════════════ */
function renderAIAdvice(role, missing, current, target) {
    const top1 = missing[0] || "Core Fundamentals";
    const top2 = missing[1] || "Advanced Topics";
    const top3 = missing[2] || "Industry Tools";

    document.getElementById("aiLearningAdvice").innerHTML = `
        <h3>
            <i class="fas fa-lightbulb" style="color:#F59E0B"></i>
            AI Learning Advice
            <span style="font-size:0.7rem;background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);color:#A78BFA;padding:3px 10px;border-radius:20px;font-weight:700">Groq AI</span>
        </h3>
        <p>
            Focus first on <strong>${top1}</strong> and <strong>${top2}</strong> — these are the
            highest-impact missing skills for a <strong>${role}</strong>.<br><br>
            After mastering those, move to <strong>${top3}</strong>
            to complete your profile. Build at least <span class="ai-em">2 real projects</span>
            that showcase your newly acquired skills.<br><br>
            Completing this roadmap can boost your readiness from
            <span class="ai-em">${current}%</span> to <span class="ai-em">${target}%</span> within
            <strong>the estimated time</strong>.
        </p>
    `;

    document.getElementById("aiTipBox").innerHTML = `
        <div class="lr-tip-item">
            <div class="lr-tip-num">1</div>
            <div class="lr-tip-text">Start with <strong style="color:#34D399">${top1}</strong></div>
        </div>
        <div class="lr-tip-item">
            <div class="lr-tip-num">2</div>
            <div class="lr-tip-text">Then master <strong style="color:#60A5FA">${top2}</strong> + ${top3}</div>
        </div>
        <div class="lr-tip-item">
            <div class="lr-tip-num">3</div>
            <div class="lr-tip-text">Build <strong style="color:#A78BFA">2 portfolio projects</strong></div>
        </div>
        <div class="lr-tip-item">
            <div class="lr-tip-num">4</div>
            <div class="lr-tip-text">Mock interviews + <strong style="color:#FBBF24">resume polish</strong></div>
        </div>
    `;
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD LEARNING PLAN
══════════════════════════════════════════════════════════ */
function downloadLearningPlan() {
    const career  = JSON.parse(sessionStorage.getItem("skillgap_career")  || "{}");
    const results = JSON.parse(sessionStorage.getItem("skillgap_results") || "{}");
    const role    = career.role    || "Python Developer";
    const match   = career.match   || 78;
    const missing = career.missing || ["Docker","AWS","REST API","CI/CD"];
    const matched = career.matched || ["Python","Flask","SQL","Git"];
    const now     = new Date();

    const template = JSON.parse(sessionStorage.getItem("roadmap_template") || "{}");
    
    function getSkillNames(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(s => typeof s === "object" ? (s.name || JSON.stringify(s)) : s);
    }

    const p1Skills = getSkillNames(template.beginner || template.phase1 || template.foundation || []);
    const p2Skills = getSkillNames(template.intermediate || template.phase2 || template.core || []);
    const p3Skills = getSkillNames(template.advanced || template.phase3 || []);
    const p4Skills = getSkillNames(template.placement || template.phase4 || []);

    const projects = window.getRoleProjects ? getRoleProjects(role) : [];

    const plan = `
╔══════════════════════════════════════════════════════════╗
║          SkillGap AI — Personalized Learning Plan         ║
║                      Module 8 Report                      ║
╚══════════════════════════════════════════════════════════╝

  Generated  : ${now.toLocaleDateString("en-IN", {day:"2-digit",month:"long",year:"numeric"})}
  Target Role: ${role}
  Current Match: ${match}% → Target: ${Math.min(match+14,95)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  YOUR STRONG SKILLS ✓
  ─────────────────────
  ${matched.length ? matched.join(", ") : "None detected yet."}

  SKILLS TO LEARN ↑
  ─────────────────────
  ${missing.length ? missing.join(", ") : "You're already highly skilled for this role!"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  LEARNING ROADMAP
  ────────────────────────────────

  📗 PHASE 1 — Beginner Foundation
     ${p1Skills.map(s => `• ${s}`).join("\n     ")}

  📘 PHASE 2 — Intermediate Core
     ${p2Skills.map(s => `• ${s}`).join("\n     ")}

  📙 PHASE 3 — Advanced Professional
     ${p3Skills.map(s => `• ${s}`).join("\n     ")}

  📕 PHASE 4 — Placement Sprint
     ${p4Skills.map(s => `• ${s}`).join("\n     ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  RECOMMENDED COURSES
  ────────────────────
  ${missing.map(s => `• ${s} Mastery Course — SkillGap Learning`).join("\n  ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PORTFOLIO PROJECTS
  ───────────────────
  ${projects.length ? projects.map((p, i) => `${i+1}. ${p.name} (${p.tags.join(" + ")})`).join("\n  ") : "Build real-world projects relevant to your role to boost your portfolio."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  AI ADVICE (Groq AI)
  ─────────────────────
  Focus first on ${missing[0] || "Foundations"} and ${missing[1] || "Core Skills"}.
  Then move to advanced topics.
  Build 2 real projects to demonstrate these skills.
  Expected improvement: ${match}% → ${Math.min(match+14,95)}%.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Powered by SkillGap AI — AI Based Skills Gap Analyzer
  © 2025 SkillGap AI. All Rights Reserved.
    `.trim();

    const blob = new Blob([plan], { type:"text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `SkillGap_LearningPlan_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📥 Learning Plan downloaded successfully!");
}

/* ══════════════════════════════════════════════════════════
   FINISH ANALYSIS — CONFETTI CELEBRATION
══════════════════════════════════════════════════════════ */
function finishAnalysis() {
    launchConfetti();
    showToast("🎉 Analysis Complete! Your roadmap is ready.");
    setTimeout(() => {
        if (confirm("🎉 Congratulations!\n\nYour complete SkillGap Analysis is done!\n\nReturn to the Dashboard to view your full report?")) {
            window.location.href = "dashboard.html";
        }
    }, 1800);
}

function launchConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#7C3AED","#3B82F6","#10B981","#F59E0B","#EC4899","#A78BFA","#34D399"];
    const particles = Array.from({length:160}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 12 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 4 + 2,
        angle: Math.random() * 360,
        spin:  Math.random() * 6 - 3,
        drift: Math.random() * 2 - 1
    }));

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.angle * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            ctx.restore();
            p.y    += p.speed;
            p.x    += p.drift;
            p.angle += p.spin;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        });
        frame++;
        if (frame < 180) requestAnimationFrame(draw);
        else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display="none"; }
    }
    draw();
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function startCourse(name) { showToast(`🎓 Opening: ${name}`); }
function viewProject(name) { showToast(`💻 Project: ${name} — Start building to strengthen your resume!`); }

function showToast(msg) {
    const toast = document.getElementById("lrToast");
    const msgEl = document.getElementById("lrToastMsg");
    if (!toast) return;
    msgEl.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3200);
}

function setupUserInfo() {
    const user    = JSON.parse(localStorage.getItem("skillgap_user") || "{}");
    const name    = user.name || "Student";
    const initial = name.charAt(0).toUpperCase();
    ["sidebarAvatar","headerAvatar"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initial;
    });
    ["sidebarName","headerName"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
    });
}

function setupSidebar() {
    const hamburger = document.getElementById("hamburger");
    const closeBtn  = document.getElementById("sidebarClose");
    if (hamburger) hamburger.addEventListener("click", openSidebar);
    if (closeBtn)  closeBtn.addEventListener("click",  closeSidebar);
}

function openSidebar() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("overlay")?.classList.add("show");
    document.getElementById("mainWrapper")?.classList.add("sidebar-pushed");
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");
    document.getElementById("mainWrapper")?.classList.remove("sidebar-pushed");
}

function logout() {
    localStorage.removeItem("skillgap_user");
    sessionStorage.clear();
    window.location.href = "login.html";
}
