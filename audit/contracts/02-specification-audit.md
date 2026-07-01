# Contracts Specification Audit

## README

# Contracts

Shared contracts.

----------------------------------------

## Component

name: contracts
type: package
status: foundation
version: 0.1.0

description: >
  Shared contracts, DTOs and public interfaces.

owner: platform

dependencies:
  - shared
  - core

exports: []

contracts:
  - contracts/CONTRACT.md

specification:
  - specification/SPECIFICATION.md

----------------------------------------

## Specification


### packages/contracts/specification/SPECIFICATION.md
# Contracts Specification

## Purpose

Contains transport contracts shared across the platform.

## Responsibilities

- DTOs
- Requests
- Responses
- Messages
- Commands
- Queries
- Events Contracts

## Forbidden

- Business Logic
- Infrastructure
- Runtime
- Services
- Repositories

----------------------------------------

## Public API

export * from "./dtos";
