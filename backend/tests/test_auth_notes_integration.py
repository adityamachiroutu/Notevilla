import os
import uuid

import requests

BASE_URL = os.getenv("NOTEVILLA_API_BASE_URL", "http://localhost:5001/api")
TIMEOUT = 10


def _unique_username(prefix="testuser"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _register(session, username, password):
    return session.post(
        f"{BASE_URL}/auth/register",
        json={"username": username, "password": password},
        timeout=TIMEOUT,
    )


def _login(session, username, password):
    return session.post(
        f"{BASE_URL}/auth/login",
        json={"username": username, "password": password},
        timeout=TIMEOUT,
    )


def _logout(session):
    return session.post(f"{BASE_URL}/auth/logout", timeout=TIMEOUT)


def _me(session):
    return session.get(f"{BASE_URL}/auth/me", timeout=TIMEOUT)


def _create_note(session, title, content):
    return session.post(
        f"{BASE_URL}/notes",
        json={"title": title, "content": content, "tags": "pytest"},
        timeout=TIMEOUT,
    )


def _update_note(session, note_id, title):
    return session.put(
        f"{BASE_URL}/notes/{note_id}",
        json={"title": title},
        timeout=TIMEOUT,
    )


def _delete_note(session, note_id):
    return session.delete(f"{BASE_URL}/notes/{note_id}", timeout=TIMEOUT)


def _list_notes(session):
    return session.get(f"{BASE_URL}/notes", timeout=TIMEOUT)


def test_register_login_logout_flow():
    session = requests.Session()
    username = _unique_username("auth")
    password = "testpass123"

    res = _register(session, username, password)
    assert res.status_code == 201, res.text
    assert res.json()["user"]["username"] == username

    res = _me(session)
    assert res.status_code == 200, res.text
    assert res.json()["user"]["username"] == username

    res = _logout(session)
    assert res.status_code == 200, res.text

    res = _me(session)
    assert res.status_code == 401, res.text

    res = _login(session, username, password)
    assert res.status_code == 200, res.text

    res = _me(session)
    assert res.status_code == 200, res.text
    assert res.json()["user"]["username"] == username


def test_notes_owner_permissions_and_visibility():
    owner_session = requests.Session()
    owner_username = _unique_username("owner")
    owner_password = "testpass123"

    res = _register(owner_session, owner_username, owner_password)
    assert res.status_code == 201, res.text

    res = _create_note(owner_session, "Test Note", "Integration test content")
    assert res.status_code == 201, res.text
    note = res.json()
    note_id = note["_id"]

    viewer_session = requests.Session()
    viewer_username = _unique_username("viewer")
    viewer_password = "testpass123"
    res = _register(viewer_session, viewer_username, viewer_password)
    assert res.status_code == 201, res.text

    res = _list_notes(viewer_session)
    assert res.status_code == 200, res.text
    notes = res.json()
    created_note = next((item for item in notes if item.get("_id") == note_id), None)
    assert created_note is not None
    assert created_note.get("userId", {}).get("username") == owner_username

    res = _update_note(viewer_session, note_id, "Hacked")
    assert res.status_code == 403, res.text

    res = _delete_note(viewer_session, note_id)
    assert res.status_code == 403, res.text

    res = _delete_note(owner_session, note_id)
    assert res.status_code == 200, res.text
