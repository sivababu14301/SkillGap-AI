/* ============================================================
   SkillGap AI — Upload Resume JavaScript
   Real AI Extraction Pipeline:
   1. PDF.js  → Extract raw text from PDF
   2. Groq API (openai/gpt-oss-20b) → Parse skills, education, certs, projects
   3. Display structured results
   ============================================================ */

/* ── Config ─────────────────────────────────────── */
const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';

/* ── PDF.js Worker ───────────────────────────────────────── */
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* ── Element References ──────────────────────────────────── */
const dropZone      = document.getElementById("dropZone");
const fileInput     = document.getElementById("resumeFile");
const fileInfoCard  = document.getElementById("fileInfoCard");
const extractBtnRow = document.getElementById("extractBtnRow");
const extractBtn    = document.getElementById("extractBtn");
const processingCard= document.getElementById("processingCard");
const errorCard     = document.getElementById("errorCard");
const resultsSection= document.getElementById("resultsSection");

let currentFile   = null;
let extractedText = "";
let aiData        = null;   // Parsed Groq response

/* ══════════════════════════════════════════════════════════
   DRAG & DROP
══════════════════════════════════════════════════════════ */
dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", (e) => { e.preventDefault(); dropZone.classList.remove("dragover"); });
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files?.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => {
    if (e.target.files?.length > 0) handleFile(e.target.files[0]);
});

/* ══════════════════════════════════════════════════════════
   FILE HANDLING
══════════════════════════════════════════════════════════ */
function handleFile(file) {
    if (file.type !== "application/pdf") { showError("Please upload a PDF file."); return; }
    if (file.size > 5 * 1024 * 1024)    { showError("File size exceeds 5MB limit."); return; }

    currentFile = file;
    aiData      = null;
    errorCard.style.display     = "none";
    resultsSection.style.display = "none";
    processingCard.style.display = "none";

    document.getElementById("fileName").textContent = file.name;
    document.getElementById("fileSize").textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById("filePages").textContent = "Calculating...";

    dropZone.style.display    = "none";
    fileInfoCard.style.display = "flex";
    extractBtnRow.style.display = "block";
    resetExtractBtn();

    // Read page count
    const fr = new FileReader();
    fr.onload = async function () {
        try {
            const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;
            document.getElementById("filePages").textContent =
                pdf.numPages + (pdf.numPages > 1 ? " pages" : " page");
        } catch { document.getElementById("filePages").textContent = "Unknown pages"; }
    };
    fr.readAsArrayBuffer(file);
}

function removeFile() {
    currentFile = null; fileInput.value = ""; aiData = null;
    fileInfoCard.style.display  = "none";
    dropZone.style.display       = "block";
    extractBtnRow.style.display  = "none";
    processingCard.style.display = "none";
    resultsSection.style.display = "none";
    errorCard.style.display      = "none";
}

function resetExtractBtn() {
    extractBtn.disabled = false;
    extractBtn.querySelector(".btn-text").style.display    = "block";
    extractBtn.querySelector(".btn-loading").style.display = "none";
}

function showError(msg) {
    errorCard.style.display = "block";
    document.getElementById("errorMsg").textContent = msg;
}

/* ══════════════════════════════════════════════════════════
   MAIN EXTRACTION PIPELINE
══════════════════════════════════════════════════════════ */
async function startExtraction() {
    if (!currentFile) return;

    extractBtn.disabled = true;
    extractBtn.querySelector(".btn-text").style.display    = "none";
    extractBtn.querySelector(".btn-loading").style.display = "block";
    errorCard.style.display = "none";
    processingCard.style.display = "block";
    resetProgress();

    try {
        // Step 0: Test Groq connection
        updateStep(1, "active", "Testing Groq connection...");
        const healthRes = await fetch(`${API_BASE}/api/ai/health`);
        if (!healthRes.ok) {
            const healthData = await healthRes.json().catch(() => ({}));
            console.warn("Groq connection test failed, continuing with fallback mode...", healthData);
            // throw new Error(healthData.message || "Groq connection test failed");
        }

        /* ── Step 1: PDF Text Extraction ────────────────── */
        updateStep(1, "active", "Reading PDF with pdf.js...");
        extractedText = await extractTextFromPDF(currentFile);
        if (!extractedText.trim()) throw new Error("No text found. PDF may be scanned/image-based.");
        updateStep(1, "done", "Text extracted ✓");
        setProgress(20);

        /* ── Step 2: Send to Backend for AI Extraction ─────────────── */
        updateStep(2, "active", "Sending to AI backend...");
        setProgress(40);
        
        const sessionData = requireAuth();
        if (!sessionData || !sessionData.user_id) throw new Error("User session not found.");
        
        const backendRes = await fetch(`${API_BASE}/api/resumes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: sessionData.user_id,
                file_name: currentFile.name,
                file_type: currentFile.name.split('.').pop() || 'pdf',
                file_size: (currentFile.size / 1024 / 1024).toFixed(2) + " MB",
                resume_text: extractedText
            })
        });
        
        if (!backendRes.ok) {
            let errText = await backendRes.text().catch(() => "");
            let errBody = {};
            try {
                errBody = JSON.parse(errText);
            } catch(e) {}
            
            let errMsg = `Backend Error ${backendRes.status}: Failed to process resume.`;
            if (errBody.details) {
                errMsg = errBody.details;
            } else if (errBody.error) {
                errMsg = `Backend Error: ${errBody.error}`;
            } else if (errText && errText.includes("<!DOCTYPE html>")) {
                errMsg = `Backend Server Error ${backendRes.status}. Check python console.`;
            } else if (errText) {
                errMsg = `Error ${backendRes.status}: ${errText.substring(0, 50)}`;
            }
            throw new Error(`Groq API Error\n${errMsg}`);
        }
        
        const data = await backendRes.json();
        aiData = data.resume.aiData || {};
        updateStep(2, "done", "AI extraction complete ✓");
        setProgress(70);

        /* ── Step 3: Structuring data ─────────────── */
        updateStep(3, "active", "Structuring data...");
        await wait(500);
        updateStep(3, "done", "Data structured ✓");
        
        /* ── Step 4: Finalizing ─────────────── */
        updateStep(4, "active", "Finalizing...");
        await wait(300);
        updateStep(4, "done", "Done ✓");
        setProgress(100);

        /* ── Clear Stale Analysis State ──────────────────── */
        sessionStorage.removeItem("skillgap_results");
        sessionStorage.removeItem("skillgap_target_role");
        sessionStorage.removeItem("skillgap_career");
        
        /* ── Save to sessionStorage temporarily ──────────────────────── */
        const resumePayload = {
            resume_id:   data.resume._id,
            fileName:    currentFile.name,
            text:        extractedText,
            aiData:      aiData,
            extracted_skills: data.resume.extracted_skills,
            uploadDate:  new Date().toISOString()
        };
        sessionStorage.setItem("skillgap_resume", JSON.stringify(resumePayload));

        /* ── Show Results ────────────────────────────────── */
        await wait(400);
        showResults();

    } catch (err) {
        console.error(err);
        processingCard.style.display = "none";
        showError("❌ " + (err.message || "Extraction failed. Check your internet connection."));
        resetExtractBtn();
    }
}

/* ══════════════════════════════════════════════════════════
   PDF TEXT EXTRACTION (pdf.js)
══════════════════════════════════════════════════════════ */
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = async function () {
            try {
                const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(" ") + "\n\n";
                }
                resolve(fullText);
            } catch (e) { reject(e); }
        };
        fr.onerror = reject;
        fr.readAsArrayBuffer(file);
    });
}

// API call moved to backend

/* ══════════════════════════════════════════════════════════
   DISPLAY RESULTS
══════════════════════════════════════════════════════════ */
function showResults() {
    processingCard.style.display = "none";
    extractBtnRow.style.display  = "none";
    resultsSection.style.display = "block";

    const d = aiData || {};

    const skills  = Array.isArray(d.skills) ? d.skills : [];
    const soft_skills = Array.isArray(d.soft_skills) ? d.soft_skills : [];
    const all_skills = [...skills, ...soft_skills];
    const edu     = Array.isArray(d.education)       ? d.education       : [];
    const certs   = Array.isArray(d.certifications)  ? d.certifications  : [];
    const projs   = Array.isArray(d.projects)        ? d.projects        : [];
    const exp     = Array.isArray(d.experience)      ? d.experience      : [];

    /* ── Summary Stats ───────────────────────────────────── */
    document.getElementById("ssSkills").textContent   = all_skills.length;
    document.getElementById("ssProjects").textContent = projs.length;
    document.getElementById("ssCerts").textContent    = certs.length;
    document.getElementById("ssEdu").textContent      = edu.length;
    document.getElementById("skillCount").textContent = all_skills.length;

    /* ── Strength Badge ──────────────────────────────────── */
    const strengthBadge = document.getElementById("strengthBadge");
    const total = all_skills.length + projs.length * 2 + certs.length + exp.length * 3;
    if (total >= 20)      { strengthBadge.textContent = "Excellent"; strengthBadge.style.background = "rgba(16,185,129,0.15)"; strengthBadge.style.color = "#34D399"; }
    else if (total >= 12) { strengthBadge.textContent = "Strong";    strengthBadge.style.background = "rgba(59,130,246,0.15)";  strengthBadge.style.color = "#60A5FA"; }
    else if (total >= 6)  { strengthBadge.textContent = "Average";   strengthBadge.style.background = "rgba(245,158,11,0.15)"; strengthBadge.style.color = "#FBBF24"; }
    else                  { strengthBadge.textContent = "Beginner";  strengthBadge.style.background = "rgba(239,68,68,0.15)";   strengthBadge.style.color = "#F87171"; }

    /* ── Skills Tags ─────────────────────────────────────── */
    document.getElementById("skillsTags").innerHTML =
        all_skills.length > 0
            ? all_skills.map(s => `<span class="skill-tag">${s}</span>`).join("")
            : `<span style="color:var(--text-muted); font-size:0.85rem;">No skills found in resume. Try a more detailed resume.</span>`;

    /* ── Education List ──────────────────────────────────── */
    document.getElementById("eduList").innerHTML =
        edu.length > 0
            ? edu.map(e => {
                let title = "Degree";
                let sub = "";
                if (typeof e === 'string') {
                    title = e;
                } else if (typeof e === 'object' && e !== null) {
                    title = e.degree || "Degree";
                    let years = [e.start_year, e.end_year].filter(Boolean).join("-") || e.year || "";
                    let inst = e.institution || "";
                    let score = e.score ? `Score: ${e.score}` : "";
                    sub = [inst, years, score].filter(Boolean).join(" • ");
                }
                return `
                <div class="extracted-item">
                    <p class="ext-title">${title}</p>
                    ${sub ? `<p class="ext-sub">${sub}</p>` : ''}
                </div>`;
            }).join("")
            : `<p style="color:var(--text-muted);font-size:0.85rem;">No education data found in resume.</p>`;

    /* ── Certifications List ─────────────────────────────── */
    document.getElementById("certList").innerHTML =
        certs.length > 0
            ? certs.map(c => {
                let title = "Certification";
                let sub = "";
                if (typeof c === 'string') {
                    title = c;
                } else if (typeof c === 'object' && c !== null) {
                    title = c.name || "Certification";
                    sub = [c.issuer ? `Issuer: ${c.issuer}` : "", c.date || c.year || ""].filter(Boolean).join(" • ");
                }
                return `
                <div class="extracted-item cert">
                    <p class="ext-title">★ ${title}</p>
                    ${sub ? `<p class="ext-sub">${sub}</p>` : ''}
                </div>`;
            }).join("")
            : `<p style="color:var(--text-muted);font-size:0.85rem;">No certifications data found in resume.</p>`;

    /* ── Experience List ─────────────────────────────────── */
    const expList = document.getElementById("expList");
    if (expList) {
        expList.innerHTML = exp.length > 0
            ? exp.map(e => {
                let title = "Role";
                let sub = "";
                let desc = "";
                if (typeof e === 'string') {
                    title = e;
                } else if (typeof e === 'object' && e !== null) {
                    title = e.title || "Role";
                    sub = [e.company, e.duration].filter(Boolean).join(" • ");
                    desc = e.description || "";
                }
                return `
                <div class="extracted-item">
                    <p class="ext-title">${title}</p>
                    ${sub ? `<p class="ext-sub" style="margin-bottom:4px">${sub}</p>` : ''}
                    ${desc ? `<p class="ext-sub">${desc}</p>` : ''}
                </div>`;
            }).join("")
            : `<p style="color:var(--text-muted);font-size:0.85rem;">No experience data found in resume.</p>`;
    }

    /* ── Projects List ───────────────────────────────────── */
    document.getElementById("projList").innerHTML =
        projs.length > 0
            ? projs.map(p => {
                let title = "Project";
                let sub = "";
                let desc = "";
                if (typeof p === 'string') {
                    title = p;
                } else if (typeof p === 'object' && p !== null) {
                    title = p.name || "Project";
                    desc = p.description || "";
                    let tech = p.technologies || "";
                    if (Array.isArray(tech)) tech = tech.join(", ");
                    sub = [p.duration || p.year, tech ? `Tech: ${tech}` : ""].filter(Boolean).join(" • ");
                }
                return `
                <div class="extracted-item proj">
                    <p class="ext-title">${title}</p>
                    ${sub ? `<p class="ext-sub" style="margin-bottom:4px">${sub}</p>` : ''}
                    ${desc ? `<p class="ext-sub">${desc}</p>` : ''}
                </div>`;
            }).join("")
            : `<p style="color:var(--text-muted);font-size:0.85rem;">No projects data found in resume.</p>`;


    /* ── Raw Text Preview ────────────────────────────────── */
    document.getElementById("resumeTextPreview").textContent = aiData.resume_text || extractedText;
}

/* ══════════════════════════════════════════════════════════
   PROGRESS HELPERS
══════════════════════════════════════════════════════════ */
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function updateStep(num, state, statusMsg) {
    const step   = document.getElementById("step" + num);
    const status = document.getElementById("step" + num + "Status");
    const check  = document.getElementById("step" + num + "Check");

    step.className = "proc-step";
    if (state === "active") {
        step.classList.add("active");
        check.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    } else if (state === "done") {
        step.classList.add("done");
        check.innerHTML = '<i class="fas fa-check-circle"></i>';
    }
    status.textContent = statusMsg;
}

function resetProgress() {
    [1, 2, 3, 4].forEach(i => {
        document.getElementById("step" + i).className = "proc-step";
        document.getElementById("step" + i + "Status").textContent = i === 1 ? "Waiting..." : "Pending";
        document.getElementById("step" + i + "Check").innerHTML =
            '<i class="fas fa-clock"></i>';
    });
    setProgress(0);
}

function setProgress(pct) {
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressPct").textContent  = pct + "%";
}

function toggleTextPreview() {
    const box = document.getElementById("textPreviewBox");
    const btn = document.getElementById("togglePreviewBtn");
    if (box.style.display === "none") {
        box.style.display = "block";
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Text';
    } else {
        box.style.display = "none";
        btn.innerHTML = '<i class="fas fa-eye"></i> Show Text';
    }
}
