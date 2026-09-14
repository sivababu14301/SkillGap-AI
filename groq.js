/* ============================================================
   SkillGap AI — Groq AI Integration (groq.js)
   
   ⚠️  SECURITY NOTE: Store your API key in an environment
       variable or backend proxy for production use.
       This client-side key is for demo/development only.
   ============================================================ */

const GROQ_CONFIG = {
    baseUrl: "https://api.groq.com/openai/v1",
    model:   "llama3-8b-8192",
    temperature: 0.7,
    maxTokens: 1024
};

/* ─────────────────────────────────────────────────────────────
   Core API call function
───────────────────────────────────────────────────────────── */
async function groqChat(messages, opts) {
    opts = opts || {};
    const sessionData = JSON.parse(sessionStorage.getItem("skillgap_session") || "{}");
    
    let system_prompt = "";
    let user_prompt = "";
    for (let m of messages) {
        if (m.role === "system") system_prompt = m.content;
        else if (m.role === "user") user_prompt += m.content + "\n";
    }

    const response = await fetch(`${window.API_BASE || ''}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_prompt: system_prompt,
            user_prompt: user_prompt.trim(),
            temperature: opts.temperature || 0.5,
            max_tokens: opts.maxTokens || 1024,
            cache_key: opts.cache_key,
            user_id: sessionData.user_id
        })
    });

    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        let errMsg = "Failed to process AI request on backend.";
        
        // If it's a rate limit OR fallback triggered due to backend exception
        if (errBody.error === "RATE_LIMIT_EXCEEDED" || errBody.error === "GROQ_FALLBACK_TRIGGERED") {
            console.warn("Groq unavailable (rate limit or connection error). Returning mock response for cache_key:", opts.cache_key);
            if (opts.cache_key) {
                if (opts.cache_key.startsWith("skills_gap")) {
                    return JSON.stringify({ summary: "Good profile", strengths: ["Python", "JavaScript"], gaps: ["Docker", "AWS"], topPriority: "Docker", readiness: "Intermediate", encouragement: "Keep going! You are doing great." });
                }
                if (opts.cache_key.startsWith("career_rec")) {
                    return JSON.stringify({ topAdvice: "Learn more backend and cloud skills.", alternateRoles: [{role:"Backend Developer", reason:"Matches your python skills", matchEstimate:80}], salaryInsight: "$80k-$100k", nextStep: "Build a full-stack project" });
                }
                if (opts.cache_key.startsWith("roadmap")) {
                    return JSON.stringify({ totalWeeks: 4, phases: [{phase:1, title:"Basics", weeks:"1-2", skills:["Python", "Git"], resources:[], goal:"Learn basics"}], dailyGoal:"1 hour of coding", placementReadiness:70 });
                }
                if (opts.cache_key.startsWith("resume_score")) {
                    return JSON.stringify({ overallScore: 75, atsScore: 70, feedback: { technicalSkills: {score:70, comment:"Good skills shown."}, projects: {score:80, comment:"Nice projects."}, education: {score:90, comment:"Solid background."}, certifications: {score:50, comment:"Consider adding more."}, formatting: {score:85, comment:"Clean format."} }, topImprovements: ["Add more cloud skills", "Expand on project impacts"], atsKeywords: ["Python", "Backend"] });
                }
            }
            errMsg = errBody.details || "Groq API rate limit or connection issue. Please try again later.";
        } else if (errBody.error === "INVALID_API_KEY") {
            errMsg = "Invalid Groq API key: " + (errBody.details || "");
        } else if (errBody.error === "MODEL_ACCESS_DENIED") {
            errMsg = "Groq model access is not available for this API key: " + (errBody.details || "");
        } else if (errBody.error === "SERVICE_UNAVAILABLE") {
            errMsg = "Groq service is temporarily unavailable: " + (errBody.details || "");
        } else if (errBody.error) {
            errMsg = `Backend error (${errBody.error}): ${errBody.details || ""}`;
        }
        throw new Error(errMsg);
    }

    const data = await response.json();
    return data.content;
}

/* ─────────────────────────────────────────────────────────────
   1. Skills Gap AI Insight
   Called from: skills-gap.js
───────────────────────────────────────────────────────────── */
async function groqAnalyzeSkillsGap(role, matched, missing, additional) {
    const prompt = `You are a professional AI career coach for SkillGap AI.

A student is targeting the role: "${role}"
- Matched Skills: ${matched.join(", ") || "None"}
- Missing Skills: ${missing.join(", ") || "None"}
- Additional Skills: ${additional.join(", ") || "None"}

Provide a concise JSON response with EXACTLY this structure (no extra text):
{
  "summary": "One sentence overview of their profile strength",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap insight 1", "gap insight 2", "gap insight 3"],
  "topPriority": "The single most important skill to learn first",
  "readiness": "Beginner | Intermediate | Advanced",
  "encouragement": "A short motivating message for the student"
}`;

    const content = await groqChat([
        { role: "system", content: "You are a career AI. Always respond with valid JSON only, no extra text." },
        { role: "user",   content: prompt }
    ], { maxTokens: 512, temperature: 0.5, cache_key: "skills_gap_" + role });

    // Parse JSON safely
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Groq");
    return JSON.parse(match[0]);
}

/* ─────────────────────────────────────────────────────────────
   2. Resume Score AI Feedback
   Called from: resume-score.js
───────────────────────────────────────────────────────────── */
async function groqResumeScore(resumeText, role) {
    const text = (resumeText || "").slice(0, 2000); // trim for token limits
    const prompt = `You are a professional resume evaluator for SkillGap AI.

Resume Content (truncated): """${text}"""
Target Role: "${role}"

Evaluate the resume and return EXACTLY this JSON (no extra text):
{
  "overallScore": 82,
  "atsScore": 78,
  "feedback": {
    "technicalSkills": { "score": 80, "comment": "Your comment here" },
    "projects":        { "score": 75, "comment": "Your comment here" },
    "education":       { "score": 90, "comment": "Your comment here" },
    "certifications":  { "score": 60, "comment": "Your comment here" },
    "formatting":      { "score": 85, "comment": "Your comment here" }
  },
  "topImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "atsKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const content = await groqChat([
        { role: "system", content: "You are a resume AI. Always respond with valid JSON only." },
        { role: "user",   content: prompt }
    ], { maxTokens: 700, temperature: 0.4, cache_key: "resume_score_" + role });

    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Groq");
    return JSON.parse(match[0]);
}

/* ─────────────────────────────────────────────────────────────
   3. Career Recommendations AI
   Called from: career-recommendations.js
───────────────────────────────────────────────────────────── */
async function groqCareerRecommendations(role, matched, missing, matchPct) {
    const prompt = `You are an AI career advisor for SkillGap AI.

Student profile:
- Target Role: "${role}"
- Match Percentage: ${matchPct}%
- Has Skills: ${matched.join(", ") || "None"}
- Missing Skills: ${missing.join(", ") || "None"}

Return EXACTLY this JSON (no extra text):
{
  "topAdvice": "One paragraph of actionable career advice",
  "alternateRoles": [
    { "role": "Role Name", "reason": "Why they are suited", "matchEstimate": 75 },
    { "role": "Role Name", "reason": "Why they are suited", "matchEstimate": 68 }
  ],
  "salaryInsight": "Brief salary expectation insight",
  "nextStep": "The most important single next action to take"
}`;

    const content = await groqChat([
        { role: "system", content: "You are a career AI. Always respond with valid JSON only." },
        { role: "user",   content: prompt }
    ], { maxTokens: 600, temperature: 0.65, cache_key: "career_rec_" + role });

    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Groq");
    return JSON.parse(match[0]);
}

/* ─────────────────────────────────────────────────────────────
   4. Learning Roadmap AI
   Called from: learning-roadmap.js
───────────────────────────────────────────────────────────── */
async function groqLearningRoadmap(role, missing) {
    const prompt = `You are a learning path AI for SkillGap AI.

Target Role: "${role}"
Skills to Learn: ${missing.join(", ") || "General programming"}

Generate a JSON learning roadmap with EXACTLY this structure:
{
  "totalWeeks": 12,
  "phases": [
    {
      "phase": 1,
      "title": "Foundation",
      "weeks": "1-4",
      "skills": ["skill1", "skill2"],
      "resources": [
        { "name": "Resource Name", "type": "Course | YouTube | Book | Practice", "url": "#", "free": true }
      ],
      "goal": "What the student can do after this phase"
    }
  ],
  "dailyGoal": "Study recommendation per day",
  "placementReadiness": 80
}
Include 3 phases maximum. Keep it realistic and beginner-friendly.`;

    const content = await groqChat([
        { role: "system", content: "You are a learning path AI. Always respond with valid JSON only." },
        { role: "user",   content: prompt }
    ], { maxTokens: 900, temperature: 0.6, cache_key: "roadmap_" + role });

    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Groq");
    return JSON.parse(match[0]);
}

/* ─────────────────────────────────────────────────────────────
   5. AI Chat Assistant (floating chat widget)
───────────────────────────────────────────────────────────── */
async function groqAskAssistant(userMessage, context) {
    const systemPrompt = `You are SkillGap AI, a friendly and knowledgeable career assistant helping students with:
- Resume improvement
- Job role selection
- Skills gap analysis
- Career recommendations
- Learning resources

${context ? "Student context: " + context : ""}

Be concise, helpful, and encouraging. Use bullet points when listing items. Keep responses under 200 words.`;

    return await groqChat([
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage }
    ], { maxTokens: 350, temperature: 0.75 });
}

/* ─────────────────────────────────────────────────────────────
   UI Helpers — show / hide AI loading state
───────────────────────────────────────────────────────────── */
function showGroqLoader(containerId, message) {
    message = message || "AI is analyzing...";
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
        '<div class="groq-loader">' +
            '<div class="groq-spinner"></div>' +
            '<span>' + message + '</span>' +
        '</div>';
}

function showGroqError(containerId, message) {
    message = message || "AI analysis unavailable. Showing default data.";
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
        '<div class="groq-error">' +
            '<i class="fas fa-exclamation-triangle"></i> ' + message +
        '</div>';
}
