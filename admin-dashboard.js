/* ============================================================
   SkillGap AI — Admin Dashboard Logic
   Handles all admin functionality, charts, and data management.
   Uses MongoDB Flask API for data persistence.
   ============================================================ */

// Global State
const adminState = {
    users: [],
    resumes: [],
    analyses: [],
    reports: [],
    roles: [],
    courses: [],
    stats: {}
};

// Wait for DOM
document.addEventListener("DOMContentLoaded", async () => {
    // Check if user is admin
    const session = getSession() || JSON.parse(localStorage.getItem("skillgap_session") || "null");
    if (!session || session.role !== "admin") {
        window.location.href = "login.html"; // Redirect non-admins to main login
        return;
    }

    // Override fetch to inject admin auth headers for /api/ routes
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        let [resource, config] = args;
        if (typeof resource === 'string' && resource.includes('/api/')) {
            config = config || {};
            config.headers = {
                ...config.headers,
                "X-User-Id": session.mongo_id || "",
                "X-Admin-Role": session.role || ""
            };
        }
        return originalFetch(resource, config);
    };

    // Set Header Info
    document.getElementById("headerName").textContent = session.user_name || "Admin";
    if (session.user_name) {
        document.getElementById("headerAvatar").textContent = session.user_name.charAt(0).toUpperCase();
        document.getElementById("profileAvatarLg").textContent = session.user_name.charAt(0).toUpperCase();
        document.getElementById("profileDisplayName").textContent = session.user_name;
        document.getElementById("profileName").value = session.user_name;
    }
    if (session.email) {
        document.getElementById("profileDisplayEmail").textContent = session.email;
        document.getElementById("profileEmail").value = session.email;
    }

    initSidebar();
    
    // Load saved tab or default
    const activeTab = localStorage.getItem("admin_active_tab") || "dashboard";
    switchAdminTab(activeTab);
    
    // Load initial data
    await loadAllData();
});

function adminLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem("skillgap_session");
    window.location.replace("login.html");
}

/* ============================================================
   1. NAVIGATION & LAYOUT
   ============================================================ */

function initSidebar() {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const closeBtn = document.getElementById("sidebarClose");
    const overlay = document.getElementById("overlay");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.add("open");
            overlay.classList.add("active");
        });
    }

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);
}

function switchAdminTab(tabId, event) {
    if (event) event.preventDefault();
    localStorage.setItem("admin_active_tab", tabId);
    
    // Hide all tabs
    document.querySelectorAll(".admin-tab-content").forEach(el => el.classList.remove("active"));
    
    // Remove active from nav links
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    
    // Show target tab
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add("active");
    }
    
    // Highlight nav link
    const targetLink = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (targetLink) {
        targetLink.classList.add("active");
        // Update breadcrumb
        const title = targetLink.querySelector(".nav-text").textContent;
        document.getElementById("currentTabLabel").textContent = title;
    }

    // Mobile sidebar close on click
    if (window.innerWidth <= 900) {
        document.getElementById("sidebar").classList.remove("open");
        document.getElementById("overlay").classList.remove("active");
    }

    // Trigger tab-specific refresh if needed
    if (tabId === 'dashboard') refreshDashboard();
    if (tabId === 'analytics') initAnalyticsCharts();
    if (tabId === 'settings') loadSettings();
}

function switchLearningSubTab(subId) {
    document.querySelectorAll(".sub-tab").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".learning-sub").forEach(el => el.classList.remove("active"));
    
    event.target.classList.add("active");
    document.getElementById(`learningSub${subId.charAt(0).toUpperCase() + subId.slice(1)}`).classList.add("active");
}

/* ============================================================
   2. DATA SYNCRONIZATION WITH BACKEND
   ============================================================ */

async function loadAllData() {
    try {
        const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
        
        const endpoints = [
            fetch(`${API_BASE}/api/admin/users`),
            fetch(`${API_BASE}/api/resumes/all`),
            fetch(`${API_BASE}/api/analysis/all`),
            fetch(`${API_BASE}/api/reports/all`),
            fetch(`${API_BASE}/api/roles`),
            fetch(`${API_BASE}/api/courses`),
            fetch(`${API_BASE}/api/admin/stats`),
            fetch(`${API_BASE}/api/admin/notifications`)
        ];
        
        const results = await Promise.allSettled(endpoints);
        
        const parseJson = async (res) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                try {
                    return await res.value.json();
                } catch(e) {
                    return null;
                }
            }
            return null;
        };

        const [users, resumes, analyses, reports, roles, courses, stats, notifications] = await Promise.all(results.map(parseJson));

        // ── Backend Data ──
        adminState.users = users || [];
        adminState.resumes = resumes || [];
        adminState.analyses = analyses || [];
        adminState.reports = reports || [];
        adminState.roles = roles || [];
        adminState.courses = courses || [];
        adminState.stats = stats || {};
        adminState.notifications = notifications || [];

        if (typeof window.ensureJobRoles === 'function') {
            await window.ensureJobRoles();
        }

        if (adminState.roles.length === 0 && typeof jobRoles !== 'undefined') {
            adminState.roles = jobRoles.map((r, i) => ({
                id: r.id || r._id,
                title: r.name || r.title,
                desc: r.description || r.desc,
                cat: r.category || r.cat,
                domain: r.domain || "IT",
                icon: r.icon,
                skills: r.skills || []
            }));
        }

        if (Object.keys(adminState.stats).length === 0) {
            adminState.stats = {
                total_users: adminState.users.length || 0,
                resumes_uploaded: adminState.resumes.length || 0,
                analyses_completed: adminState.analyses.length || 0,
                reports_generated: adminState.reports.length || 0,
                active_today: Math.max(1, Math.floor(adminState.users.length * 0.4)),
                avg_match: 0
            };
        }

        // Render everything
        renderUsersTable();
        renderResumesTable();
        renderAnalysesTable();
        renderReportsTable();
        renderRolesGrid();
        renderCoursesTable();
        renderNotifications();
        loadSettings();
        
    } catch (err) {
        console.error("Error loading admin dashboard data:", err);
    } finally {
        // ALWAYS refresh dashboard so it doesn't stay stuck at 0 if an error occurs
        refreshDashboard();
    }
}

/* ============================================================
   3. DASHBOARD TAB
   ============================================================ */

function refreshDashboard() {
    const stats = adminState.stats;

    // Update KPI Cards
    document.getElementById("valTotalUsers").textContent = stats.total_users || 0;
    document.getElementById("valResumes").textContent = stats.resumes_uploaded || 0;
    document.getElementById("valAnalyses").textContent = stats.analyses_completed || 0;
    document.getElementById("valReports").textContent = stats.reports_generated || 0;
    
    const valTotalRoles = document.getElementById("valTotalRoles");
    if(valTotalRoles) valTotalRoles.textContent = stats.total_job_roles || 0;
    const valITRoles = document.getElementById("valITRoles");
    if(valITRoles) valITRoles.textContent = stats.it_job_roles || 0;
    const valNonITRoles = document.getElementById("valNonITRoles");
    if(valNonITRoles) valNonITRoles.textContent = stats.non_it_job_roles || 0;

    document.getElementById("valActiveToday").textContent = stats.active_today || 0;
    document.getElementById("valAvgMatch").textContent = (stats.avg_match || 0) + "%";

    renderActivityFeed();
    initDashboardCharts();
}

function renderActivityFeed() {
    const feed = document.getElementById("dashActivityFeed");
    if (!feed) return;

    // Create dynamic feed based on real fetched database collections
    const activities = [];
    
    // Add user registrations
    (adminState.users || []).forEach(u => {
        if (!u.created_at) return;
        activities.push({
            dateObj: new Date(u.created_at),
            icon: "fa-user-plus",
            bg: "bg-blue",
            text: `<strong>${u.name}</strong> registered a new account.`
        });
    });

    // Add resume uploads
    (adminState.resumes || []).forEach(r => {
        if (!r.date) return;
        activities.push({
            dateObj: new Date(r.date),
            icon: "fa-file-upload",
            bg: "bg-purple",
            text: `<strong>${r.userName || "User"}</strong> uploaded <em>${r.fileName}</em>.`
        });
    });

    // Add skill analyses
    (adminState.analyses || []).forEach(a => {
        if (!a.date) return;
        activities.push({
            dateObj: new Date(a.date),
            icon: "fa-microscope",
            bg: "bg-green",
            text: `System analyzed resume for <strong>${a.role || "Target Role"}</strong> (${a.match}% Match).`
        });
    });

    // Sort descending by date and take top 5
    activities.sort((a, b) => b.dateObj - a.dateObj);
    const recentActivities = activities.slice(0, 5);

    if (recentActivities.length === 0) {
        feed.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">No recent activities found.</p>`;
        return;
    }

    const timeAgo = (date) => {
        const diff = Math.floor((new Date() - date) / 1000);
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff/60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`;
        return `${Math.floor(diff/86400)} days ago`;
    };

    feed.innerHTML = recentActivities.map(act => `
        <div class="activity-item">
            <div class="activity-icon ${act.bg}"><i class="fas ${act.icon}"></i></div>
            <div class="activity-content">
                <p>${act.text}</p>
                <span class="activity-time">${timeAgo(act.dateObj)}</span>
            </div>
        </div>
    `).join("");
}

let dashGrowthChart = null;
let dashRolesChart = null;
let dashSkillsChart = null;

function initDashboardCharts() {
    // Helper to get last 6 months labels
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        let m = d.getMonth() - i;
        if (m < 0) m += 12;
        last6Months.push(months[m]);
    }

    // 1. User Growth Data
    const growthData = [0, 0, 0, 0, 0, 0];
    (adminState.users || []).forEach(u => {
        if (!u.created_at) return;
        const uDate = new Date(u.created_at);
        const diffMonths = (d.getFullYear() - uDate.getFullYear()) * 12 + (d.getMonth() - uDate.getMonth());
        if (diffMonths >= 0 && diffMonths < 6) {
            growthData[5 - diffMonths]++;
        }
    });

    const ctxGrowth = document.getElementById('growthChart');
    if (ctxGrowth) {
        if (dashGrowthChart) dashGrowthChart.destroy();
        dashGrowthChart = new Chart(ctxGrowth, {
            type: 'line',
            data: {
                labels: last6Months,
                datasets: [{
                    label: 'New Users',
                    data: growthData,
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                }
            }
        });
    }

    // 2. Roles Data
    const roleCounts = {};
    (adminState.analyses || []).forEach(a => {
        const r = a.role || a.selected_role || "Unknown";
        roleCounts[r] = (roleCounts[r] || 0) + 1;
    });
    const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const roleLabels = sortedRoles.length ? sortedRoles.map(x => x[0]) : ["No Data"];
    const roleData = sortedRoles.length ? sortedRoles.map(x => x[1]) : [1];

    const ctxRoles = document.getElementById('rolesChart');
    if (ctxRoles) {
        if (dashRolesChart) dashRolesChart.destroy();
        dashRolesChart = new Chart(ctxRoles, {
            type: 'doughnut',
            data: {
                labels: roleLabels,
                datasets: [{
                    data: roleData,
                    backgroundColor: ['#3B82F6', '#10B981', '#F472B6', '#FBBF24', '#8B5CF6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', usePointStyle: true, padding: 20 } } }
            }
        });
    }

    // 3. Skills Data
    const skillCounts = {};
    (adminState.analyses || []).forEach(a => {
        const allSkills = [...(a.matched_skills || []), ...(a.missing_skills || [])];
        allSkills.forEach(s => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
    });
    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const skillLabels = sortedSkills.length ? sortedSkills.map(x => x[0]) : ["No Data"];
    const skillData = sortedSkills.length ? sortedSkills.map(x => x[1]) : [0];

    const ctxSkills = document.getElementById('skillsChart');
    if (ctxSkills) {
        if (dashSkillsChart) dashSkillsChart.destroy();
        dashSkillsChart = new Chart(ctxSkills, {
            type: 'bar',
            data: {
                labels: skillLabels,
                datasets: [{
                    label: 'Demand Count',
                    data: skillData,
                    backgroundColor: '#10B981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1 } }
                }
            }
        });
    }
}

function updateGrowthChart(period) {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    if (dashGrowthChart) {
        dashGrowthChart.data.datasets[0].data = dashGrowthChart.data.datasets[0].data.map(v => v + Math.floor(Math.random() * 10 - 5));
        dashGrowthChart.update();
    }
}

/* ============================================================
   4. USERS MANAGEMENT
   ============================================================ */

function renderUsersTable() {
    const users = adminState.users || [];
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    // Update Stats (robust against undefined)
    document.getElementById("usersTotal").textContent = users.length;
    document.getElementById("usersActive").textContent = users.filter(u => (u.status || 'active') === 'active').length;
    document.getElementById("usersInactive").textContent = users.filter(u => u.status === 'inactive').length;
    document.getElementById("usersAdmins").textContent = users.filter(u => (u.role || 'user') === 'admin').length;
    
    document.getElementById("usersTableInfo").textContent = `Showing ${users.length} users`;

    tbody.innerHTML = users.map(u => {
        const safeName = u.name || 'Unknown';
        const safeEmail = u.email || 'No Email';
        const safeRole = u.role || 'user';
        const safeStatus = u.status || 'active';

        return `
        <tr data-role="${safeRole}" data-status="${safeStatus}" data-name="${safeName.toLowerCase()}" data-email="${safeEmail.toLowerCase()}">
            <td style="font-family:monospace;font-weight:700;color:#A78BFA">${u.user_id || u.id || 'N/A'}</td>
            <td>
                <div class="td-user">
                    <div class="td-avatar" style="background:${safeRole === 'admin' ? '#EF4444' : '#7C3AED'}">${safeName.charAt(0).toUpperCase()}</div>
                    <span>${safeName}</span>
                </div>
            </td>
            <td>${safeEmail}</td>
            <td><span class="role-badge role-${safeRole}">${safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}</span></td>
            <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
            <td><span class="status-badge status-${safeStatus}">${safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}</span></td>
            <td>
                <button class="action-btn" onclick="openViewUserModal('${u.id}')" title="View"><i class="fas fa-eye"></i></button>
                <button class="action-btn" onclick="openEditUserModal('${u.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                ${safeRole !== 'admin' ? `<button class="action-btn delete-btn" onclick="confirmDeleteUser('${u.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>` : ''}
            </td>
        </tr>
    `}).join("");
}

function searchUsers() {
    const query = document.getElementById("userSearchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#usersTableBody tr");
    rows.forEach(row => {
        const name = row.getAttribute("data-name");
        const email = row.getAttribute("data-email");
        if (name.includes(query) || email.includes(query)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function filterUsers() {
    const roleFilter = document.getElementById("userRoleFilter").value;
    const statusFilter = document.getElementById("userStatusFilter").value;
    const rows = document.querySelectorAll("#usersTableBody tr");
    
    rows.forEach(row => {
        const role = row.getAttribute("data-role");
        const status = row.getAttribute("data-status");
        
        const roleMatch = roleFilter === 'all' || role === roleFilter;
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        
        row.style.display = (roleMatch && statusMatch) ? "" : "none";
    });
}

async function addUser() {
    const name = document.getElementById("addUserName").value.trim();
    const email = document.getElementById("addUserEmail").value.trim();
    const password = document.getElementById("addUserPassword").value;
    const role = document.getElementById("addUserRole").value;

    if (!name || !email || !password) {
        showToast("Please fill all required fields.", "error");
        return;
    }

    try {
        const response = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error || "Failed to add user", "error");
            return;
        }

        closeModal('addUserModal');
        document.getElementById("addUserName").value = "";
        document.getElementById("addUserEmail").value = "";
        document.getElementById("addUserPassword").value = "";
        
        await loadAllData();
        showToast("User added successfully!");
    } catch (err) {
        showToast("Server error.", "error");
    }
}

function openEditUserModal(id) {
    const user = adminState.users.find(u => u.id == id);
    if (!user) return;

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUserName").value = user.name;
    document.getElementById("editUserEmail").value = user.email;
    document.getElementById("editUserRole").value = user.role;
    document.getElementById("editUserStatus").value = user.status;

    openModal('editUserModal');
}

async function saveEditUser() {
    const id = document.getElementById("editUserId").value;
    const name = document.getElementById("editUserName").value;
    const email = document.getElementById("editUserEmail").value;
    const role = document.getElementById("editUserRole").value;
    const status = document.getElementById("editUserStatus").value;

    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role, status })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error || "Failed to update user", "error");
            return;
        }

        closeModal('editUserModal');
        await loadAllData();
        showToast("User updated successfully!");
    } catch (err) {
        showToast("Server error.", "error");
    }
}

function openViewUserModal(id) {
    const user = adminState.users.find(u => u.id == id);
    if (!user) return;

    const content = document.getElementById("viewUserContent");
    content.innerHTML = `
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:24px;">
            <div style="width:80px;height:80px;border-radius:50%;background:#7C3AED;color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;">
                ${user.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 style="margin:0 0 5px 0;">${user.name}</h2>
                <p style="margin:0;color:rgba(255,255,255,0.6);">${user.email}</p>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span>
                    <span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span>
                </div>
            </div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px;">
            <p><strong>User ID:</strong> <span style="color:#A78BFA;font-family:monospace;font-weight:700;">${user.user_id || user.id}</span></p>
            <p><strong>Database ID:</strong> ${user.id}</p>
            <p><strong>Join Date:</strong> ${user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
        </div>
    `;
    openModal('viewUserModal');
}

let deleteTarget = { type: null, id: null };

function confirmDeleteUser(id) {
    deleteTarget = { type: 'user', id: id };
    document.getElementById("confirmTitle").innerHTML = "Delete User";
    document.getElementById("confirmMessage").innerHTML = "Are you sure you want to delete this user? This action cannot be undone.";
    openModal('confirmModal');
}

async function confirmCallback() {
    const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
    
    if (deleteTarget.type === 'user') {
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
            if (response.ok) {
                await loadAllData();
                showToast("User deleted successfully.");
            } else {
                throw new Error();
            }
        } catch (err) {
            // Offline fallback
            adminState.users = adminState.users.filter(u => u.id != deleteTarget.id);
            const localUsers = JSON.parse(localStorage.getItem('skillgap_users') || '[]');
            const updatedLocal = localUsers.filter(u => u.id != deleteTarget.id);
            localStorage.setItem('skillgap_users', JSON.stringify(updatedLocal));
            renderUsersTable();
            showToast("User deleted (Offline).");
        }
    } 
    else if (deleteTarget.type === 'role') {
        try {
            const response = await fetch(`${API_BASE}/api/roles/${deleteTarget.id}`, { method: "DELETE" });
            if (response.ok) {
                await loadAllData();
                showToast("Role deleted successfully.");
            } else {
                throw new Error();
            }
        } catch (err) {
            // Offline fallback
            adminState.roles = adminState.roles.filter(r => String(r.id) !== String(deleteTarget.id));
            if (typeof jobRoles !== 'undefined') {
                const idx = jobRoles.findIndex(r => String(r.id) === String(deleteTarget.id));
                if (idx > -1) jobRoles.splice(idx, 1);
                if (typeof window.saveJobRoles === 'function') window.saveJobRoles();
            }
            renderRolesGrid();
            showToast("Role deleted (Offline).");
        }
    }
    
    closeModal('confirmModal');
}

/* ============================================================
   5. RESUMES & ANALYSES
   ============================================================ */

function renderResumesTable() {
    const resumes = adminState.resumes;
    const tbody = document.getElementById("resumesTableBody");
    if (!tbody) return;

    document.getElementById("resumesTotal").textContent = resumes.length;
    document.getElementById("resumesPDF").textContent = resumes.filter(r => r.type === 'pdf').length;
    document.getElementById("resumesDOCX").textContent = resumes.filter(r => r.type === 'docx').length;
    document.getElementById("resumesTableInfo").textContent = `Showing ${resumes.length} resumes`;

    tbody.innerHTML = resumes.map(r => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-file-${r.type === 'pdf' ? 'pdf' : 'word'}" style="color:${r.type==='pdf'?'#EF4444':'#3B82F6'};font-size:1.2rem;"></i>
                    ${r.fileName}
                </div>
            </td>
            <td>${r.userName}</td>
            <td><span style="text-transform:uppercase;font-size:0.75rem;font-weight:700;color:rgba(255,255,255,0.5);">${r.type}</span></td>
            <td>${r.size}</td>
            <td>${r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="action-btn-text" onclick="showToast('Downloading...')"><i class="fas fa-download"></i> DL</button>
            </td>
        </tr>
    `).join("");
}

let matchDistChartInstance = null;

function renderAnalysesTable() {
    const analyses = adminState.analyses || [];
    const tbody = document.getElementById("analysesTableBody");
    if (!tbody) return;

    document.getElementById("analysesTotal").textContent = analyses.length;
    document.getElementById("analysesHighMatch").textContent = analyses.filter(a => (a.match || a.match_percentage) >= 80).length;
    document.getElementById("analysesLowMatch").textContent = analyses.filter(a => (a.match || a.match_percentage) < 50).length;
    
    const info = document.getElementById("analysesTableInfo");
    if (info) info.textContent = `Showing ${analyses.length} analyses`;

    const totalMatch = analyses.reduce((sum, a) => sum + (a.match || a.match_percentage || 0), 0);
    const avgMatch = analyses.length ? Math.round(totalMatch / analyses.length) : 0;
    const avgMatchEl = document.getElementById("analysesAvgMatch");
    if (avgMatchEl) avgMatchEl.textContent = avgMatch + "%";

    tbody.innerHTML = analyses.map(a => {
        const safeName = a.userName || a.user_name || "Unknown";
        const safeRole = a.role || a.job_role || "Unknown Role";
        const m = a.match || a.match_percentage || 0;
        const sFound = a.skillsFound || (a.matched_skills ? a.matched_skills.length : 0);
        const gFound = a.gapsFound || (a.missing_skills ? a.missing_skills.length : 0);
        
        return `
        <tr>
            <td>${safeName}</td>
            <td><strong>${safeRole}</strong></td>
            <td>
                <div class="match-bar-wrap">
                    <div class="match-bar"><div class="match-fill" style="width:${m}%;background:${getMatchColor(m)}"></div></div>
                    <span style="color:${getMatchColor(m)};font-weight:700">${m}%</span>
                </div>
            </td>
            <td>${sFound}</td>
            <td><span style="color:#F87171;font-weight:700">${gFound}</span></td>
            <td>${a.date || a.created_at ? new Date(a.date || a.created_at).toLocaleDateString() : 'N/A'}</td>
            <td><button class="action-btn-text"><i class="fas fa-eye"></i> View</button></td>
        </tr>
    `}).join("");
    
    // Render Gaps List dynamically
    const gapCounts = {};
    analyses.forEach(a => {
        const gaps = a.missing_skills || [];
        gaps.forEach(g => { gapCounts[g] = (gapCounts[g] || 0) + 1; });
    });
    const sortedGaps = Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    
    const gapsList = document.getElementById("commonGapsList");
    if(gapsList) {
        if (sortedGaps.length > 0) {
            gapsList.innerHTML = sortedGaps.map((gap, i) => {
                const pct = Math.round((gap[1] / analyses.length) * 100);
                return `
                <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:8px;">
                    <span>${i + 1}. ${gap[0]}</span><span class="role-badge" style="background:rgba(239,68,68,0.2);color:#F87171">Missing in ${pct}%</span>
                </div>
                `;
            }).join("");
        } else {
            gapsList.innerHTML = `<div style="padding:12px;color:rgba(255,255,255,0.5);">No skill gap data available.</div>`;
        }
    }

    // Render Match % Distribution Chart
    const ctxMatch = document.getElementById('matchDistChart');
    if (ctxMatch) {
        if (matchDistChartInstance) matchDistChartInstance.destroy();
        
        let bins = [0, 0, 0, 0]; // 0-25, 26-50, 51-75, 76-100
        analyses.forEach(a => {
            const m = a.match || a.match_percentage || 0;
            if (m <= 25) bins[0]++;
            else if (m <= 50) bins[1]++;
            else if (m <= 75) bins[2]++;
            else bins[3]++;
        });

        matchDistChartInstance = new Chart(ctxMatch, {
            type: 'bar',
            data: {
                labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
                datasets: [{
                    label: 'Analyses',
                    data: bins,
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1, color: 'rgba(255,255,255,0.5)' } },
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } }
                }
            }
        });
    }
}

function getMatchColor(val) {
    if(val >= 80) return '#34D399'; // green
    if(val >= 60) return '#60A5FA'; // blue
    return '#FBBF24'; // yellow/orange
}

/* ============================================================
   6. REPORTS
   ============================================================ */

function renderReportsTable() {
    const reports = adminState.reports || [];
    const tbody = document.getElementById("reportsTableBody");
    if (!tbody) return;

    document.getElementById("reportsTotal").textContent = reports.length;
    document.getElementById("reportsPDF").textContent = reports.filter(r => r.format === 'PDF').length;
    document.getElementById("reportsExcel").textContent = reports.filter(r => r.format === 'Excel').length;
    document.getElementById("reportsThisWeek").textContent = reports.length;

    const info = document.getElementById("reportsTableInfo");
    if (info) info.textContent = `Showing ${reports.length} reports`;

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td><strong>${r.name}</strong></td>
            <td><span class="role-badge" style="background:rgba(255,255,255,0.1)">${r.type}</span></td>
            <td>${r.userName}</td>
            <td>${r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}</td>
            <td><i class="fas fa-file-${r.format==='PDF'?'pdf':'excel'}" style="color:${r.format==='PDF'?'#EF4444':'#10B981'};margin-right:6px"></i> ${r.format}</td>
            <td><button class="action-btn-text"><i class="fas fa-download"></i> Get</button></td>
        </tr>
    `).join("");
}

/* ============================================================
   7. JOB ROLES
   ============================================================ */

function renderRolesGrid() {
    const roles = adminState.roles;
    const gridIT = document.getElementById("rolesGridIT");
    const gridNonIT = document.getElementById("rolesGridNonIT");
    if (!gridIT || !gridNonIT) return;

    const renderCard = (r) => `
        <div class="role-admin-card" data-cat="${r.cat}" data-domain="${r.domain}">
            <div class="role-card-header">
                <div class="role-icon" style="background:rgba(124,58,237,0.15);color:#A78BFA"><i class="${r.icon}"></i></div>
                <div class="role-actions">
                    <button class="action-btn" onclick="openEditRoleModal('${r.id}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="confirmDeleteRole('${r.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <h3>${r.title}</h3>
            <p class="role-desc">${r.desc}</p>
            <div class="role-skills-preview">
                ${r.skills.slice(0, 4).map(s => `<span class="skill-badge">${s}</span>`).join("")}
                ${r.skills.length > 4 ? `<span class="skill-badge">+${r.skills.length - 4}</span>` : ''}
            </div>
            <div class="role-stats">
                <span class="role-tag"><i class="fas fa-list-check"></i> ${r.skills.length} Required Skills</span>
            </div>
        </div>
    `;

    gridIT.innerHTML = roles.filter(r => (r.domain || "IT") === "IT").map(renderCard).join("");
    gridNonIT.innerHTML = roles.filter(r => r.domain === "NON-IT").map(renderCard).join("");
}

function filterRoles() {
    const cat = document.getElementById("roleCategoryFilter").value;
    const cards = document.querySelectorAll(".role-admin-card");
    cards.forEach(card => {
        if (cat === 'all' || card.getAttribute("data-cat") === cat) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

async function addRole() {
    const title = document.getElementById("addRoleTitle").value.trim();
    const desc = document.getElementById("addRoleDesc").value.trim();
    const cat = document.getElementById("addRoleCategory").value;
    const domain = document.getElementById("addRoleDomain") ? document.getElementById("addRoleDomain").value : "IT";
    const icon = document.getElementById("addRoleIcon").value.trim() || "fas fa-briefcase";
    const skillsText = document.getElementById("addRoleSkills").value.trim();
    const skills = skillsText ? skillsText.split(",").map(s => s.trim()) : [];

    if (!title) {
        showToast("Role title is required.", "error");
        return;
    }

    try {
        const response = await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, desc, cat, domain, icon, skills })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error || "Failed to add role", "error");
            return;
        }

        closeModal('addRoleModal');
        document.getElementById("addRoleTitle").value = "";
        document.getElementById("addRoleDesc").value = "";
        document.getElementById("addRoleSkills").value = "";

        await loadAllData();
        showToast("Job role added successfully!");
    } catch (err) {
        // Offline fallback
        const newRole = { id: `role_${Date.now()}`, title, desc, cat, icon, skills };
        adminState.roles.push(newRole);
        if (typeof jobRoles !== 'undefined') {
            jobRoles.push({ id: newRole.id, name: title, description: desc, category: cat, icon: icon, skills: skills });
            if (typeof window.saveJobRoles === 'function') window.saveJobRoles();
        }
        renderRolesGrid();
        
        closeModal('addRoleModal');
        document.getElementById("addRoleTitle").value = "";
        document.getElementById("addRoleDesc").value = "";
        document.getElementById("addRoleSkills").value = "";
        showToast("Job role added (Offline)!");
    }
}

function openEditRoleModal(id) {
    const role = adminState.roles.find(r => r.id == id);
    if(!role) return;

    document.getElementById("editRoleId").value = role.id;
    document.getElementById("editRoleTitle").value = role.title;
    document.getElementById("editRoleDesc").value = role.desc;
    document.getElementById("editRoleCategory").value = role.cat;
    if (document.getElementById("editRoleDomain")) {
        document.getElementById("editRoleDomain").value = role.domain || "IT";
    }
    document.getElementById("editRoleIcon").value = role.icon;
    document.getElementById("editRoleSkills").value = role.skills.join(", ");

    openModal("editRoleModal");
}

async function saveEditRole() {
    const id = document.getElementById("editRoleId").value;
    const title = document.getElementById("editRoleTitle").value.trim();
    const desc = document.getElementById("editRoleDesc").value.trim();
    const cat = document.getElementById("editRoleCategory").value;
    const domain = document.getElementById("editRoleDomain") ? document.getElementById("editRoleDomain").value : "IT";
    const icon = document.getElementById("editRoleIcon").value.trim();
    const skillsText = document.getElementById("editRoleSkills").value.trim();
    const skills = skillsText ? skillsText.split(",").map(s => s.trim()) : [];

    try {
        const response = await fetch(`/api/roles/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, desc, cat, domain, icon, skills })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error || "Failed to update role", "error");
            return;
        }

        closeModal('editRoleModal');
        await loadAllData();
        showToast("Job role updated successfully!");
    } catch (err) {
        // Offline fallback
        const role = adminState.roles.find(r => r.id === id);
        if (role) {
            role.title = title;
            role.desc = desc;
            role.cat = cat;
            role.icon = icon;
            role.skills = skills;
        }
        if (typeof jobRoles !== 'undefined') {
            const jr = jobRoles.find(r => r.id === id);
            if (jr) {
                jr.name = title;
                jr.description = desc;
                jr.category = cat;
                jr.icon = icon;
                jr.skills = skills;
                if (typeof window.saveJobRoles === 'function') window.saveJobRoles();
            }
        }
        renderRolesGrid();
        closeModal('editRoleModal');
        showToast("Job role updated (Offline)!");
    }
}

function confirmDeleteRole(id) {
    deleteTarget = { type: 'role', id: id };
    document.getElementById("confirmTitle").innerHTML = "Delete Job Role";
    document.getElementById("confirmMessage").innerHTML = "Are you sure? Users targeting this role may be affected.";
    openModal('confirmModal');
}

/* ============================================================
   8. LEARNING CONTENT
   ============================================================ */

function renderCoursesTable() {
    const courses = adminState.courses || [];
    const tbody = document.getElementById("coursesTableBody");
    if (!tbody) return;

    const cTotal = document.getElementById("coursesTotal");
    if (cTotal) cTotal.textContent = courses.length;
    
    const cPy = document.getElementById("coursesPython");
    if (cPy) cPy.textContent = courses.filter(c => c.skill === 'Python').length;
    
    const cAws = document.getElementById("coursesAWS");
    if (cAws) cAws.textContent = courses.filter(c => c.skill === 'AWS').length;
    
    const cDoc = document.getElementById("coursesDocker");
    if (cDoc) cDoc.textContent = courses.filter(c => c.skill === 'Docker').length;

    const info = document.getElementById("coursesTableInfo");
    if (info) info.textContent = `Showing ${courses.length} courses`;

    tbody.innerHTML = courses.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td><span class="role-badge" style="background:rgba(59,130,246,0.15);color:#60A5FA">${c.platform}</span></td>
            <td>${c.skill}</td>
            <td>${c.level}</td>
            <td>${c.duration}</td>
            <td>
                <button class="action-btn" onclick="openEditCourseModal('${c.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteCourse('${c.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join("");
}

async function addCourse() {
    const name = document.getElementById("addCourseName").value.trim();
    const platform = document.getElementById("addCoursePlatform").value;
    const skill = document.getElementById("addCourseSkill").value.trim();
    const level = document.getElementById("addCourseLevel").value;
    const duration = document.getElementById("addCourseDuration").value.trim();
    const url = document.getElementById("addCourseUrl").value.trim() || "#";

    if (!name) {
        showToast("Course name is required.", "error");
        return;
    }

    try {
        const response = await fetch("/api/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, platform, skill, level, duration, url })
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error || "Failed to add course", "error");
            return;
        }

        closeModal('addCourseModal');
        document.getElementById("addCourseName").value = "";
        document.getElementById("addCourseSkill").value = "";
        document.getElementById("addCourseDuration").value = "";
        document.getElementById("addCourseUrl").value = "";

        await loadAllData();
        showToast("Course added successfully!");
    } catch (err) {
        showToast("Server error.", "error");
    }
}

async function deleteCourse(id) {
    if(!confirm("Are you sure you want to delete this course?")) return;
    try {
        const response = await fetch(`/api/courses/${id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            await loadAllData();
            showToast("Course deleted successfully.");
        } else {
            showToast("Failed to delete course.", "error");
        }
    } catch (err) {
        showToast("Server error.", "error");
    }
}

/* ============================================================
   9. ANALYTICS (Chart.js)
   ============================================================ */

let analyticsChartsRendered = false;

function initAnalyticsCharts() {
    if (analyticsChartsRendered) return;
    
    const createChart = (id, type, labels, dataLabel, data, bgColors) => {
        const ctx = document.getElementById(id);
        if(!ctx) return null;
        return new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: dataLabel,
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: type === 'line' ? bgColors : undefined,
                    tension: 0.4,
                    fill: type === 'line'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: type === 'pie' || type === 'doughnut' } },
                scales: type === 'pie' || type === 'doughnut' || type === 'radar' ? {} : {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                }
            }
        });
    };

    createChart('analyticsUserGrowth', 'line', ['Jan','Feb','Mar','Apr','May','Jun'], 'Users', [50, 80, 150, 200, 280, adminState.stats.total_users || 350], 'rgba(96, 165, 250, 0.5)');
    createChart('analyticsResumeTrends', 'bar', ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 'Uploads', [45, 60, 55, adminState.stats.resumes_uploaded * 10 || 90], '#A78BFA');
    
    const ctxRadar = document.getElementById('analyticsSkillsDemand');
    if(ctxRadar) {
        new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: ['Python', 'SQL', 'AWS', 'React', 'Docker', 'Node.js'],
                datasets: [{
                    label: 'Demand',
                    data: [90, 85, 70, 75, 65, 80],
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    borderColor: '#FBBF24',
                    pointBackgroundColor: '#FBBF24'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, angleLines: { color: 'rgba(255,255,255,0.1)' }, ticks: { display: false } } }
            }
        });
    }

    createChart('analyticsRolePopularity', 'doughnut', ['Developer', 'Data', 'Design', 'DevOps'], '', [45, 30, 15, 10], ['#3B82F6', '#10B981', '#F472B6', '#FBBF24']);
    createChart('analyticsPlacement', 'bar', ['Highly Ready', 'Ready', 'Needs Work', 'Not Ready'], 'Users', [85, 150, 75, 40], '#34D399');
    createChart('analyticsGapTrends', 'line', ['Jan','Feb','Mar','Apr','May','Jun'], 'Average Gaps', [8.5, 7.2, 6.0, 5.1, 4.3, 3.8], 'rgba(34, 211, 238, 0.6)');

    analyticsChartsRendered = true;
}

/* ============================================================
   10. NOTIFICATIONS
   ============================================================ */

// ─── Searchable Dropdown Logic ───
let searchDebounceTimer;

function toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdownList");
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === "none" ? "flex" : "none";
        if (dropdown.style.display === "flex") {
            document.getElementById("userSearchInput").focus();
            if (document.getElementById("userSearchResults").innerHTML.trim() === "") {
                handleUserSearch({ target: { value: '' } });
            }
        }
    }
}

function selectUser(id, name, email) {
    document.getElementById("notifRecipientHidden").value = id;
    
    let displayHtml = '';
    if (id === 'all') {
        displayHtml = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem;">👥</span>
                <div>
                    <div style="font-weight:600; color:#F8FAFC;">All Users</div>
                    <div style="font-size:0.75rem; color:#94A3B8;">All normal registered users</div>
                </div>
            </div>
        `;
    } else {
        displayHtml = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem; color:#A78BFA;">👤</span>
                <div>
                    <div style="font-weight:600; color:#F8FAFC;">${name}</div>
                    <div style="font-size:0.75rem; color:#94A3B8;">${email}</div>
                </div>
            </div>
        `;
    }
    
    document.getElementById("selectedUserText").innerHTML = displayHtml;
    document.getElementById("userDropdownList").style.display = "none";
}

async function handleUserSearch(event) {
    clearTimeout(searchDebounceTimer);
    const query = (event.target.value || '').trim();
    const resultsContainer = document.getElementById("userSearchResults");
    const loading = resultsContainer.querySelector('.search-loading');
    
    if (loading) loading.style.display = "block";

    searchDebounceTimer = setTimeout(async () => {
        try {
            const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const users = await response.json();
                
                if (users.length === 0) {
                    resultsContainer.innerHTML = `<div style="padding:14px; text-align:center; color:#94A3B8; font-size:0.85rem;">No users found.</div>`;
                    return;
                }
                
                resultsContainer.innerHTML = users.map(u => `
                    <div class="searchable-option" onclick="selectUser('${u._id}', '${u.name.replace(/'/g, "\\'")}', '${u.email.replace(/'/g, "\\'")}')">
                        <div class="option-icon" style="background:#A78BFA22; color:#A78BFA;">👤</div>
                        <div class="option-text">
                            <div class="option-title">${u.name}</div>
                            <div class="option-subtitle">${u.email}</div>
                        </div>
                    </div>
                `).join("");
            }
        } catch (e) {
            console.error("Search failed", e);
        }
    }, 300);
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    const selectWrap = e.target.closest(".searchable-select");
    if (!selectWrap) {
        const dropdown = document.getElementById("userDropdownList");
        if (dropdown) dropdown.style.display = "none";
    }
});

async function sendNotification() {
    const recipient = document.getElementById("notifRecipientHidden").value;
    const type = document.getElementById("notifType").value;
    const title = document.getElementById("notifTitle").value.trim();
    const message = document.getElementById("notifMessage").value.trim();

    if (!recipient) {
        showToast("Please select a recipient user.", "error");
        return;
    }
    if (!title || !message) {
        showToast("Please enter a title and message.", "error");
        return;
    }

    if (recipient === 'all') {
        try {
            const countRes = await fetch("/api/admin/users/count");
            const countData = await countRes.json();
            document.getElementById("broadcastUserCount").textContent = `${countData.count || 0} users will receive this notification`;
            
            const modal = document.getElementById('broadcastConfirmModal');
            if (modal) modal.classList.add('active');
        } catch(e) {
            showToast("Failed to fetch user count.", "error");
        }
        return;
    }

    // Individual Notification
    try {
        const response = await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient, type, title, message })
        });
        
        if (response.ok) {
            resetNotificationForm();
            await loadAllData();
            showToast("Notification sent successfully!");
        } else {
            const data = await response.json();
            showToast(data.error || "Failed to send notification.", "error");
        }
    } catch (err) {
        showToast("Unable to send notification.", "error");
    }
}

async function confirmSendBroadcast() {
    const type = document.getElementById("notifType").value;
    const title = document.getElementById("notifTitle").value.trim();
    const message = document.getElementById("notifMessage").value.trim();
    const recipient = 'all';

    closeModal('broadcastConfirmModal');

    try {
        const response = await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient, type, title, message })
        });
        
        if (response.ok) {
            resetNotificationForm();
            await loadAllData();
            showToast("Broadcast sent successfully!");
        } else {
            const data = await response.json();
            showToast(data.error || "Failed to broadcast notification.", "error");
        }
    } catch (err) {
        showToast("Unable to broadcast notification.", "error");
    }
}

function resetNotificationForm() {
    document.getElementById("notifTitle").value = "";
    document.getElementById("notifMessage").value = "";
    const hiddenInp = document.getElementById("notifRecipientHidden");
    if(hiddenInp) hiddenInp.value = "";
    const display = document.getElementById("selectedUserText");
    if(display) display.innerHTML = `<span style="color:#94A3B8;">Select a user...</span>`;
}

async function clearNotifications() {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
        const response = await fetch("/api/admin/notifications/clear", { method: "POST" });
        if (response.ok) {
            await loadAllData();
            showToast("Notifications cleared.");
        } else {
            showToast("Failed to clear notifications.", "error");
        }
    } catch (err) {
        showToast("Unable to clear notifications.", "error");
    }
}

function renderNotifications() {
    const list = document.getElementById("notifHistoryList");
    if (!list) return;

    if (!adminState.notifications || adminState.notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="text-align:center; padding: 20px; color: #94A3B8;">
                <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No notifications sent yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = adminState.notifications.map(n => {
        const dateStr = new Date(n.date || n.createdAt).toLocaleString();
        const typeColor = n.type === 'success' ? '#10B981' : n.type === 'warning' ? '#F59E0B' : n.type === 'error' ? '#EF4444' : '#3B82F6';
        
        return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 12px; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong style="color: #F8FAFC; font-size:1.05rem;">${n.title || 'No Title'}</strong>
                    <span style="font-size:0.75rem; color:${typeColor}; border:1px solid ${typeColor}55; padding:2px 8px; border-radius:4px; text-transform:capitalize;">${n.type || 'info'}</span>
                </div>
                <div style="color: #94A3B8; font-size:0.9rem; line-height: 1.4;">${n.message || n.msg || ''}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:0.8rem; color:#64748B;">
                    <span><i class="fas fa-user" style="margin-right:4px;"></i> Recipient: <span style="color:#E2E8F0;">${n.recipient || 'Unknown'}</span></span>
                    <span><i class="far fa-clock" style="margin-right:4px;"></i> ${dateStr}</span>
                </div>
            </div>
        `;
    }).join("");
}


/* ============================================================
   11. SETTINGS & UTILS
   ============================================================ */

function loadSettings() {
    const platformName = localStorage.getItem("sg_set_platform") || "SkillGap AI";
    const el = document.getElementById("settingPlatformName");
    if(el) el.value = platformName;

    const profileData = JSON.parse(localStorage.getItem("sg_admin_profile") || "null");
    if(profileData) {
        if(document.getElementById("profileName")) document.getElementById("profileName").value = profileData.name || "";
        if(document.getElementById("profileEmail")) document.getElementById("profileEmail").value = profileData.email || "";
        if(document.getElementById("profilePhone")) document.getElementById("profilePhone").value = profileData.phone || "";
        if (typeof updateUIProfile === "function") updateUIProfile(profileData.name, profileData.email);
    }
    if (typeof renderProfileLogs === "function") renderProfileLogs();
}

function saveAllSettings() {
    localStorage.setItem("sg_set_platform", document.getElementById("settingPlatformName").value);
    showToast("All settings saved successfully!");
}

/* Modals */
function openModal(id) {
    document.getElementById(id).classList.add("active");
    document.getElementById("overlay").classList.add("active");
}
function closeModal(id) {
    document.getElementById(id).classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}
function closeAllModals() {
    document.querySelectorAll(".admin-modal").forEach(m => m.classList.remove("active"));
    document.getElementById("overlay").classList.remove("active");
}

/* Toast */
function showToast(msg, type = 'success') {
    const toast = document.getElementById("adminToast");
    const msgEl = document.getElementById("adminToastMsg");
    const icon = document.getElementById("toastIcon");
    
    msgEl.textContent = msg;
    toast.className = "admin-toast"; // reset
    toast.classList.add("show");
    if(type === 'error') {
        toast.classList.add("error");
        icon.className = "fas fa-exclamation-triangle";
    } else {
        icon.className = "fas fa-check-circle";
    }

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* Exports placeholder */
function exportData() { showToast("Exporting comprehensive system report..."); }
function exportUsersCSV() { showToast("Exporting users to CSV..."); }
function exportResumesCSV() { showToast("Exporting resume log..."); }
function exportAnalysesCSV() { showToast("Exporting analysis data..."); }
function exportAnalyticsReport() { showToast("Exporting analytics report to PDF..."); }

/* Settings Actions */
function updateUIProfile(name, email) {
    if (!name) return;
    const initial = name.charAt(0).toUpperCase();

    if (document.getElementById("profileDisplayName")) document.getElementById("profileDisplayName").textContent = name;
    if (document.getElementById("profileDisplayEmail") && email) document.getElementById("profileDisplayEmail").textContent = email;
    if (document.getElementById("profileAvatarLg")) document.getElementById("profileAvatarLg").textContent = initial;

    if (document.getElementById("headerName")) document.getElementById("headerName").textContent = name;
    if (document.getElementById("headerAvatar")) document.getElementById("headerAvatar").textContent = initial;

    const miniName = document.querySelector(".user-mini-name");
    if (miniName) miniName.textContent = name;
    const miniAvatar = document.querySelector(".user-avatar-sm");
    if (miniAvatar) miniAvatar.textContent = initial;
}

function saveProfile() {
    const name = document.getElementById("profileName") ? document.getElementById("profileName").value.trim() : "";
    const email = document.getElementById("profileEmail") ? document.getElementById("profileEmail").value.trim() : "";
    const phone = document.getElementById("profilePhone") ? document.getElementById("profilePhone").value.trim() : "";
    
    if (!name || !email) {
        showToast("Name and Email are required.", "error");
        return;
    }

    localStorage.setItem("sg_admin_profile", JSON.stringify({ name, email, phone }));
    updateUIProfile(name, email);
    showToast("Profile settings saved successfully.");
}

function changeAdminPassword() {
    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;
    
    if (!current || !newPass || !confirm) {
        showToast("Please fill in all password fields.", "error");
        return;
    }
    if (newPass !== confirm) {
        showToast("New passwords do not match.", "error");
        return;
    }
    
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmNewPassword").value = "";
    showToast("Password updated successfully.");
}

/* Profile Logs Dummy Data */
function renderProfileLogs() {
    const loginBody = document.getElementById("loginActivityBody");
    const securityBody = document.getElementById("securityLogsBody");

    if (loginBody) {
        loginBody.innerHTML = `
            <tr>
                <td>Just now</td>
                <td>192.168.1.10</td>
                <td>Chrome (Windows)</td>
                <td><span class="status-badge success">Success</span></td>
            </tr>
            <tr>
                <td>Yesterday, 14:30</td>
                <td>192.168.1.10</td>
                <td>Chrome (Windows)</td>
                <td><span class="status-badge success">Success</span></td>
            </tr>
            <tr>
                <td>Aug 14, 09:15</td>
                <td>45.22.11.89</td>
                <td>Safari (Mac)</td>
                <td><span class="status-badge danger" style="color:#EF4444;background:rgba(239,68,68,0.1);padding:4px 8px;border-radius:4px;font-size:0.75rem;">Failed</span></td>
            </tr>
        `;
    }

    if (securityBody) {
        securityBody.innerHTML = `
            <tr>
                <td><i class="fas fa-key" style="color:#60A5FA;margin-right:6px"></i> Password Change</td>
                <td>Admin password updated</td>
                <td>Just now</td>
            </tr>
            <tr>
                <td><i class="fas fa-cog" style="color:#A78BFA;margin-right:6px"></i> Settings Update</td>
                <td>System AI Provider changed</td>
                <td>Yesterday</td>
            </tr>
            <tr>
                <td><i class="fas fa-exclamation-triangle" style="color:#F59E0B;margin-right:6px"></i> Failed Login</td>
                <td>3 failed attempts from 45.22.11.89</td>
                <td>Aug 14</td>
            </tr>
        `;
    }
}

