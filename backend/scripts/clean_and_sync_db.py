import json
import sqlite3
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.security import get_password_hash, verify_password

db_path = Path(__file__).resolve().parent.parent.parent / "tenderx.db"
sample_path = Path(__file__).resolve().parent.parent / "app" / "data" / "sample_tenders.json"

print(f"Connecting to database at: {db_path}")
conn = sqlite3.connect(str(db_path))
c = conn.cursor()

# 1. Read canonical sample tenders
with open(sample_path, "r", encoding="utf-8") as f:
    canonical = json.load(f)
canonical_ids = [t["tender_id"] for t in canonical]
print(f"Canonical sample tenders: {len(canonical_ids)}")

# 2. Delete non-canonical tenders
placeholders = ",".join(["?"] * len(canonical_ids))
c.execute(f"SELECT id, tender_id FROM tenders WHERE tender_id NOT IN ({placeholders})", canonical_ids)
to_delete = c.fetchall()
print(f"Found {len(to_delete)} non-canonical extra tenders to remove...")

del_tender_uuids = [row[0] for row in to_delete]
if del_tender_uuids:
    uuid_placeholders = ",".join(["?"] * len(del_tender_uuids))
    # delete associated tasks
    c.execute(f"DELETE FROM tender_tasks WHERE tender_id IN ({uuid_placeholders})", del_tender_uuids)
    # delete associated bid documents
    c.execute(f"DELETE FROM bid_documents WHERE tender_id IN ({uuid_placeholders})", del_tender_uuids)
    # delete extra tenders
    c.execute(f"DELETE FROM tenders WHERE id IN ({uuid_placeholders})", del_tender_uuids)

# 3. Update / set user passwords
users_to_sync = [
    ("admin@tenderx.local", "AdminPassword123!", "Tender Manager", "admin", 1),
    ("bidmanager@tenderx.local", "BidManager123!", "Rahul Sharma (Bid Manager)", "bid_manager", 0),
    ("viewer@tenderx.local", "Viewer123!", "Ananya Verma (Audit Viewer)", "viewer", 0),
]

for email, plain_pwd, full_name, role, is_super in users_to_sync:
    hashed = get_password_hash(plain_pwd)
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    if row:
        c.execute("UPDATE users SET hashed_password = ?, full_name = ?, role = ?, is_active = 1, is_superuser = ? WHERE email = ?",
                  (hashed, full_name, role, is_super, email))
        print(f"Updated user: {email} (password verified: {verify_password(plain_pwd, hashed)})")
    else:
        import uuid
        uid = str(uuid.uuid4())
        c.execute("INSERT INTO users (id, email, hashed_password, full_name, is_active, is_superuser, role) VALUES (?, ?, ?, ?, 1, ?, ?)",
                  (uid, email, hashed, full_name, is_super, role))
        print(f"Created user: {email}")

# 4. Ensure Company Profiles exist for all users with consistent details
c.execute("SELECT id, email FROM users")
all_users = c.fetchall()
for u_id, u_email in all_users:
    c.execute("SELECT id FROM company_profiles WHERE user_id = ?", (u_id,))
    if not c.fetchone():
        import uuid
        c.execute("""
            INSERT INTO company_profiles (
                id, user_id, company_name, pan_number, gst_number, udyam_msme_number,
                is_msme, annual_turnover_cr, net_worth_cr, years_of_experience,
                core_competencies
            ) VALUES (?, ?, ?, 'AAACA9876K', '07AAACA9876K1Z9', 'UDYAM-DL-01-0098765', 'Micro', 6.5, 3.2, 6,
            'Turnkey system integration, CCTV and surveillance, IT infrastructure, software solutions')
        """, (str(uuid.uuid4()), u_id, "Apex Enterprise Solutions Pvt Ltd"))
        print(f"Created company profile for user {u_email}")
    else:
        c.execute("""
            UPDATE company_profiles SET
                company_name = 'Apex Enterprise Solutions Pvt Ltd',
                annual_turnover_cr = 6.5,
                net_worth_cr = 3.2,
                years_of_experience = 6,
                is_msme = 'Micro'
            WHERE user_id = ?
        """, (u_id,))
        print(f"Updated company profile for user {u_email}")

conn.commit()

# Final validation
c.execute("SELECT count(*) FROM tenders")
t_count = c.fetchone()[0]
print(f"\n==========================================")
print(f"Final tenders count in DB: {t_count} (Expected: 20)")
assert t_count == 20, f"Expected exactly 20 tenders, but got {t_count}"

c.execute("SELECT email, role, full_name FROM users")
print("Active users in DB:")
for r in c.fetchall():
    print(f" - {r[0]} ({r[1]}): {r[2]}")
print(f"==========================================\n")

conn.close()
