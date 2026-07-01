# Shared Specification

## Purpose

The Shared package provides generic, framework-independent building blocks
that can be reused by every package in the platform.

## Responsibilities

- Shared types
- Shared value objects
- Common utilities
- Generic helpers
- Generic constants
- Generic errors

## Forbidden

The Shared package MUST NOT contain:

- Business logic
- Domain logic
- Infrastructure logic
- Runtime logic
- SDK logic
- UI code
- Framework-specific code
- Repository implementations
- Services

## Dependencies

Shared must remain dependency-free except for standard TypeScript/JavaScript
libraries.

## Consumers

Expected consumers include:

- Core
- Domain
- Contracts
- SDK
- Runtime
- Infrastructure
- Applications

