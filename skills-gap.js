/* ============================================================
   SkillGap AI — Skills Gap Analysis Logic
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
    const sessionData = typeof requireAuth === "function" ? requireAuth() : JSON.parse(sessionStorage.getItem("skillgap_session") || "null");
    if (!sessionData || !sessionData.user_id) {
        window.location.href = "login.html";
        return;
    }

    const API_BASE = (window.location.protocol === 'file:' || window.location.port !== '5000') ? 'http://localhost:5000' : '';
    
    let targetRoleName, requiredSkills, userSkills, matchedSkills, missingSkills, additionalSkills, matchPercentage, resumeScore, atsScore, placementReadiness;
    
    try {
        const analysisRes = await fetch(`${API_BASE}/api/analysis/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: sessionData.user_id })
        });
        
        if (analysisRes.ok) {
            const data = await analysisRes.json();
            targetRoleName = data.role;
            requiredSkills = data.requiredSkills;
            userSkills = data.userSkills;
            matchedSkills = data.matched;
            missingSkills = data.missing;
            additionalSkills = data.additional;
            matchPercentage = data.percentage;
            resumeScore = data.resumeScore;
            atsScore = data.atsScore;
            placementReadiness = data.placementReadiness;
        } else {
            const errData = await analysisRes.json();
            document.getElementById("targetRoleName").textContent = "Error";
            const mainContainer = document.querySelector(".container.mt-4");
            if (mainContainer) {
                mainContainer.innerHTML = `<div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Analysis Failed!</h4>
                    <p>${errData.error || "Failed to calculate analysis in backend."}</p>
                    <hr>
                    <a href="job-role.html" class="btn btn-primary">Go Back to Job Roles</a>
                </div>`;
            }
            return;
        }
    } catch (e) {
        console.error("Backend fetch error", e);
        const mainContainer = document.querySelector(".container.mt-4");
        if (mainContainer) {
            mainContainer.innerHTML = `<div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Connection Error!</h4>
                <p>Failed to connect to the backend server. Please ensure the server is running.</p>
                <hr>
                <a href="job-role.html" class="btn btn-primary">Go Back to Job Roles</a>
            </div>`;
        }
        return;
    }

    document.getElementById("targetRoleName").textContent = targetRoleName;

    // Save result to session for next pages
    const analysisPayload = {
        role: targetRoleName,
        matched: matchedSkills,
        missing: missingSkills,
        percentage: matchPercentage,
        resumeScore: resumeScore,
        atsScore: atsScore,
        placementReadiness: placementReadiness
    };
    sessionStorage.setItem("skillgap_results", JSON.stringify(analysisPayload));

    // 4. Update UI Stats
    document.getElementById("valRequired").textContent = requiredSkills.length;
    document.getElementById("valUser").textContent = userSkills.length;
    document.getElementById("valMatched").textContent = matchedSkills.length;
    document.getElementById("valMissing").textContent = missingSkills.length;
    
    // Animate Percentage
    animateValue("valPercent", 0, matchPercentage, 1000, "%");
    animateValue("chartPercent", 0, matchPercentage, 1000, "%");

    document.getElementById("countMatched").textContent = matchedSkills.length;
    document.getElementById("countMissing").textContent = missingSkills.length;
    document.getElementById("countAdditional").textContent = additionalSkills.length;

    // 5. Populate Lists
    const listMatched = document.getElementById("listMatched");
    if (matchedSkills.length === 0) listMatched.innerHTML = "<li><span class='text-muted'>No matched skills found.</span></li>";
    else listMatched.innerHTML = matchedSkills.map(s => `<li><i class="fas fa-check-circle"></i> ${s}</li>`).join("");

    const listMissing = document.getElementById("listMissing");
    if (missingSkills.length === 0) listMissing.innerHTML = "<li><span class='text-muted'>No missing skills!</span></li>";
    else listMissing.innerHTML = missingSkills.map(s => `<li><i class="fas fa-times-circle"></i> ${s}</li>`).join("");

    const listAdditional = document.getElementById("listAdditional");
    if (additionalSkills.length === 0) listAdditional.innerHTML = "<li><span class='text-muted'>No additional skills.</span></li>";
    else listAdditional.innerHTML = additionalSkills.map(s => `<li><i class="fas fa-star"></i> ${s}</li>`).join("");

    // 6. Draw Chart
    drawChart(matchPercentage);

    // 7. Generate AI Insights
    generateAIInsights(matchedSkills, missingSkills, additionalSkills, targetRole.name);
});

// Animation helper
function animateValue(id, start, end, duration, suffix="") {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Chart.js Setup
function drawChart(percent) {
    const ctx = document.getElementById('matchChart').getContext('2d');
    
    // Gradient for the donut
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#3B82F6');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Match', 'Gap'],
            datasets: [{
                data: [percent, 100 - percent],
                backgroundColor: [gradient, 'rgba(255, 255, 255, 0.05)'],
                borderWidth: 0,
                borderRadius: 10
            }]
        },
        options: {
            cutout: '80%',
            responsive: true,
            maintainAspectRatio: false,
            animation: { animateScale: true, duration: 1500 },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

// AI Insights Generator — powered by Groq AI
async function generateAIInsights(matched, missing, additional, roleName) {
    const container = document.getElementById("aiInsightsContent");
    if (!container) return;

    // Show loading spinner
    container.innerHTML =
        '<div class="groq-loader">'
        + '<div class="groq-spinner"></div>'
        + '<span>SkillGap AI is analyzing your profile with Groq...</span>'
        + '</div>';

    try {
        const insight = await groqAnalyzeSkillsGap(roleName, matched, missing, additional);

        const readinessColor = {
            "Beginner":     "#F59E0B",
            "Intermediate": "#3B82F6",
            "Advanced":     "#10B981"
        }[insight.readiness] || "#7C3AED";

        const strengthsList = (insight.strengths || []).map(function(s) {
            return '<li><i class="fas fa-check-circle"></i> ' + s + '</li>';
        }).join("");

        const gapsList = (insight.gaps || []).map(function(g) {
            return '<li><i class="fas fa-times-circle"></i> ' + g + '</li>';
        }).join("");

        container.innerHTML =
            '<div class="insight-col strengths">'
                + '<h4><i class="fas fa-bolt" style="color:#10B981"></i> Strengths</h4>'
                + '<ul>' + strengthsList + '</ul>'
            + '</div>'
            + '<div class="insight-col weaknesses">'
                + '<h4><i class="fas fa-exclamation-triangle" style="color:#EF4444"></i> Skill Gaps</h4>'
                + '<ul>' + gapsList + '</ul>'
            + '</div>'
            + '<div class="insight-col recommendation">'
                + '<h4><i class="fas fa-robot" style="color:#A78BFA"></i> AI Recommendation</h4>'
                + '<div class="recommendation-box">'
                    + '<p>' + (insight.summary || "") + '</p>'
                    + '<div class="groq-tags">'
                        + '<span class="groq-tag priority">'
                            + '<i class="fas fa-fire"></i> Top Priority: ' + (insight.topPriority || "—")
                        + '</span>'
                        + '<span class="groq-tag readiness" style="background:' + readinessColor + '22;color:' + readinessColor + ';border-color:' + readinessColor + '44">'
                            + '<i class="fas fa-signal"></i> ' + (insight.readiness || "Intermediate")
                        + '</span>'
                    + '</div>'
                    + '<p class="groq-encourage"><i class="fas fa-star" style="color:#F59E0B"></i> ' + (insight.encouragement || "") + '</p>'
                + '</div>'
            + '</div>';

    } catch (err) {
        console.warn("Groq API error:", err.message);
        
        console.warn("Groq API error. Using graceful fallback instead. Details:", err.message);

        // Graceful fallback — static insights based on dataset
        var strengthsHtml = matched.length > 2
            ? '<li><i class="fas fa-check-circle"></i> Strong foundation in core requirements</li><li><i class="fas fa-check-circle"></i> Good match for ' + roleName + '</li>'
            : '<li><i class="fas fa-check-circle"></i> Starting to build relevant skills</li>';

        var weaknessesHtml = missing.length > 3
            ? '<li><i class="fas fa-times-circle"></i> Significant gaps in required tools</li><li><i class="fas fa-times-circle"></i> Core framework knowledge missing</li>'
            : missing.length > 0
                ? '<li><i class="fas fa-times-circle"></i> A few specific tools missing</li>'
                : '<li><i class="fas fa-check-circle"></i> No major weaknesses found!</li>';

        var recommendation = missing.length > 0
            ? 'Focus your learning path on acquiring <strong>' + missing.slice(0,3).join(", ") + '</strong> to boost your placement readiness for <strong>' + roleName + '</strong>.'
            : 'You are highly qualified for this role. Focus on advanced projects to showcase your expertise.';

        container.innerHTML =
            '<div class="insight-col strengths"><h4>Strengths:</h4><ul>' + strengthsHtml + '</ul></div>'
            + '<div class="insight-col weaknesses"><h4>Weaknesses:</h4><ul>' + weaknessesHtml + '</ul></div>'
            + '<div class="insight-col recommendation"><h4>Recommendation:</h4>'
                + '<div class="recommendation-box"><p>' + recommendation + '</p></div>'
            + '</div>';
    }
}
