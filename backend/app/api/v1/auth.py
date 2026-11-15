from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token
from ...models.user import User
from ...models.company import CompanyProfile
from ...schemas.auth import Token, UserCreate, UserResponse, UserLogin
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

VALID_ROLES = ["admin", "bid_manager", "viewer"]


def find_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    """Find a user in the database by email, username/full_name, or email prefix."""
    if not identifier:
        return None
    raw = identifier.strip()
    low = raw.lower()

    # 1. Exact match on email (case-insensitive)
    user = db.query(User).filter(func.lower(User.email) == low).first()
    if user:
        return user

    # 2. Match on full_name (case-insensitive)
    user = db.query(User).filter(func.lower(User.full_name) == low).first()
    if user:
        return user

    # 3. Match username prefix of email (e.g. 'admin' matches 'admin@tenderx.local')
    user = db.query(User).filter(User.email.ilike(f"{low}@%")).first()
    if user:
        return user

    # 4. Single match substring in full name
    matches = db.query(User).filter(User.full_name.ilike(f"%{raw}%")).all()
    if len(matches) == 1:
        return matches[0]

    return None


def verify_user_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password via bcrypt hash, with plain text fallback for database records."""
    if not plain_password or not hashed_password:
        return False
    if verify_password(plain_password, hashed_password):
        return True
    if plain_password == hashed_password:
        return True
    return False


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 compatible token login, checking username or email directly in the database."""
    user = find_user_by_identifier(db, form_data.username)
    if not user or not verify_user_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username/email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    role = user.role or ("admin" if user.is_superuser else "bid_manager")
    access_token = create_access_token(
        subject=str(user.id),
        claims={"role": role, "email": user.email, "full_name": user.full_name},
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/login/json", response_model=Token)
def login_json(
    login_data: UserLogin,
    db: Session = Depends(get_db),
) -> Any:
    """JSON body login endpoint, checking username or email directly in the database."""
    identifier = login_data.email or login_data.username or ""
    user = find_user_by_identifier(db, identifier)
    if not user or not verify_user_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username/email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    role = user.role or ("admin" if user.is_superuser else "bid_manager")
    access_token = create_access_token(
        subject=str(user.id),
        claims={"role": role, "email": user.email, "full_name": user.full_name},
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/register", response_model=UserResponse)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Create a new user and initialize an associated CompanyProfile."""
    clean_email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists in the database.",
        )

    assigned_role = (user_in.role or "bid_manager").lower()
    if assigned_role not in VALID_ROLES:
        assigned_role = "bid_manager"

    user = User(
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip() if user_in.full_name else clean_email.split("@")[0].title(),
        is_active=True,
        is_superuser=(assigned_role == "admin"),
        role=assigned_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically initialize complete company profile for consistent matching
    default_profile = CompanyProfile(
        user_id=user.id,
        company_name=f"{user.full_name or 'My'} Enterprise Solutions",
        pan_number="AAACA9876K",
        gst_number="07AAACA9876K1Z9",
        udyam_msme_number="UDYAM-DL-01-0098765",
        is_msme="Micro",
        annual_turnover_cr=6.5,
        net_worth_cr=3.2,
        years_of_experience=6,
        sectors=["IT Infrastructure", "CCTV Surveillance", "Software Solutions"],
        certifications=["ISO 9001:2015", "ISO 27001:2022"],
        core_competencies="Government tendering, enterprise software, system integration, IT infrastructure, and facilities AMC.",
    )
    db.add(default_profile)
    db.commit()

    return user


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get profile information for current authenticated user."""
    return current_user


@router.get("/roles")
def get_rbac_roles_matrix() -> Any:
    """Get RBAC roles definition and permission matrix."""
    return {
        "roles": [
            {
                "id": "admin",
                "label": "Administrator",
                "badge": "Full Access",
                "description": "Full access to user management, company credentials, bid generation, tender evaluation, and system configurations.",
                "permissions": [
                    "manage_users",
                    "manage_company_profile",
                    "upload_documents",
                    "delete_documents",
                    "generate_bids",
                    "edit_bids",
                    "export_packages",
                    "manage_tasks",
                ],
            },
            {
                "id": "bid_manager",
                "label": "Bid Manager",
                "badge": "Standard Access",
                "description": "Evaluate tenders, upload compliance documents, synthesize proposals in Bid Studio, and manage milestones.",
                "permissions": [
                    "view_company_profile",
                    "upload_documents",
                    "generate_bids",
                    "edit_bids",
                    "export_packages",
                    "manage_tasks",
                ],
            },
            {
                "id": "viewer",
                "label": "Auditor / Viewer",
                "badge": "Read Only",
                "description": "Read-only access to discover tenders, review qualification match scores, inspect credential vault, and read proposal drafts.",
                "permissions": [
                    "view_tenders",
                    "view_evaluations",
                    "view_documents",
                    "view_proposals",
                    "read_company_profile",
                ],
            },
        ]
    }


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all platform users and their roles for workspace access visibility."""
    return db.query(User).all()


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Any:
    """Admin-only: update user role."""
    target_role = new_role.lower()
    if target_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = target_role
    if target_role == "admin":
        user.is_superuser = True
    else:
        user.is_superuser = False

    db.commit()
    db.refresh(user)
    return user


@router.post("/switch-role", response_model=Token)
def switch_current_user_role(
    role_in: str = Query(..., description="Target role to switch to (admin, bid_manager, viewer)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Switch active role of the current user for testing and permission evaluation."""
    target_role = role_in.lower()
    if target_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    current_user.role = target_role
    current_user.is_superuser = (target_role == "admin")
    db.commit()
    db.refresh(current_user)

    access_token = create_access_token(
        subject=str(current_user.id),
        claims={"role": target_role, "email": current_user.email, "full_name": current_user.full_name},
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": target_role,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
    }


