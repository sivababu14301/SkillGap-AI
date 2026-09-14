const fs = require('fs');
let jsContent = fs.readFileSync("job-roles-data.js", "utf-8");
const fullScript = jsContent + "\nconsole.log(JSON.stringify(jobRoles));";
fs.writeFileSync("temp_eval.js", "let window = {};" + fullScript);
const { execSync } = require('child_process');
const output = execSync("node temp_eval.js", { encoding: "utf-8" });
const allJobRoles = JSON.parse(output);

const pyRoles = allJobRoles.map(r => ({
    title: r.name,
    desc: r.description,
    cat: r.category,
    icon: r.icon,
    domain: r.domain,
    skills: r.skills
}));

let seedContent = fs.readFileSync("backend/seed.py", "utf-8");
const pyRolesStr = "roles = " + JSON.stringify(pyRoles, null, 4);
seedContent = seedContent.replace(/roles = \[[\s\S]*?\]\n\s*db\.job_roles\.insert_many\(roles\)/, pyRolesStr + "\n        db.job_roles.insert_many(roles)");
fs.writeFileSync("backend/seed.py", seedContent);
console.log("Seed updated");
