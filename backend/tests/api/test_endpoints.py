import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()
    assert response.json()["version"] == settings.VERSION

def test_security_headers():
    """Test security headers are properly set"""
    response = client.get("/health")
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
    assert response.headers["Content-Security-Policy"]
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Permissions-Policy"]

def test_rate_limiting():
    """Test rate limiting middleware"""
    # Make requests up to the limit
    for _ in range(settings.RATE_LIMIT_PER_MINUTE):
        response = client.get("/health")
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = client.get("/health")
    assert response.status_code == 429
    assert "Too many requests" in response.json()["detail"]["message"]

def test_cors_headers():
    """Test CORS headers are properly set"""
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers
    assert "Access-Control-Allow-Methods" in response.headers
    assert "Access-Control-Allow-Headers" in response.headers

@pytest.mark.api
def test_auth_flow(test_user):
    """Test complete authentication flow"""
    # Register
    response = client.post(
        "/api/v1/auth/register",
        json=test_user
    )
    assert response.status_code == 201
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "token_type" in response.json()
    token = response.json()["access_token"]
    
    # Access protected endpoint
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]

@pytest.mark.api
def test_invalid_token():
    """Test invalid token handling"""
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

@pytest.mark.api
def test_expired_token():
    """Test expired token handling"""
    # Note: This test relies on the token expiration being handled by the verify_token function
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJleHAiOjE1MTYyMzkwMjJ9.7w_2hzBjQq9uD5tR5K11KrEsQxvjzJ9dvU2DjqFLf8U"}
    )
    assert response.status_code == 401

@pytest.mark.api
def test_error_handling():
    """Test error handling middleware"""
    # Test 404 handling
    response = client.get("/nonexistent")
    assert response.status_code == 404
    assert "timestamp" in response.json()
    
    # Test validation error handling
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.api
def test_admin_access(test_admin, test_headers):
    """Test admin-only endpoint access"""
    # Regular user should not have access
    response = client.get(
        "/api/v1/admin/users",
        headers=test_headers
    )
    assert response.status_code == 403
    
    # Admin should have access
    admin_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_admin["email"],
            "password": test_admin["password"]
        }
    )
    admin_token = admin_response.json()["access_token"]
    
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200

@pytest.mark.api
def test_subscription_management(test_headers, test_subscription):
    """Test subscription management endpoints"""
    # Create subscription
    response = client.post(
        "/api/v1/subscriptions/",
        headers=test_headers,
        json=test_subscription
    )
    assert response.status_code == 201
    sub_id = response.json()["id"]
    
    # Get subscription
    response = client.get(
        f"/api/v1/subscriptions/{sub_id}",
        headers=test_headers
    )
    assert response.status_code == 200
    assert response.json()["plan_name"] == test_subscription["plan_name"]
    
    # Update subscription
    response = client.put(
        f"/api/v1/subscriptions/{sub_id}",
        headers=test_headers,
        json={"duration_days": 60}
    )
    assert response.status_code == 200
    assert response.json()["duration_days"] == 60
