from typing import TypedDict, Optional
from langgraph.graph import StateGraph, START, END
from core.sandbox import ContextSandbox
from core.memory import VersionedMemory
from agents.auditor import AuditorAgent
from agents.evaluator import EvaluatorAgent

class QuestionState(TypedDict):
    session_id: str
    q_id: str
    q_text: str
    correct_answer: str
    pos_marks: int
    neg_marks: int
    student_answer: str
    q_type: str

    #Updated by Auditor
    is_safe: Optional[bool]
    flag_reason: Optional[str]

    #Updated by Evaluator
    score: Optional[int]
    justification: Optional[str]

    #Updated by Memory
    parent_hash: str
    new_commit_hash: Optional[str]

class ExamSupervisor:
    def __init__(self, memory_db_path="examguard_memory.db"):
        self.auditor= AuditorAgent()
        self.evaluator= EvaluatorAgent()
        self.memory= VersionedMemory(db_path=memory_db_path)
        self.graph= self._build_graph()

    def _build_graph(self):

        workflow = StateGraph(QuestionState)

        #1.audit node
        def audit_node(state: QuestionState):
            #Pre-scan heuristics first
            if ContextSandbox.pre_scan_heuristics(state["q_text"]):
                return {"is_safe": False, "flag_reason": "Heuristic scan detected injection pattern."}
            
            #LLM Audit
            sandboxed_text = ContextSandbox.wrap_untrusted_content(state["q_text"])
            audit_result = self.auditor.scan(sandboxed_text)
            return {
                "is_safe": audit_result.is_clean,
                "flag_reason": audit_result.flagged_reason
            }
        
        #2.evaluate node
        def evaluate_node(state: QuestionState):

            if state["q_type"] == "TITA":
                if state["student_answer"].strip() == state["correct_answer"].strip():
                    return {
                        "score": state["pos_marks"],
                        "justification": "TITA: Exact match."
                    }
                else:
                    return {
                        "score": 0,
                        "justification": "TITA: NOT match."
                    }
            else:
                eval_result= self.evaluator.evaluate(
                state["correct_answer"],
                state["pos_marks"],
                state["neg_marks"],
                state["student_answer"]
                )
                return {
                "score": eval_result.score,
                "justification": eval_result.justification
                }

        
        #3.memory node
        def memory_node(state: QuestionState):
            payload= {
                "q_id": state["q_id"],
                "student_answer": state["student_answer"],
                "is_safe": state.get("is_safe"),
                "flag_reason": state.get("flag_reason"),
                "score": state.get("score", 0),
                "justification": state.get("justification", "Flagged/Aborted")
            }
            action_type= "GRADE" if state.get("is_safe") else "QUARANTINE"
            commit_hash= self.memory.commit(state["session_id"], action_type, payload, state["parent_hash"])
            return {"new_commit_hash": commit_hash}
        
        #Conditinal Edge
        def route_after_audit(state: QuestionState):
            if state.get("is_safe"):
                return "evaluate"
            return "memory"
        
        workflow.add_node("audit", audit_node)
        workflow.add_node("evaluate", evaluate_node)
        workflow.add_node("memory", memory_node)
        
        workflow.add_edge(START, "audit")
        workflow.add_conditional_edges("audit",route_after_audit, {"evaluate": "evaluate", "memory": "memory"})
        workflow.add_edge("evaluate","memory")
        workflow.add_edge("memory", END)

        return workflow.compile()