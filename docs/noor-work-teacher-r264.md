# NOOR Work — Teacher workspace R264

## Scope / intended user

- A separate **Noor Work** application (`/work`) inside the existing NOOR gateway, not a module bolted onto Noor Personal.
- Teacher workload target **21 periods per week**; no classes, students, timetable times, exams or marks are invented.
- Owner-only entitlement `access / application / noor-work`, independent of `noor-personal`.
- Zero additional Render/Supabase projects or paid service assumptions.

## First usable workflow

1. Set up actual weekly timetable (weekday, period number, subject, section, room and optional start/end times). Dashboard shows number configured out of 21.
2. Record manual teacher check-in and check-out for the current Riyadh civil day; this is a **private work log, not official school attendance**.
3. Create a lesson preparation attached to an actual timetable period: teaching goals, activities and homework.
4. Create sections and students. Student codes are optional; avoid national IDs.
5. Mark attendance for a section by period and date: present, absent, late or excused.
6. Create assessments and record marks, with an upper bound at each assessment's maximum score.
7. Save all changes in the owner-specific database. Concurrent revisions conflict rather than silently overwrite.

## Security

- Existing Noor verified session cookie and the **separate** Work entitlement are checked server-side before account-to-owner resolution.
- Owner UUID is taken from the server's account linkage, **never from the HTTP body**.
- POST/PUT-like changes require same-origin and strict payload validation.
- Dedicated `noor_work_teacher_states_r264` has RLS enabled and no grants to anon/authenticated; privileged server can touch only the authorized owner's row by exact owner UUID.
- Response cache is disabled; browser localStorage and IndexedDB are not used for school data.
- Personal life data, private journals, finance, and reviewer/demo accounts are never copied into Work.
- Do not input identifiable real students until authenticated owner/device data-isolation and school permissions have been verified.

## Release gate

1. Apply `database/noor-work-teacher-r264.sql` in the **existing** Supabase project after CI.
2. Add a single exact `noor-work` entitlement to the existing owner's account (not any demo account).
3. Confirm no owner state was mutated during migration.
4. Verify runtime route on the deployed Render SHA, then manually create a **synthetic** class, student, session and score, save/reopen, and validate isolation.
5. Keep review branch/PR draft until the schema and application are consistent. Do not present draft GitHub code as published.

## Explicit limitations of R264

The first iteration stores a bounded owner-scoped JSON document with optimistic compare-and-swap. Before production-scale year-long real student records, plan a normalized schema for students, periods, attendance observations and assessment marks, export/import, multiple terms, editable records and supervisor-approved retention policies. The visual dashboard is not an official school information system or integration with Madrasati.
