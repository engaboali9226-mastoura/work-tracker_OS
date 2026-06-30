# Attendance Component

## Status

Approved

---

## Purpose

Manage attendance and departure records.

---

## Responsibilities

- Register Check-In
- Register Check-Out
- Calculate Working Duration
- Determine Attendance Status

---

## Inputs

- CheckIn
- CheckOut
- GetAttendance

---

## Outputs

- CheckedIn
- CheckedOut
- AttendanceStatus

---

## Business Rules

- A check-in is required before check-out.
- Only one active attendance session is allowed.
- Attendance belongs to the current workday.

