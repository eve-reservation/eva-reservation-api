# Common Errors When Approving Participants

## Error: "Participant not found" (404)

### Problem
You're using the wrong ID type in the URL.

### Wrong Examples:
```bash
# ❌ Using userId
PATCH /api/match-event/participant/507f1f77bcf86cd799439017

# ❌ Using personId  
PATCH /api/match-event/participant/695daedb7e100e9fa4517ece
```

### Solution
Use the participant's `id` field from the participants list response, not `userId` or `personId`.

**Step-by-step:**

1. **Get participants first:**
   ```bash
   GET /api/match-event/{matchEventId}/participants?status=WAITLIST
   ```

2. **Find the participant in the response:**
   ```json
   {
     "id": "695daedc7e100e9fa4517ed2",  ← Use THIS as participantId
     "userId": "507f1f77bcf86cd799439017",  ← NOT this
     "personId": null,  ← NOT this
     "status": "WAITLIST"
   }
   ```

3. **Use the `id` field in the URL:**
   ```bash
   # ✅ CORRECT
   PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
   {
     "status": "ACCEPTED"
   }
   ```

---

## Understanding Participant IDs

When you get a list of participants, each participant has:

- **`id`** - The participant record ID (use this for approving)
- **`userId`** - The registered user's ID (if participant is a registered user)
- **`personId`** - The person record ID (if participant is an unregistered person)

**Always use `id` for participant operations!**

---

## Real Example from Your Data

### Your Waitlist Response:
```json
{
  "participants": [
    {
      "id": "695daedc7e100e9fa4517ed2",  ← GROUP LEADER - Use this!
      "userId": "507f1f77bcf86cd799439017",
      "status": "WAITLIST",
      "metadata": { "isGroupLeader": true }
    },
    {
      "id": "695daedc7e100e9fa4517ed3",  ← Group member
      "personId": "695daedb7e100e9fa4517ecf",
      "status": "WAITLIST"
    }
  ]
}
```

### To Approve the Group Leader (and auto-approve all members):

```bash
# ✅ CORRECT - Uses participant id
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
{
  "status": "ACCEPTED"
}

# ❌ WRONG - Uses userId
PATCH /api/match-event/participant/507f1f77bcf86cd799439017
```

---

## Quick Reference

| Field | What It Is | When to Use |
|-------|------------|-------------|
| `id` | Participant record ID | ✅ **Use this for approving/updating participants** |
| `userId` | Registered user's ID | ❌ Don't use for participant operations |
| `personId` | Person record ID | ❌ Don't use for participant operations |

---

## Other Common Errors

### Error: "Only the event creator can update participant status" (403)
**Solution:** Make sure you're authenticated as the user who created the match event.

### Error: "Cannot join event with status: {status}" (400)
**Solution:** The event is not in a state that allows joining (e.g., CANCELLED, COMPLETED).

---

## Need Help?

1. Always get the participants list first
2. Copy the `id` field from the participant you want to approve
3. Use that `id` in the PATCH endpoint

