import sqlite3
import hashlib
import json
from  datetime import datetime

class VersionedMemory:
    def __init__(self, db_path="examguard_memory.db"):
        self.db_path= db_path
        self._initialize_db()
    
    def _initialize_db(self):
        """Creates the commits table if it does not exist."""
        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commits (
                    commit_hash TEXT PRIMARY KEY,
                    parent_hash TEXT,
                    timestamp TEXT,
                    session_id TEXT,
                    action_type TEXT,
                    payload TEXT,
                    is_valid INTEGER DEFAULT 1
                    )
            ''')
            conn.commit()
    
    def _generate_hash(self, parent_hash: str, payload: dict) -> str:
        """Generates a unique SHA-256 hash for the commit."""
        data_string= f"{parent_hash}{json.dumps(payload, sort_keys=True)}{datetime.now().isoformat()}"
        return hashlib.sha256(data_string.encode("utf-8")).hexdigest()[:12]
    
    def commit(self, session_id: str, action_type: str, payload: dict, parent_hash: str = "ROOT") -> str:
        """Records an agent's decision into the version-controlled memory."""
        commit_hash= self._generate_hash(parent_hash, payload)
        timestamp= datetime.now().isoformat()

        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('''
                INSERT INTO commits (commit_hash, parent_hash, timestamp, session_id, action_type, payload, is_valid) VALUES(?,?,?,?,?,?,1)''',(commit_hash, parent_hash, timestamp, session_id, action_type, json.dumps(payload)))
            conn.commit()

        return commit_hash

    def rollback(self, commit_hash: str, session_id: str):
        """Invalidates all commits that occurred strictly after the target commit_hash."""
        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('''SELECT commit_hash FROM commits WHERE session_id = ? ORDER BY timestamp DESC''',(session_id,))
            rows = cursor.fetchall()
            to_invalidate= []

            for row in rows:
                current_hash= row[0]
                if current_hash == commit_hash:
                    break
                to_invalidate.append(current_hash)
            
            if to_invalidate:
                placeholders= ','.join('?' * len(to_invalidate))
                cursor.execute(f'''UPDATE commits SET is_valid = 0 WHERE commit_hash IN {placeholders}''', tuple(to_invalidate))
                conn.commit()
    
    def get_session_history(self, session_id: str) -> list:
        """Retrieves the full chronological commit history for a specific session."""
        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('''SELECT commit_hash, parent_hash, timestamp, action_type, payload, is_valid 
                FROM commits 
                WHERE session_id = ? 
                ORDER BY timestamp ASC''', (session_id,))
            rows= cursor.fetchall()
            columns= [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
    
    def get_session_score(self, session_id: str) -> str:
        """Deterministically calculates the total score by parsing valid grading payloads in Python."""
        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('''SELECT payload FROM commits WHERE session_id = ? AND is_valid = 1 AND action_type = 'GRADE' ''', (session_id,))
            rows = cursor.fetchall()
            total_score= 0

            for row in rows:
                try:
                    payload_dict= json.loads(row[0])
                    total_score += int(payload_dict.get("score", 0))
                except (json.JSONDecodeError, KeyError, TypeError):
                    continue
            return total_score


            
