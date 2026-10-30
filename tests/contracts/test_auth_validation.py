"""Contrato FastAPI + schemas reais, sem banco, servidor ou credenciais reais."""

import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth.schemas import UserCreate, UserLogin


@pytest.fixture
def client():
    app = FastAPI()

    @app.post("/auth/login/json")
    def login(data: UserLogin):
        return {"accepted": True}

    @app.post("/auth/register")
    def register(data: UserCreate):
        return {"accepted": True}

    with TestClient(app) as test_client:
        yield test_client


@pytest.mark.parametrize("endpoint", ["/auth/login/json", "/auth/register"])
def test_email_validation_matches_frontend_fixture(client, endpoint):
    fixture = Path(__file__).parents[1] / "fixtures" / "auth-validation-error.json"
    expected = json.loads(fixture.read_text(encoding="utf-8"))
    response = client.post(endpoint, json={
        "email": "iago@gmail", "password": "synthetic-password",
    })
    assert response.status_code == 422
    assert response.json() == expected


@pytest.mark.parametrize(
    ("field", "value", "error_type"),
    [
        ("password", "a" * 7, "string_too_short"),
        ("password", "a" * 129, "string_too_long"),
        ("displayName", "a" * 51, "string_too_long"),
    ],
)
def test_registration_limits_match_ui(client, field, value, error_type):
    payload = {"email": "learner@example.com", "password": "synthetic-password", field: value}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", field]
    assert error["type"] == error_type


@pytest.mark.parametrize("password_length", [8, 128])
def test_registration_accepts_boundary_values(client, password_length):
    response = client.post("/auth/register", json={
        "email": "learner+music@sub.example.com",
        "password": "a" * password_length,
        "displayName": "a" * 50,
    })
    assert response.status_code == 200
