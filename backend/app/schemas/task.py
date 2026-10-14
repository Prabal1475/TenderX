from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class TenderTaskBase(BaseModel):
    tender_id: UUID
    title: str
    description: Optional[str] = None
    category: str = Field(
        default="Technical_Bid",
        description="EMD_Payment | Technical_Bid | Financial_Bid | Pre_Bid_Clarification | Submission",
    )
    due_date: Optional[datetime] = None
    is_completed: bool = False
    priority: str = "Medium"


class TenderTaskCreate(TenderTaskBase):
    pass


class TenderTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None


class TenderTaskResponse(TenderTaskBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
