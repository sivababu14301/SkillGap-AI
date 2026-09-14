import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from dotenv import load_dotenv

# Load env variables
load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGO_DB = os.getenv("MONGO_DB", "skillgap_ai")

client = None

def get_db():
    global client
    if client is None:
        if not MONGODB_URI:
            print("Database connection error: MONGODB_URI is not set in environment variables.")
            sys.exit(1)
        try:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # The ismaster command is cheap and does not require auth.
            client.admin.command('ping')
            print("MongoDB Atlas connected successfully")
        except Exception as e:
            print(f"Database connection error: Failed to connect to MongoDB Atlas. Details: {e}")
            sys.exit(1)
    return client[MONGO_DB]

def init_db():
    db = get_db()
    # Create collections if they don't exist and ensure indexes
    # 1. users: unique index on email and user_id
    db.users.create_index("email", unique=True)
    db.users.create_index("user_id", unique=True, sparse=True)
    
    # 2. resumes
    db.resumes.create_index("user_id")
    
    # 3. skill_analysis
    db.skill_analysis.create_index("user_id")
    
    # 4. reports
    db.reports.create_index("user_id")
    
    # 5. job_roles
    db.job_roles.create_index("title", unique=True)
    
    # 6. learning_roadmaps
    db.learning_roadmaps.create_index("role")
    
    print("Database collections initialized and indexes created.")
