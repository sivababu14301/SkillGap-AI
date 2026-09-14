const fs = require('fs');

const generateScript = fs.readFileSync('backend/generate_120_roles.py', 'utf8');

// Extract the roles array from generate_120_roles.py
const rolesMatch = generateScript.match(/roles = (\[[\s\S]*?\])\n\n    print/);
if (!rolesMatch) {
    console.error("Could not find roles array.");
    process.exit(1);
}
const rolesString = rolesMatch[1];

let seedPy = fs.readFileSync('backend/seed.py', 'utf8');

// Replace everything inside `if db.job_roles.count_documents({}) == 0:` until `for r in roles:` or similar.
// Wait, the original seed.py has `roles = [\n    {\n ...\n    }\n]`
// We can just use a regex to replace `roles = [...]` inside `if db.job_roles.count_documents({}) == 0:`
seedPy = seedPy.replace(/(if db\.job_roles\.count_documents\(\{\}\) == 0:\n\s*roles = )\[[\s\S]*?\](\n\s*for r in roles:|\n\s*db\.job_roles\.insert_many\(roles\))/, `$1${rolesString}$2`);

// Ensure we drop db before checking if we want it to re-seed. 
// Actually, let's just make it drop the job_roles unconditionally on start during this update, or tell the user to drop it.
// Let's modify seed.py to drop job_roles first.
seedPy = seedPy.replace(/# 3\. Seed Default Job Roles/, "# 3. Seed Default Job Roles\n    print('Dropping job_roles...')\n    db.job_roles.drop()");

fs.writeFileSync('backend/seed.py', seedPy);
console.log('Successfully updated seed.py');
