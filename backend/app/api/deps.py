from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..core.config import settings
from ..models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2),
) -> User:
    """Dependency to extract and validate the authenticated user from the JWT."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user


def require_roles(*allowed_roles: str):
    """
    Dependency factory to enforce Role-Based Access Control (RBAC).
    Admin/Superusers always bypass restrictions.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "bid_manager").lower()
        if current_user.is_superuser or user_role == "admin":
            return current_user

        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{user_role}' lacks required permissions. Requires: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


# Convenient role shortcut dependencies
require_admin = require_roles("admin")
require_bid_manager = require_roles("admin", "bid_manager")
require_viewer = require_roles("admin", "bid_manager", "viewer")

