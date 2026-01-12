# Matchmaking MVP Documentation

## Overview

The Matchmaking feature allows users to create and join events for reservations. For example, a user can reserve a basketball court and create a "Basketball 5v5" match event, then other users can discover and join that event.

## Architecture

The matchmaking system is built on top of the existing reservation system:

1. **Reservation** (existing): A booking for a facility (e.g., basketball court)
2. **MatchEvent** (new): An event linked to a reservation that allows participants to join
3. **MatchParticipant** (new): Tracks users who join a match event

## Data Models

### MatchEvent

- **reservationId** (required): Links to an existing reservation (one-to-one)
- **createdBy**: User ID of the event creator
- **title**: Event name (e.g., "Basketball 5v5")
- **description**: Optional event description
- **maxParticipants**: Maximum number of participants (default: 10)
- **minParticipants**: Minimum required participants (default: 2)
- **status**:
    - `DRAFT`: Created but not published
    - `OPEN`: Accepting participants
    - `FULL`: All slots filled (may accept waitlist)
    - `CONFIRMED`: All participants confirmed
    - `IN_PROGRESS`: Event happening now
    - `COMPLETED`: Event finished
    - `CANCELLED`: Event cancelled
- **autoAccept**: If true, automatically accept join requests (default: false)
- **isPublic**: Whether others can discover this event (default: true)
- **skillLevel**: Optional filter (e.g., "BEGINNER", "INTERMEDIATE", "ADVANCED")
- **genderPreference**: Optional filter ("MIXED", "MALE", "FEMALE")
- **ageRange**: Optional filter (e.g., {min: 18, max: 50})

### MatchParticipant

- **matchEventId**: Link to the match event
- **userId**: User joining the event
- **status**:
    - `PENDING`: Request pending approval
    - `ACCEPTED`: Accepted into event
    - `REJECTED`: Request rejected
    - `WAITLIST`: On waitlist (event full)
    - `CONFIRMED`: Confirmed attendance
    - `CHECKED_IN`: Attended the event
    - `NO_SHOW`: Did not attend
    - `LEFT`: Left early

## API Endpoints

### Match Event Endpoints

#### Create Match Event

```
POST /api/match-event
```

Creates a match event for an existing reservation.

**Request Body:**

```json
{
	"reservationId": "507f1f77bcf86cd799439011",
	"title": "Basketball 5v5",
	"description": "Looking for 9 more players",
	"maxParticipants": 10,
	"minParticipants": 2,
	"autoAccept": false,
	"isPublic": true,
	"skillLevel": "INTERMEDIATE"
}
```

#### Get Match Event

```
GET /api/match-event/:id
```

#### Get All Match Events

```
GET /api/match-event?status=OPEN&page=1&limit=10
```

Filters and paginates public match events.

#### Update Match Event

```
PATCH /api/match-event/:id
```

Only the event creator can update.

#### Delete Match Event

```
DELETE /api/match-event/:id
```

Only the event creator can delete.

### Participant Endpoints

#### Join Match Event

```
POST /api/match-event/:id/join
```

Request to join a match event. If `autoAccept` is true and slots are available, participant is automatically accepted. Otherwise, status is `PENDING` and requires creator approval.

**Request Body:**

```json
{
	"notes": "I'm an experienced player"
}
```

#### Leave Match Event

```
POST /api/match-event/:id/leave
```

Leave a match event you've joined.

#### Get Participants

```
GET /api/match-event/:id/participants?status=ACCEPTED
```

Get all participants for a match event, optionally filtered by status.

#### Update Participant Status

```
PATCH /api/match-event/participant/:participantId
```

Only the event creator can update participant status (accept/reject/confirm).

**Request Body:**

```json
{
	"status": "ACCEPTED",
	"notes": "Welcome to the team!"
}
```

## User Flow Example

### 1. Create Reservation

```bash
POST /api/reservation
{
  "facilityId": "...",
  "bookingPeriod": {
    "startDateTime": "2025-01-15T18:00:00Z",
    "endDateTime": "2025-01-15T20:00:00Z"
  }
}
```

### 2. Create Match Event

```bash
POST /api/match-event
{
  "reservationId": "<reservation-id-from-step-1>",
  "title": "Basketball 5v5 - Evening Game",
  "description": "Looking for players for a friendly 5v5 game",
  "maxParticipants": 10,
  "autoAccept": true,
  "skillLevel": "INTERMEDIATE"
}
```

### 3. Other Users Discover and Join

```bash
# Browse available events
GET /api/match-event?status=OPEN

# Join an event
POST /api/match-event/<match-event-id>/join
{
  "notes": "I'd love to join!"
}
```

### 4. Event Creator Manages Participants (if autoAccept=false)

```bash
# See pending requests
GET /api/match-event/<match-event-id>/participants?status=PENDING

# Accept a participant
PATCH /api/match-event/participant/<participant-id>
{
  "status": "ACCEPTED"
}
```

## Business Logic

1. **Event Capacity**: When participants reach `maxParticipants`, event status automatically changes to `FULL`.

2. **Auto-Accept**: If `autoAccept` is true:
    - Joins are automatically accepted if slots available
    - If full, participant goes to waitlist (if `allowWaitlist` is true)

3. **Manual Approval**: If `autoAccept` is false:
    - All joins require creator approval
    - Creator must accept/reject each request

4. **Waitlist**: When event is full and `allowWaitlist` is true, new participants get `WAITLIST` status. When someone leaves, waitlist participants can be promoted.

5. **Event Status Updates**:
    - `OPEN` → `FULL`: When participants reach max
    - `FULL` → `OPEN`: When a participant leaves and space opens

## Integration with Reservation System

- Each MatchEvent is linked to exactly one Reservation
- Reservation provides the facility, time slot, and basic booking info
- MatchEvent adds the social/matchmaking layer on top
- Participants are tracked separately from reservation guests (though they can be linked via `guestId`)

## Future Enhancements (Not in MVP)

- Automatic waitlist promotion
- Notifications when events are full or participants join
- Skill-based matching suggestions
- Participant ratings/reviews
- Recurring events
- Team/group joining
- Payment splitting among participants

## Testing

After generating Prisma client, you can test the endpoints:

```bash
# Generate Prisma client
npm run prisma-generate

# Example: Create a reservation first, then create a match event
# Then other users can join via POST /api/match-event/:id/join
```

## Database Migration

After adding the new schema files, run:

```bash
npm run prisma-generate
```

The schema files in `prisma/schema/` are automatically picked up by Prisma with the `prismaSchemaFolder` feature.
