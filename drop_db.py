import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from backend.db import get_db, init_db

init_db()
db = get_db()
db.job_roles.drop()
print("job_roles collection dropped.")
