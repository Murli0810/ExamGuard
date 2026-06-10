import json
import sys
from core.memory import VersionedMemory

def main():
    memory= VersionedMemory()

    print("=" * 50)
    print(" EXAMGUARD HUMAN-IN-THE-LOOP CONTROL DASHBOARD")
    print("=" * 50)

    session_id= input("Enter Target Student Session ID: ").strip()
    history= memory.get_session_history(session_id)

    if not history:
        print("❌ No audit records located for the specified Session ID.")
        sys.exit(1)
    
    print(f"\nChronological Audit Trail for Session: {session_id}")
    print("-" * 75)
    print(f"{'COMMIT HASH':<15} | {'ACTION TYPE':<12} | {'VALIDITY':<8} | {'SUMMARY'}")
    print("-" * 75)

    for commit in history:
        payload= json.loads(commit['payload'])
        status= "ACTIVE" if commit['is_valid'] == 1 else 'REJECTED'

        if commit['action_type'] == 'GRADE':
            summary= f"Q-ID: {payload.get('q_id')} | Awarded Score: {payload.get('score')}"
        else:
            summary= f"Q-ID: {payload.get('q_id')} | Flagged Reason: {payload.get('flag_reason')[:40]}..."

        print(f"{commit['commit_hash']:<15} | {commit['action_type']:<12} | {status:<8} | {summary}")

    print("-" * 75)

    target_hash= input("\nEnter target commit hash to roll back to (Keep Safe Base): ").strip()
    
    hash_exists= any(c['commit_hash'] == target_hash for c in history)
    if not hash_exists:
        print("❌ Error: Specified hash does not exist in this session context.")
        sys.exit(1)

    confirm = input(f"⚠️ Are you sure you want to invalidate all commits after {target_hash}? (yes/no): ")
    if confirm.lower() == 'yes':
        memory.rollback(target_hash, session_id)
        print(f"\n✅ State successfully restored. Commits following {target_hash} have been invalidated.")

    else:
        print("\nOperation cancelled.")
    
    print("*" * 50)
    print("UPDATED HISTORY AFTER ROLLBACK")
    print("*" * 50)

    updated_history = memory.get_session_history(session_id)
    print("-" * 75)
    print(f"{'COMMIT HASH':<15} | {'ACTION TYPE':<12} | {'VALIDITY':<8} | {'SUMMARY'}")
    print("-" * 75)
    for commit in updated_history:
        payload= json.loads(commit['payload'])
        status= "ACTIVE" if commit['is_valid'] == 1 else 'REJECTED'

        if commit['action_type'] == 'GRADE':
            summary= f"Q-ID: {payload.get('q_id')} | Awarded Score: {payload.get('score')}"
        else:
            summary= f"Q-ID: {payload.get('q_id')} | Flagged Reason: {payload.get('flag_reason')[:40]}..."

        print(f"{commit['commit_hash']:<15} | {commit['action_type']:<12} | {status:<8} | {summary}")

if __name__ == "__main__":
    main()

