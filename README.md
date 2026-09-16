# AI-Based Skills Gap Analyzer

This project is an AI-powered Skills Gap Analyzer designed to help users identify missing skills based on their desired job roles and resume. It uses a Flask backend (Python) and a vanilla HTML/CSS/JS frontend.

## Prerequisites

- Python 3.11+
- MongoDB

## Local Development Setup

1. **Clone the repository**
2. **Install Backend Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment Variables**
   Create a `.env` file in the `backend/` directory based on `backend/.env.example`.
   ```env
   MONGODB_URI=your_mongodb_connection_string
   MONGO_DB=skillgap_ai
   SECRET_KEY=your_secret_key
   GROQ_API_KEY=your_groq_api_key
   ```
4. **Run the Application**
   ```bash
   python backend/app.py
   ```
   The application will be available at `http://localhost:5000`.

## Deployment (Render)

This project is configured to be deployed on Render using the included `render.yaml`.

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn backend.app:app`

Make sure to set your Environment Variables (`MONGODB_URI`, `GROQ_API_KEY`, etc.) in your Render dashboard, as `.env` is ignored by git for security purposes.

## Architecture

- `public/`: Contains all frontend assets (HTML, CSS, JS, images).
- `backend/`: Contains the Flask application, routes, and database models.
- `requirements.txt`: Python dependencies.
- `render.yaml`: Render deployment configuration.
