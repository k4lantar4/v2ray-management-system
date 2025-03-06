import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.config import settings
from app.db.session import Base
from app.core.security import SecurityUtils

# Test database
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def test_user():
    return {
        "email": "test@example.com",
        "password": "test_password",
        "full_name": "Test User"
    }

@pytest.fixture(scope="module")
def test_admin():
    return {
        "email": "admin@example.com",
        "password": "admin_password",
        "full_name": "Admin User",
        "is_admin": True
    }

@pytest.fixture(scope="module")
def test_subscription():
    return {
        "plan_name": "Basic",
        "duration_days": 30,
        "price": 9.99
    }

@pytest.fixture(scope="module")
def test_token(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user["email"],
            "password": test_user["password"]
        }
    )
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def test_headers(test_token):
    return {"Authorization": f"Bearer {test_token}"}
