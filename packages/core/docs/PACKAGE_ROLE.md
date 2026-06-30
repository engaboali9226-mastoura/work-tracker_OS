# Package: core

Status: Approved

---

## Purpose

The core package contains platform-wide abstractions that are
independent from any runtime implementation.

It defines the fundamental language of the platform.

---

## Responsibilities

- Core Types
- Core Interfaces
- Component Identity
- Platform Constants
- Lifecycle Contracts
- Platform Errors
- Base Abstractions

---

## Does NOT contain

- Business Logic
- Infrastructure
- Runtime Implementation
- HTTP
- Database
- Storage
- UI

---

## Relationship

core
    ↓
runtime
    ↓
components

The runtime depends on core.

Business components depend on runtime abstractions only.

