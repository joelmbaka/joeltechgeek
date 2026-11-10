# Play Review CRM account — production Neon fixture coverage
**Checked and seeded:** 2026-11-05, Africa/Nairobi

The production Neon project `small-scene-46266045` (`neondb`) contains the **active, isolated Play Review account** (`Joel (Play Review)`, using the reserved `.invalid` sign-in identity). It has **33 demo leads**, built from 12 prior records plus **21 additional clearly labeled QA scenarios**.

All inserted people, businesses, contact information and outreach outcomes are fictitious. New demo phone numbers are in the **North American 202-555-0100 through 202-555-0199 example range**, not real business contact numbers. Newly created demo contacts have no deliverable email addresses. The data is for evaluating the interface; do **not** actually attempt outreach.

## Verified production coverage at setup
| Metric | Count |
|---|---:|
| Play Review account leads | 33 |
| Leads with persistent `lead_brief` | 33 |
| Leads with `lead_facts` | 33 |
| Leads with a contact phone | 21 |
| Typed next actions | 10 |
| Future follow-ups | 5 |
| Overdue follow-ups | 5 |
| Simulated outreach events added | 18 |
| New call-number snapshots | 17 |
| Leads with multiple named contacts | at least 2 prior/new examples |

The server-generated view query was evaluated directly with this account and the `Africa/Nairobi` time zone after seeding:

| View | Count on Nov 5, 2026 |
|---|---:|
| For You | 22 |
| To Call | 9 |
| Follow-ups | 10 |
| Done Today | 3 |
| High Priority | 12 |
| All Leads | 33 |

Counts are *time-dependent*: Done Today events and future/overdue call eligibility change naturally as days pass. These were live read-only SQL results at seeding time, **not** a deployed-device acceptance test.

## Key demo scenarios and expected behavior
| Lead name | What it demonstrates |
|---|---|
| `QA New High Priority (Demo)` | High-priority first call, For You and To Call |
| `QA New Standard (Demo)` | Uncontacted standard-priority lead |
| `QA Retry No Answer (Demo)` | First unsuccessful call yesterday; To Call |
| `QA Retry Switched Off (Demo)` | Unsuccessful call from two weeks ago; To Call |
| `QA Retry Third Eligible (Demo)` | Three consecutive failures, most recent four days ago; To Call |
| `QA Retry Third Cooldown (Demo)` | Three consecutive failures, most recent yesterday; cooldown |
| `QA Fifth Attempt Review (Demo)` | Five consecutive failures; manual retry review |
| `QA Wrong Number (Demo)` | Same invalid phone; needs contact correction |
| `QA Corrected Phone (Demo)` | Phone changed after wrong-number event; eligible again |
| `QA Due Call (Demo)` | Typed Call follow-up already due; in To Call + Follow-ups |
| `QA Future Call (Demo)` | Typed future Call excluded from To Call until due |
| `QA Future Email (Demo)` | High-priority future Email; not To Call |
| `QA Due Email (Demo)` | Overdue Email appears in For You but not To Call |
| `QA Done Today (Demo)` | Unsuccessful call earlier today; Done Today |
| `QA Done Today Email (Demo)` | Email activity earlier today; Done Today |
| `QA Multiple Contacts (Demo)` | Primary and second contact; future Call explicitly targets `Noor Demo` |
| `Chris Individual (Demo)` | Person-only record; no company/category |
| `QA Won Closed (Demo)` | Won/closed: excluded from active queues |
| `QA Competitor Closed (Demo)` | Competitor classification: excluded |
| `QA Do Not Contact (Demo)` | DNC: excluded from outreach |
| `QA Needs Next Step (Demo)` | Successful conversation but no next action; For You |

The original 12 review leads were retained and their missing briefs/facts were populated without erasing original activity histories or follow-up schedules. Five existing scheduled actions were assigned explicit types where the text established an appropriate type.

## Safety and isolation
- Every new lead and activity belongs exclusively to the Play Review CRM user, not a regular customer agent.
- Original notes, historical events and contact records on that account were preserved.
- Other users' lead counts were checked immediately afterward and remained unchanged (the primary agent had 1,145, Maureen 15, and the other agent 2).
- Writes were limited to synthetic QA leads and existing review-account records.
- All simulated historical events are visibly marked `[Play Review QA v1]`; these are synthetic test events, **not actual calls or messages**.
- Fixture inserts were written to avoid duplicates on repeated execution; this account is not automatically reset after a reviewer edits or completes demo tasks.

## What remains to validate on the real app
- Verify the **Review Access** sign-in control is enabled for the relevant development or release environment; account activation was verified in Neon, not the runtime feature gate.
- Launch both Android and web on the updated deployed backend and confirm all six views, pagination (33 > 25 mobile page size), industry filtering, global search and All Leads A–Z.
- Try **Save & Stay** and **Save & Next**. Saving a demo activity changes this persistent fixture data; that is expected.
- Edit a brief, labeled fact and next action; confirm card/details/history reflect changes.
- Test overdue Call completion versus an unrelated overdue Email task.
- Verify notification scheduling separately with a future demo follow-up. The seeded future actions naturally move toward due status as dates pass.
- Check no actual dial or external email is sent to any demo contact.

See [CRM redesign handoff](./crm-workflow-redesign-handoff.md) for implementation and release verification instructions.
