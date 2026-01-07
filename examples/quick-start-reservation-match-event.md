# Quick Start: Create Reservation and Match Event

Complete guide to reserve your basketball court facility and create a match event for players to join.

## Prerequisites

- You have a facility (e.g., Basketball Court with ID: `695b113d92807cb6ada994a0`)
- You are authenticated (have a valid user token)

---

## Step 1: Create Reservation

First, you need to reserve the facility. This creates a booking slot.

**Endpoint:** `POST /api/reservation`

**Request:**
```json
{
  "facilityId": "695b113d92807cb6ada994a0",
  "organizationId": "507f1f77bcf86cd799439011",
  "status": "CONFIRMED",
  "guestCount": 1,
  "purpose": "Basketball match",
  "eventName": "5v5 Basketball Game",
  "bookingPeriod": {
    "startDateTime": "2026-01-15T18:00:00Z",
    "endDateTime": "2026-01-15T20:00:00Z",
    "numberOfHours": 2,
    "numberOfDays": 0
  },
  "specialRequests": "Need basketballs and scoreboard",
  "bookingSource": "web"
}
```

**Response:** You'll receive a reservation object with an `id` and `confirmationCode`:
```json
{
  "status": "success",
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "695b1234e64fd899629d3da0",
      "confirmationCode": "RES-ABC123",
      "facilityId": "695b113d92807cb6ada994a0",
      "status": "CONFIRMED",
      "bookingPeriod": {
        "startDateTime": "2026-01-15T18:00:00.000Z",
        "endDateTime": "2026-01-15T20:00:00.000Z",
        "numberOfHours": 2
      }
    }
  }
}
```

**⚠️ Important:** Save the `reservation.id` - you'll need it for the next step!

---

## Step 2: Create Match Event

Now create a match event linked to your reservation. This allows others to discover and join your game.

**Endpoint:** `POST /api/match-event`

**Request:**
```json
{
  "reservationId": "695b1234e64fd899629d3da0",
  "organizationId": "507f1f77bcf86cd799439011",
  "title": "Basketball 5v5 - Evening Game",
  "description": "Looking for 9 more players for a friendly 5v5 basketball game. All skill levels welcome!",
  "maxParticipants": 10,
  "minParticipants": 6,
  "allowWaitlist": true,
  "status": "OPEN",
  "isPublic": true,
  "autoAccept": true,
  "skillLevel": "INTERMEDIATE",
  "genderPreference": "MIXED",
  "ageRange": {
    "min": 18,
    "max": 50
  },
  "rules": "Standard basketball rules. Teams will be divided evenly.",
  "requirements": "Bring your own water bottle. Basketballs and hoops provided."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Match event created successfully",
  "data": {
    "matchEvent": {
      "id": "695b5678e64fd899629d3da1",
      "reservationId": "695b1234e64fd899629d3da0",
      "title": "Basketball 5v5 - Evening Game",
      "status": "OPEN",
      "maxParticipants": 10,
      "createdBy": "your-user-id",
      "currentParticipants": 1
    }
  }
}
```

**⚠️ Important:** Save the `matchEvent.id` - others will use this to join!

---

## Step 3: Others Join Your Event

Other users can now discover and join your match event. They can join alone or with a group!

**Endpoint:** `POST /api/match-event/{matchEventId}/join`

**Example:** `POST /api/match-event/695b5678e64fd899629d3da1/join`

### Option A: Single User Join

**Request:**
```json
{
  "userId": "695b8888e64fd899629d3da3",
  "notes": "I'm an experienced player, would love to join!"
}
```

### Option B: Join with Group (4 unregistered friends)

**Request:**
```json
{
  "userId": "695b8888e64fd899629d3da3",
  "notes": "Joining with my basketball team",
  "groupMembers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    {
      "firstName": "Mike",
      "lastName": "Johnson",
      "phone": "+1234567891"
    },
    {
      "firstName": "Sarah",
      "lastName": "Williams"
    }
  ]
}
```

**Response (with group):**
```json
{
  "status": "success",
  "message": "Successfully joined match event with 5 participant(s). Status: ACCEPTED",
  "data": {
    "participants": [
      {
        "id": "695b9999e64fd899629d3da2",
        "userId": "695b8888e64fd899629d3da3",
        "status": "ACCEPTED",
        "metadata": {
          "isGroupLeader": true
        }
      }
    ],
    "totalParticipants": 5,
    "groupMembers": 4
  }
}
```

**Notes:**
- `groupMembers` array allows you to add unregistered users
- Each group member needs `firstName` and `lastName` (email/phone optional)
- Person records are automatically created for group members
- All participants get the same status based on event capacity

---

## Step 4: View Match Event & Participants

View your match event details and see who's joined.

**Endpoint:** `GET /api/match-event/{matchEventId}`

**Example:** `GET /api/match-event/695b5678e64fd899629d3da1`

**Response:**
```json
{
  "status": "success",
  "data": {
    "matchEvent": {
      "id": "695b5678e64fd899629d3da1",
      "title": "Basketball 5v5 - Evening Game",
      "status": "OPEN",
      "maxParticipants": 10,
      "currentParticipants": 3,
      "reservation": {
        "id": "695b1234e64fd899629d3da0",
        "facility": {
          "identifier": "COURT-05",
          "displayName": "Basket Ba;",
          "metadata": {
            "sportType": "Basketball",
            "surfaceType": "Hardcourt",
            "maxPlayers": 10
          }
        },
        "bookingPeriod": {
          "startDateTime": "2026-01-15T18:00:00.000Z",
          "endDateTime": "2026-01-15T20:00:00.000Z"
        }
      },
      "participants": [
        {
          "id": "695b1111e64fd899629d3da2",
          "userId": "695b2222e64fd899629d3da3",
          "status": "ACCEPTED",
          "joinedAt": "2026-01-06T09:15:00.000Z"
        }
      ]
    }
  }
}
```

---

## Discover Available Match Events

Other users can browse available match events:

**Endpoint:** `GET /api/match-event?status=OPEN&document=true&count=true`

**Query Parameters:**
- `status`: Filter by status (OPEN, FULL, etc.)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `document=true`: Include match events in response
- `count=true`: Include total count
- `query`: Search by title or description

**Example:**
```
GET /api/match-event?status=OPEN&document=true&count=true&page=1&limit=10
```

---

## Match Event Settings Explained

### `autoAccept: true`
- **true**: Joins are automatically accepted if slots available
- **false**: Creator must manually approve each join request

### `isPublic: true`
- **true**: Event appears in public listings
- **false**: Only people with the link can join

### `allowWaitlist: true`
- **true**: When full, new participants go to waitlist
- **false**: No more participants accepted when full

### Event Status Flow
1. **DRAFT**: Created but not published
2. **OPEN**: Accepting participants
3. **FULL**: All slots filled (may accept waitlist)
4. **CONFIRMED**: All participants confirmed
5. **IN_PROGRESS**: Event happening now
6. **COMPLETED**: Event finished
7. **CANCELLED**: Event cancelled

---

## Complete Example with Your Facility

Based on your basketball court (`695b113d92807cb6ada994a0`):

### 1. Create Reservation
```bash
POST /api/reservation
Content-Type: application/json

{
  "facilityId": "695b113d92807cb6ada994a0",
  "organizationId": "507f1f77bcf86cd799439011",
  "status": "CONFIRMED",
  "guestCount": 1,
  "purpose": "Basketball match",
  "eventName": "5v5 Basketball Game",
  "bookingPeriod": {
    "startDateTime": "2026-01-15T18:00:00Z",
    "endDateTime": "2026-01-15T20:00:00Z",
    "numberOfHours": 2
  },
  "bookingSource": "web"
}
```

### 2. Create Match Event (Use reservation ID from step 1)
```bash
POST /api/match-event
Content-Type: application/json

{
  "reservationId": "<RESERVATION_ID_FROM_STEP_1>",
  "title": "Basketball 5v5 - Looking for Players",
  "description": "Friendly 5v5 game. Need 9 more players!",
  "maxParticipants": 10,
  "minParticipants": 6,
  "allowWaitlist": true,
  "status": "OPEN",
  "isPublic": true,
  "autoAccept": true,
  "skillLevel": "INTERMEDIATE"
}
```

### 3. Share the Match Event ID
- Others can join using: `POST /api/match-event/<MATCH_EVENT_ID>/join`
- Or discover it via: `GET /api/match-event?status=OPEN`

---

## Tips

1. **Reserve First**: Always create a reservation before creating a match event
2. **Set maxParticipants**: Based on your facility's `metadata.maxPlayers` (10 for your court)
3. **Use autoAccept**: Set to `true` for easier joining, `false` for more control
4. **Check Status**: Event status automatically changes to `FULL` when participants reach max
5. **Waitlist**: Enable waitlist if you want backup players if someone leaves

---

## Troubleshooting

**Error: "This reservation already has a match event"**
- Each reservation can only have one match event
- Check if a match event already exists: `GET /api/match-event?filter=reservationId:<ID>`

**Error: "Reservation not found"**
- Make sure the reservation ID is correct
- Verify the reservation was created successfully

**Event shows as FULL but you want more players**
- Update `maxParticipants`: `PATCH /api/match-event/<ID>` with new `maxParticipants`
- Status will automatically change back to `OPEN` if participants < max

