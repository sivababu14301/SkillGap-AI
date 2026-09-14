import sys

with open("job-roles-data.js", "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find("jobRoles.push(...nonItRoles);")
if idx != -1:
    content = content[:idx + len("jobRoles.push(...nonItRoles);")] + "\n"

with open("job-roles-data.js", "w", encoding="utf-8") as f:
    f.write(content)

print("job-roles-data.js fixed.")
