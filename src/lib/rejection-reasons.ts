// src/lib/rejection-reasons.ts

export const REJECTION_REASONS = [
  { value: 'BEYOND_ECONOMIC_REPAIR',    label: 'Beyond Economic Repair' },
  { value: 'NO_FAULT_FOUND',           label: 'No Fault Found — Unit returned to customer' },
  { value: 'INCORRECT_ITEM_SUBMITTED', label: 'Incorrect Item Submitted' },
  { value: 'CUSTOMER_CANCELLED',       label: 'Customer Cancelled' },
  { value: 'OUT_OF_WARRANTY',          label: 'Out of Warranty — Awaiting customer approval' },
  { value: 'NOT_ACCEPTED',             label: 'Not Accepted for Repair' },
] as const

export type RejectionReasonValue = (typeof REJECTION_REASONS)[number]['value']
