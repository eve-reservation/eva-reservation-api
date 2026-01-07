# How to View and Approve Waitlist Participants

## Overview

When a match event is full, new participants go to the waitlist (if `allowWaitlist: true`). This guide shows you how to view and approve waitlist participants.

---

## Step 1: View Waitlist Participants

**Endpoint:** `GET /api/match-event/{matchEventId}/participants?status=WAITLIST`

**Example:**
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=WAITLIST
```

**Response:**
```json
{
  "status": "success",
  "message": "Participants retrieved successfully",
  "data": {
    "participants": [
      {
        "id": "695daedc7e100e9fa4517ed2",
        "userId": "507f1f77bcf86cd799439017",
        "status": "WAITLIST",
        "joinedAt": "2026-01-07T00:54:52.347Z",
        "notes": "Joining with my basketball team",
        "metadata": {
          "isGroupLeader": true
        }
      },
      {
        "id": "695daedc7e100e9fa4517ed4",
        "personId": "695daedb7e100e9fa4517ece",
        "status": "WAITLIST",
        "metadata": {
          "isGroupMember": true,
          "groupLeader": "507f1f77bcf86cd799439017"
        }
      }
    ],
    "total": 5
  }
}
```

---

## Step 2: Approve Individual Waitlist Participant

**Endpoint:** `PATCH /api/match-event/participant/{participantId}`

**Example:**
```bash
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
Content-Type: application/json

{
  "status": "ACCEPTED",
  "notes": "Approved from waitlist"
}
```

**Response (Regular Participant):**
```json
{
  "status": "success",
  "message": "Participant updated successfully",
  "data": {
    "participant": {
      "id": "695daedc7e100e9fa4517ed2",
      "status": "ACCEPTED",
      "acceptedAt": "2026-01-07T01:00:00.000Z",
      "notes": "Approved from waitlist"
    }
  }
}
```

**Response (Group Leader - Auto-approves all group members):**
```json
{
  "status": "success",
  "message": "Participant updated successfully. Auto-approved 4 group member(s).",
  "data": {
    "participant": {
      "id": "695daedc7e100e9fa4517ed2",
      "status": "ACCEPTED",
      "metadata": {
        "isGroupLeader": true
      }
    },
    "autoApprovedGroupMembers": [
      {
        "id": "695daedc7e100e9fa4517ed3",
        "status": "ACCEPTED",
        "metadata": {
          "isGroupMember": true,
          "groupLeader": "507f1f77bcf86cd799439017"
        }
      }
    ],
    "totalAutoApproved": 4
  }
}
```

### ⚡ **Automatic Group Approval**

**When you approve a group leader**, all their group members are automatically approved! This means:

- ✅ You only need to approve **one participant** (the group leader)
- ✅ All 4 group members get approved automatically
- ✅ No need to approve each member individually

**Note:** If you approve an individual group member (not the leader), only that member gets approved. To approve the whole group, approve the leader.

---

## Step 3: View All Participants by Status

You can filter participants by any status:

- `status=WAITLIST` - Only waitlist participants
- `status=ACCEPTED` - Only accepted participants
- `status=PENDING` - Only pending participants
- `status=CONFIRMED` - Only confirmed participants

**Example:**
```bash
# Get all accepted participants
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=ACCEPTED

# Get all participants (no filter)
GET /api/match-event/695cd539e5800f65afc9ebd5/participants
```

---

## Step 4: Approve Multiple Waitlist Participants (Bulk)

To approve multiple participants, you need to call the update endpoint multiple times:

**Example (JavaScript/TypeScript):**
```javascript
const waitlistParticipants = [
  "695daedc7e100e9fa4517ed2",
  "695daedc7e100e9fa4517ed3",
  "695daedc7e100e9fa4517ed4"
];

// Approve all waitlist participants
const approvals = await Promise.all(
  waitlistParticipants.map(participantId =>
    fetch(`/api/match-event/participant/${participantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' })
    })
  )
);
```

---

## Complete Workflow Example

### 1. Check Event Status and Waitlist
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5
```

Response shows:
- `status: "FULL"` - Event is full
- `maxParticipants: 12` - Maximum capacity

### 2. Get Waitlist Participants
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=WAITLIST
```

### 3. Approve Waitlist Participants (one by one)
```bash
# Approve participant 1
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
{
  "status": "ACCEPTED"
}

# Approve participant 2
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed3
{
  "status": "ACCEPTED"
}
```

### 4. Verify Status
After approving, check participants again:
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=ACCEPTED
```

---

## Important Notes

1. **Authorization:** Only the event creator (user who created the match event) can approve participants
2. **Event Status:** After approving waitlist participants, if you reach `maxParticipants`, the event status stays `FULL`
3. **Group Members:** If you approve a group leader, consider whether to also approve their group members
4. **Automatic Promotion:** The system doesn't automatically promote waitlist to accepted when space opens - you must manually approve

---

## Status Transitions

```
WAITLIST → ACCEPTED → CONFIRMED → CHECKED_IN
     ↓
  REJECTED (if rejected)
```

**Common Actions:**
- `WAITLIST` → `ACCEPTED`: Promote from waitlist
- `WAITLIST` → `REJECTED`: Reject waitlist request
- `ACCEPTED` → `CONFIRMED`: Confirm attendance
- `ACCEPTED` → `CHECKED_IN`: Mark as attended

---

## Query Parameters for Get Participants

- `status`: Filter by status (WAITLIST, ACCEPTED, PENDING, etc.)
- `fields`: Comma-separated fields to include (e.g., `fields=id,status,joinedAt`)

**Example:**
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=WAITLIST&fields=id,status,userId,personId,metadata
```

