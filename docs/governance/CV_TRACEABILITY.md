# CV Traceability

Status: TASK-003 trace of one persisted CV/JD pair.

## Selected Records

Selection rule: use the most recently updated persisted CV that has a linked job, `generationContext`, `tailoredCv`, and `reviewSnapshot`.

| Record | ID | Evidence |
|---|---|---|
| CV | `cv-mr4q83lz-cidl0` | `CV_Manager_React/data/app_data.json` `data.cvVersions[]` |
| Job | `jd-mpy6kou0-ctiw9` | Same snapshot, linked by `CvVersion.jdId` |

The CV and job have matching `jdContentHash`. The review snapshot's `cvUpdatedAt` matches the CV's `updatedAt`.

## Stage Trace

| Stage | Observed record | Integrity result | Confidence |
|---|---|---|---|
| Evidence selection | Job selects 12 skills, 6 domain records, 18 evidence cards, and 6 stories | All selected IDs exist in current app data | Confirmed |
| CV Brief | 10 `mustShowEvidenceIds`, 11 `claimsToAvoid`, empty `bulletPlan` | All must-show evidence IDs exist | Confirmed |
| Writer input context | 10 skills, 7 domain records, 10 evidence cards, 6 stories; no invalid IDs | Context evidence exactly equals current Brief must-show evidence, but the current Brief was generated after this CV's recorded generation time | Confirmed |
| Writer output/current CV | 14 work bullets across 4 roles | 9 bullets cite evidence IDs; 5 cite none | Confirmed |
| Evidence integrity | 9 unique cited evidence IDs | All exist globally and all are selected on the linked Job | Confirmed |
| Context integrity | Current visible bullet citations versus generation context | 3 cited IDs are outside generation context; 4 context evidence IDs are not cited | Confirmed |
| Review | Current review snapshot | Bound to current CV timestamp; `ready=false`, 2 gate issues, 3 reviewer issues | Confirmed |

## Visible Bullet Trace

| Bullets | Count | Trace status |
|---|---:|---|
| Current-role bullets with globally valid evidence IDs | 9 | Supported by current evidence records |
| Prior-role bullets without evidence IDs | 5 | Unsupported in the persisted `TailoredCv` trace |
| Bullets citing IDs outside recorded generation context | 3 | Globally valid and selected on the Job, but not proven as Writer input for this generation |

No CV text or runtime data was modified during this trace.

