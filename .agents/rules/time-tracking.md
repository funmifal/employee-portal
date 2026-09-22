---
trigger: always_on
---

# Time Tracking Rules

## Current Product Scope

Employee time tracking is not a feature defined in the current PRD.

## Mandatory Rules

- Do not implement employee clock-in/clock-out functionality.
- Do not add timesheets.
- Do not add attendance tracking.
- Do not add working-hour calculations.
- Do not add employee productivity tracking.
- Do not add time-based billing.
- Do not interpret `createdAt` or `updatedAt` database fields as employee time tracking.
- Do not introduce time-tracking database models or UI merely because the product is an employee portal.

## Allowed Time Data

System timestamps required by the existing data model may be used for:

- record creation
- record updates
- processing lifecycle
- audit/debugging needs

They must not be presented as employee time-tracking functionality.

## Future Changes

If time tracking becomes a product requirement, define it explicitly before implementation.