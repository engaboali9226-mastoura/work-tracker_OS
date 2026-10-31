# Continuous habits, definition editing and debt register

Habits without an end date are continuous. The create/edit form distinguishes continuous and limited habits, preserves the start date, and requires an end date for limited habits. Daily completion and notes still belong to each execution day. Selected weekdays determine the number of scheduled days per week.

Definition edits keep the definition identity and its activity log, require the current revision ID, and create a new revision. The current-day materializer deduplicates by definition and occurrence across revisions, preserving an already materialized execution snapshot and its status. Historical executions are not rewritten. Existing progress cannot be removed, re-denominated or reduced below recorded progress by an edit.

Category names are stored in the existing owner-bound Foundation JSON document. Legacy documents start with the existing default suggestions. Custom names can be added and existing names renamed across that owner's definitions in one conditional transaction. Rename collisions are rejected; this is not an implicit merge. No new database table, migration or authorization rule is needed.

The debt register shows person/direction, original amount and date, total repaid and latest repayment date, outstanding balance, computed payment state, elapsed calendar duration, optional due date, notes and installment history. It supports SAR and EGP debt ledgers with separate totals and exact integer minor units. One person can have multiple independent debt records and each record multiple installments. No screenshot data is imported.

Cash accounts, income, expenses and the existing overview remain SAR. EGP debt and repayments are recorded outside those SAR accounts; a payment cannot cross currencies. The payment form explicitly distinguishes a recorded account movement from a historical/outside-account settlement. Settlements are not income or expense. Correcting a settlement uses the existing void-entry flow and preserves the original record. Full repayment is derived from the remaining amount, not from a manual checkbox.

Deployment requires both updated server and frontend code. The preparation installer tests in an external copy, installs/commits source and publishes through the existing governed gate. It does not restart the Mac runtime or send live data commands. The online service must deploy the merged commit before these commands become available. No browser login or live financial write is part of installation.
