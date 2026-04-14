export enum WorkshopStage {
  AWAITING_TEST    = 'AWAITING_TEST',
  RETEST           = 'RETEST',
  REWORK           = 'REWORK',
  FINAL_TEST       = 'FINAL_TEST',
  CLEAN_AND_LABEL  = 'CLEAN_AND_LABEL',
  INSPECTION       = 'INSPECTION',
  WORKSHOP_COMPLETE= 'WORKSHOP_COMPLETE',
}

export enum HoldReason {
  AWAITING_PARTS    = 'AWAITING_PARTS',
  WITH_SUPPORT      = 'WITH_SUPPORT',
  WITH_ENGINEERING  = 'WITH_ENGINEERING',
  AWAITING_CUSTOMER = 'AWAITING_CUSTOMER',
  CREDIT_HELD       = 'CREDIT_HELD',
}

export const WorkshopStageLabel: Record<WorkshopStage, string> = {
  [WorkshopStage.AWAITING_TEST]:    'Awaiting Test',
  [WorkshopStage.RETEST]:           'Under Test',
  [WorkshopStage.REWORK]:           'In Rework',
  [WorkshopStage.FINAL_TEST]:       'Final Test',
  [WorkshopStage.CLEAN_AND_LABEL]:  'Finishing',
  [WorkshopStage.INSPECTION]:       'Inspection',
  [WorkshopStage.WORKSHOP_COMPLETE]:'Repair Complete',
}

/** Customer-facing labels. CREDIT_HELD maps to a generic message — never expose the reason. */
export const HoldCustomerLabel: Record<HoldReason, string> = {
  [HoldReason.AWAITING_PARTS]:    'On Hold — Awaiting Parts',
  [HoldReason.WITH_SUPPORT]:      'On Hold — Under Investigation',
  [HoldReason.WITH_ENGINEERING]:  'On Hold — Engineering Review',
  [HoldReason.AWAITING_CUSTOMER]: 'Action Required — Response Needed',
  [HoldReason.CREDIT_HELD]:       'On Hold — Please Contact Us',
}

/** Admin-facing labels shown in the hold dropdown */
export const HoldAdminLabel: Record<HoldReason, string> = {
  [HoldReason.AWAITING_PARTS]:    'Awaiting Parts',
  [HoldReason.WITH_SUPPORT]:      'With Support',
  [HoldReason.WITH_ENGINEERING]:  'With Engineering',
  [HoldReason.AWAITING_CUSTOMER]: 'Awaiting Confirmation — Customer',
  [HoldReason.CREDIT_HELD]:       'Credit Held',
}

export const WORKSHOP_STAGES = Object.values(WorkshopStage)
export const HOLD_REASONS    = Object.values(HoldReason)
