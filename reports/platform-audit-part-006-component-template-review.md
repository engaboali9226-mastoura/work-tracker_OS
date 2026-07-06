# Platform Audit Part 006 - Component Template Review

========================================
TEMPLATE TREE
========================================
templates/component/CONTRACT.md
templates/component/DECISIONS.md
templates/component/EXECUTION.md
templates/component/HEALTH.md
templates/component/LOGGING.md
templates/component/METRICS.md
templates/component/README.md
templates/component/SPECIFICATION.md
templates/component/TESTS.md
templates/component/component.yaml

==================================================
templates/component/CONTRACT.md
==================================================
# Component Contract

## Input Ports

---

## Output Ports

---

## Input Messages

---

## Output Messages

---

## Validation

---

## Version


==================================================
templates/component/DECISIONS.md
==================================================
# Decisions

Document all architectural decisions related to this component.


==================================================
templates/component/EXECUTION.md
==================================================
# Execution

Creation

Update

Validation

Testing


==================================================
templates/component/HEALTH.md
==================================================
# Health

Status

Dependencies

Checks

Recovery


==================================================
templates/component/LOGGING.md
==================================================
# Logging

Inputs

Outputs

Warnings

Errors

Execution Time


==================================================
templates/component/METRICS.md
==================================================
# Metrics

Execution Count

Execution Time

Failures

Success Rate


==================================================
templates/component/README.md
==================================================
# Component

Purpose

Responsibilities

Folder Structure

How To Execute

How To Test


==================================================
templates/component/SPECIFICATION.md
==================================================
# Component Specification

---

## Component Name

---

## Purpose

---

## Responsibilities

---

## Non Responsibilities

---

## Inputs

---

## Outputs

---

## Commands

---

## Events In

---

## Events Out

---

## Business Rules

---

## State

---

## Configuration

---

## Dependencies

---

## Contracts

---

## Health Check

---

## Logging

---

## Metrics

---

## Security

---

## Validation Rules

---

## Error Handling

---

## Test Scenarios

---

## Acceptance Criteria


==================================================
templates/component/TESTS.md
==================================================
# Test Plan

Unit Tests

Integration Tests

Contract Tests

Failure Tests

Recovery Tests


==================================================
templates/component/component.yaml
==================================================
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft



[PASS] Component Template Review Completed.
