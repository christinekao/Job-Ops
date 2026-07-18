# TASK-003

## Title

Plan Contract-Aligned Implementation and Regression Coverage

## Status

BLOCKED

## Objective

Create an implementation-ready, bounded change plan for gaps between approved Stage Contracts and current code/tests.

## Problem

Implementation scope cannot be safely defined until contracts and acceptance artifacts are approved.

## Root cause addressed

Only root causes explicitly accepted in TASK-002; none may be assumed in advance.

## Evidence

TASK-001 audit, TASK-002 approved contract, exact production symbols and test gaps mapped in those reports.

## Dependencies

TASK-001 and TASK-002 completed and verified; explicit authorization for each production file; approved actual/ideal CV fixtures and test expectations.

## Files allowed to change

None while BLOCKED. A future READY revision must enumerate exact files.

## Files prohibited from changing

All repository files while BLOCKED; after readiness, anything outside the explicit allowlist remains prohibited.

## Implementation requirements

Split each newly discovered issue into a new task; order changes by dependency; specify migration, tests and rollback before implementation; do not combine refactor and behavior changes without approval.

## Acceptance criteria

Every proposed change traces to an approved contract gap, names exact files/symbols, has bounded tests and contains no unapproved best-practice requirement.

## Required tests

To be derived from approved contracts; baseline candidates are `npm run test:system` plus explicitly approved browser/PDF/prompt fixtures. Candidate status is not a confirmed requirement.

## Regression risks

CV/JD identity invalidation, stale review snapshots, persistence revision conflict, duplicate automation apply, unsupported claims, repeat AI repair and PDF/export regressions.

## Rollback method

Per-change rollback must be defined before implementation; preserve data schema/backups and avoid destructive migration unless separately authorized.

## Definition of done

An approved sequence of independently executable implementation tasks exists. This document alone does not authorize implementation.

## Completion report format

```text
TASK-003 Completion Report
Status:
Approved implementation tasks:
Files/symbols mapped:
Tests mapped:
Migration/rollback:
Remaining blockers:
Production code changed: No (planning phase)
```
