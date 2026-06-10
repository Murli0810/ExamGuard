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
            r"(?i)ignore\s+(all\s+)?(previous\s+)?(instructions|directions)",
            r"(?i)ignore\s+(the\s+)?standard\s+rubric",
            r"(?i)system\s+override",
            r"(?i)you\s+are\s+now",
            r"(?i)bypass\s+(the\s+)?rubric",
            r"(?i)(award|assign)\s+full\s+marks"
        ]

        normalized_content = content.lower().replace("\n", " ").replace("\\n", " ").replace("\\t", " ")

        for pattern in suspicious_patterns:
            if re.search(pattern, normalized_content):
                return True
        
        return False
        
