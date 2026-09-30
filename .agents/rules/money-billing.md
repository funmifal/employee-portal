---
trigger: glob
---

# Money and Billing Rules

## Current Product Scope

The Employee Portal Note Digitization & Manual Compiler has no payment, subscription, invoicing, wallet, transaction, or billing workflow defined in the PRD.

## Mandatory Rules

- Do not implement payment processing unless the PRD explicitly introduces it.
- Do not add Flutterwave, Stripe, Paystack, or another payment provider to the application without an explicit requirement.
- Do not add payment-related database models merely because the product is commercially licensed.
- The PRD's internal enterprise licensing/business model must not be interpreted as an application-level billing feature.
- Do not introduce pricing pages, checkout flows, invoices, subscriptions, wallets, or payment status fields without an approved product requirement.

## If Billing Is Added Later

A future billing requirement must explicitly define:

- billing model
- payment provider
- currency
- payment lifecycle
- refund behavior
- transaction states
- ownership
- authorization
- audit requirements

Until then, billing is out of scope.