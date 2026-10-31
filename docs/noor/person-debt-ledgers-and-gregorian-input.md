# Person debt ledgers and civil date entry

The debt center opens on a list of people, with a separate Statistics tab for the aggregate view. People can be saved without recording a debt or changing cash. New debts can reference an owner-scoped person ID. Legacy debts remain untouched and are displayed under their existing exact person name; a saved person with that name can display those legacy records without a background migration.

Each person file uses the reference fields: name, debt amount and date, settlement amount and date, remaining amount, payment state, duration, colored month status, and notes. Multiple payments retain their individual values and dates, as well as the sum and their note history. A person can have multiple independent debts and both SAR and EGP records; totals are separated by currency and direction.

Duration is calculated from the originating debt date until the latest provided settlement date, or the current civil date when no settlement exists. This applies even when a payment is partial; remaining debt stays open. Calendar intervals use whole months with clamped anniversaries, including leap days. The visible aging legend defines yellow as fewer than six whole months, orange as six through eight, red as nine or more, and green only for full repayment. These thresholds match the observed yellow-five / orange-seven / red-nine examples; hidden spreadsheet rules were not supplied.

All definition and financial date-entry fields use explicit Gregorian day, Arabic Gregorian month name and Latin-numbered year selectors. A hidden ISO value supplies the existing API. Native date-picker display can follow the device's Hijri calendar, so the date controls no longer rely on it. Required, partial and maximum-date constraints remain enforced.

Permanent definition deletion confirmation is a portal attached to the document body, outside the scroll-limited inline details. It has a viewport-bounded dialog, its own scroll area, visible footer controls, input focus, keyboard trapping, Escape/cancel and focus restoration. Typed confirmation and the existing backend deletion command are retained. No test performs live deletion, creates real debt data or imports the reference image.

Backend and frontend deployment are required. Preparation tests and publishes source through the existing governed gate, without restarting local services or issuing live user commands.
