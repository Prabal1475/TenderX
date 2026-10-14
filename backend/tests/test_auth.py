from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_password_hashing():
    raw_pwd = "SecretPassword123!"
    hashed = get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_creation_and_decoding():
    subject = "user-12345"
    token = create_access_token(subject=subject)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == subject
