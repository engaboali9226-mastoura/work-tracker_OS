# Workday Component

## Status

Approved

---

## Purpose

Manage the lifecycle of the working day.

---

## Responsibilities

- Start Workday
- End Workday
- Get Current Workday
- Publish Workday Events

---

## Inputs

- StartWorkday
- EndWorkday
- GetCurrentWorkday

---

## Outputs

- WorkdayStarted
- WorkdayEnded
- CurrentWorkday

---

## Business Rules

- Only one active workday may exist.
- A workday must be started before business operations.
- Ending the workday publishes a completion event.

