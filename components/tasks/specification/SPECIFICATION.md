# Tasks Component

## Status

Approved

---

## Purpose

Manage the complete lifecycle of work tasks.

---

## Responsibilities

- Create Task
- Start Task
- Pause Task
- Resume Task
- Cancel Task
- Complete Task
- Add Notes
- Retrieve Active Tasks
- Retrieve Task History

---

## Inputs

- CreateTask
- StartTask
- PauseTask
- ResumeTask
- CompleteTask
- CancelTask
- AddTaskNote
- GetTask
- GetActiveTasks

---

## Outputs

- TaskCreated
- TaskStarted
- TaskPaused
- TaskResumed
- TaskCompleted
- TaskCancelled
- TaskNoteAdded
- ActiveTasks

---

## Business Rules

- Every task belongs to one workday.
- Only active tasks may be paused.
- Only paused tasks may be resumed.
- Completed and cancelled tasks are immutable.
- Multiple active tasks are allowed unless restricted by policy.

