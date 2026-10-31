# Person editing

A person file exposes Edit person for its name and profile note. The existing finance command boundary accepts `edit-person` with a unique request id, person id, previous name/note and replacement name/note. Empty or duplicate names are rejected. Stale edits require reopening the file. Owner scoping and conditional ledger revisions remain in effect.

Registered person identity remains stable. Linked debt labels and legacy debt labels matching the original name update together; amounts, currencies, due dates, transactions and repayment history remain unchanged. Transaction notes preserve their original text. Legacy name-only profiles become registered people on edit, scoped to that owner's ledger. This does not merge two existing person profiles.

The dialog preloads saved values, retains failed submissions, supports cancellation and shares the existing finance modal layout. No live financial operations are issued by the installer or tests. Backend and frontend must both be deployed for activation.
