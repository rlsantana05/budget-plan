---
name: budget-summary
description: Show a budget summary with integrity checks based on planning/funding separation
allowed-tools: ["read", "bash", "write"]
argument-hint: "[month]"
---

# Budget Summary with Validation

Provides a summary of the budget state for the given month (default: current month) and validates key budgeting invariants.

## Features

- Shows: Planned, Funded, Spent, Remaining, Available to Allocate
- Validates: Funding never exceeds Available to Allocate
- Validates: Moving money between categories doesn't change total funded
- Validates: Planned amounts can exceed cash (aspirational)
- Shows: Weekly review readiness indicators

## Usage

`/budget-summary [month]`

Where `[month]` is optional in YYYY-MM format (default: current month).

## Example Output

```
Budget Summary for 2024-08
==========================
Available to Allocate: $1,250.00
Planned Total:     $3,800.00
Funded Total:      $2,550.00
Spent Total:       $1,875.00
Remaining Total:   $675.00

✓ Budget integrity checks passed
✓ Funding constraint satisfied
✓ Weekly review recommended (3 days until month end)
```

## Implementation Notes

This command should:
1. Read budget data from your storage layer
2. Calculate key metrics
3. Validate business rules:
   - Funded ≤ Available to Allocate + Income Received
   - Remaining = Funded - Spent ≥ 0
   - Account balances are separate from budgeting
4. Display results with clear pass/fail indicators