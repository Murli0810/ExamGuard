import re

class ContextSandbox:
    @staticmethod
    def wrap_untrusted_content(content: str) -> str:
        """Wraps untrusted input in XML tags to establish a strict trust boundary."""
        return f"<untrusted_content>\n{content}\n</untrusted_content>"
    
    @staticmethod
    def pre_scan_heuristics(content: str) -> bool:
        """
        Fast, rule-based scan for common injection keywords before hitting the LLM.
        Returns True if a threat is detected, False otherwise.
        """
        suspicious_patterns= [
            r"(?i)ignore\s+(all\s+)?previous\s+(instructions|directions)",
            r"(?i)system\s+override",
            r"(?i)you\s+are\s+now",
            r"(?i)bypass\s+rubric",
            r"(?i)award\s+full\s+marks"
        ]
        for pattern in suspicious_patterns:
            if re.search(pattern, content):
                return True
            return False
        
