# Quick Reference: Approve Waitlist Participants

## View All Waitlist Participants

```bash
GET /api/match-event/{matchEventId}/participants?status=WAITLIST
```

**Example:**
```bash
GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=WAITLIST
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "participants": [
      {
        "id": "695daedc7e100e9fa4517ed2",
        "userId": "507f1f77bcf86cd799439017",
        "status": "WAITLIST",
        "joinedAt": "2026-01-07T00:54:52.347Z",
        "metadata": { "isGroupLeader": true }
      }
    ],
    "total": 5
  }
}
```

---

## Approve a Waitlist Participant

```bash
PATCH /api/match-event/participant/{participantId}
```

**⚠️ Important:** Use the participant's `id` field (not `userId` or `personId`) from the participants list.

**Example:**
```bash
# ❌ WRONG: Using userId
PATCH /api/match-event/participant/507f1f77bcf86cd799439017  # This is userId, not participantId!

# ✅ CORRECT: Using participant id
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2  # This is the participant id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "ACCEPTED",
  "notes": "Approved from waitlist"
}
```

**How to find the participantId:**
1. Get waitlist participants: `GET /api/match-event/{matchEventId}/participants?status=WAITLIST`
2. Find the participant you want to approve
3. Copy the `id` field (e.g., `695daedc7e100e9fa4517ed2`)
4. Use that `id` as the `participantId` in the URL

**Response:**
```json
{
  "status": "success",
  "message": "Participant updated successfully",
  "data": {
    "participant": {
      "id": "695daedc7e100e9fa4517ed2",
      "status": "ACCEPTED",
      "acceptedAt": "2026-01-07T01:00:00.000Z"
    }
  }
}
```

---

## Quick Steps

1. **Get waitlist participants:**
   ```
   GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=WAITLIST
   ```

2. **Find the participant to approve:**
   - Look for the `id` field in the response (NOT `userId` or `personId`)
   - Example: `"id": "695daedc7e100e9fa4517ed2"` ← This is what you need!

3. **Approve the participant:**
   ```
   PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
   Body: { "status": "ACCEPTED" }
   ```
   **Note:** If this is a group leader (has `metadata.isGroupLeader: true`), all group members will be auto-approved!

4. **Verify results:**
   ```
   GET /api/match-event/695cd539e5800f65afc9ebd5/participants?status=ACCEPTED
   ```

---

## Important Notes

- ✅ Only the **event creator** can approve participants
- ✅ When approving from `WAITLIST` to `ACCEPTED`, the system automatically sets `acceptedAt` timestamp
- ✅ If event was `FULL` and you approve waitlist participants, the event status may change back to `OPEN` if space becomes available
- ✅ **Group Approval:** If you approve a **group leader** (participant with `metadata.isGroupLeader: true`), **all their group members are automatically approved**. This saves time!
- ✅ If you approve an individual group member (not the leader), only that member gets approved

---

## Status Flow

```
WAITLIST → ACCEPTED → CONFIRMED → CHECKED_IN
```

Use `status: "ACCEPTED"` to promote from waitlist.

---

## See Also

- Full documentation: `examples/manage-waitlist-participants.md`
- JSON examples: `examples/approve-waitlist-participants.json`

