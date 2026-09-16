/* ============================================================
   SkillGap AI — Resume Score JavaScript
   Formula:
   Score = (TechSkills*0.35) + (Projects*0.25) +
           (Education*0.15) + (Certs*0.10) + (Formatting*0.15)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    // ── 1. Read gap analysis data from session ──────────────────
    const results = JSON.parse(sessionStorage.getItem("skillgap_results") || "null");
    const matchPct = results ? results.percentage : 0;
    const resumeData = JSON.parse(sessionStorage.getItem("skillgap_resume") || "{}");
    const aiData = resumeData.aiData || {};
    
    let baseScore = results ? results.resumeScore : 0;

    // ── 2. Score Calculations ───────────────────────────────────
    const hasProjects = aiData.projects && aiData.projects.length > 0;
    const hasEdu = aiData.education && aiData.education.length > 0;
    const hasCerts = aiData.certifications && aiData.certifications.length > 0;

    const components = {
        "Technical Skills":    { score: Math.round(matchPct),  weight: 0.35, color: "#7C3AED" },
        "Projects":            { score: hasProjects ? 85 : 30, weight: 0.25, color: "#3B82F6" },
        "Education":           { score: hasEdu ? 90 : 40,      weight: 0.15, color: "#10B981" },
        "Certifications":      { score: hasCerts ? 80 : 20,    weight: 0.10, color: "#F59E0B" },
        "Experience Score":    { score: 95,                    weight: 0.15, color: "#EC4899" },
    };

    let totalScore = baseScore;

    // ── 3. Grade & Stars ────────────────────────────────────────
    function getGrade(s) {
        if (s >= 90) return { label: "Excellent", color: "#34D399", stars: 5 };
        if (s >= 75) return { label: "Good",      color: "#60A5FA", stars: 4 };
        if (s >= 60) return { label: "Average",   color: "#FBBF24", stars: 3 };
        return             { label: "Needs Work", color: "#F87171", stars: 2 };
    }
    const grade = getGrade(totalScore);

    // Update DOM
    document.getElementById("scoreDisplay").textContent = totalScore;
    const gradeEl = document.getElementById("scoreGrade");
    gradeEl.textContent = grade.label;
    gradeEl.style.color = grade.color;

    // Stars
    const starsContainer = document.getElementById("scoreStars");
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(grade.stars)) starsHtml += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= grade.stars) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        else starsHtml += '<i class="far fa-star"></i>';
    }
    starsContainer.innerHTML = starsHtml;

    // ── 4. Score Breakdown Progress Bars ───────────────────────
    const breakdownColors = {
        "Technical Skills":  "#7C3AED",
        "Projects":          "#3B82F6",
        "Education":         "#10B981",
        "Certifications":    "#F59E0B",
        "Experience Score":  "#EC4899",
    };
    const listEl = document.getElementById("breakdownList");
    listEl.innerHTML = Object.entries(components).map(([name, c]) => `
        <div class="breakdown-item">
            <div class="breakdown-label-row">
                <span class="breakdown-label">${name}</span>
                <span class="breakdown-pct" style="color:${breakdownColors[name]}">${Math.round(c.score)}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width:${Math.round(c.score)}%; background:${breakdownColors[name]};"></div>
            </div>
        </div>
    `).join("");

    // ── 5. ATS Compatibility ────────────────────────────────────
    const atsScore = results ? results.atsScore : 0;
    document.getElementById("atsScore").textContent = atsScore + "%";

    const atsMetricsData = [
        { label: "Keyword Coverage", value: Math.round(matchPct * 0.85 + 20) + "%", barPct: Math.round(matchPct * 0.85 + 20), color: "#3B82F6", badge: "good" },
        { label: "Formatting",       value: "Excellent",   barPct: 95,                 color: "#10B981", badge: "excellent" },
        { label: "Readability",      value: "Good",        barPct: 80,                 color: "#3B82F6", badge: "good"      },
        { label: "File Parsing",     value: "Excellent",   barPct: 95,                 color: "#10B981", badge: "excellent" },
    ];
    document.getElementById("atsMetrics").innerHTML = atsMetricsData.map(m => `
        <div class="ats-metric-item">
            <div class="ats-metric-label-row">
                <span class="ats-metric-label">${m.label}</span>
                <span class="ats-metric-badge badge-${m.badge}">${m.value}</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width:${m.barPct}%; background:${m.color};"></div>
            </div>
        </div>
    `).join("");

    // ── 6. Strengths & Weaknesses ───────────────────────────────
    const strengths = results && results.matched && results.matched.length > 0
        ? results.matched.slice(0,4).map(s => `Strong ${s} knowledge`)
        : (results ? ["No strong technical matches found"] : ["Analysis Pending"]);

    const weaknesses = results && results.missing && results.missing.length > 0
        ? results.missing.slice(0,4).map(s => `Missing ${s}`)
        : (results ? ["No critical missing skills found"] : ["Analysis Pending"]);

    document.getElementById("strengthsList").innerHTML = strengths.map(s =>
        `<li><i class="fas fa-check-circle"></i> ${s}</li>`).join("");
    document.getElementById("weaknessesList").innerHTML = weaknesses.map(w =>
        `<li><i class="fas fa-times-circle"></i> ${w}</li>`).join("");

    // ── 7. Improvement Suggestions ──────────────────────────────
    const missingSkills = results && results.missing ? results.missing : [];
    const topMissing = missingSkills.slice(0, 3).join(", ");
    
    let suggestions = [];
    if (results) {
        suggestions = [
            `Learn ${topMissing || "more job-relevant tools"} to boost your match.`,
            "Add more industry-level projects to your portfolio.",
            "Include your GitHub profile and live project links.",
            "Add certifications related to your target role.",
            "Quantify your achievements with numbers and metrics.",
            "Improve ATS keywords based on the job description.",
        ];
    } else {
        suggestions = ["Analysis Pending: Select a job role to view personalized suggestions."];
    }
    
    document.getElementById("suggestionsList").innerHTML = suggestions.map(s => `
        <li>
            <span class="sug-icon"><i class="fas fa-check"></i></span>
            <span>${s}</span>
        </li>
    `).join("");

    // ── 8. Chart.js – Components Donut ─────────────────────────
    const donutCtx = document.getElementById("componentsDonut").getContext("2d");
    const compLabels = Object.keys(components);
    const compValues = Object.values(components).map(c => Math.round(c.score * c.weight));
    const compColors = Object.values(components).map(c => c.color);

    new Chart(donutCtx, {
        type: "doughnut",
        data: {
            labels: compLabels,
            datasets: [{ data: compValues, backgroundColor: compColors, borderWidth: 0, borderRadius: 6 }]
        },
        options: {
            cutout: "70%",
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 1500 },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } }
        }
    });

    // Legend
    document.getElementById("compLegend").innerHTML = compLabels.map((label, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${compColors[i]}"></span>
            <span>${label}</span>
        </div>
    `).join("");

    // ── 9. Chart.js – Radar Chart ───────────────────────────────
    const radarCtx = document.getElementById("radarChart").getContext("2d");
    const radarScores = [
        Math.round(components["Technical Skills"].score),
        Math.round(components["Projects"].score),
        Math.round(components["Education"].score),
        Math.round(components["Certifications"].score),
        atsScore
    ];

    new Chart(radarCtx, {
        type: "radar",
        data: {
            labels: ["Skills", "Projects", "Education", "Certifications", "Experience"],
            datasets: [{
                label: "Resume Quality",
                data: radarScores,
                backgroundColor: "rgba(124,58,237,0.25)",
                borderColor: "#7C3AED",
                borderWidth: 2,
                pointBackgroundColor: "#A78BFA",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 1500 },
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { color: "rgba(255,255,255,0.3)", font: { size: 10 }, stepSize: 25 },
                    grid: { color: "rgba(255,255,255,0.06)" },
                    pointLabels: { color: "rgba(255,255,255,0.7)", font: { size: 11, weight: "600" } },
                    angleLines: { color: "rgba(255,255,255,0.06)" }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // ── 10. Score Donut Ring ────────────────────────────────────
    const scoreDonutCtx = document.getElementById("scoreDonut").getContext("2d");
    const scoreGrad = scoreDonutCtx.createLinearGradient(0, 0, 0, 200);
    scoreGrad.addColorStop(0, "#7C3AED");
    scoreGrad.addColorStop(1, "#3B82F6");

    new Chart(scoreDonutCtx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [totalScore, 100 - totalScore],
                backgroundColor: [scoreGrad, "rgba(255,255,255,0.04)"],
                borderWidth: 0,
                borderRadius: 10
            }]
        },
        options: {
            cutout: "82%",
            responsive: false,
            animation: { duration: 1500 },
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
});

// Download Report (simple text download)
function downloadReport() {
    const results = JSON.parse(sessionStorage.getItem("skillgap_results") || "{}");
    const role = results.role || "Target Role";
    const pct  = results.percentage || 0;
    const matched  = (results.matched  || []).join(", ") || "N/A";
    const missing  = (results.missing  || []).join(", ") || "N/A";

    const report = `
SkillGap AI — Resume Report
============================
Generated: ${new Date().toLocaleDateString()}

TARGET ROLE       : ${role}
MATCH PERCENTAGE  : ${pct}%

MATCHED SKILLS
--------------
${matched}

MISSING SKILLS
--------------
${missing}

IMPROVEMENT TIPS
----------------
• Learn the missing skills listed above.
• Add more project experience.
• Include certifications relevant to ${role}.
• Quantify your achievements.
• Add GitHub links to your resume.

Powered by SkillGap AI
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SkillGap_AI_Report.txt";
    a.click();
    URL.revokeObjectURL(url);
}
