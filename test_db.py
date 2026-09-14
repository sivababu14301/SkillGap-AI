import sys
sys.path.insert(0, '.')
from backend.db import get_db

try:
    db = get_db()
    db.command('ping')
    print('MongoDB connected successfully!')
except Exception as e:
    print(f'MongoDB connection failed: {e}')
