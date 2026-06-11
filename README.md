# ExamGuard: Autonomous Security Operations Center

ExamGuard is an AI-driven, human-in-the-loop security auditing platform designed for examination integrity. Built with a LangGraph backend and a Next.js front-end SOC dashboard, it utilizes cryptographic state ledgers to track, quarantine, and rollback AI grading actions.

## 🏗 Architecture
*   **Frontend:** Next.js (App Router), Tailwind CSS v4, Radix UI primitives.
*   **Backend:** FastAPI, LangGraph (Multi-Agent framework), SQLite (Versioned State Memory).
*   **LLM Engine:** Groq API.

## 🚀 Getting Started

### 1. Backend Setup (FastAPI + LangGraph)
Ensure you have Python installed, then set up the environment:
```bash
# Clone the repository and navigate to the backend folder
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt