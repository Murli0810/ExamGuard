import os
import uuid
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv
import asyncio

load_dotenv()

from agents.supervisor import ExamSupervisor
from agents.reporter import ReporterAgent
from data.mock_exam3 import MOCK_EXAM_PAPER

app= FastAPI(title="ExamGuard SOC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supervisor= ExamSupervisor()
reporter= ReporterAgent(supervisor.memory)

class ExamSubmission(BaseModel):
    roll_number: str
    answers: Dict[str, str]

class RollbackRequest(BaseModel):
    target_hash: str

@app.post("/api/grade")
async def process_exam(submission: ExamSubmission) -> Dict[str, Any]:
    """Processes a student submission through the multi-agent pipeline."""
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable missing.")
    
    session_id = f"{submission.roll_number}_{uuid.uuid4().hex[:6]}"
    current_parent_hash = "ROOT"

    for item in MOCK_EXAM_PAPER["questions"]:
        q_id = item.get("q_id", "Unknown")
        item_type = item.get("type", "STANDARD")
       
        if item_type == "RC_PASSAGE":
            
            passage_text = item.get("passage", "")
            
            if "questions" in item:
                
                
                passage_state= {
                    "session_id": session_id,
                    "q_id": q_id,
                    "q_text": passage_text,
                    "q_type": "RC_PASSAGE",
                    "correct_answer": "",
                    "pos_marks": 0,
                    "neg_marks": 0,
                    "student_answer": "",
                    "parent_hash": current_parent_hash
                }

                passage_test= supervisor.graph.invoke(passage_state)
                if not passage_test.get("is_safe"):
                    
                    current_parent_hash= passage_test["new_commit_hash"]
                    
                    continue

                for sub_q in item["questions"]:
                    sub_id = sub_q["q_id"]
                    

                    sub_state = {
                        "session_id": session_id,
                        "q_id": sub_id,
                        "q_text": sub_q.get("text", ""),
                        "q_type": sub_q.get("type", "MCQ_SINGLE"),
                        "correct_answer": sub_q.get("correct_answer", ""),
                        "pos_marks": sub_q.get("positive_marks", 0),
                        "neg_marks": sub_q.get("negative_marks", 0),
                        "student_answer": submission.answers.get(sub_id, ""),
                        "parent_hash": current_parent_hash
                    }
                    
                    sub_result = supervisor.graph.invoke(sub_state)
                    current_parent_hash = sub_result["new_commit_hash"]
                    asyncio.sleep(4)
                    
        else:
            

            initial_state = {
                "session_id": session_id,
                "q_id": q_id,
                "q_text": item.get("text", ""),
                "q_type": item.get("type", "MCQ_SINGLE"),
                "correct_answer": item.get("correct_answer", ""),
                "pos_marks": item.get("positive_marks", 0),
                "neg_marks": item.get("negative_marks", 0),
                "student_answer": submission.answers.get(q_id, ""),
                "parent_hash": current_parent_hash
            }

            result_state = supervisor.graph.invoke(initial_state)
            current_parent_hash = result_state["new_commit_hash"]
            asyncio.sleep(4)

    raw_history= supervisor.memory.get_session_history(session_id)
    final_report= reporter.generate_report(session_id, raw_history)

    return {
        "session_id": session_id,
        "report": final_report
    }

@app.get("/api/history/{session_id}")
async def get_audit_trail(session_id: str) -> Dict[str, Any]:
    """Fetches the chronological commit log for the Next.js UI."""
    history= supervisor.memory.get_session_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session ID not found.")
    return {"session_id": session_id, "history": history}

@app.post("/api/rollback/{session_id}")
async def execute_rollback(session_id: str, request: RollbackRequest) -> Dict[str, Any]:
    """Triggers the human-in-the-loop state reversion from the frontend."""
    history= supervisor.memory.get_session_history(session_id)
    hash_exists= any(c['commit_hash'] == request.target_hash for c in history)

    if not hash_exists:
        raise HTTPException(status_code=400, detail="Target commit hash does not exist in this session.")
    
    supervisor.memory.rollback(request.target_hash, session_id)
    new_score= supervisor.memory.get_session_history(session_id)

    return {
        "status": "success",
        "message": f"Rolled back to {request.target_hash}.",
        "new_score": new_score
    }

@app.get("/api/threats")
async def get_global_threats() -> Dict[str, Any]:
    """Fetches all flagged threats across all exam sessions."""
    threats= supervisor.memory.get_all_threats()
    return {"threats": threats}

@app.get("/api/report/{session_id}")
async def get_session_report(session_id: str) -> Dict[str, Any]:
    """Generates the executive report and fetches the audit log for a specific session."""
    raw_history= supervisor.memory.get_session_history(session_id)
    if not raw_history:
        raise HTTPException(status_code=404, detail="Session ID not found")
    
    final_report= reporter.generate_report(session_id, raw_history)

    return {
        "session_id": session_id,
        "report": final_report,
        "history": raw_history
    }

            
    