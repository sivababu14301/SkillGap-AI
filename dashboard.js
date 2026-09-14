/* ============================================================
   SkillGap AI — Dashboard JavaScript
   Handles: session check, user info, chart, readiness ring,
            sidebar toggle, date display.
   ============================================================ */

/* ---- Session Guard ---- */
function getActiveSession() {
    return (
        JSON.parse(sessionStorage.getItem("skillgap_session") || "null") ||
        JSON.parse(localStorage.getItem("skillgap_session")   || "null")
    );
}

function logout() {
    sessionStorage.removeItem("skillgap_session");
    localStorage.removeItem("skillgap_session");
    window.location.href = "login.html";
}

/* ---- Boot ---- */
document.addEventListener("DOMContentLoaded", async () => {
    // Load job roles data
    if (window.ensureJobRoles) await window.ensureJobRoles();

    // Check session
    const session = getActiveSession();
    if (!session || !session.user_id) {
        window.location.href = "login.html";
        return;
    }

    // Populate user info
    const name = session.user_name || "User";
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    document.getElementById("welcomeName").textContent  = name.split(" ")[0];
    document.getElementById("headerName").textContent   = name.split(" ")[0];
    document.getElementById("headerAvatar").textContent = initials;
    document.getElementById("sidebarName").textContent  = name;
    document.getElementById("sidebarAvatar").textContent= initials;
    if (document.getElementById("sidebarUserId")) {
        document.getElementById("sidebarUserId").textContent = session.user_id;
    }

    // Date
    const now = new Date();
    document.getElementById("welcomeDate").textContent =
        now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

    // Fetch dashboard stats from MongoDB backend
    let dashboardStats = null;
    try {
        const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
        const res = await fetch(`${API_BASE}/api/dashboard/user/${session.user_id}`);
        if (res.ok) {
            dashboardStats = await res.json();
        }
    } catch (err) {
        console.error("Backend not reachable", err);
    }

    if (dashboardStats && dashboardStats.latest_analysis) {
        const latestAnalysis = dashboardStats.latest_analysis;
        
        let matchPct = dashboardStats.match_percentage || 0;
        let readinessPct = dashboardStats.placement_readiness || 0;

        // Stats counts
        animateCounter("statResumeScore", dashboardStats.resumes_uploaded, 0);
        animateCounter("statATSScore", dashboardStats.skills_detected, 0);
        animateCounter("statMatch", matchPct, 0, "%");
        animateCounter("statReadiness", readinessPct, 0, "%");
        animateRing("readinessRing", readinessPct);

        let chartMatched = latestAnalysis.matched_skills ? latestAnalysis.matched_skills.length : 0;
        let chartMissing = latestAnalysis.missing_skills ? latestAnalysis.missing_skills.length : 0;
        let chartAdditional = latestAnalysis.additional_skills ? latestAnalysis.additional_skills.length : 0;

        initSkillsChart(chartMatched, chartMissing, chartAdditional);
        document.getElementById("chartTotal").textContent = chartMatched + chartMissing + chartAdditional;
        document.getElementById("legendMatched").textContent = chartMatched;
        document.getElementById("legendMissing").textContent = chartMissing;
        document.getElementById("legendAdditional").textContent = chartAdditional;
        
        // Populate specific roles logic
        populateRecentAnalysis([], latestAnalysis, {name: latestAnalysis.selected_role}, false);
        populateRecommendedRoles(null, latestAnalysis, false);

    } else {
        document.getElementById("statResumeScore").textContent = dashboardStats ? dashboardStats.resumes_uploaded : 0;
        document.getElementById("statATSScore").textContent = "0";
        document.getElementById("statMatch").textContent = "N/A";
        document.getElementById("statReadiness").textContent = "N/A";
        document.getElementById("readinessPct").textContent = "N/A";
        
        initSkillsChart(1, 1, 1, true); // pending state
        document.getElementById("chartTotal").textContent = "0";

        const readinessDetails = document.getElementById("readinessDetails");
        if (readinessDetails) {
            readinessDetails.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:20px;">Analysis pending or not available.</p>`;
        }
        
        populateRecentAnalysis([], null, null, false);
        populateRecommendedRoles(null, null, false);
    }

    // Sidebar toggle
    initSidebar();
});

/* ---- Populate Recent Analysis ---- */
function populateRecentAnalysis(allResumes, latestAnalysis, targetRoleObj, isMockData) {
    const tableBody = document.getElementById("recentAnalysisTableBody");
    if (!tableBody) return;

    // Use fallback data exactly like the screenshot
    if (isMockData) {
        tableBody.innerHTML = `
            <tr>
                <td><i class="fas fa-code"></i> Python Developer</td>
                <td><span class="match-pill green">72%</span></td>
                <td>20 May 2024</td>
                <td><span class="status-pill done">Done</span></td>
            </tr>
            <tr>
                <td><i class="fas fa-database"></i> Data Analyst</td>
                <td><span class="match-pill blue">65%</span></td>
                <td>18 May 2024</td>
                <td><span class="status-pill done">Done</span></td>
            </tr>
            <tr>
                <td><i class="fas fa-server"></i> Backend Developer</td>
                <td><span class="match-pill purple">81%</span></td>
                <td>15 May 2024</td>
                <td><span class="status-pill done">Done</span></td>
            </tr>
        `;
        return;
    }

    if (!latestAnalysis) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No analysis data available.</td></tr>`;
        return;
    }

    // Dynamic data rendering based on actual data
    let roleName = targetRoleObj?.name || latestAnalysis.selected_role || "Target Role";
    let matchPct = latestAnalysis.match_percentage || latestAnalysis.matchPercentage || 0;
    let dateStr = new Date(latestAnalysis.created_at || Date.now()).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    let icon = "fas fa-briefcase";
    if (roleName.toLowerCase().includes("python")) icon = "fas fa-code";
    else if (roleName.toLowerCase().includes("data")) icon = "fas fa-database";

    tableBody.innerHTML = `
        <tr>
            <td><i class="${icon}"></i> ${roleName}</td>
            <td><span class="match-pill ${matchPct >= 70 ? 'green' : (matchPct >= 50 ? 'blue' : 'purple')}">${matchPct}%</span></td>
            <td>${dateStr}</td>
            <td><span class="status-pill done">Done</span></td>
        </tr>
    `;
}

/* ---- Populate Recommended Roles ---- */
function populateRecommendedRoles(resumeData, latestAnalysis, isMockData) {
    const list = document.getElementById("recommendedRolesList");
    if (!list) return;

    let userSkills = [];
    if (latestAnalysis) {
        userSkills = [...(latestAnalysis.matched_skills || latestAnalysis.matchedSkills || []), 
                      ...(latestAnalysis.additional_skills || latestAnalysis.additionalSkills || latestAnalysis.extraSkills || [])];
    } else if (resumeData && resumeData.extracted_skills) {
        userSkills = resumeData.extracted_skills;
    } else if (resumeData && resumeData.aiData && resumeData.aiData.skills) {
        userSkills = resumeData.aiData.skills;
    }

    if (!userSkills || userSkills.length === 0 || jobRoles.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Upload a resume and complete analysis to see recommendations.</p>`;
        return;
    }
    
    const normalizedUserSkills = userSkills.map(s => typeof normalizeSkill === 'function' ? normalizeSkill(s).toLowerCase() : s.toLowerCase());
    
    // Evaluate roles dynamically
    let evaluatedRoles = jobRoles.map(role => {
        let matchedSkills = 0;
        role.skills.forEach(rs => {
            const normRs = typeof normalizeSkill === 'function' ? normalizeSkill(rs).toLowerCase() : rs.toLowerCase();
            if (normalizedUserSkills.includes(normRs)) matchedSkills++;
        });
        
        let calculatedMatch = role.skills.length > 0 ? Math.round((matchedSkills / role.skills.length) * 100) : 0;
        return { ...role, match: calculatedMatch };
    });
    
    // Filter and sort
    evaluatedRoles = evaluatedRoles.filter(r => r.match > 0).sort((a, b) => b.match - a.match).slice(0, 3);
    
    if (isMockData) {
        evaluatedRoles = [
            { name: "Python Developer", category: "Backend Engineering", icon: "fas fa-code", match: 80, colorTheme: "purple" },
            { name: "Backend Developer", category: "Full Stack Engineering", icon: "fas fa-server", match: 75, colorTheme: "blue" },
            { name: "Data Analyst", category: "Data & Analytics", icon: "fas fa-database", match: 68, colorTheme: "green" }
        ];
    }
    
    if (evaluatedRoles.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">No matching IT roles found.</p>`;
        return;
    }
    
    list.innerHTML = evaluatedRoles.map(role => {
        let colorTheme = role.colorTheme || "blue";
        if (role.category === "Backend") colorTheme = "purple";
        else if (role.category === "Data & AI") colorTheme = "green";
        else if (role.category === "Security") colorTheme = "red";
        else if (role.category === "Design") colorTheme = "pink";
        
        let hex = "#3B82F6";
        if (colorTheme === "purple") hex = "#7C3AED";
        if (colorTheme === "green") hex = "#10B981";
        if (colorTheme === "red") hex = "#EF4444";
        if (colorTheme === "pink") hex = "#EC4899";

        return `
            <div class="role-rec-card">
                <div class="role-rec-info">
                    <div class="role-rec-icon ${colorTheme}-icon"><i class="${role.icon || 'fas fa-code'}"></i></div>
                    <div>
                        <p class="role-rec-title">${role.name}</p>
                        <p class="role-rec-sub">${role.category || 'Technology'}</p>
                    </div>
                </div>
                <div class="role-rec-match">
                    <span class="match-pct">${role.match}%</span>
                    <div class="mini-bar"><div class="mini-fill" style="width:${role.match}%; background:${hex};"></div></div>
                </div>
            </div>
        `;
    }).join("");
}

/* ---- Counter Animation ---- */
function animateCounter(id, target, start = 0, suffix = "") {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1200;
    const step     = (target - start) / (duration / 16);
    let current    = start;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.round(current) + suffix;
    }, 16);
}

/* ---- Skills Doughnut Chart ---- */
function initSkillsChart(matched = 23, missing = 9, additional = 4) {
    const ctx = document.getElementById("skillsChart");
    if (!ctx) return;

    const data = {
        labels:   ["Matched", "Missing", "Additional"],
        datasets: [{
            data:            [matched, missing, additional],
            backgroundColor: ["#7C3AED", "#EF4444", "#F59E0B"],
            hoverBackgroundColor: ["#9333EA", "#F87171", "#FBBF24"],
            borderWidth:     0,
            borderRadius:    6,
            hoverOffset:     8,
        }]
    };

    new Chart(ctx, {
        type: "doughnut",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            animation: { animateScale: true, duration: 1200 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.parsed} skills`
                    },
                    backgroundColor: "rgba(6,13,46,0.95)",
                    titleColor: "#F1F5F9",
                    bodyColor:  "#94A3B8",
                    borderColor:"rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    padding:    12,
                    cornerRadius:10,
                }
            }
        }
    });
}

/* ---- Readiness Ring Animation ---- */
function animateRing(id, score) {
    const ring        = document.getElementById(id);
    const pctEl       = document.getElementById("readinessPct");
    if (!ring) return;

    const circumference = 314; // 2 * Math.PI * 50
    const offset        = circumference - (score / 100) * circumference;

    // Animate after short delay
    setTimeout(() => {
        ring.style.strokeDashoffset = offset;
    }, 300);

    // Number counter
    let current = 0;
    const interval = setInterval(() => {
        current += 2;
        if (current >= score) { current = score; clearInterval(interval); }
        pctEl.textContent = current + "%";
    }, 20);
}

/* ---- Sidebar Toggle ---- */
function initSidebar() {
    const sidebar    = document.getElementById("sidebar");
    const overlay    = document.getElementById("overlay");
    const hamburger  = document.getElementById("hamburger");
    const closeBtn   = document.getElementById("sidebarClose");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.add("open");
            overlay.classList.add("active");
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeSidebar);
    }
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
}


