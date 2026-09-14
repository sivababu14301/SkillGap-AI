import sys

with open('backend/seed.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
# Find 'roles = ['
start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'roles = [':
        start_idx = i
        break

# Find 'from backend.non_it_roles import get_non_it_roles'
end_idx = -1
for i, line in enumerate(lines):
    if 'from backend.non_it_roles import get_non_it_roles' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx]
    
    new_lines.append('    import os\n')
    new_lines.append('    from backend.csv_loader import load_it_roles_from_csv\n')
    new_lines.append('    csv_path = os.path.join(os.path.dirname(__file__), "..", "IT_120_Job_Roles_Skills_Dataset.csv")\n')
    new_lines.append('    roles = load_it_roles_from_csv(csv_path)\n\n')
    
    new_lines.extend(lines[end_idx:])
    
    with open('backend/seed.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print('seed.py successfully updated.')
else:
    print('Indices not found:', start_idx, end_idx)
