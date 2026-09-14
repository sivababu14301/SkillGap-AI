/* ============================================================
   SkillGap AI — Header Functionality (header.js)
   Handles: Search bar, Notification bell, Profile dropdown
   Shared across all dashboard pages.
   ============================================================ */

// ─── Page Index for Search ────────────────────────────────────────────────────
const SEARCH_PAGES = [
    {
        title: "Dashboard",
        desc:  "Overview of your career stats and analytics",
        icon:  "fas fa-th-large",
        url:   "dashboard.html",
        keywords: ["dashboard", "overview", "home", "stats", "career", "analytics", "summary"]
    },
    {
        title: "Upload Resume",
        desc:  "Upload and parse your resume for analysis",
        icon:  "fas fa-upload",
        url:   "upload-resume.html",
        keywords: ["upload", "resume", "cv", "file", "parse", "document", "pdf"]
    },
    {
        title: "Job Roles",
        desc:  "Browse and select your target job role",
        icon:  "fas fa-bullseye",
        url:   "job-role.html",
        keywords: ["job", "role", "career", "target", "position", "developer", "designer", "analyst", "engineer"]
    },
    {
        title: "Skills Gap Analysis",
        desc:  "Analyze matched and missing skills for your role",
        icon:  "fas fa-chart-bar",
        url:   "skills-gap.html",
        keywords: ["skills", "gap", "analysis", "missing", "matched", "required", "technical"]
    },
    {
        title: "Resume Score",
        desc:  "View your ATS and resume quality score",
        icon:  "fas fa-star",
        url:   "resume-score.html",
        keywords: ["resume", "score", "ats", "rating", "quality", "evaluation", "grade"]
    },
    {
        title: "Career Recommendations",
        desc:  "AI-powered career path suggestions",
        icon:  "fas fa-lightbulb",
        url:   "career-recommendations.html",
        keywords: ["career", "recommendations", "suggestions", "ai", "path", "guidance", "tips"]
    },
    {
        title: "Learning Roadmap",
        desc:  "Personalized learning plan to close skill gaps",
        icon:  "fas fa-road",
        url:   "learning-roadmap.html",
        keywords: ["learning", "roadmap", "plan", "course", "study", "resources", "skills", "improve"]
    },
    {
        title: "Reports",
        desc:  "Download and view your full analysis report",
        icon:  "fas fa-file-alt",
        url:   "reports.html",
        keywords: ["report", "reports", "download", "pdf", "export", "analysis", "results"]
    },
    {
        title: "Profile",
        desc:  "Manage your account and personal information",
        icon:  "fas fa-user-circle",
        url:   "profile.html",
        keywords: ["profile", "account", "settings", "personal", "user", "info", "password", "edit"]
    }
];

// ─── Notification Data ────────────────────────────────────────────────────────
let NOTIFICATIONS = [];

async function fetchUserMessages() {
    const session = getActiveSession();
    if (!session || !session.mongo_id) return;
    
    try {
        const response = await fetch("/api/user/messages", {
            headers: { "X-User-Id": session.mongo_id }
        });
        if (response.ok) {
            NOTIFICATIONS = await response.json();
            const notifBtn = document.getElementById("notifBtn");
            const dropdown = document.getElementById("notifDropdown");
            if (notifBtn) updateNotifBadge(notifBtn);
            if (dropdown && dropdown.classList.contains("open")) {
                renderNotifications(dropdown);
            }
        }
    } catch (err) {
        console.error("Failed to load messages", err);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUnreadCount() {
    return NOTIFICATIONS.filter(function(n) { return !n.read; }).length;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function(c) {
        return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    var escaped = escapeHtml(text);
    var re = new RegExp("(" + escapeRegex(query) + ")", "gi");
    return escaped.replace(re, "<mark>$1</mark>");
}

// ─── Dropdown Helpers ─────────────────────────────────────────────────────────
function openDropdown(el) {
    el.classList.add("open");
}

function closeDropdown(el) {
    if (el) el.classList.remove("open");
}

function closeAllDropdowns() {
    document.querySelectorAll(".header-dropdown.open").forEach(function(d) {
        d.classList.remove("open");
    });
}

// ─── Session Helper ───────────────────────────────────────────────────────────
function getActiveSession() {
    return (
        JSON.parse(sessionStorage.getItem("skillgap_session") || "null") ||
        JSON.parse(localStorage.getItem("skillgap_session") || "null")
    );
}

function logout() {
    sessionStorage.removeItem("skillgap_session");
    localStorage.removeItem("skillgap_session");
    window.location.href = "login.html";
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function initSearch() {
    var searchInput = document.getElementById("searchInput");
    var searchWrap  = document.getElementById("searchWrap");
    if (!searchInput || !searchWrap) return;

    var dropdown = document.createElement("div");
    dropdown.id = "searchDropdown";
    dropdown.className = "header-dropdown search-dropdown";
    searchWrap.appendChild(dropdown);

    var debounceTimer;

    searchInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        var q = searchInput.value.trim();
        debounceTimer = setTimeout(function() {
            renderSearchResults(q, dropdown);
        }, 180);
    });

    searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            closeDropdown(dropdown);
            searchInput.blur();
        } else if (e.key === "Enter") {
            var first = dropdown.querySelector(".search-result-item");
            if (first) first.click();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            var items = dropdown.querySelectorAll(".search-result-item");
            if (items.length) items[0].focus();
        }
    });

    dropdown.addEventListener("keydown", function(e) {
        var items = Array.from(dropdown.querySelectorAll(".search-result-item"));
        var idx = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" && idx < items.length - 1) {
            e.preventDefault();
            items[idx + 1].focus();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (idx > 0) items[idx - 1].focus();
            else searchInput.focus();
        } else if (e.key === "Escape") {
            closeDropdown(dropdown);
            searchInput.focus();
        }
    });

    searchInput.addEventListener("focus", function() {
        var q = searchInput.value.trim();
        if (q) renderSearchResults(q, dropdown);
    });
}

function renderSearchResults(query, dropdown) {
    if (!query) { closeDropdown(dropdown); return; }

    var q = query.toLowerCase();
    var results = SEARCH_PAGES.filter(function(page) {
        return page.title.toLowerCase().indexOf(q) !== -1 ||
               page.desc.toLowerCase().indexOf(q) !== -1 ||
               page.keywords.some(function(k) { return k.indexOf(q) !== -1; });
    });

    if (!results.length) {
        dropdown.innerHTML =
            '<div class="search-no-results">' +
            '<i class="fas fa-search-minus"></i> No results for "<strong>' +
            escapeHtml(query) + '</strong>"</div>';
    } else {
        dropdown.innerHTML = results.map(function(page) {
            return '<div class="search-result-item" tabindex="0" onclick="window.location.href=\'' + page.url + '\'">' +
                '<div class="sri-icon"><i class="' + page.icon + '"></i></div>' +
                '<div class="sri-text">' +
                    '<span class="sri-title">' + highlightMatch(page.title, query) + '</span>' +
                    '<span class="sri-desc">' + escapeHtml(page.desc) + '</span>' +
                '</div>' +
                '<i class="fas fa-arrow-right sri-arrow"></i>' +
            '</div>';
        }).join("");
    }

    openDropdown(dropdown);
}

// ─── Notifications ────────────────────────────────────────────────────────────
function initNotifications() {
    var notifBtn = document.getElementById("notifBtn");
    if (!notifBtn) return;

    var wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    notifBtn.parentNode.insertBefore(wrapper, notifBtn);
    wrapper.appendChild(notifBtn);

    var dropdown = document.createElement("div");
    dropdown.id = "notifDropdown";
    dropdown.className = "header-dropdown notif-dropdown";
    wrapper.appendChild(dropdown);

    updateNotifBadge(notifBtn);
    renderNotifications(dropdown);

    notifBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
            renderNotifications(dropdown);
            openDropdown(dropdown);
        }
    });

    // Start polling for messages
    fetchUserMessages();
    setInterval(fetchUserMessages, 30000); // 30 seconds
}

function getIconForType(type) {
    switch(type) {
        case "Resume Review": return { icon: "fas fa-file-alt", color: "#7C3AED" };
        case "Skill Gap": return { icon: "fas fa-chart-bar", color: "#3B82F6" };
        case "Career Recommendation": return { icon: "fas fa-lightbulb", color: "#F59E0B" };
        case "Learning Roadmap": return { icon: "fas fa-road", color: "#10B981" };
        case "Placement": return { icon: "fas fa-briefcase", color: "#EC4899" };
        case "System Announcement": return { icon: "fas fa-bullhorn", color: "#EF4444" };
        default: return { icon: "fas fa-info-circle", color: "#64748B" };
    }
}

function renderNotifications(dropdown) {
    if (!dropdown) return;
    var unread = getUnreadCount();
    
    if (NOTIFICATIONS.length === 0) {
        dropdown.innerHTML =
            '<div class="notif-header">' +
                '<span class="notif-title"><i class="fas fa-bell"></i> Messages</span>' +
            '</div>' +
            '<div class="notif-list" style="padding:20px;text-align:center;color:#64748B;">No messages yet.</div>';
        return;
    }

    dropdown.innerHTML =
        '<div class="notif-header" style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span class="notif-title"><i class="fas fa-bell"></i> Messages</span>' +
            '<button onclick="clearAllNotifications(event)" style="background:none; border:none; color:#ef4444; font-size:0.8rem; cursor:pointer; font-weight:600; padding:0;">Clear All</button>' +
        '</div>' +
        '<div class="notif-list">' +
        NOTIFICATIONS.map(function(n) {
            const style = getIconForType(n.type);
            return '<div class="notif-item ' + (n.read ? 'read' : 'unread') + '" data-id="' + n._id + '" onclick="markRead(\'' + n._id + '\')">' +
                '<div class="notif-icon-wrap" style="background:' + style.color + '22;color:' + style.color + '">' +
                    '<i class="' + style.icon + '"></i>' +
                '</div>' +
                '<div class="notif-content">' +
                    '<div class="notif-item-title">' + escapeHtml(n.subject || n.title || 'Message') + '</div>' +
                    '<div class="notif-item-msg">' + escapeHtml(n.message || n.msg || '') + '</div>' +
                    '<div class="notif-item-time"><i class="far fa-clock"></i> ' + new Date(n.createdAt).toLocaleString() + '</div>' +
                '</div>' +
                (!n.read ? '<div class="notif-dot"></div>' : '') +
            '</div>';
        }).join("") +
        '</div>';
}

function updateNotifBadge(notifBtn) {
    var badge = notifBtn.querySelector(".notif-badge");
    var count = getUnreadCount();
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
    }
}

async function markRead(id) {
    var n = NOTIFICATIONS.find(function(n) { return n._id === id; });
    if (n && !n.read) { 
        n.read = true; 
        
        var notifBtn = document.getElementById("notifBtn");
        var dropdown = document.getElementById("notifDropdown");
        if (notifBtn) updateNotifBadge(notifBtn);
        if (dropdown) renderNotifications(dropdown);

        const session = getActiveSession();
        if (session && session.mongo_id) {
            try {
                await fetch("/api/user/messages/" + id + "/read", {
                    method: "POST",
                    headers: { "X-User-Id": session.mongo_id }
                });
            } catch (e) {
                console.error("Failed to mark read", e);
            }
        }
    }
}

// ─── Clear All Notifications ────────────────────────────────────────────────────
async function clearAllNotifications(e) {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to clear all notifications?")) {
        return;
    }
    const session = getActiveSession();
    if (!session || !session.mongo_id) return;
    
    try {
        const response = await fetch("/api/user/messages/clear", {
            method: "POST",
            headers: { "X-User-Id": session.mongo_id }
        });
        if (response.ok) {
            NOTIFICATIONS = [];
            const dropdown = document.getElementById("notifDropdown");
            if (dropdown) renderNotifications(dropdown);
            const notifBtn = document.getElementById("notifBtn");
            if (notifBtn) updateNotifBadge(notifBtn);
            
            // Show alert as required
            alert("All notifications cleared.");
        }
    } catch(err) {
        console.error("Failed to clear notifications", err);
    }
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
function initProfileDropdown() {
    var profileEl = document.getElementById("headerProfile");
    if (!profileEl) return;

    var wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    profileEl.parentNode.insertBefore(wrapper, profileEl);
    wrapper.appendChild(profileEl);

    var dropdown = document.createElement("div");
    dropdown.id = "profileDropdown";
    dropdown.className = "header-dropdown profile-dropdown";

    var session = getActiveSession();
    var name = session ? session.user_name : "Demo User";
    var email = session ? (session.email || "user@skillgap.ai") : "user@skillgap.ai";
    var initials = name.split(" ").map(function(n) { return n[0]; }).join("").toUpperCase().slice(0, 2);

    dropdown.innerHTML =
        '<div class="pd-header">' +
            '<div class="pd-avatar">' + initials + '</div>' +
            '<div class="pd-info">' +
                '<span class="pd-name">' + escapeHtml(name) + '</span>' +
                '<span class="pd-email">' + escapeHtml(email) + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="pd-divider"></div>' +
        '<div class="pd-menu">' +
            '<a href="profile.html" class="pd-item"><i class="fas fa-user-circle"></i><span>My Profile</span></a>' +
            '<a href="profile.html#settings" class="pd-item"><i class="fas fa-cog"></i><span>Settings</span></a>' +
            '<a href="reports.html" class="pd-item"><i class="fas fa-file-alt"></i><span>My Reports</span></a>' +
        '</div>' +
        '<div class="pd-divider"></div>' +
        '<div class="pd-footer">' +
            '<a href="#" class="pd-item pd-logout" onclick="logout(); return false;"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a>' +
        '</div>';

    wrapper.appendChild(dropdown);

    profileEl.addEventListener("click", function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) openDropdown(dropdown);
    });

    var arrow = profileEl.querySelector(".profile-arrow");
    var observer = new MutationObserver(function() {
        if (arrow) {
            arrow.style.transform = dropdown.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
            arrow.style.transition = "transform 0.25s ease";
        }
    });
    observer.observe(dropdown, { attributes: true, attributeFilter: ["class"] });
}

// ─── Close on outside click / Escape ─────────────────────────────────────────
document.addEventListener("click", function(e) {
    if (!e.target.closest(".header-dropdown") &&
        !e.target.closest("#notifBtn") &&
        !e.target.closest("#headerProfile") &&
        !e.target.closest("#searchWrap")) {
        closeAllDropdowns();
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeAllDropdowns();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    initSearch();
    initNotifications();
    initProfileDropdown();

    // Populate user info in header
    var session = getActiveSession();
    var name = session ? session.user_name : "Demo User";
    var initials = name.split(" ").map(function(n) { return n[0]; }).join("").toUpperCase().slice(0, 2);

    var headerName   = document.getElementById("headerName");
    var headerAvatar = document.getElementById("headerAvatar");
    var sidebarName  = document.getElementById("sidebarName");
    var sidebarAvatar= document.getElementById("sidebarAvatar");

    if (headerName)   headerName.textContent   = name.split(" ")[0];
    if (headerAvatar) headerAvatar.textContent  = initials;
    if (sidebarName)  sidebarName.textContent   = name;
    if (sidebarAvatar)sidebarAvatar.textContent = initials;

    // Universal Mobile Sidebar Logic
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    const closeBtn = document.getElementById("sidebarClose");

    function closeSidebarMobile() {
        if (sidebar) sidebar.classList.remove("open");
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.classList.remove("active", "show");
    }

    if (hamburger && sidebar) {
        hamburger.addEventListener("click", function(e) {
            e.stopPropagation();
            sidebar.classList.add("open");
            const overlay = document.getElementById("overlay");
            if (overlay) overlay.classList.add("active", "show");
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeSidebarMobile);
    }

    // Close when clicking outside
    document.addEventListener("click", function(e) {
        if (sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && (!hamburger || !hamburger.contains(e.target))) {
                closeSidebarMobile();
            }
        }
    });

    // Close when clicking a nav link
    if (sidebar) {
        const navLinks = sidebar.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", closeSidebarMobile);
        });
    }
});
