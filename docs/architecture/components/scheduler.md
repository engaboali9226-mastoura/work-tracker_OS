# scheduler

Generated from Architecture Source of Truth.

## Purpose

Manage all scheduled operations and time-based automation across
Work Tracker OS.

## Responsibilities

- Register Scheduled Jobs
- Execute Scheduled Jobs
- Cancel Scheduled Jobs
- Pause Scheduled Jobs
- Resume Scheduled Jobs
- Retry Failed Jobs
- Publish Schedule Events

## Input Ports

- RegisterSchedule
- CancelSchedule
- PauseSchedule
- ResumeSchedule
- ExecuteSchedule

## Output Ports

- ScheduleRegistered
- ScheduleExecuted
- ScheduleCancelled
- SchedulePaused
- ScheduleResumed
- ScheduleFailed

## Dependencies

- none
