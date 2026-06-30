# Architecture Foundation

Status: Frozen

Version: 1.0

---

# Purpose

Defines the permanent architecture of Work Tracker OS.

Business features MUST evolve without changing this foundation.

Architecture changes require an ADR.

---

# Package Responsibilities

## core

Platform abstractions.

Contains:

- Core Types
- Base Interfaces
- Lifecycle Contracts
- Platform Errors
- Component Identity

Must NOT contain:

- Runtime
- Business Logic
- Infrastructure

---

## runtime

Execution engine.

Contains:

- Component Loader
- Lifecycle Manager
- Port Dispatcher
- Runtime Host
- Health Engine
- Metrics Engine
- Logger
- Tracing

Must NOT contain:

- Business Rules

---

## contracts

Shared contracts.

Contains:

- DTOs
- Shared Schemas
- Public Interfaces

Must NOT contain:

- Runtime code

---

## events

Platform event definitions.

Contains:

- Event Types
- Event Contracts
- Message Definitions

Must NOT contain:

- Business workflows

---

## domain

Business model.

Contains:

- Entity
- Aggregate
- Repository
- Domain Service
- Value Object

Must NOT contain:

- Infrastructure
- HTTP

---

## application

Application use cases.

Contains:

- Commands
- Queries
- Use Cases
- Handlers

Must NOT contain:

- Database
- HTTP

---

## infrastructure

External integrations.

Contains:

- Database
- HTTP
- Storage
- Cache
- Clock
- Configuration

Must NOT contain:

- Business Rules

---

## shared

Pure reusable utilities.

Must remain business independent.

---

## testing

Testing utilities only.

---

# Component Responsibilities

Every component owns:

- Manifest
- Contracts
- Documentation
- Tests
- Implementation

---

# Source Of Truth

Component metadata:

components/*/component.yaml

Runtime registry:

Generated automatically.

Dependencies:

Declared inside component manifests.

Ports:

Declared inside component manifests.

---

# Dependency Direction

Architecture

↓

Core

↓

Runtime

↓

Components

No reverse dependency is allowed.

---

# Modification Policy

Changing the architecture requires:

1. ADR
2. Review
3. Approval

Business implementation MUST NOT modify architecture.

