# Group Members Database Structure

## Overview

When users join a match event with unregistered group members, the data is stored across two Prisma models:

## 1. Person Model (for unregistered group members)

**Location:** `prisma/schema/person.prisma`

**What gets saved:**

- Personal information (firstName, lastName)
- Contact information (email, phone)
- Organization ID
- Metadata

**Example Person record for a group member:**

```json
{
	"id": "695b2222e64fd899629d3da4",
	"organizationId": "507f1f77bcf86cd799439011",
	"personalInfo": {
		"firstName": "John",
		"lastName": "Doe"
	},
	"contactInfo": {
		"email": "john.doe@example.com",
		"phones": [
			{
				"type": "mobile",
				"number": "+1234567890",
				"isPrimary": true
			}
		]
	},
	"metadata": {
		"isActive": true,
		"isDeleted": false
	}
}
```

## 2. MatchParticipant Model (links Person to MatchEvent)

**Location:** `prisma/schema/matchEvent.prisma` (lines 73-111)

**What gets saved:**

- Link to MatchEvent (`matchEventId`)
- Link to Person (`personId`) - for group members
- Link to User (`userId`) - for registered users
- Participant status (ACCEPTED, PENDING, WAITLIST, etc.)
- Metadata (flags like `isGroupMember`, `isGroupLeader`)
- Notes

**Example MatchParticipant records:**

### Main User (Group Leader):

```json
{
	"id": "695b1111e64fd899629d3da2",
	"matchEventId": "695cd539e5800f65afc9ebd5",
	"userId": "507f1f77bcf86cd799439011",
	"personId": null,
	"status": "ACCEPTED",
	"metadata": {
		"isGroupLeader": true
	},
	"notes": "Joining with my basketball team"
}
```

### Group Member:

```json
{
	"id": "695b1112e64fd899629d3da3",
	"matchEventId": "695cd539e5800f65afc9ebd5",
	"userId": null,
	"personId": "695b2222e64fd899629d3da4",
	"status": "ACCEPTED",
	"metadata": {
		"isGroupMember": true,
		"groupLeader": "507f1f77bcf86cd799439011"
	},
	"notes": "Group member added by 507f1f77bcf86cd799439011"
}
```

## Data Flow

```
User joins with groupMembers array
    ↓
1. Create Person records for each group member
   → Stored in: Person collection
   → Fields: personalInfo (firstName, lastName), contactInfo (email, phone)
    ↓
2. Create MatchParticipant records
   → Main user: MatchParticipant with userId + metadata.isGroupLeader = true
   → Group members: MatchParticipant with personId + metadata.isGroupMember = true
   → All linked to same matchEventId
```

## Database Collections Involved

### Person Collection

- **Purpose:** Stores personal information for unregistered users
- **Fields:**
    - `personalInfo.firstName` / `personalInfo.lastName`
    - `contactInfo.email`
    - `contactInfo.phones[]`
    - `organizationId`

### MatchParticipant Collection

- **Purpose:** Links users/persons to match events
- **Fields:**
    - `matchEventId` - Links to MatchEvent
    - `userId` - For registered users (nullable)
    - `personId` - For unregistered users (nullable)
    - `status` - Participant status
    - `metadata` - Contains `isGroupMember`, `isGroupLeader`, `groupLeader` flags

## Querying Group Members

### Get all participants (including group members) for an event:

```typescript
const participants = await prisma.matchParticipant.findMany({
	where: { matchEventId: "..." },
	include: {
		// For registered users
		// userId links to User model (if you add the relation)
		// For group members
		// personId links to Person model (if you add the relation)
	},
});
```

### Get only group members:

```typescript
const groupMembers = await prisma.matchParticipant.findMany({
	where: {
		matchEventId: "...",
		metadata: {
			path: ["isGroupMember"],
			equals: true,
		},
	},
});
```

### Get group leader:

```typescript
const groupLeader = await prisma.matchParticipant.findFirst({
	where: {
		matchEventId: "...",
		metadata: {
			path: ["isGroupLeader"],
			equals: true,
		},
	},
});
```

## Relations to Add (Optional)

You could add explicit relations in the schema:

```prisma
model MatchParticipant {
  // ... existing fields ...

  // Add these relations (optional)
  user        User?     @relation(fields: [userId], references: [id])
  person      Person?   @relation(fields: [personId], references: [id])

  // Then in Person model:
  // matchParticipants MatchParticipant[]
}
```

Currently, the relations are implicit (just ObjectId references), but adding explicit relations would allow Prisma to auto-join the data.
