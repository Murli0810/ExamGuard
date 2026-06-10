import os
import sys
import json
import uuid
from dotenv import load_dotenv

from agents.supervisor import ExamSupervisor
from agents.reporter import ReporterAgent
from data.mock_exam3 import MOCK_EXAM_PAPER, MOCK_STUDENT_SUBMISSION

load_dotenv()

def run_demo():
    print("Initializing ExamGuard Pipeline...\n" + "="*40)
    
    supervisor = ExamSupervisor()
    
    session_id = f"{MOCK_STUDENT_SUBMISSION['roll_number']}_{uuid.uuid4().hex[:6]}"
    current_parent_hash = "ROOT"
    
    total_score = 0

    for item in MOCK_EXAM_PAPER["questions"]:
        q_id = item.get("q_id", "Unknown")
        item_type = item.get("type", "STANDARD")
       
        if item_type == "RC_PASSAGE":
            print(f"\nProcessing Reading Comprehension Block {q_id}...")
            passage_text = item.get("passage", "")
            
            if "questions" in item:
                print(f"--- Scanning Sub-Questions for {q_id} ---")
                
                for sub_q in item["questions"]:
                    sub_id = sub_q["q_id"]
                    print(f"\nProcessing Sub-Question {sub_id}...")

                    full_context_text = f"Passage:\n{passage_text}\n\nQuestion:\n{sub_q.get('text', '')}"

                    sub_state = {
                        "session_id": session_id,
                        "q_id": sub_id,
                        "q_text": full_context_text,
                        "correct_answer": sub_q.get("correct_answer", ""),
                        "pos_marks": sub_q.get("positive_marks", 0),
                        "neg_marks": sub_q.get("negative_marks", 0),
                        "student_answer": MOCK_STUDENT_SUBMISSION["answers"].get(sub_id, ""),
                        "parent_hash": current_parent_hash
                    }
                    
                    sub_result = supervisor.graph.invoke(sub_state)
                    current_parent_hash = sub_result["new_commit_hash"]

                    if sub_result.get("is_safe"):
                        sub_score = sub_result.get("score", 0)
                        total_score += sub_score
                        print(f"[✅ SAFE] Sub-Question Score: {sub_score}")
                        print(f"Justification: {sub_result.get('justification')}")
                    else:
                        print(f"[🚨 THREAT DETECTED] Sub-Question {sub_id} quarantined.")
                        print(f"Reason: {sub_result.get('flag_reason')}")

                    print(f"Commit Hash: {current_parent_hash}")
                    
        else:
            
            print(f"\nProcessing {q_id}...")

            initial_state = {
                "session_id": session_id,
                "q_id": q_id,
                "q_text": item.get("text", ""),
                "correct_answer": item.get("correct_answer", ""),
                "pos_marks": item.get("positive_marks", 0),
                "neg_marks": item.get("negative_marks", 0),
                "student_answer": MOCK_STUDENT_SUBMISSION["answers"].get(q_id, ""),
                "parent_hash": current_parent_hash
            }

            result_state = supervisor.graph.invoke(initial_state)
            current_parent_hash = result_state["new_commit_hash"]
            is_safe = result_state.get("is_safe")

            if is_safe:
                score = result_state.get("score", 0)
                total_score += score
                print(f"[✅ SAFE] Evaluated Score: {score}")
                print(f"Justification: {result_state.get('justification')}")
            else:
                print(f"[🚨 THREAT DETECTED] Question quarantined.")
                print(f"Reason: {result_state.get('flag_reason')}")
            
            print(f"Commit Hash: {current_parent_hash}")
            print("-" * 40)
            
    print("\n" + "="*40)
    print("GENERATING EXAMINER AUDIT REPORT...")
    print("="*40)
    
    reporter = ReporterAgent(supervisor.memory)
    raw_history = supervisor.memory.get_session_history(session_id)
    final_report = reporter.generate_report(session_id, raw_history)
    
    print(f"SESSION ID: {session_id}")
    print(f"FINAL SCORE: {final_report.get('final_recommended_score', 0)}")
    print(f"SECURITY THREATS: {final_report.get('threats_detected', 0)}")
    print(f"\nEXECUTIVE SUMMARY:\n{final_report.get('executive_summary', 'Error generating report.')}")
    print("\n[To view exact commit hashes and trigger a rollback, query the examguard_memory.db file]")
    print("Demo execution completed.")


if __name__ == "__main__":
    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY is not set in the environment.")
        sys.exit(1)
    
    if "--reset" in sys.argv:
        if os.path.exists("examguard_memory.db"):
            os.remove("examguard_memory.db")
            print("✅ Database successfully wiped. ExamGuard is ready for a clean run.")
        else:
            print("Database already clean.")
        sys.exit(0)
    
    run_demo()