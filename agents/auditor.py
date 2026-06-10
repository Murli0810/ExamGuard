import os
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

class AuditResult(BaseModel):
    is_clean: bool = Field(description="True if no prompt injection is detected, False if malicious.")
    confidence_score: float = Field(description="Confidence score from 0.0 to 1.0")
    flagged_reason: str = Field(description="Explanation of the threat if found, or 'Clean' if safe.")

class AuditorAgent:
    def __init__(self):
        self.llm= ChatGroq(model="meta-llama/llama-prompt-guard-2-86m", temperature=0.0)

        self.prompt= ChatPromptTemplate.from_messages([
            ("human", "{sandboxed_text}")
        ])

        self.chain= self.prompt | self.llm

    def scan(self, text: str) -> AuditResult:
        """Executes a text attack classification sweep and returns a standard AuditResult."""
        try:
            response = self.chain.invoke({"sandboxed_text": text})
            raw_output = response.content.strip().lower()
            
            # Expanded checks to catch Prompt Guard 2's specific 'malicious' label
            if any(token in raw_output for token in ["injection", "jailbreak", "unsafe", "malicious"]):
                return AuditResult(
                    is_clean=False,
                    confidence_score=1.0,
                    flagged_reason=f"Exploit Guard triggered: detected target token '{raw_output}'"
                )
            
            # Explicit baseline return path
            return AuditResult(
                is_clean=True,
                confidence_score=1.0,
                flagged_reason="Clean"
            )
            
        except Exception as e:
            # Absolute fail-secure fallback path
            return AuditResult(
                is_clean=False, 
                confidence_score=1.0, 
                flagged_reason=f"Security architecture exception: {str(e)}. Isolating workspace."
            )