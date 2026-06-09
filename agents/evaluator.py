from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

class GradeResult(BaseModel):
    score: int = Field(description="The exact numeric score awarded based on the rubric.")
    justification: str = Field(description="A concise, one-sentence explanation of the scoring decision")

class EvaluatorAgent:
    def __init__(self):
        self.llm= ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0).with_structured_output()

        self.prompt= ChatPromptTemplate.from_messages([
            ("system","""You are an inflexible, highly accurate Evaluator Agent.
             Your sole purpose is to compare student's answer against the correct answer and apply the mathematical grading rubric.
             
             Strict Grading Rules:
             1. EXACT MATCH: If the student answer matches the correct answer perfectly, award the exact 'Positive Marks' value.
             2. INCORRECT MATCH: If the student answer does not match the correct answer, award the exact 'Negative Marks' value.
             3. NO ANSWER: If the student answer is missing, empty, or 'skipped', award 0 marks.
             
             Do NOT hallucinate decimal scores or ignore the provided rubric values."""),
             ("human","""
             Correct Answer: {correct_answer}
             Positive Marks: {pos_marks}
             Negative Marks: {neg_marks}
              
             Student Answer: {student_answer}""")
        ])

        self.chain= self.prompt | self.llm

    def evaluate(self, correct_answer: str, pos_marks: int, neg_marks: int, student_answer: str) -> GradeResult:
        """Executes the grading logic with fail-secure error handling."""
        try:
            result= self.chain.invoke({
                "correct_answer": str(correct_answer).strip(),
                "pos_marks": pos_marks,
                "neg_marks": neg_marks,
                "student_answer": str(student_answer).strip()
            })
            return result
        except Exception as e:
            return GradeResult(
                score=0,
                justification=f"Evaluation aborted due to system error: {str(e)}"
            )
