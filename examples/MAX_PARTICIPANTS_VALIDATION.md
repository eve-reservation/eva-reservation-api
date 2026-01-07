# Max Participants Validation

## Overview

The system now validates that approving participants won't exceed the `maxParticipants` limit for an event.

---

## Validation Rules

### When Approving Individual Participants

**Before approving:** The system checks if there's space available.

**Error if event is full:**

```json
{
	"status": "error",
	"message": "Cannot approve participant: Event is full. Maximum 12 participants allowed, but 12 are already accepted.",
	"code": 400
}
```

### When Approving Group Leaders

**Before approving:** The system checks if there's space for:

- The group leader (1 participant)
- All group members (N participants)

**Error if group is too large:**

```json
{
	"status": "error",
	"message": "Cannot approve group leader: Event would exceed maximum participants. Maximum 12 participants allowed, 10 already accepted. Only 2 spot(s) available, but trying to approve 5 participant(s) (1 leader + 4 group members).",
	"code": 400
}
```

---

## Example Scenarios

### Scenario 1: Event is Full

**Event:** `maxParticipants: 12`, `currentAccepted: 12`

**Request:**

```bash
PATCH /api/match-event/participant/{participantId}
{
  "status": "ACCEPTED"
}
```

**Response:**

```json
{
	"status": "error",
	"message": "Cannot approve participant: Event is full. Maximum 12 participants allowed, but 12 are already accepted.",
	"code": 400
}
```

### Scenario 2: Group Too Large

**Event:** `maxParticipants: 12`, `currentAccepted: 10`

**Group:** Leader + 4 members = 5 total

**Request:**

```bash
PATCH /api/match-event/participant/{leaderId}
{
  "status": "ACCEPTED"
}
```

**Response:**

```json
{
	"status": "error",
	"message": "Cannot approve group leader: Event would exceed maximum participants. Maximum 12 participants allowed, 10 already accepted. Only 2 spot(s) available, but trying to approve 5 participant(s) (1 leader + 4 group members).",
	"code": 400
}
```

### Scenario 3: Partial Group Approval

**Event:** `maxParticipants: 12`, `currentAccepted: 11`

**Group:** Leader + 4 members = 5 total

**Request:**

```bash
PATCH /api/match-event/participant/{leaderId}
{
  "status": "ACCEPTED"
}
```

**Result:**

- Leader is approved ✅
- 1 group member is auto-approved (to reach 12)
- 3 group members remain on waitlist (exceeds limit)

**Response:**

```json
{
  "status": "success",
  "message": "Participant updated successfully. Auto-approved 1 group member(s).",
  "data": {
    "participant": { ... },
    "autoApprovedGroupMembers": [ ... ], // Only 1 member
    "totalAutoApproved": 1
  }
}
```

---

## Status Calculation

The system counts participants with these statuses as "accepted":

- `ACCEPTED`
- `CONFIRMED`
- `CHECKED_IN`

Participants with these statuses don't count toward the limit:

- `PENDING`
- `WAITLIST`
- `REJECTED`
- `NO_SHOW`
- `LEFT`

---

## Fixing Existing Over-Capacity Events

If you have existing events with more accepted participants than `maxParticipants` (due to the issue before this validation was added):

### Option 1: Reject Extra Participants

```bash
# Get all accepted participants
GET /api/match-event/{id}/participants?status=ACCEPTED

# Find participants that exceed the limit
# Reject the extra ones:
PATCH /api/match-event/participant/{participantId}
{
  "status": "REJECTED",
  "notes": "Rejected due to capacity limit"
}
```

### Option 2: Increase maxParticipants

```bash
PATCH /api/match-event/{id}
{
  "maxParticipants": 20  # Increase to accommodate current participants
}
```

---

## Best Practices

1. **Set appropriate `maxParticipants`** when creating events
2. **Use waitlists** (`allowWaitlist: true`) to handle overflow
3. **Monitor event capacity** before approving large groups
4. **Reject extra participants** if accidentally over-approved

---

## API Behavior Summary

| Scenario                              | Behavior                   |
| ------------------------------------- | -------------------------- |
| Event not full, approve individual    | ✅ Approved                |
| Event not full, approve small group   | ✅ All approved            |
| Event full, approve individual        | ❌ Error: Event is full    |
| Event has 2 spots, approve group of 5 | ❌ Error: Exceeds capacity |
| Event has 5 spots, approve group of 3 | ✅ All approved            |
| Event has 1 spot, approve group of 5  | ❌ Error: Exceeds capacity |

