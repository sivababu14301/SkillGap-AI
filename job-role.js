/* ============================================================
   SkillGap AI — Job Role Selection JavaScript (Premium Rebuild)
   ============================================================ */

/* ── Category & Job Roles are now loaded from job-roles-data.js ── */


/* ── State ──────────────────────────────────────────────────── */
let currentDomain = "IT";
let currentCategory = "All";
let selectedRole    = null;
let userResumeSkills = [];
let searchQuery = "";

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
    await window.ensureJobRoles();

    // Load resume skills from session if available
    const resumeData = JSON.parse(sessionStorage.getItem("skillgap_resume") || "{}");
    if (resumeData && resumeData.text) {
        const text = resumeData.text.toLowerCase();
        const possibleSkills = [
            "python","sql","html","css","javascript","machine learning","flask",
            "django","git","aws","docker","java","react","node.js","typescript",
            "tensorflow","kubernetes","linux","figma","tableau","power bi","excel",
            "agile","scrum","rest api","mongodb","postgresql","spark","airflow"
        ];
        userResumeSkills = possibleSkills.filter(s => text.includes(s));
    }

    // Fallback demo skills
    if (!userResumeSkills.length) {
        userResumeSkills = ["Python", "SQL", "HTML", "CSS", "JavaScript", "Git"];
    }

    renderCategoryTabs();
    renderRoles();
    setupAIRecommendation();

    // Search input listener
    const searchInput = document.getElementById("roleSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderRoles();
        });
    }

    // Sidebar/hamburger auth setup
    const session = JSON.parse(
        sessionStorage.getItem("skillgap_session") ||
        localStorage.getItem("skillgap_session") || "null"
    );
    if (session) {
        const initials = (session.name || "U").charAt(0).toUpperCase();
        document.querySelectorAll("#sidebarAvatar,#headerAvatar").forEach(el => el.textContent = initials);
        document.querySelectorAll("#sidebarName,#headerName").forEach(el => el.textContent = session.name || "User");
    }
});

function getCategoriesForDomain(domain) {
    const allDomainRoles = jobRoles.filter(r => (r.domain || "IT") === domain);
    const cats = new Set(allDomainRoles.map(r => r.category));
    return ["All", ...Array.from(cats)];
}

/* ── Render Category Tabs ────────────────────────────────────── */
function renderCategoryTabs() {
    const container = document.getElementById("categoryTabs");
    if (!container) return;
    container.innerHTML = "";

    const categories = getCategoriesForDomain(currentDomain);
    
    if (!categories.includes(currentCategory)) {
        currentCategory = "All";
    }

    categories.forEach((cat) => {
        const meta  = categoryMeta[cat] || categoryMeta["All"];
        const allDomainRoles = jobRoles.filter(r => (r.domain || "IT") === currentDomain);
        const count = cat === "All" ? allDomainRoles.length : allDomainRoles.filter(r => r.category === cat).length;
        
        const btn   = document.createElement("button");
        btn.className = `cat-tab${cat === currentCategory ? " active" : ""}`;
        btn.id        = `tab_${cat.replace(/[^a-z0-9]/gi,"_")}`;
        btn.innerHTML = `<i class="${meta.icon || 'fas fa-briefcase'}"></i> ${cat} <span class="tab-count">${count}</span>`;
        btn.onclick = () => switchCategory(cat);
        container.appendChild(btn);
    });
}

/* ── Switch Domain ───────────────────────────────────────────── */
window.switchDomain = function(domain) {
    currentDomain = domain;
    
    const domainItBtn = document.getElementById("domain_IT");
    const domainNonItBtn = document.getElementById("domain_NON_IT");
    if (domainItBtn) domainItBtn.classList.toggle("active", domain === "IT");
    if (domainNonItBtn) domainNonItBtn.classList.toggle("active", domain === "NON-IT");
    
    currentCategory = "All";
    renderCategoryTabs();
    renderRoles();
};

/* ── Switch Category ─────────────────────────────────────────── */
function switchCategory(cat) {
    currentCategory = cat;

    // Update tab active states
    document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
    const activeTab = document.getElementById(`tab_${cat.replace(/[^a-z0-9]/gi,"_")}`);
    if (activeTab) activeTab.classList.add("active");

    renderRoles();
}

/* ── Render Role Cards ───────────────────────────────────────── */
function renderRoles() {
    const grid   = document.getElementById("roleGrid");
    const label  = document.getElementById("rolesCount");
    
    if (!grid || !label) return;

    const allDomainRoles = jobRoles.filter(r => (r.domain || "IT") === currentDomain);
    let filtered = allDomainRoles;

    if (currentCategory !== "All") {
        filtered = filtered.filter(r => r.category === currentCategory);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(r => r.name.toLowerCase().includes(searchQuery));
    }

    label.textContent = filtered.length;

    if (!filtered.length) {
        grid.innerHTML = `<div class="no-results-msg"><i class="fas fa-search"></i>No roles found matching your criteria.</div>`;
        return;
    }

    grid.innerHTML = filtered.map((role, idx) => `
        <div class="role-card${selectedRole?.id === role.id ? " selected" : ""}"
             id="card_${role.id}"
             onclick="selectRole('${role.id}')"
             title="${role.name}">
            <div class="check-badge"><i class="fas fa-check"></i></div>
            <div class="role-icon-lg ${role.colorClass}"><i class="${role.icon}"></i></div>
            <div class="role-card-content">
                <h3>${role.name}</h3>
                <div class="role-meta"><i class="fas fa-tag"></i>${role.category}</div>
                <span class="skill-count-pill"><i class="fas fa-list"></i> ${role.skills?.length || 0} skills</span>
            </div>
        </div>
    `).join("");
}

/* ── AI Recommendation ───────────────────────────────────────── */
function setupAIRecommendation() {
    if (!jobRoles.length) return;
    let bestMatch   = jobRoles[0];
    let maxMatchPct = 0;
    const userLower = userResumeSkills.map(s => s.toLowerCase().trim());

    jobRoles.forEach(role => {
        const matched  = role.skills.filter(rs => userLower.includes(rs.toLowerCase().trim())).length;
        const matchPct = Math.round((matched / (role.skills.length || 1)) * 100);
        if (matchPct > maxMatchPct) { maxMatchPct = matchPct; bestMatch = role; }
    });

    // Ensure a reasonable confidence for demo
    const confidence = Math.max(maxMatchPct + 15, 65);

    const suggestionCard = document.getElementById("aiSuggestionCard");
    if(suggestionCard) {
        suggestionCard.innerHTML = `
            <div class="ai-badge"><i class="fas fa-magic"></i> AI Recommended</div>
            <p class="rec-text">Based on your resume, our AI suggests you target:</p>
            <div class="rec-role-box" onclick="selectRole('${bestMatch.id}')">
                <div class="rec-role-icon ${bestMatch.colorClass}" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">
                    <i class="${bestMatch.icon}"></i>
                </div>
                <div class="rec-role-info">
                    <h4>${bestMatch.name}</h4>
                    <p>${bestMatch.category}</p>
                </div>
                <div class="rec-confidence">
                    <span>${Math.min(confidence, 99)}%</span>
                    <small>Confidence</small>
                </div>
            </div>
            <p class="rec-select-hint"><i class="fas fa-hand-pointer"></i> Click above to auto-select this role</p>
        `;
    }

    // Store recommended role
    sessionStorage.setItem("skillgap_ai_recommended_role", JSON.stringify(bestMatch));
}

/* ── Select Role ─────────────────────────────────────────────── */
function selectRole(roleId) {
    selectedRole = jobRoles.find(r => r.id === roleId);
    if (!selectedRole) return;

    // Highlight card (handle both visible and non-visible cards)
    document.querySelectorAll(".role-card").forEach(c => c.classList.remove("selected"));
    const card = document.getElementById(`card_${roleId}`);
    if (card) {
        card.classList.add("selected");
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // If role is in a different domain or category, switch to show it
    const roleDomain = selectedRole.domain || "IT";
    let needsRender = false;
    if (currentDomain !== roleDomain) {
        currentDomain = roleDomain;
        const domainItBtn = document.getElementById("domain_IT");
        const domainNonItBtn = document.getElementById("domain_NON_IT");
        if (domainItBtn) domainItBtn.classList.toggle("active", currentDomain === "IT");
        if (domainNonItBtn) domainNonItBtn.classList.toggle("active", currentDomain === "NON-IT");
        needsRender = true;
    }
    
    if (currentCategory !== "All" && selectedRole.category !== currentCategory) {
        currentCategory = selectedRole.category;
        needsRender = true;
    }

    if (needsRender) {
        renderCategoryTabs();
        renderRoles();
        // Re-apply selected after render
        setTimeout(() => {
            const c = document.getElementById(`card_${roleId}`);
            if (c) c.classList.add("selected");
        }, 50);
    }

    // Calculate match
    const userLower   = userResumeSkills.map(s => s.toLowerCase().trim());
    const matchedSkills = selectedRole.skills.filter(rs => userLower.includes(rs.toLowerCase().trim()));
    const missingSkills = selectedRole.skills.filter(rs => !userLower.includes(rs.toLowerCase().trim()));
    let matchPct      = 0;
    if (selectedRole.skills.length > 0) {
        matchPct = Math.round((matchedSkills.length / selectedRole.skills.length) * 100);
    }

    // Show details panel
    document.getElementById("noRoleSelected").style.display = "none";
    const detailsEl = document.getElementById("roleDetailsContent");
    detailsEl.style.display = "block";

    // Populate
    document.getElementById("rdName").textContent     = selectedRole.name;
    document.getElementById("rdCategory").innerHTML   = `<i class="fas fa-tag"></i> ${selectedRole.category}`;
    document.getElementById("rdCount").textContent    = `${selectedRole.skills.length} Required Skills`;
    document.getElementById("rdDesc").textContent     = selectedRole.description;

    const iconDiv = document.getElementById("rdIcon");
    iconDiv.className = `rd-icon ${selectedRole.colorClass}`;
    iconDiv.innerHTML = `<i class="${selectedRole.icon}"></i>`;

    // Skills tags with match highlighting
    document.getElementById("rdSkillsTags").innerHTML = selectedRole.skills.map(s => {
        const isMatched = userLower.includes(s.toLowerCase());
        return `<span class="skill-tag${isMatched ? " matched" : ""}">${isMatched ? '<i class="fas fa-check" style="font-size:0.65rem;margin-right:4px;"></i>' : ''}${s}</span>`;
    }).join("");
    
    // Add Soft Skills and Tools to the details panel if they exist
    if (selectedRole.soft_skills && selectedRole.soft_skills.length > 0) {
        let softSkillsHtml = `<h4><i class="fas fa-users"></i> Soft Skills</h4><div class="skills-tags">`;
        softSkillsHtml += selectedRole.soft_skills.map(s => `<span class="skill-tag">${s}</span>`).join("");
        softSkillsHtml += `</div>`;
        
        let toolsHtml = `<h4><i class="fas fa-tools"></i> Tools & Tech</h4><div class="skills-tags">`;
        if(selectedRole.tools && selectedRole.tools.length > 0) {
            toolsHtml += selectedRole.tools.map(s => `<span class="skill-tag">${s}</span>`).join("");
        }
        toolsHtml += `</div>`;

        // Check if extra sections already appended, if not append them
        if (!document.getElementById("rdExtraSkills")) {
            const extraDiv = document.createElement("div");
            extraDiv.id = "rdExtraSkills";
            extraDiv.className = "rd-section";
            // Insert before match preview section
            const matchPreviewSec = document.querySelector(".match-preview-sec");
            if(matchPreviewSec) {
                matchPreviewSec.parentNode.insertBefore(extraDiv, matchPreviewSec);
            }
        }
        document.getElementById("rdExtraSkills").innerHTML = softSkillsHtml + toolsHtml;
    } else {
        const extraDiv = document.getElementById("rdExtraSkills");
        if(extraDiv) extraDiv.innerHTML = "";
    }


    // Match bar
    document.getElementById("mpVal").textContent      = `${matchPct}%`;
    document.getElementById("mpMatched").textContent  = matchedSkills.length;
    document.getElementById("mpMissing").textContent  = missingSkills.length;
    document.getElementById("mpTotal").textContent    = selectedRole.skills.length;

    const fill = document.getElementById("mpFill");
    // Small delay to trigger CSS transition
    setTimeout(() => { fill.style.width = `${matchPct}%`; }, 50);

    if      (matchPct >= 70) fill.style.background = "linear-gradient(to right, #10B981, #34D399)";
    else if (matchPct >= 40) fill.style.background = "linear-gradient(to right, #3B82F6, #60A5FA)";
    else                     fill.style.background = "linear-gradient(to right, #F59E0B, #FBBF24)";

    // Update mp-val color
    const mpValEl = document.getElementById("mpVal");
    mpValEl.style.color = matchPct >= 70 ? "#34D399" : matchPct >= 40 ? "#60A5FA" : "#FBBF24";

    // Enable continue
    const btn = document.getElementById("continueBtn");
    btn.disabled = false;
    btn.classList.add("pulse");
}

/* ── Navigate to Analysis ────────────────────────────────────── */
async function goToAnalysis() {
    if (!selectedRole) return;
    
    // Save to backend MongoDB
    const session = JSON.parse(
        sessionStorage.getItem("skillgap_session") ||
        localStorage.getItem("skillgap_session") || "null"
    );
    
    if (session && session.user_id) {
        try {
            const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000') ? 'http://localhost:5000' : '';
            const res = await fetch(`${API_BASE}/api/job-selection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: session.user_id,
                    selected_job_role: selectedRole.name,
                    resume_id: null // optional or we can fetch latest
                })
            });
            if (!res.ok) console.error("Failed to save job selection to backend");
        } catch (err) {
            console.error("Backend error during job selection:", err);
        }
    }

    sessionStorage.setItem("skillgap_target_role", JSON.stringify(selectedRole));
    window.location.href = "skills-gap.html";
}

/* ── Sidebar helpers (same as other pages) ───────────────────── */
const hamburger  = document.getElementById("hamburger");
const sidebar    = document.getElementById("sidebar");
const overlay    = document.getElementById("overlay");
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
