# Digital Lead Call Handling Flow (LMS <-> Ozonetel <-> Inventix)

This document defines the complete lifecycle for digital lead calling and closure handling across all cases.

## System Entities

- **LMS**: Source system and lead state owner.
- **Ozonetel**: Calling system that sends webhook dispositions.
- **Inventix (CRM)**: Deal and store-visit event system for Interested leads.

---

## Master Decision Flow Diagram

```mermaid
flowchart TD
    A[Lead created in LMS] --> B[Push lead to Ozonetel]
    B --> C{Webhook disposition received?}

    C -->|No within 4 days| D[No-answer retry logic]
    C -->|Follow-up| E[Follow-up logic]
    C -->|Interested_Store_Visit| F[Interested visit-cycle logic]
    C -->|Not Interested| G[Mark Not Interested and stop]
    C -->|Other/unknown| H[Keep latest valid state and wait]

    %% Case 1
    D --> D1[Attempt 1 wait 4 days]
    D1 --> D2{Webhook received?}
    D2 -->|Yes| I[Route by received disposition]
    D2 -->|No| D3[Day 5 re-push for Attempt 2]
    D3 --> D4[Wait another 4 days]
    D4 --> D5{Webhook received?}
    D5 -->|Yes| I
    D5 -->|No| D6[Mark Invalid and stop permanently]

    %% Case 2
    E --> E1[followup_count += 1]
    E1 --> E2{followup_count >= 3?}
    E2 -->|Yes| D6
    E2 -->|No| E3[Schedule reattempt on +2 days]
    E3 --> E4{Next webhook in cycle?}
    E4 -->|Follow-up or no disposition| E1
    E4 -->|Interested_Store_Visit| F
    E4 -->|Not Interested| G
    E4 -->|Visited event from Inventix| J[Mark Converted and stop]

    %% Case 3
    F --> F1[Create/Update deal in Inventix]
    F1 --> F2{Visit date provided?}
    F2 -->|Yes| F3[Set D = provided visit date]
    F2 -->|No| F4[Set D = interested date + 5 days]
    F3 --> F5[Run visit cycle: D-1, D, D+1 if no visit]
    F4 --> F5
    F5 --> F6{Visited event received from Inventix?}
    F6 -->|Yes| J
    F6 -->|No| F7{Disposition at D+1 call?}
    F7 -->|New visit date provided| F8[Update D in Inventix]
    F7 -->|No disposition or interest_confirmed_calling| F9[Derive next D = D+1 call date + 4 days]
    F8 --> F10[interested_cycle_count += 1]
    F9 --> F10
    F10 --> F11{interested_cycle_count >= 3?}
    F11 -->|Yes| D6
    F11 -->|No| F5

    %% Case 4 mixed
    I --> K{Latest disposition}
    K -->|Follow-up| E
    K -->|Interested_Store_Visit| F
    K -->|Not Interested| G
    K -->|No disposition| H
    H --> C

    %% terminal states
    J --> L[Terminal: Converted]
    G --> M[Terminal: Not Interested]
    D6 --> N[Terminal: Invalid]
```

---

## Complete Flow Wireframe

```mermaid
flowchart LR
    subgraph S1[1. Intake Layer]
        A1[LMS creates lead]
        A2[Push to Ozonetel]
        A1 --> A2
    end

    subgraph S2[2. Event Layer]
        B1[Webhook listener]
        B2[Disposition normalizer]
        B3[Inventix visit event listener]
        B1 --> B2
    end

    subgraph S3[3. Decision Engine]
        C1{Terminal status already set?}
        C2{Disposition type}
        C3{No webhook 4 days?}
        C4{followup_count >= 3?}
        C5{interested_cycle_count >= 3?}
        C6{Visited event?}
    end

    subgraph S4[4. Case Handlers]
        D1[Case 1: No-answer handler]
        D2[Case 2: Follow-up handler]
        D3[Case 3: Interested handler]
        D4[Case 4: Mixed-flow router]
        D5[Case 5: Not Interested handler]
    end

    subgraph S5[5. Scheduler + CRM]
        E1[Re-push scheduler]
        E2[Follow-up +2 day scheduler]
        E3[Visit cycle scheduler: D-1, D, D+1]
        E4[Inventix deal create/update]
        E5[Visit date derive/update]
    end

    subgraph S6[6. Terminal Outcomes]
        F1[Converted]
        F2[Invalid]
        F3[Not Interested]
    end

    A2 --> B1
    B2 --> C1
    B3 --> C6
    C1 -->|Yes| F1
    C1 -->|No| C2

    C2 -->|Follow-up| D2
    C2 -->|Interested_Store_Visit| D3
    C2 -->|Not Interested| D5
    C2 -->|No disposition| C3

    C3 -->|Yes| D1
    C3 -->|No| D4

    D1 --> E1
    D2 --> C4
    C4 -->|Yes| F2
    C4 -->|No| E2

    D3 --> E4
    D3 --> E5
    D3 --> E3
    E3 --> C5
    C5 -->|Yes| F2
    C5 -->|No| D4

    D4 --> C6
    C6 -->|Yes| F1
    C6 -->|No| C2

    D5 --> F3
```

### Wireframe Reading Guide

- **Intake Layer**: lead enters from LMS and is pushed to Ozonetel.
- **Event Layer**: webhooks and Inventix visit events are captured and normalized.
- **Decision Engine**: terminal checks, disposition branching, and counter limits are evaluated.
- **Case Handlers**: each of the 5 cases executes its own rules.
- **Scheduler + CRM**: manages retries, follow-up timing, visit-cycle calls, and Inventix updates.
- **Terminal Outcomes**: end states are `Converted`, `Invalid`, or `Not Interested`.

---

## Global Rules (Apply to All Cases)

- **Conversion has highest priority**: if Inventix sends a visited event, mark **Converted** and stop all future calls.
- **Not Interested is immediate closure**: mark **Not Interested** and stop all calling.
- **Invalid is terminal**: once Invalid, ignore all future webhooks and never re-push.
- **Latest disposition drives active path**, but counters from previous paths remain preserved.
- **Ignore late events for terminal leads** (`Invalid`, `Converted`, `Not Interested`).

---

## Case 1: Call Not Answered (No Webhook from Ozonetel)

### Trigger
- Lead pushed from LMS to Ozonetel, but no webhook/disposition is received.

### Flow
1. **Attempt 1**
   - Push lead to Ozonetel.
   - Wait **4 days** for webhook.
2. **Attempt 2**
   - If still no webhook, re-push on **Day 5**.
   - Wait another **4 days**.
3. **Closure**
   - If still no webhook, mark lead as **Invalid**.

### Limits
- Max attempts: **2**
- Wait per attempt: **4 days**
- Total lifecycle before closure: **8-9 days**

---

## Case 2: Only Follow-up Disposition

### Meaning
Customer answered, but outcome needs reattempt (call later, unclear audio, disconnect, etc.).

### Trigger
- First webhook within initial window is **Follow-up**.

### Flow
1. Start follow-up cycle and increment `followup_count`.
2. Reattempt every **2 days**.
3. Repeat up to **3 follow-up cycles**.
4. If unresolved (Follow-up again or no disposition), mark **Invalid** after limit.

### Limits
- `followup_count` max: **3**
- Wait per cycle: **2 days**
- Total follow-up window: **6 days**

---

## Case 3: Only Interested Disposition

### Trigger
- Webhook disposition is **Interested_Store_Visit**.

### Visit Date Rules
- If customer gives a visit date: use that as `D`.
- If missing: derive `D = interested disposition date + 5 days`.

### CRM Action
- Create/update deal in **Inventix** with lead details and visit date `D`.

### Visit Calling Cycle
- **D-1**: reminder call.
- **D**: confirmation call.
- **D+1**: missed-visit follow-up call (only if visit not happened).

### Next Visit Date Rules (post D+1 when no visit)
- If customer provides new date: set new `D` to provided date.
- If no disposition or `interest_confirmed_calling`: derive new `D = (D+1 call date) + 4 days`.

### Re-iteration Limit
- Allow up to **3 interested cycles total** (first schedule cycle + max 2 more cycles).
- If no visit after limit and only soft/no outcome, mark **Invalid**.

### Conversion
- Only Inventix **visited event** marks conversion.
- `interest_confirmed_calling` is not conversion.

---

## Case 4: Mixed Follow-up + Interested

### Principle
- Switch active flow based on **latest disposition**.
- Preserve both counters:
  - `followup_count`
  - `interested_cycle_count`
- Whichever limit hits first closes lead as **Invalid** (unless converted earlier).

### Decision Framework
- Only Follow-up -> run Case 2.
- Only Interested -> run Case 3.
- Follow-up -> Interested -> switch to Interested flow.
- Interested -> Follow-up -> continue Follow-up flow with existing counters.
- Visit event anytime -> mark **Converted** immediately.

### Limit Rules
- If `followup_count >= 3` -> Invalid.
- If `interested_cycle_count >= 3` -> Invalid.

---

## Case 5: Not Interested

### Trigger
- Webhook disposition is **Not Interested**.

### Action
- Immediately mark lead as **Not Interested**.
- Stop all future calls.
- Ignore any future webhooks.

---

## Counter & State Model

- `followup_count`: increments on each completed Follow-up cycle.
- `interested_cycle_count`: increments on each completed Interested visit cycle.
- `latest_disposition`: last valid disposition from webhook.
- `terminal_status`: one of `Converted`, `Invalid`, `Not Interested`.

---

## Execution Pseudocode

```python
if lead.terminal_status in ["Converted", "Invalid", "Not Interested"]:
    ignore_future_events()
elif inventix_event == "visited":
    mark_converted()
    stop_all_calls()
elif webhook_disposition == "Not Interested":
    mark_not_interested()
    stop_all_calls()
elif webhook_disposition == "Interested_Store_Visit":
    run_interested_flow()
elif webhook_disposition == "Follow-up":
    run_followup_flow()
elif no_webhook_within_4_days and lead.initial_attempts < 2:
    retry_no_answer_flow()
elif followup_count >= 3 or interested_cycle_count >= 3:
    mark_invalid()
    stop_all_calls()
else:
    wait_for_next_event_or_schedule()
```

---

## Operational Notes

- Once any terminal status is reached, never re-enter calling.
- Date arithmetic must use a consistent timezone across LMS, Ozonetel, and Inventix.
- Inventix is source of truth for visit completion.
- Visit date updates in Inventix must overwrite previous scheduled date.
