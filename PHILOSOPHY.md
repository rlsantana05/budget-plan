<!-- BEGIN:nextjs-agent-rules -->

# AGENTS.md

# Budgeting App

## Mission

Build a modern, intuitive personal budgeting application that helps people confidently manage their money without forcing them into a single budgeting philosophy.

This application combines the strengths of EveryDollar's monthly planning with YNAB's "budget only the money you have" approach.

The application should always prioritize clarity, simplicity, and confidence over accounting complexity.

---

# Product Philosophy

This is NOT an EveryDollar clone.

This is NOT a YNAB clone.

It intentionally separates **planning** from **funding**.

## Core Workflow

Users move through the same lifecycle every month:

```
Plan Month
    ↓
Receive Income
    ↓
Fund Categories
    ↓
Spend Money
    ↓
Weekly Review
    ↓
Adjust Funding
    ↓
Close Month
```

These stages should remain conceptually separate throughout the application.

---

# Budgeting Philosophy

## Planning

Users may plan their entire month before receiving all income.

Planning answers:

> "What do I want my money to accomplish this month?"

Planning is aspirational.

Planned amounts are allowed to exceed currently available cash.

Planning never represents actual money.

---

## Funding

Only real money that has already been earned can be funded into categories.

Funding answers:

> "What jobs can my current dollars perform?"

Funding is reality.

Never allow more money to be funded than is actually available.

---

## Spending

Transactions reduce funded money.

Transactions never modify the planned budget.

---

## Weekly Reviews

Budgets are monthly.

Reviews are weekly.

Weekly reviews exist to answer:

- Are we spending too quickly?
- Which categories are falling behind?
- Should money be moved?
- Are we likely to finish the month successfully?

Weeks are review checkpoints.

Weeks are never budgeting periods.

---

# Core Concepts

The system revolves around these concepts.

## User

Owns accounts, budgets, transactions, and goals.

---

## Account

Represents where money exists.

Examples:

- Checking
- Savings
- Credit Card
- Cash

Account balances are never the budgeting system.

---

## Transaction

Money entering or leaving an account.

Transactions update balances and category spending.

---

## Category

Represents the purpose of money.

Examples:

- Rent
- Groceries
- Gas
- Dining
- Emergency Fund

---

## Budget

Represents the monthly financial plan.

---

## Funding

Represents assigning earned money to categories.

---

## Goal

Represents future financial objectives.

---

## Scheduled Transaction

Represents recurring future income or expenses.

---

# Budget States

Every category should expose the following values.

## Planned

The intended monthly amount.

May exceed funded money.

---

## Funded

Real money assigned to the category.

Cannot exceed Available to Allocate.

---

## Spent

Money already spent.

---

## Remaining

Funded minus Spent.

Represents how much can still be spent safely.

---

# Dashboard Metrics

The dashboard should always emphasize:

## Available to Allocate

Income Received

minus

Money Already Funded

This is the most important number in the application.

It represents dollars that have not yet been assigned a purpose.

It is NOT an account balance.

---

## Budget Progress

Display:

- Planned
- Funded
- Spent
- Remaining

---

## Weekly Progress

Display:

- Spending pace
- Categories at risk
- Overspending
- Upcoming bills
- Forecast

The dashboard should encourage proactive decisions instead of merely reporting history.

---

# Business Rules

Planning is unlimited.

Funding is constrained by real cash.

Spending reduces Remaining.

Income increases Available to Allocate.

Moving money between categories never changes total funded money.

Account balances and budgeting are separate systems.

The budgeting engine should never depend solely on account balances.

---

# Design Philosophy

The interface should feel like a premium SaaS application.

Prioritize:

1. Clarity
2. Simplicity
3. Speed
4. Accessibility
5. Excellent typography
6. Consistent spacing

Avoid clutter.

Avoid dashboards overloaded with charts.

Every screen should answer one primary question.

---

# User Experience Principles

The application should feel:

- Calm
- Predictable
- Fast
- Trustworthy

Users should always know:

- Where their money is.
- What it is assigned to.
- What they can safely spend.
- Whether they are on track.

Never require accounting knowledge.

Avoid financial jargon whenever possible.

---

# Architecture

Use the latest version of Next.js.

This project may use framework features newer than your training data.

Before implementing framework-specific behavior, consult:

node_modules/next/dist/docs/

Prefer:

- Server Components
- Server Actions
- Route Handlers
- Streaming where appropriate

Only use Client Components when interactivity requires them.

---

# Code Organization

Organize by feature instead of file type whenever practical.

Example:

```
app/
features/
  budgeting/
  accounts/
  transactions/
  reports/
components/
lib/
server/
hooks/
types/
```

Keep business logic outside UI components.

---

# Coding Standards

Write code that another developer can understand in six months.

Prefer:

- Explicit names
- Small functions
- Small components
- Strong typing
- Predictable behavior

Avoid:

- Clever abstractions
- Deep component nesting
- Duplicate logic
- Dead code
- Premature optimization

---

# State Management

Server state belongs on the server.

UI state belongs in components.

Never duplicate the same state in multiple places.

Prefer derived values over stored values.

---

# Calculations

Business calculations should be centralized.

Never duplicate budgeting formulas across components.

Always derive:

Remaining

Available to Allocate

Budget totals

Forecasts

from a single source of truth.

---

# Error Handling

Fail gracefully.

Display meaningful errors.

Never silently ignore failures.

Always account for:

- Empty states
- Loading states
- Error states

---

# Performance

Prefer server rendering.

Avoid unnecessary re-renders.

Lazy-load expensive features.

Optimize database queries before optimizing React.

Measure performance before attempting micro-optimizations.

---

# Accessibility

Every feature should be keyboard accessible.

Use semantic HTML.

Support screen readers.

Maintain sufficient color contrast.

Never rely on color alone to communicate status.

---

# Testing Mindset

Before considering a feature complete, think about:

- Happy path
- Empty state
- Error state
- Mobile layout
- Slow network
- Large datasets
- Edge cases

---

# Documentation

Comments should explain **why**, not **what**.

Document business rules that are not immediately obvious.

Keep documentation synchronized with implementation.

---

# Decision Principles

When multiple implementations are possible, choose the one that is:

- Easier to understand
- Easier to maintain
- Easier to extend
- More aligned with the budgeting philosophy

Favor obvious solutions over clever ones.

Long-term maintainability always outweighs short-term convenience.

---

# Git Workflow

## Branch Strategy

- Use `main` by default.
- Create feature branches only when explicitly requested or when working on large, isolated features.
- Keep commits small and focused.

---

## Commit Style

Use Conventional Commits.

Format:

type: short description

Examples:

feat: add budget categories

fix: correct remaining balance calculation

refactor: simplify transaction service

docs: update budgeting philosophy

chore: configure eslint

Allowed types:

- feat
- fix
- refactor
- docs
- style
- test
- chore

Do not include scopes or long commit bodies unless requested.

---

## Commit Frequency

Create a commit after completing a logical unit of work.

Examples:

- One completed feature
- One bug fix
- One refactor
- One documentation update

Avoid combining unrelated changes into a single commit.

---

## Before Committing

Always:

- Stage only relevant files.
- Exclude temporary files, logs, generated artifacts, and secrets.
- Run linting when available.
- Run type checking when available.
- Ensure the project builds if the affected changes could impact compilation.

Never commit code that knowingly fails these checks unless explicitly instructed.

---

## Pull Requests

When working on feature branches:

- Keep pull requests focused.
- Avoid unrelated formatting changes.
- Prefer several small PRs over one large PR.

---

## History

Prefer a clean, readable history.

Avoid "fix typo", "oops", or "try again" commits.

If work has not yet been shared, amend the previous commit instead of creating unnecessary follow-up commits.

Never rewrite shared history unless explicitly instructed.

---

## Safety

Never commit:

- API keys
- Secrets
- Environment files
- Personal credentials
- Database dumps
- Large generated files unless intentionally tracked

<!-- END:nextjs-agent-rules -->
