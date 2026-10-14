from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...models.task import TenderTask
from ...schemas.task import TenderTaskResponse, TenderTaskCreate, TenderTaskUpdate
from ..deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Deadline & Task Tracker"])


@router.get("/", response_model=List[TenderTaskResponse])
def list_tasks(
    tender_id: Optional[UUID] = Query(None, description="Filter by tender"),
    is_completed: Optional[bool] = Query(None, description="Filter by completion status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List bid deadlines, checklists, and tasks for the current user."""
    query = db.query(TenderTask).filter(TenderTask.user_id == current_user.id)
    if tender_id:
        query = query.filter(TenderTask.tender_id == tender_id)
    if is_completed is not None:
        query = query.filter(TenderTask.is_completed == is_completed)

    tasks = query.order_by(TenderTask.due_date.asc().nullslast()).all()
    return tasks


@router.post("/", response_model=TenderTaskResponse)
def create_task(
    task_in: TenderTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new tender deadline, milestone, or action item."""
    task = TenderTask(
        **task_in.model_dump(),
        user_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TenderTaskResponse)
def update_task(
    task_id: UUID,
    task_in: TenderTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update task details, mark completed, or adjust deadline."""
    task = db.query(TenderTask).filter(
        TenderTask.id == task_id,
        TenderTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = task_in.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a task."""
    task = db.query(TenderTask).filter(
        TenderTask.id == task_id,
        TenderTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
