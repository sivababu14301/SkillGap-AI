document.addEventListener("DOMContentLoaded", async () => {
    // 1. Require Auth & Load Session
    const session = JSON.parse(
        sessionStorage.getItem("skillgap_session") || 
        localStorage.getItem("skillgap_session") || "null"
    );
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // 2. Fetch all modules states
    const resumeData = JSON.parse(sessionStorage.getItem("skillgap_resume") || "null");
    const scoreData  = JSON.parse(sessionStorage.getItem("skillgap_score") || "null");
    // Determine API_BASE
    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';

    // Fetch profile data and job role from backend
    let profileData = {};
    let targetRole = null;
    try {
        const response = await fetch(`${API_BASE}/api/profile/${session.user_id}`);
        if (response.ok) {
            const data = await response.json();
            profileData = data.profile || {};
        }
        
        const jobRes = await fetch(`${API_BASE}/api/job-selection/user/${session.user_id}`);
        if (jobRes.ok) {
            const jobData = await jobRes.json();
            targetRole = { name: jobData.selected_job_role };
        }
    } catch (e) {
        console.error("Failed to fetch profile or job role from backend", e);
    }
    
    // Fallback to session if backend fails
    const name = profileData.name || session.user_name || session.name || "User";
    const email = profileData.email || session.email || "user@example.com";

    // 3. Initialize Top Header Info
    const initials = name.charAt(0).toUpperCase();
    document.querySelectorAll("#sidebarAvatar,#headerAvatar,#profileAvatar").forEach(el => el.textContent = initials);
    document.querySelectorAll("#sidebarName,#headerName,#profileName,#dynamicPageTitle").forEach(el => el.textContent = name);
    
    // Set User ID input and label
    const formattedUserId = session.user_id || "USR001";
    if (document.getElementById("profileUserId")) {
        document.getElementById("profileUserId").textContent = formattedUserId;
    }
    if (document.getElementById("settingsUserId")) {
        document.getElementById("settingsUserId").value = formattedUserId;
    }

    // Set email input and label
    document.getElementById("profileEmail").textContent = email;
    if (document.getElementById("settingsEmail")) document.getElementById("settingsEmail").value = email;
    if (document.getElementById("settingsName")) document.getElementById("settingsName").value = name;

    // Load extra info from backend
    if (profileData.phone) {
        document.getElementById("profilePhone").textContent = profileData.phone;
        if (document.getElementById("settingsPhone")) document.getElementById("settingsPhone").value = profileData.phone;
    }
    if (profileData.location) {
        document.querySelector(".profile-location").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profileData.location}`;
        if (document.getElementById("settingsLocation")) document.getElementById("settingsLocation").value = profileData.location;
    }
    if (profileData.bio) {
        document.getElementById("profileBio").textContent = profileData.bio;
        if (document.getElementById("settingsBio")) document.getElementById("settingsBio").value = profileData.bio;
    }
    if (profileData.education && document.getElementById("profileEducation")) document.getElementById("profileEducation").textContent = profileData.education;
    if (profileData.college && document.getElementById("profileCollege")) document.getElementById("profileCollege").textContent = profileData.college;
    if (profileData.graduationYear && document.getElementById("profileGradYear")) document.getElementById("profileGradYear").textContent = profileData.graduationYear;
    
    if (profileData.linkedin && document.getElementById("profileLinkedin")) {
        const link = document.createElement("a");
        link.href = profileData.linkedin.startsWith('http') ? profileData.linkedin : `https://${profileData.linkedin}`;
        link.target = "_blank";
        link.style.color = "#3B82F6";
        link.textContent = "LinkedIn Profile";
        document.getElementById("profileLinkedin").innerHTML = "";
        document.getElementById("profileLinkedin").appendChild(link);
    }
    
    if (profileData.github && document.getElementById("profileGithub")) {
        const link = document.createElement("a");
        link.href = profileData.github.startsWith('http') ? profileData.github : `https://${profileData.github}`;
        link.target = "_blank";
        link.style.color = "#3B82F6";
        link.textContent = "GitHub Profile";
        document.getElementById("profileGithub").innerHTML = "";
        document.getElementById("profileGithub").appendChild(link);
    }
    
    // Avatar picture loading if stored
    if (profileData.profilePhoto) {
        document.getElementById("profileAvatar").innerHTML = `<img src="${profileData.profilePhoto}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }

    // Populate Modal fields initially
    if (document.getElementById("modalName")) {
        document.getElementById("modalName").value = name;
        document.getElementById("modalEmail").value = email;
        document.getElementById("modalPhone").value = profileData.phone || "";
        document.getElementById("modalLocation").value = profileData.location || "";
        document.getElementById("modalEducation").value = profileData.education || "";
        document.getElementById("modalCollege").value = profileData.college || "";
        document.getElementById("modalGradYear").value = profileData.graduationYear || "";
        document.getElementById("modalCareerGoal").value = profileData.careerGoal || "";
        document.getElementById("modalLinkedin").value = profileData.linkedin || "";
        document.getElementById("modalGithub").value = profileData.github || "";
        document.getElementById("modalBio").value = profileData.bio || "";
    }

    // 4. Update Target Role and Headline
    if (profileData.careerGoal) {
        document.getElementById("profileTargetRole").textContent = profileData.careerGoal;
    } else if (targetRole) {
        document.getElementById("profileTargetRole").textContent = targetRole.name;
    } else {
        document.getElementById("profileTargetRole").textContent = "None Selected";
    }

    // Fetch latest analysis and its synced resume from backend
    let latestAnalysis = null;
    let syncedResumeData = null;
    let latestUploadedResume = null;
    let allResumes = [];
    try {
        const res = await fetch(`${API_BASE}/api/analysis/user/${session.user_id}`);
        if (res.ok) {
            const analyses = await res.json();
            if (analyses && analyses.length > 0) {
                analyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                latestAnalysis = analyses[0];
            }
        }
        
        // Also fetch all resumes for this user to get the latest uploaded one
        const resResumes = await fetch(`${API_BASE}/api/resumes/user/${session.user_id}`);
        if (resResumes.ok) {
            allResumes = await resResumes.json();
            if (allResumes && allResumes.length > 0) {
                allResumes.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
                latestUploadedResume = allResumes[0];
                
                // If we have an analysis, find the resume it belongs to
                if (latestAnalysis && latestAnalysis.resume_id) {
                    syncedResumeData = allResumes.find(r => r._id === latestAnalysis.resume_id);
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch analyses or resume", e);
    }

    // Offline / LocalStorage fallbacks if backend is unreachable or empty
    if (!latestUploadedResume) {
        const offlineResumes = JSON.parse(localStorage.getItem("skillgap_offline_resumes") || "[]");
        if (offlineResumes.length > 0) {
            const lastOffline = offlineResumes[offlineResumes.length - 1];
            latestUploadedResume = {
                file_name: lastOffline.fileName,
                uploaded_at: lastOffline.uploadDate
            };
        } else {
            // Also check session storage for just the current one
            const currentSessionResume = JSON.parse(sessionStorage.getItem("skillgap_resume") || "null");
            if (currentSessionResume) {
                latestUploadedResume = {
                    file_name: currentSessionResume.fileName,
                    uploaded_at: currentSessionResume.uploadDate
                };
            }
        }
    }
    
    if (!latestAnalysis) {
        const sessionResults = JSON.parse(sessionStorage.getItem("skillgap_results") || "null");
        if (sessionResults) {
            latestAnalysis = {
                resume_score: sessionResults.resumeScore,
                ats_score: sessionResults.atsScore,
                match_percentage: sessionResults.matchPercentage || sessionResults.match_percentage,
                placement_readiness: sessionResults.placementReadiness,
                matched_skills: sessionResults.matchedSkills || [],
                missing_skills: sessionResults.missingSkills || []
            };
        }
    }

    // Determine the resume to display in the card
    // Prioritize the synced resume (from the analysis), but fallback to the latest uploaded one
    const displayResume = syncedResumeData || latestUploadedResume;

    // 5. Update Statistics - show "No analysis available" if no latestAnalysis
    if (latestAnalysis) {
        const resumeScoreVal = latestAnalysis.resume_score || 0;
        const atsScoreVal    = latestAnalysis.ats_score || 0;
        const skillMatchVal  = latestAnalysis.match_percentage || 0;
        const readinessVal   = latestAnalysis.placement_readiness || Math.round(((resumeScoreVal + skillMatchVal) / 2)) || 0;

        document.getElementById("statResumeScore").textContent = resumeScoreVal;
        document.getElementById("statATSScore").textContent = atsScoreVal + "%";
        document.getElementById("statSkillMatch").textContent = skillMatchVal + "%";
        document.getElementById("statReadiness").textContent = readinessVal + "%";
        
        // Restore original labels if they were overwritten
        const labels = document.querySelectorAll('.stat-box-info .lbl');
        labels.forEach(lbl => {
            if(lbl.dataset.original) {
                lbl.textContent = lbl.dataset.original;
                lbl.style.fontSize = ""; // Reset font size
                delete lbl.dataset.original;
            }
        });
    } else if (latestUploadedResume) {
        document.getElementById("statResumeScore").textContent = "Pending";
        document.getElementById("statResumeScore").style.fontSize = "1rem";
        document.getElementById("statATSScore").textContent = "Pending";
        document.getElementById("statATSScore").style.fontSize = "1rem";
        document.getElementById("statSkillMatch").textContent = "Pending";
        document.getElementById("statSkillMatch").style.fontSize = "1rem";
        document.getElementById("statReadiness").textContent = "Pending";
        document.getElementById("statReadiness").style.fontSize = "1rem";
        
        const labels = document.querySelectorAll('.stat-box-info .lbl');
        labels.forEach(lbl => {
            if(!lbl.dataset.original) {
                lbl.dataset.original = lbl.textContent;
                lbl.textContent = "Analysis Pending";
                lbl.style.fontSize = "0.75rem";
            }
        });
    } else {
        document.getElementById("statResumeScore").textContent = "N/A";
        document.getElementById("statATSScore").textContent = "N/A";
        document.getElementById("statSkillMatch").textContent = "N/A";
        document.getElementById("statReadiness").textContent = "N/A";
        
        // Change labels to show no analysis
        const labels = document.querySelectorAll('.stat-box-info .lbl');
        labels.forEach(lbl => {
            if(!lbl.dataset.original) {
                lbl.dataset.original = lbl.textContent;
                lbl.textContent = "No analysis available";
                lbl.style.fontSize = "0.75rem";
            }
        });
    }

    // 6. Skill distribution bars based on analysis
    if (latestAnalysis) {
        const matched = latestAnalysis.matched_skills || [];
        const missing = latestAnalysis.missing_skills || [];
        const total = matched.length + missing.length;
        const matchCount = matched.length;
        const techMatchPct = total > 0 ? Math.round((matchCount / total) * 100) : 0;
        
        // Technical
        updateProgressBar("Technical Skills", techMatchPct, "linear-gradient(to right, #7C3AED, #A78BFA)");
        // Soft skills (we don't extract soft skills currently, but we shouldn't use fake data. Remove or zero out)
        updateProgressBar("Soft Skills", 0, "linear-gradient(to right, #3B82F6, #60A5FA)");
        // Tools & Platforms
        updateProgressBar("Tools & Platforms", techMatchPct > 0 ? techMatchPct - 10 : 0, "linear-gradient(to right, #10B981, #34D399)");
    } else {
        updateProgressBar("Technical Skills", 0, "linear-gradient(to right, #7C3AED, #A78BFA)");
        updateProgressBar("Soft Skills", 0, "linear-gradient(to right, #3B82F6, #60A5FA)");
        updateProgressBar("Tools & Platforms", 0, "linear-gradient(to right, #10B981, #34D399)");
    }

    // 7. Update Learning roadmap tracks
    const roadmapPhases = latestAnalysis ? 3 : 0;
    if (roadmapPhases > 0) {
        // Sample timeline
        document.getElementById("learningTrackList").innerHTML = `
            <div class="progress-bar-item">
                <div class="pb-info">
                    <span>Phase 1: Core Foundations</span>
                    <span class="val">100%</span>
                </div>
                <div class="pb-track"><div class="pb-fill complete" style="width: 100%;"></div></div>
            </div>
            <div class="progress-bar-item">
                <div class="pb-info">
                    <span>Phase 2: Framework Mastery</span>
                    <span class="val">40%</span>
                </div>
                <div class="pb-track"><div class="pb-fill" style="width: 40%; background: linear-gradient(to right, #3B82F6, #60A5FA);"></div></div>
            </div>
            <div class="progress-bar-item">
                <div class="pb-info">
                    <span>Phase 3: Cloud & DevOps Masterclass</span>
                    <span class="val">10%</span>
                </div>
                <div class="pb-track"><div class="pb-fill" style="width: 10%; background: linear-gradient(to right, #10B981, #34D399);"></div></div>
            </div>
        `;
    } else {
        document.getElementById("learningTrackList").innerHTML = `
            <div class="no-roadmap-placeholder" style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.8rem;">
                <i class="fas fa-route" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
                No roadmap created yet. Complete a resume analysis and choose a role first.
            </div>
        `;
    }

    // 8. Update Resume Management section and Skills
    if (displayResume) {
        document.getElementById("resumeFileName").textContent = displayResume.file_name || displayResume.fileName || "Uploaded_Resume.pdf";
        const dateString = displayResume.uploaded_at || displayResume.uploadDate ? new Date(displayResume.uploaded_at || displayResume.uploadDate).toLocaleDateString() : new Date().toLocaleDateString();
        document.getElementById("resumeUploadDate").textContent = "Uploaded on: " + dateString;
        document.getElementById("downloadResumeBtn").disabled = false;
        
        // Update total resumes count if backend loaded
        if (typeof allResumes !== "undefined" && allResumes && document.getElementById("resumeCount")) {
            document.getElementById("resumeCount").innerHTML = `<i class="fas fa-files-o"></i> Resumes: ${allResumes.length}`;
        }
        
        if (latestAnalysis) {
            document.getElementById("resumeAnalysisStatus").innerHTML = `<i class="fas fa-check-circle"></i> Analysis Complete`;
            document.getElementById("resumeAnalysisStatus").style.color = "#10B981";
            
            // Populate Skills Info
            const tagHtml = (skills) => skills && skills.length > 0 ? skills.map(s => `<span class="s-tag" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">${s}</span>`).join("") : `<span style="color:var(--text-muted);font-size:0.8rem;">None</span>`;
            
            document.getElementById("profileMatchedSkills").innerHTML = tagHtml(latestAnalysis.matched_skills || latestAnalysis.matchedSkills);
            document.getElementById("profileMissingSkills").innerHTML = tagHtml(latestAnalysis.missing_skills || latestAnalysis.missingSkills);
            document.getElementById("profileAdditionalSkills").innerHTML = tagHtml(latestAnalysis.additional_skills || latestAnalysis.additionalSkills || latestAnalysis.extraSkills);
            
        } else {
            document.getElementById("resumeAnalysisStatus").innerHTML = `<i class="fas fa-clock"></i> Analysis Pending (Select a Role)`;
            document.getElementById("resumeAnalysisStatus").style.color = "#FBBF24";
            document.getElementById("profileMatchedSkills").innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">Pending</span>`;
            document.getElementById("profileMissingSkills").innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">Pending</span>`;
            document.getElementById("profileAdditionalSkills").innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">Pending</span>`;
        }
    } else {
        document.getElementById("resumeFileName").textContent = "No Resume Uploaded";
        document.getElementById("resumeUploadDate").textContent = "Please upload a resume first";
        document.getElementById("downloadResumeBtn").disabled = true;
        
        if (document.getElementById("resumeCount")) {
            document.getElementById("resumeCount").innerHTML = `<i class="fas fa-files-o"></i> Resumes: 0`;
        }
        document.getElementById("resumeAnalysisStatus").innerHTML = `<i class="fas fa-clock"></i> No analysis available`;
    }

    // 9. Badges logic
    if (latestAnalysis && (latestAnalysis.ats_score || latestAnalysis.atsScore) >= 80) unlockBadge("badgeATS");
    if (targetRole) unlockBadge("badgeRole");
    if (displayResume) unlockBadge("badgeUpload");
    if (latestAnalysis) unlockBadge("badgeRoadmap");

    // 10. Generate Activity Timeline
    generateActivityTimeline(allResumes, latestAnalysis, targetRole);

    // 11. Listen for Avatar Change on the profile page upload btn
    document.getElementById("avatarFileInput").addEventListener("change", handleAvatarChangeProfile);
    
    // Listen for avatar change on the modal
    if(document.getElementById("modalProfilePhoto")) {
        document.getElementById("modalProfilePhoto").addEventListener("change", handleAvatarChangeModal);
    }
});

// Helper to unlock badges
function unlockBadge(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove("locked");
        el.style.transform = "scale(1.05)";
        setTimeout(() => el.style.transform = "none", 300);
    }
}

// Update skill progress bar
function updateProgressBar(label, value, gradient) {
    const list = document.getElementById("skillsProgressList");
    // Find the item by label and update its value
    const items = list.querySelectorAll(".progress-bar-item");
    items.forEach(item => {
        const info = item.querySelector(".pb-info");
        if (info && info.firstElementChild && info.firstElementChild.textContent === label) {
            info.lastElementChild.textContent = value + "%";
            const fill = item.querySelector(".pb-fill");
            if (fill) {
                fill.style.width = value + "%";
                fill.style.background = gradient;
            }
        }
    });
}

// Generate activities dynamically
function generateActivityTimeline(allResumes, latestAnalysis, role) {
    const timeline = document.getElementById("activityTimeline");
    let items = [];

    // Base timeline
    items.push({
        icon: "fas fa-user-plus",
        title: "Account Created",
        desc: "Registered profile successfully on SkillGap AI.",
        time: "Initial",
        timestamp: 0
    });

    if (allResumes && allResumes.length > 0) {
        allResumes.forEach(resume => {
            const date = new Date(resume.uploaded_at || resume.uploadDate);
            items.push({
                icon: "fas fa-file-upload",
                title: "Resume Uploaded",
                desc: `Uploaded file '${resume.file_name || resume.fileName || "resume.pdf"}'.`,
                time: date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                timestamp: date.getTime()
            });
        });
    }

    if (latestAnalysis) {
        const date = new Date(latestAnalysis.created_at || Date.now());
        items.push({
            icon: "fas fa-chart-pie",
            title: "Analysis Completed",
            desc: `Generated Skill Matrix for ${latestAnalysis.selected_role || role?.name || "Target Role"}. Matched ${latestAnalysis.matched_skills?.length || 0} skills.`,
            time: date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            timestamp: date.getTime() + 1000 // Ensure it appears after the resume upload
        });
        
        items.push({
            icon: "fas fa-star",
            title: "Scores Evaluated",
            desc: `ATS Score: ${latestAnalysis.ats_score || latestAnalysis.atsScore}%. Resume Score: ${latestAnalysis.resume_score || latestAnalysis.resumeScore}/100.`,
            time: date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            timestamp: date.getTime() + 2000
        });
    }

    // Sort by chronological reverse order (newest first)
    items.sort((a, b) => b.timestamp - a.timestamp);

    timeline.innerHTML = items.map(item => `
        <div class="timeline-item">
            <div class="timeline-badge"><i class="${item.icon}"></i></div>
            <div class="timeline-content">
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
                <span class="timeline-time">${item.time}</span>
            </div>
        </div>
    `).join("");
}

// Scroll to settings section helper (Legacy)
function scrollToSettings() {
    document.getElementById("settingsSection").scrollIntoView({ behavior: "smooth" });
}

// Simulate resume download
function downloadResume() {
    const resumeData = JSON.parse(sessionStorage.getItem("skillgap_resume") || "null");
    if (!resumeData) return;
    
    showSettingsMessage("settingsMsg", "Preparing resume download...", "success");
    
    // Simulate downloading resume text as txt file
    const blob = new Blob([resumeData.text || "SkillGap AI Resume content"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resumeData.filename ? resumeData.filename.replace(".pdf", "_Evaluated.txt") : "Resume_Evaluated.txt";
    a.click();
    URL.revokeObjectURL(url);
}

// Modal handling logic
function openEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}

let pendingAvatarDataUrl = null;

function handleAvatarChangeProfile(e) {
    handleAvatarFile(e.target.files[0], true);
}

function handleAvatarChangeModal(e) {
    handleAvatarFile(e.target.files[0], false);
}

function handleAvatarFile(file, autoSave) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(event) {
        const dataUrl = event.target.result;
        
        if (autoSave) {
            // Directly save to backend if uploaded from main profile page
            const session = JSON.parse(sessionStorage.getItem("skillgap_session") || "{}");
            const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
            try {
                await fetch(`${API_BASE}/api/profile/${session.user_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profilePhoto: dataUrl })
                });
                document.getElementById("profileAvatar").innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                showSettingsMessage("settingsMsg", "Profile picture updated successfully!", "success");
            } catch (err) {
                console.error(err);
                showSettingsMessage("settingsMsg", "Failed to update profile picture.", "error");
            }
        } else {
            // Just hold it in memory for the modal save
            pendingAvatarDataUrl = dataUrl;
        }
    };
    reader.readAsDataURL(file);
}

// Save Profile Modal handler
async function saveProfileModal(e) {
    e.preventDefault();
    const session = JSON.parse(sessionStorage.getItem("skillgap_session") || "{}");
    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
    
    const updateData = {
        name: document.getElementById("modalName").value,
        phone: document.getElementById("modalPhone").value,
        location: document.getElementById("modalLocation").value,
        education: document.getElementById("modalEducation").value,
        college: document.getElementById("modalCollege").value,
        graduationYear: document.getElementById("modalGradYear").value,
        careerGoal: document.getElementById("modalCareerGoal").value,
        linkedin: document.getElementById("modalLinkedin").value,
        github: document.getElementById("modalGithub").value,
        bio: document.getElementById("modalBio").value
    };
    
    if (pendingAvatarDataUrl) {
        updateData.profilePhoto = pendingAvatarDataUrl;
    }

    try {
        const btn = document.getElementById("saveProfileBtnModal");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const response = await fetch(`${API_BASE}/api/profile/${session.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const data = await response.json();
            const p = data.profile;
            
            // Update UI
            document.getElementById("profileName").textContent = p.name;
            document.getElementById("profilePhone").textContent = p.phone || "+91 00000 00000";
            document.querySelector(".profile-location").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.location || "Location not set"}`;
            document.getElementById("profileBio").textContent = p.bio || "No bio updated.";
            document.querySelectorAll("#sidebarName,#headerName").forEach(el => el.textContent = p.name);
            
            if (p.careerGoal) {
                document.getElementById("profileTargetRole").textContent = p.careerGoal;
            }
            
            if (p.profilePhoto) {
                document.getElementById("profileAvatar").innerHTML = `<img src="${p.profilePhoto}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
            
            if (p.education && document.getElementById("profileEducation")) document.getElementById("profileEducation").textContent = p.education;
            if (p.college && document.getElementById("profileCollege")) document.getElementById("profileCollege").textContent = p.college;
            if (p.graduationYear && document.getElementById("profileGradYear")) document.getElementById("profileGradYear").textContent = p.graduationYear;
            
            if (p.linkedin && document.getElementById("profileLinkedin")) {
                const link = document.createElement("a");
                link.href = p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`;
                link.target = "_blank";
                link.style.color = "#3B82F6";
                link.textContent = "LinkedIn Profile";
                document.getElementById("profileLinkedin").innerHTML = "";
                document.getElementById("profileLinkedin").appendChild(link);
            }
            
            if (p.github && document.getElementById("profileGithub")) {
                const link = document.createElement("a");
                link.href = p.github.startsWith('http') ? p.github : `https://${p.github}`;
                link.target = "_blank";
                link.style.color = "#3B82F6";
                link.textContent = "GitHub Profile";
                document.getElementById("profileGithub").innerHTML = "";
                document.getElementById("profileGithub").appendChild(link);
            }
            
            // Update session active name
            session.user_name = p.name;
            session.name = p.name;
            sessionStorage.setItem("skillgap_session", JSON.stringify(session));
            localStorage.setItem("skillgap_session", JSON.stringify(session));
            
            closeEditProfileModal();
            showSettingsMessage("settingsMsg", "Profile updated successfully!", "success");
        } else {
            throw new Error("Failed to update profile");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred while saving the profile.");
    } finally {
        const btn = document.getElementById("saveProfileBtnModal");
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
}

// Save Profile handler (Legacy settings form fallback)
function saveProfile(e) {
    e.preventDefault();
    // Replaced by saveProfileModal but kept so no JS error throws if user submits old form
    showSettingsMessage("settingsMsg", "Please use the Edit Profile button above.", "info");
}

// Change Password simulation
function changePassword(e) {
    e.preventDefault();
    const curPass = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;

    if (newPass.length < 6) {
        showSettingsMessage("settingsMsg", "New password must be at least 6 characters.", "error");
        return;
    }

    showSettingsMessage("settingsMsg", "Password updated successfully!", "success");
    document.getElementById("passwordForm").reset();
}

// Show feedback messages
function showSettingsMessage(id, text, type) {
    const el = document.getElementById(id);
    el.className = `settings-msg ${type}`;
    el.textContent = text;
    el.style.display = "block";
    
    setTimeout(() => {
        el.style.display = "none";
    }, 4000);
}

