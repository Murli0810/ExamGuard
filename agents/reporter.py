import json
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

class ReportSummary(BaseModel):
    executive_summary: str = Field(description="A brief 2-3 sentence overview of the student's performance and any security incidents.")
class ReporterAgent():
    def __init__(self, memory_module):
        self.memory= memory_module
        self.llm= ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0).with_structured_output(ReportSummary)

        self.prompt= ChatPromptTemplate.from_messages([
            ("system","""You are ExamGuard's Chief Reporting Officer. 
            Your task is to analyze a raw database audit log of an exam session and generate a clear, professional summary for human examiners.
            
            Strict Directives:
            1. Focus purely on the JSON data provided.
            2. Count the number of threats exactly as they appear in the log (action_type = 'QUARANTINE').
            3. Do not attempt to calculate or mention the final numerical score."""),
            ("human","Here is the JSON audit log for the session:\n{audit_log}")
        ])

        self.chain= self.prompt | self.llm

    def generate_report(self, session_id: str, session_history: list) -> dict:
        """Executes the report generation with fail-secure handling."""
        try:
            audit_log_str= json.dumps(session_history, indent=2)
            llm_result= self.chain.invoke({"audit_log": audit_log_str})
            deterministic_score = self.memory.get_session_score(session_id)
            threat_count= self.memory.get_threat_count(session_id)
            return {
                "executive_summary": llm_result.executive_summary,
                "threats_detected": threat_count,
                "final_recommended_score": deterministic_score
            }
        except Exception as e:
            return {
                "executive_summary": f"Report generation aborted due to system error: {str(e)}.",
                "threats_detected": 0,
                "final_recommended_score": 0
            }