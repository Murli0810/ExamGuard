import sqlite3
import hashlib
import json
from  datetime import datetime

class VersionedMemory:
    def __init__(self, db_path="ExamGuard_memory.db"):
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
                INSERT INTO commits (commit_hash, parent_hash, timestamp, session_id, action_type, payload, is_valid)
                           VALUES(?, ?, ?, ?, ?, ?, 1)
                        '''),(commit_hash, parent_hash, timestamp, session_id, action_type, json.dumps(payload))
            conn.commit()

        return commit_hash

    def rollback(self, commit_hash: str):
        """Invalidates the specified commit and all subsequent commits descending from it."""
        with sqlite3.connect(self.db_path) as conn:
            cursor= conn.cursor()
            cursor.execute('SELECT timestamp FROM commits WHERE commit_hash = ?)', (commit_hash))
            result= cursor.fetchone()

            if result:
                compromised_time= result[0]
                cursor.execute('''
                    UPDATE commits 
                    SET is_valid = 0 
                    WHERE timestamp >= ?
                    ''', (compromised_time,))
                conn.commit() 

            
