# Group Approval Feature Explained

## Overview

When users join a match event with group members, approving the group leader automatically approves all group members. This saves time and ensures consistency.

---

## How It Works

### Scenario: User joins with 4 group members

```
User joins → Creates 5 participants:
1. Group Leader (userId: "507f1f77bcf86cd799439017")
   - metadata: { isGroupLeader: true }

2-5. Group Members (4 people)
   - Each has: metadata: { isGroupMember: true, groupLeader: "507f1f77bcf86cd799439017" }
```

### When You Approve the Group Leader

**What happens:**

1. ✅ The group leader's status changes to `ACCEPTED`
2. ✅ **All 4 group members automatically change to `ACCEPTED`**
3. ✅ Response includes list of auto-approved members

**Example Request:**

```bash
PATCH /api/match-event/participant/695daedc7e100e9fa4517ed2
{
  "status": "ACCEPTED"
}
```

**Example Response:**

```json
{
	"status": "success",
	"message": "Participant updated successfully. Auto-approved 4 group member(s).",
	"data": {
		"participant": {
			"id": "695daedc7e100e9fa4517ed2",
			"status": "ACCEPTED",
			"metadata": { "isGroupLeader": true }
		},
		"autoApprovedGroupMembers": [
			{
				"id": "695daedc7e100e9fa4517ed3",
				"status": "ACCEPTED"
			},
			{
				"id": "695daedc7e100e9fa4517ed4",
				"status": "ACCEPTED"
			},
			{
				"id": "695daedc7e100e9fa4517ed5",
				"status": "ACCEPTED"
			},
			{
				"id": "695daedc7e100e9fa4517ed6",
				"status": "ACCEPTED"
			}
		],
		"totalAutoApproved": 4
	}
}
```

---

## When You Approve an Individual Group Member

**What happens:**

- ✅ Only that specific member gets approved
- ✅ Other group members remain unchanged
- ✅ The group leader is not affected

**Use case:** Sometimes you might want to approve only specific members from a group.

---

## How to Identify Group Leaders

### In the Participants List

Look for participants with:

```json
{
	"metadata": {
		"isGroupLeader": true
	}
}
```

### In the Waitlist

```bash
GET /api/match-event/{id}/participants?status=WAITLIST
```

Response will show:

- Group leaders have `metadata.isGroupLeader: true`
- Group members have `metadata.isGroupMember: true` and `metadata.groupLeader: "{leaderId}"`

---

## Best Practice

**Recommended workflow:**

1. **View waitlist:**

    ```bash
    GET /api/match-event/{id}/participants?status=WAITLIST
    ```

2. **Identify group leaders** (look for `metadata.isGroupLeader: true`)

3. **Approve group leaders** - this automatically approves all their members:

    ```bash
    PATCH /api/match-event/participant/{leaderId}
    { "status": "ACCEPTED" }
    ```

4. **Approve individual participants** (if any remain)

---

## FAQ

### Q: Do I need to approve each group member individually?

**A:** No! Just approve the group leader, and all members are automatically approved.

### Q: What if I only want to approve some group members?

**A:** Approve individual group members instead of the leader. Only the members you approve will change status.

### Q: What happens if the leader is already approved but I approve a member?

**A:** Only that member gets approved. The leader's status doesn't change.

### Q: Can I approve a member first, then approve the leader?

**A:** Yes. When you approve the leader, only members that aren't already accepted will be auto-approved.

---

## Technical Details

- **Auto-approval triggers:** Only when approving a group leader (`metadata.isGroupLeader: true`) and changing status to `ACCEPTED`
- **Which members are approved:** Only members with status `PENDING`, `WAITLIST`, or `REJECTED`
- **Already accepted members:** Are not changed
- **Member identification:** Members are identified by `metadata.groupLeader` matching the leader's `userId` or `personId`
