import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_email_and_username_directly_in_db():
    # 1. Admin login via full email
    res1 = client.post("/api/v1/auth/login/json", json={"email": "admin@tenderx.local", "password": "AdminPassword123!"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["email"] == "admin@tenderx.local"
    assert data1["role"] == "admin"
    assert "access_token" in data1

    # 2. Admin login via username ("admin")
    res2 = client.post("/api/v1/auth/login/json", json={"username": "admin", "password": "AdminPassword123!"})
    assert res2.status_code == 200
    assert res2.json()["email"] == "admin@tenderx.local"

    # 3. Bid Manager login via email and username
    res3 = client.post("/api/v1/auth/login/json", json={"email": "bidmanager@tenderx.local", "password": "BidManager123!"})
    assert res3.status_code == 200
    assert res3.json()["role"] == "bid_manager"

    res3b = client.post("/api/v1/auth/login/json", json={"username": "bidmanager", "password": "BidManager123!"})
    assert res3b.status_code == 200

    # 4. Viewer login via email and username
    res4 = client.post("/api/v1/auth/login/json", json={"email": "viewer@tenderx.local", "password": "Viewer123!"})
    assert res4.status_code == 200
    assert res4.json()["role"] == "viewer"

    res4b = client.post("/api/v1/auth/login/json", json={"username": "viewer", "password": "Viewer123!"})
    assert res4b.status_code == 200

    # 5. Invalid credentials rejection
    res5 = client.post("/api/v1/auth/login/json", json={"email": "admin@tenderx.local", "password": "WrongPassword"})
    assert res5.status_code == 400
    assert "Incorrect username/email or password" in res5.json()["detail"]

    res6 = client.post("/api/v1/auth/login/json", json={"email": "nonexistent@user.com", "password": "AnyPassword123!"})
    assert res6.status_code == 400


def test_tender_count_is_strictly_twenty_and_stable_on_refresh():
    # Login as admin
    login_res = client.post("/api/v1/auth/login/json", json={"email": "admin@tenderx.local", "password": "AdminPassword123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First fetch (initial page load)
    res1 = client.get("/api/v1/tenders/", headers=headers)
    assert res1.status_code == 200
    tenders1 = res1.json()
    assert len(tenders1) == 20, f"Expected exactly 20 tenders, got {len(tenders1)}"

    t_map = {t["tender_id"]: t for t in tenders1}
    assert "GEM/2026/B/8912401" in t_map
    assert "CPPP/2026/NHAI/TOLL/889" in t_map

    railway = t_map["GEM/2026/B/8912401"]
    nhai = t_map["CPPP/2026/NHAI/TOLL/889"]
    assert railway["overall_match_score"] == 94
    assert railway["is_hard_eligible"] is True
    assert nhai["overall_match_score"] == 42
    assert nhai["is_hard_eligible"] is False

    # Second fetch (page refresh simulation)
    res2 = client.get("/api/v1/tenders/", headers=headers)
    assert res2.status_code == 200
    tenders2 = res2.json()
    assert len(tenders2) == 20, "Tender count must remain 20 on refresh"
    assert [t["id"] for t in tenders1] == [t["id"] for t in tenders2], "Tender order must remain stable"
    assert [t["overall_match_score"] for t in tenders1] == [t["overall_match_score"] for t in tenders2], "Scores must remain identical"

    # Triggering Ingestion must NOT add random/synthetic tenders
    ingest_res = client.post("/api/v1/tenders/ingest?portal=all&generate_mock=false", headers=headers)
    assert ingest_res.status_code == 200

    # Third fetch (after ingest)
    res3 = client.get("/api/v1/tenders/", headers=headers)
    assert res3.status_code == 200
    tenders3 = res3.json()
    assert len(tenders3) == 20, "Tender count must strictly stay 20 even after ingestion sync"
