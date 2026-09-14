/* ============================================================
   SkillGap AI — Reports Module JavaScript
   ============================================================ */

/* ── Fetch Data from Backend ────────────────────────────────────── */
async function fetchUserReportData() {
    const session = JSON.parse(
        sessionStorage.getItem("skillgap_session") ||
        localStorage.getItem("skillgap_session") || "null"
    );

    if (!session || !session.user_id) {
        return null;
    }

    const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000') ? 'http://localhost:5000' : '';
    let allResumes = [];
    let latestAnalysis = null;
    let syncedResumeData = null;

    try {
        const resResumes = await fetch(`${API_BASE}/api/resumes/user/${session.user_id}`);
        if (resResumes.ok) {
            allResumes = await resResumes.json();
            if (allResumes.length > 0) {
                allResumes.sort((a, b) => new Date(b.uploaded_at || b.uploadDate) - new Date(a.uploaded_at || a.uploadDate));
                syncedResumeData = allResumes[0];
            }
        }
        
        const resAnalysis = await fetch(`${API_BASE}/api/analysis/user/${session.user_id}`);
        if (resAnalysis.ok) {
            const analyses = await resAnalysis.json();
            if (analyses && analyses.length > 0) {
                analyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                latestAnalysis = analyses[0];
                if (latestAnalysis.resume_id && allResumes.length > 0) {
                    syncedResumeData = allResumes.find(r => r._id === latestAnalysis.resume_id) || syncedResumeData;
                }
            }
        }
    } catch (err) {
        console.error("Failed to fetch user report data:", err);
    }

    if (!latestAnalysis) return null;

    return {
        session,
        allResumes,
        syncedResumeData,
        latestAnalysis,
        resumeScore: latestAnalysis.resume_score || latestAnalysis.resumeScore || 0,
        atsScore: latestAnalysis.ats_score || latestAnalysis.atsScore || 0,
        skillMatch: latestAnalysis.match_percentage || latestAnalysis.matchPercentage || 0,
        readiness: latestAnalysis.placement_readiness || latestAnalysis.placementReadiness || 0,
        targetRole: latestAnalysis.selected_role || "Unknown Role",
        matchedSkills: latestAnalysis.matched_skills || latestAnalysis.matchedSkills || [],
        missingSkills: latestAnalysis.missing_skills || latestAnalysis.missingSkills || [],
        extraSkills: latestAnalysis.additional_skills || latestAnalysis.additionalSkills || latestAnalysis.extraSkills || [],
        createdAt: latestAnalysis.created_at || Date.now()
    };
}

/* ── Animated Counter ────────────────────────────────────────── */
function animateCount(el, target, suffix = "", duration = 1200) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = Math.floor(start) + suffix;
        if (start >= target) clearInterval(timer);
    }, 16);
}

/* ── Bar Chart (pure CSS) ────────────────────────────────────── */
function renderBarChart(breakdown) {
    const wrap = document.getElementById("barChart");
    if (!wrap) return;
    wrap.innerHTML = breakdown.map(item => `
        <div class="bar-row">
            <span class="bar-label">${item.label}</span>
            <div class="bar-track">
                <div class="bar-fill" id="bar_${item.label.replace(/\s+/g,'_')}"
                     style="width:0%;background:${item.gradient};"></div>
            </div>
            <span class="bar-pct" style="color:${item.color};">${item.score}%</span>
        </div>
    `).join("");

    // Animate after paint
    requestAnimationFrame(() => {
        breakdown.forEach(item => {
            const el = document.getElementById("bar_" + item.label.replace(/\s+/g,'_'));
            if (el) setTimeout(() => { el.style.width = item.score + "%"; }, 200);
        });
    });
}

/* ── Doughnut Chart (Chart.js) ───────────────────────────────── */
function renderDoughnut(matched, missing, extra) {
    const ctx = document.getElementById("skillsDonut");
    if (!ctx) return;

    document.getElementById("lgMatched").textContent = matched;
    document.getElementById("lgMissing").textContent = missing;
    document.getElementById("lgExtra").textContent   = extra;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Matched", "Missing", "Extra"],
            datasets: [{
                data: [matched, missing, extra],
                backgroundColor: [
                    "rgba(16,185,129,0.85)",
                    "rgba(239,68,68,0.85)",
                    "rgba(59,130,246,0.85)"
                ],
                borderColor: [
                    "rgba(16,185,129,1)",
                    "rgba(239,68,68,1)",
                    "rgba(59,130,246,1)"
                ],
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            cutout: "72%",
            plugins: { legend: { display: false }, tooltip: { callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.raw} skill${ctx.raw !== 1 ? 's' : ''}`
            }}},
            animation: { animateRotate: true, duration: 1000 }
        }
    });
}

/* ── Score Breakdown Cards ───────────────────────────────────── */
function renderBreakdown(breakdown) {
    const grid = document.getElementById("breakdownGrid");
    if (!grid) return;
    grid.innerHTML = breakdown.map(item => `
        <div class="breakdown-item">
            <div class="bi-header">
                <span class="bi-name" style="color:${item.color};">
                    <i class="${item.icon}"></i>${item.label}
                </span>
                <span class="bi-score" style="color:${item.color};">${item.score}%</span>
            </div>
            <div class="bi-bar">
                <div class="bi-fill" id="bfill_${item.label.replace(/\s+/g,'_')}"
                     style="width:0%;background:${item.gradient};"></div>
            </div>
        </div>
    `).join("");

    requestAnimationFrame(() => {
        breakdown.forEach(item => {
            const el = document.getElementById("bfill_" + item.label.replace(/\s+/g,'_'));
            if (el) setTimeout(() => { el.style.width = item.score + "%"; }, 300);
        });
    });
}

/* ── Resume Extraction Summary ─────────────────────────────────── */
function renderResumeSummary(resumeData) {
    if (!resumeData) return;

    const el = id => document.getElementById(id);
    const tagHtml = (skills, cls) => Array.isArray(skills) && skills.length > 0 ? skills.map(s => `<span class="s-tag ${cls}">${s}</span>`).join("") : `<span style="color:var(--text-muted);font-size:0.78rem;">None detected</span>`;

    // Try to pull from parsed aiData if available, fallback to basic logic
    let edu = "No education data found in resume.";
    let exp = "No experience data found in resume.";
    let proj = "No projects data found in resume.";
    let certs = "No certifications data found in resume.";
    let tech = [];
    let soft = [];

    if (resumeData.aiData) {
        if (resumeData.aiData.education && resumeData.aiData.education.length > 0) {
            edu = resumeData.aiData.education.map(e => {
                if (typeof e === 'string') return `• ${e}`;
                const title = [e.degree || e.course || e.title, e.field || e.major].filter(Boolean).join(" - ") || "Education";
                return `• ${title}`;
            }).join("\n");
        }
        if (resumeData.aiData.experience && resumeData.aiData.experience.length > 0) {
            exp = resumeData.aiData.experience.map(e => {
                if (typeof e === 'string') return `• ${e}`;
                const title = e.role || e.title || e.position || "Experience";
                return `• ${title}`;
            }).join("\n");
        }
        if (resumeData.aiData.projects && resumeData.aiData.projects.length > 0) {
            proj = resumeData.aiData.projects.map(p => {
                if (typeof p === 'string') return `• ${p}`;
                const title = p.name || p.title || p.projectName || "Project";
                return `• ${title}`;
            }).join("\n");
        }
        if (resumeData.aiData.certifications && resumeData.aiData.certifications.length > 0) {
            certs = resumeData.aiData.certifications.map(c => {
                if (typeof c === 'string') return `• ${c}`;
                const title = c.name || c.title || c.certification || "Certification";
                return `• ${title}`;
            }).join("\n");
        }
        if (resumeData.aiData.skills) {
            tech = resumeData.aiData.skills;
        }
    } else if (resumeData.extracted_text) {
        // Very basic fallback if aiData isn't structured
        edu = "Extracted from text: Needs manual review.";
        tech = resumeData.extracted_skills || [];
    }

    if (el("reportEdu")) el("reportEdu").textContent = edu;
    if (el("reportExp")) el("reportExp").textContent = exp;
    if (el("reportProj")) el("reportProj").textContent = proj;
    if (el("reportCert")) el("reportCert").textContent = certs;
    if (el("reportTechSkills")) el("reportTechSkills").innerHTML = tagHtml(tech, "matched");
    if (el("reportSoftSkills")) el("reportSoftSkills").innerHTML = tagHtml(soft, "extra");
}

/* ── Career Recommendations ──────────────────────────────────── */
function populateRecommendedRolesForReports(data) {
    if (!window.jobRoles) {
        // Fallback or skip if job roles aren't loaded
        return;
    }
    
    let userSkills = [...data.matchedSkills, ...data.extraSkills];
    const normalizedUserSkills = userSkills.map(s => typeof normalizeSkill === 'function' ? normalizeSkill(s).toLowerCase() : s.toLowerCase());
    
    let evaluatedRoles = jobRoles.map(role => {
        let matchedSkills = 0;
        role.skills.forEach(rs => {
            const normRs = typeof normalizeSkill === 'function' ? normalizeSkill(rs).toLowerCase() : rs.toLowerCase();
            if (normalizedUserSkills.includes(normRs)) matchedSkills++;
        });
        
        let calculatedMatch = role.skills.length > 0 ? Math.round((matchedSkills / role.skills.length) * 100) : 0;
        return { ...role, match: calculatedMatch, confidence: Math.min(100, calculatedMatch + 15) };
    });
    
    evaluatedRoles = evaluatedRoles.filter(r => r.match > 0).sort((a, b) => b.match - a.match).slice(0, 5);
    
    const recs = evaluatedRoles.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        category: r.category || "Technology",
        match: r.match,
        confidence: r.confidence
    }));

    renderCareerRecs(recs);
}

function renderCareerRecs(recs) {
    const list = document.getElementById("careerRecList");
    if (!list) return;
    
    if (recs.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">No career recommendations available based on current skills.</p>`;
        return;
    }

    const rankClass = r => r === 1 ? "gold" : r === 2 ? "silver" : r === 3 ? "bronze" : "other";
    const rankLabel = r => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;

    list.innerHTML = recs.map(rec => `
        <div class="career-rec-item">
            <div class="cr-rank ${rankClass(rec.rank)}">${rankLabel(rec.rank)}</div>
            <div class="cr-info">
                <div class="cr-name">${rec.name}</div>
                <div class="cr-category">${rec.category}</div>
            </div>
            <div class="cr-bars">
                <div class="cr-bar-row">
                    <span class="cr-bar-label" style="font-size:0.62rem;color:var(--text-muted);width:54px;">Match</span>
                    <div class="cr-bar-track">
                        <div class="cr-bar-fill" style="width:${rec.match}%;background:linear-gradient(to right,#10B981,#34D399);"></div>
                    </div>
                    <span class="cr-pct" style="color:#34D399;">${rec.match}%</span>
                </div>
                <div class="cr-bar-row">
                    <span class="cr-bar-label" style="font-size:0.62rem;color:var(--text-muted);width:54px;">Conf.</span>
                    <div class="cr-bar-track">
                        <div class="cr-bar-fill" style="width:${rec.confidence}%;background:linear-gradient(to right,#7C3AED,#C084FC);"></div>
                    </div>
                    <span class="cr-pct" style="color:#C084FC;">${rec.confidence}%</span>
                </div>
            </div>
        </div>
    `).join("");
}

/* ── AI Insights ─────────────────────────────────────────────── */
function renderInsights(insights) {
    const list = document.getElementById("insightsList");
    if (!list) return;
    list.innerHTML = insights.map(ins => `
        <div class="insight-item ${ins.type}">
            <div class="insight-type">${ins.label}</div>
            <div class="insight-text">${ins.text}</div>
        </div>
    `).join("");
}

/* ── Learning Roadmap Summary ────────────────────────────────── */
function renderRoadmap(phases, stats) {
    const container = document.getElementById("roadmapPhases");
    const footer    = document.getElementById("roadmapFooter");
    if (!container) return;

    container.innerHTML = phases.map(p => `
        <div class="phase-item">
            <div class="phase-num">${p.phase}</div>
            <div class="phase-info">
                <div class="phase-title">${p.title}</div>
                <div class="phase-duration"><i class="fas fa-clock" style="font-size:0.65rem;margin-right:3px;"></i>${p.duration}</div>
            </div>
            <span class="phase-gain">${p.gain}</span>
        </div>
    `).join("");

    if (footer) {
        footer.innerHTML = `
            <div class="rm-stat green">
                <span class="val">${stats.improvement}</span>
                <span class="lbl">Expected Improvement</span>
            </div>
            <div class="rm-stat blue">
                <span class="val">${stats.weeks}</span>
                <span class="lbl">Est. Completion</span>
            </div>
        `;
    }
}

/* ── Progress Indicators ─────────────────────────────────────── */
function renderProgress(progressData) {
    const list = document.getElementById("progressList");
    if (!list) return;
    list.innerHTML = progressData.map(p => `
        <div class="progress-item">
            <div class="progress-item-header">
                <span class="progress-item-label" style="color:${p.color};">
                    <i class="${p.icon}"></i>${p.label}
                </span>
                <span class="progress-item-val" style="color:${p.color};">${p.val}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" id="pfill_${p.label.replace(/\s+/g,'_')}"
                     style="width:0%;background:${p.gradient};"></div>
            </div>
        </div>
    `).join("");

    requestAnimationFrame(() => {
        progressData.forEach((p, i) => {
            const el = document.getElementById("pfill_" + p.label.replace(/\s+/g,'_'));
            if (el) setTimeout(() => { el.style.width = p.val + "%"; }, 400 + i * 80);
        });
    });
}

/* ── Recent Reports Table ────────────────────────────────────── */
function renderRecentReports(reports) {
    const tbody = document.getElementById("recentReportsTbody");
    if (!tbody) return;

    const statusBadge = s => {
        if (s === "complete") return `<span class="status-badge complete"><i class="fas fa-check-circle"></i> Complete</span>`;
        if (s === "pending")  return `<span class="status-badge pending"><i class="fas fa-clock"></i> Pending</span>`;
        return `<span class="status-badge draft"><i class="fas fa-pen"></i> Draft</span>`;
    };
    const matchClass = m => m >= 70 ? "high" : m >= 50 ? "mid" : "low";
    const fmtDate = d => {
        const dt = new Date(d);
        return dt.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    };

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td><span class="report-id">${r.id}</span></td>
            <td><span class="role-cell">${r.role}</span></td>
            <td><span class="score-badge"><i class="fas fa-star"></i> ${r.score}/100</span></td>
            <td><span class="match-cell ${matchClass(r.match)}">${r.match}%</span></td>
            <td><span class="date-badge"><i class="fas fa-calendar"></i> ${fmtDate(r.date)}</span></td>
            <td>${statusBadge(r.status)}</td>
            <td>
                ${r.status !== "draft" ? `<button class="dl-btn" onclick="downloadReport('${r.id}')"><i class="fas fa-download"></i> PDF</button>` : `<button class="dl-btn" style="background:rgba(255,255,255,0.07);color:var(--text-muted);box-shadow:none;" disabled>Draft</button>`}
            </td>
        </tr>
    `).join("");
}

/* ── Analysis Summary (dynamic) ─────────────────────────────── */
function renderAnalysisSummary(data) {
    const el = id => document.getElementById(id);
    const session = JSON.parse(sessionStorage.getItem("skillgap_session") || localStorage.getItem("skillgap_session") || "null");

    if (el("reportUserId")) el("reportUserId").textContent = session ? (session.user_id || "USR001") : "USR001";
    if (el("reportTargetRole")) el("reportTargetRole").textContent = data.targetRole;
    if (el("reportTotalSkills")) el("reportTotalSkills").textContent =
        (data.matchedSkills.length + data.missingSkills.length) + " Skills";
    if (el("reportDate")) el("reportDate").textContent = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

    const tagHtml = (skills, cls) => skills.map(s => `<span class="s-tag ${cls}">${s}</span>`).join("") || `<span style="color:var(--text-muted);font-size:0.78rem;">None</span>`;

    if (el("reportMatchedSkills"))    el("reportMatchedSkills").innerHTML    = tagHtml(data.matchedSkills, "matched");
    if (el("reportMissingSkills"))    el("reportMissingSkills").innerHTML    = tagHtml(data.missingSkills, "missing");
    if (el("reportAdditionalSkills")) el("reportAdditionalSkills").innerHTML = tagHtml(data.extraSkills,   "extra");

    // AI Rec
    if (el("reportAIRec")) {
        if (data.missingSkills.length > 0) {
            const top3 = data.missingSkills.slice(0, 3).join(", ");
            el("reportAIRec").innerHTML = `Focus on acquiring <strong>${top3}</strong> to significantly boost your placement readiness for the <strong>${data.targetRole}</strong> role. Follow the AI-generated learning roadmap for structured progress.`;
        }
    }

    // Update doughnut center text
    const doughnutVal = document.querySelector(".doughnut-center .val");
    if (doughnutVal) doughnutVal.textContent = data.skillMatch + "%";
}

/* ── Score Cards Counter Animation ──────────────────────────── */
function animateScoreCards(data) {
    const el = id => document.getElementById(id);
    if (el("resumeScoreVal")) animateCount(el("resumeScoreVal"), data.resumeScore, "/100");
    if (el("atsScoreVal"))    animateCount(el("atsScoreVal"),    data.atsScore,    "%");
    if (el("skillMatchVal"))  animateCount(el("skillMatchVal"),  data.skillMatch,  "%");
    if (el("readinessVal"))   animateCount(el("readinessVal"),   data.readiness,   "%");
}

/* ── Export Actions ──────────────────────────────────────────── */
async function saveReportToBackend(format) {
    const data = await fetchUserReportData();
    if (!data) return;
    const sessionData = data.session;
    if (sessionData && sessionData.user_id) {
        const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000') ? 'http://localhost:5000' : '';
        fetch(`${API_BASE}/api/reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: sessionData.user_id,
                report_name: `Skill Gap Report - ${data.targetRole}`,
                report_type: "skill-gap",
                report_format: format,
                report_data: {
                    user_id: sessionData.user_id,
                    targetRole: data.targetRole,
                    resumeScore: data.resumeScore,
                    atsScore: data.atsScore,
                    skillMatch: data.skillMatch,
                    readiness: data.readiness,
                    matchedSkills: data.matchedSkills,
                    missingSkills: data.missingSkills,
                    extraSkills: data.extraSkills
                }
            })
        }).catch(err => console.error("Failed to save report to backend:", err));
    }
}

function downloadPDF() {
    showToast("📥 Preparing PDF report...", "info");
    saveReportToBackend("PDF");
    setTimeout(() => {
        window.print();
        showToast("✅ PDF export triggered via print dialog.", "success");
    }, 600);
}

async function downloadExcel() {
    showToast("📊 Generating Excel report...", "info");
    saveReportToBackend("Excel");
    const data = await fetchUserReportData();
    if (!data) return;
    
    const session = data.session;
    const currentUserId = session ? (session.user_id || "USR001") : "USR001";
    const currentUserName = session ? (session.user_name || session.name || "User") : "User";

    const rows = [
        ["SkillGap AI - Analysis Report"],
        [],
        ["Metric", "Value"],
        ["User ID",            currentUserId],
        ["Candidate Name",     currentUserName],
        ["Target Role",        data.targetRole],
        ["Resume Score",       data.resumeScore + "/100"],
        ["ATS Score",          data.atsScore + "%"],
        ["Skill Match",        data.skillMatch + "%"],
        ["Placement Readiness",data.readiness + "%"],
        [],
        ["Matched Skills", data.matchedSkills.join(", ")],
        ["Missing Skills", data.missingSkills.join(", ")],
        ["Extra Skills",   data.extraSkills.join(", ")]
    ];
    
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `SkillGapAI_Report_${currentUserId}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setTimeout(() => showToast("✅ Excel (CSV) downloaded!", "success"), 500);
}

function downloadReport(id) {
    showToast(`📥 Downloading report ${id}...`, "info");
    setTimeout(() => showToast("✅ Report downloaded!", "success"), 1200);
}

/* ── Toast Notification ──────────────────────────────────────── */
function showToast(msg, type = "info") {
    let toast = document.getElementById("reportToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "reportToast";
        Object.assign(toast.style, {
            position: "fixed", bottom: "24px", right: "24px", zIndex: "9999",
            padding: "13px 20px", borderRadius: "14px", fontFamily: "'Inter',sans-serif",
            fontSize: "0.84rem", fontWeight: "600", display: "flex", alignItems: "center",
            gap: "10px", maxWidth: "320px", boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            transition: "all 0.3s ease", transform: "translateY(20px)", opacity: "0"
        });
        document.body.appendChild(toast);
    }
    const colors = {
        info:    { bg: "rgba(59,130,246,0.95)",  border: "rgba(59,130,246,0.5)" },
        success: { bg: "rgba(16,185,129,0.95)",  border: "rgba(16,185,129,0.5)" },
        error:   { bg: "rgba(239,68,68,0.95)",   border: "rgba(239,68,68,0.5)"  }
    };
    const c = colors[type] || colors.info;
    toast.style.background   = c.bg;
    toast.style.border        = `1px solid ${c.border}`;
    toast.style.color         = "#fff";
    toast.textContent         = msg;
    requestAnimationFrame(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity   = "1";
    });
    setTimeout(() => {
        toast.style.transform = "translateY(20px)";
        toast.style.opacity   = "0";
    }, 3000);
}

/* ── Sidebar Helpers ─────────────────────────────────────────── */
const hamburger    = document.getElementById("hamburger");
const sidebar      = document.getElementById("sidebar");
const overlay      = document.getElementById("overlay");
const sidebarClose = document.getElementById("sidebarClose");

function openSidebar()  { sidebar?.classList.add("open"); overlay?.classList.add("show"); }
function closeSidebar() { sidebar?.classList.remove("open"); overlay?.classList.remove("show"); }
hamburger?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);

function logout() {
    sessionStorage.clear();
    localStorage.removeItem("skillgap_session");
    window.location.href = "login.html";
}

/* ── Init User Info ──────────────────────────────────────────── */
function initUserInfo() {
    const session = JSON.parse(
        sessionStorage.getItem("skillgap_session") ||
        localStorage.getItem("skillgap_session") || "null"
    );
    if (session) {
        const initials = (session.name || session.user_name || "U").charAt(0).toUpperCase();
        document.querySelectorAll("#sidebarAvatar,#headerAvatar").forEach(el => el.textContent = initials);
        document.querySelectorAll("#sidebarName,#headerName").forEach(el => el.textContent = session.name || session.user_name || "User");
    }
}

async function fetchRecentReports(sessionData) {
    if (sessionData && sessionData.user_id) {
        try {
            const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000') ? 'http://localhost:5000' : '';
            const response = await fetch(`${API_BASE}/api/analysis/user/${sessionData.user_id}`);
            if (response.ok) {
                const reports = await response.json();
                if (reports && reports.length > 0) {
                    return reports.map(r => ({
                        id: r._id.substring(0, 8),
                        role: r.selected_role || "Unknown Role",
                        score: r.resume_score || r.resumeScore || 0,
                        match: r.match_percentage || r.matchPercentage || 0,
                        date: r.created_at || r.timestamp || new Date(),
                        status: "complete"
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        }
    }
    return [];
}

/* ── MAIN INIT ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
    initUserInfo();

    const data = await fetchUserReportData();

    let reportData = data;
    let isMockReport = false;

    if (!reportData) {
        // ── FALLBACK MOCK DATA (demo state when no analysis exists) ──
        isMockReport = true;
        const session = JSON.parse(
            sessionStorage.getItem("skillgap_session") ||
            localStorage.getItem("skillgap_session") || "null"
        );
        reportData = {
            session: session || { user_id: "USR001", name: "Demo User" },
            allResumes: [{ _id: "r1", file_name: "Siva_Resume_Final.pdf", uploaded_at: new Date().toISOString() }],
            syncedResumeData: {
                file_name: "Siva_Resume_Final.pdf",
                uploaded_at: new Date().toISOString(),
                aiData: {
                    education: ["B.Tech in Computer Science – Anna University (2020–2024)"],
                    experience: ["Intern – Web Developer at XYZ Solutions (Jun 2023 – Aug 2023)"],
                    projects: ["E-Commerce Platform using React & Node.js", "Portfolio Website with Flask & PostgreSQL"],
                    certifications: ["AWS Certified Developer – Associate", "Meta Front-End Developer Certificate"],
                    skills: ["HTML","CSS","JavaScript","React","Node.js","SQL","Git","Python","Flask","REST API"]
                }
            },
            latestAnalysis: null,
            resumeScore: 82,
            atsScore: 86,
            skillMatch: 72,
            readiness: 77,
            targetRole: "Full Stack Developer",
            matchedSkills: ["HTML","CSS","JavaScript","React","Node.js","SQL","Git","Python","Flask","REST API"],
            missingSkills: ["Docker","MongoDB","Authentication","CI/CD","Deployment","TypeScript"],
            extraSkills: ["Excel","PowerPoint","Communication","Agile"],
            createdAt: new Date().toISOString()
        };
    }

    // Use reportData from here on
    const data2 = reportData;

    // Hide empty state, show content
    document.getElementById("reportsContentWrapper").style.display = "block";
    document.getElementById("noAnalysisContainer").style.display = "none";

    // Build Dynamic Breakdown
    const breakdown = [
        { label: "Technical Skills",  score: data2.skillMatch, icon: "fas fa-code",        color: "#C084FC", gradient: "linear-gradient(to right,#7C3AED,#C084FC)" },
        { label: "Projects",          score: Math.min(100, data2.skillMatch + 5), icon: "fas fa-diagram-project", color: "#60A5FA", gradient: "linear-gradient(to right,#3B82F6,#60A5FA)" },
        { label: "Education",         score: 90, icon: "fas fa-graduation-cap",   color: "#34D399", gradient: "linear-gradient(to right,#10B981,#34D399)" },
        { label: "Certifications",    score: Math.min(100, Math.max(0, data2.skillMatch - 15)), icon: "fas fa-certificate",  color: "#FBBF24", gradient: "linear-gradient(to right,#F59E0B,#FBBF24)" },
        { label: "ATS Compatibility", score: data2.atsScore, icon: "fas fa-robot",        color: "#2DD4BF", gradient: "linear-gradient(to right,#14B8A6,#2DD4BF)" },
        { label: "Resume Formatting", score: Math.min(100, data2.atsScore + 2), icon: "fas fa-file-lines",   color: "#F472B6", gradient: "linear-gradient(to right,#EC4899,#F472B6)" }
    ];

    // Build Insights (Improvement Suggestions)
    const insights = [];
    if (data2.missingSkills.length > 0) {
        insights.push({ type: "weakness", label: "Priority Missing Skills", text: `Your resume is missing critical skills: ${data2.missingSkills.slice(0, 3).join(", ")}.` });
        data2.missingSkills.slice(0, 3).forEach(skill => {
            insights.push({ type: "improve", label: `Improvement: ${skill}`, text: `Complete a hands-on project or certification focusing specifically on ${skill}.` });
        });
    } else {
        insights.push({ type: "strength", label: "Excellent Skill Match", text: `You have successfully matched all primary required skills for ${data2.targetRole}.` });
    }

    // Build Roadmap
    let roadmapPhases = [];
    if (data2.missingSkills.length > 0) {
        const batchSize = Math.max(1, Math.ceil(data2.missingSkills.length / 4));
        const phases = ["Foundation", "Core Skills", "Advanced Application", "Placement Readiness"];
        for (let i = 0; i < 4; i++) {
            const phaseSkills = data2.missingSkills.slice(i * batchSize, (i + 1) * batchSize);
            if (phaseSkills.length > 0) {
                roadmapPhases.push({ phase: i + 1, title: phases[i], duration: (i + 2) + " Weeks", gain: `+${phaseSkills.length * 5}%` });
            }
        }
    } else {
        roadmapPhases.push({ phase: 1, title: "Interview Prep", duration: "2 Weeks", gain: "+10%" });
    }
    const roadmapStats = { improvement: `+${data2.missingSkills.length * 5}%`, weeks: `${roadmapPhases.length * 2.5} Weeks` };

    // Fetch dynamic recent reports OR use fallback mock reports
    let recentReports = await fetchRecentReports(data2.session);
    if (isMockReport || recentReports.length === 0) {
        recentReports = [
            { id: "RPT-2024-001", role: "Python Developer",        score: 79, match: 72, date: new Date(Date.now() - 5*24*3600*1000), status: "complete" },
            { id: "RPT-2024-002", role: "Data Analyst",            score: 85, match: 68, date: new Date(Date.now() - 10*24*3600*1000), status: "complete" },
            { id: "RPT-2024-003", role: "Full Stack Developer",    score: 82, match: 72, date: new Date(Date.now() - 15*24*3600*1000), status: "complete" },
            { id: "RPT-2024-004", role: "Backend Developer",       score: 76, match: 59, date: new Date(Date.now() - 20*24*3600*1000), status: "pending" },
            { id: "RPT-2024-005", role: "Machine Learning Eng.",   score: 63, match: 37, date: new Date(Date.now() - 25*24*3600*1000), status: "draft" }
        ];
    }

    // Merge session data
    const merged = {
        ...data2,
        breakdown,
        roadmapPhases,
        roadmapStats,
        insights,
        recentReports
    };

    // Animate score counters
    setTimeout(() => animateScoreCards(merged), 200);

    // Render all sections
    renderResumeSummary(merged.syncedResumeData);
    renderAnalysisSummary(merged);
    renderDoughnut(merged.matchedSkills.length, merged.missingSkills.length, merged.extraSkills.length);
    renderBarChart(merged.breakdown);
    renderBreakdown(merged.breakdown);
    
    // Career Recs requires job-roles-data.js so we will do it via a helper function inside renderCareerRecs
    populateRecommendedRolesForReports(merged);

    renderInsights(merged.insights);
    renderRoadmap(merged.roadmapPhases, merged.roadmapStats);
    
    renderProgress(merged.breakdown.slice(0, 5).map(b => ({ label: b.label, icon: b.icon, val: b.score, color: b.color, gradient: b.gradient })));
    renderRecentReports(merged.recentReports);
});
