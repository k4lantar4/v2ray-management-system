import pytest
from datetime import timedelta
from app.core.security import SecurityUtils, create_access_token, verify_token, blacklist_token
from app.core.config import settings

def test_password_hashing():
    """Test password hashing and verification"""
    password = "test_password"
    hashed = SecurityUtils.get_password_hash(password)
    assert SecurityUtils.verify_password(password, hashed)
    assert not SecurityUtils.verify_password("wrong_password", hashed)

def test_2fa():
    """Test 2FA secret generation and verification"""
    secret = SecurityUtils.generate_2fa_secret()
    code = SecurityUtils.generate_2fa_code(secret)
    assert SecurityUtils.verify_2fa_code(secret, code)
    assert not SecurityUtils.verify_2fa_code(secret, "000000")

def test_api_key():
    """Test API key generation and verification"""
    api_key = SecurityUtils.generate_api_key()
    hashed = SecurityUtils.hash_api_key(api_key)
    assert SecurityUtils.verify_api_key(api_key, hashed)
    assert not SecurityUtils.verify_api_key("wrong_key", hashed)

def test_phone_validation():
    """Test Iranian phone number validation"""
    assert SecurityUtils.is_valid_iranian_phone("+989123456789")
    assert not SecurityUtils.is_valid_iranian_phone("+1234567890")
    assert not SecurityUtils.is_valid_iranian_phone("123456789")
    assert not SecurityUtils.is_valid_iranian_phone("+98123456")

def test_token_creation():
    """Test JWT token creation and verification"""
    token = create_access_token(
        "test_user",
        expires_delta=timedelta(minutes=15)
    )
    payload = verify_token(token)
    assert payload["sub"] == "test_user"
    assert "jti" in payload
    assert "exp" in payload

def test_token_blacklisting():
    """Test token blacklisting"""
    token = create_access_token("test_user")
    # Token should be valid initially
    payload = verify_token(token)
    assert payload["sub"] == "test_user"
    
    # Blacklist the token
    blacklist_token(token)
    
    # Token should be invalid after blacklisting
    with pytest.raises(Exception) as exc_info:
        verify_token(token)
    assert "Token has been invalidated" in str(exc_info.value)

def test_refresh_token():
    """Test refresh token creation"""
    token = create_access_token(
        "test_user",
        additional_claims={"type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = verify_token(token)
    assert payload["sub"] == "test_user"
    assert payload["type"] == "refresh"

@pytest.mark.parametrize("phone_number,expected", [
    ("+989123456789", True),   # Valid Iranian number
    ("+98912345678", False),   # Too short
    ("+9891234567890", False), # Too long
    ("+88912345678", False),   # Wrong country code
    ("989123456789", False),   # Missing +
    ("+98abcdefghij", False),  # Non-numeric
    ("", False),               # Empty string
    (None, False),             # None
])
def test_phone_validation_cases(phone_number, expected):
    """Test various phone number validation cases"""
    assert SecurityUtils.is_valid_iranian_phone(phone_number) == expected

def test_token_expiration():
    """Test token expiration"""
    # Create a token that expires in 0 seconds
    token = create_access_token(
        "test_user",
        expires_delta=timedelta(seconds=0)
    )
    
    # Token should be invalid
    with pytest.raises(Exception) as exc_info:
        verify_token(token)
    assert "Could not validate credentials" in str(exc_info.value)
