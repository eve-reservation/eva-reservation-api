# Court Facility JSON Examples

This document contains JSON examples for creating court facilities that can be used with the matchmaking feature.

## Required Fields

- `facilityTypeId`: ObjectId reference to a FacilityType (required)
- `identifier`: Unique identifier for the facility (required, e.g., "Basketball Court 1")
- `organizationId`: Organization identifier (required)

## Optional Fields

- `displayName`: Friendly display name
- `locationId`: Reference to Location model
- `spaceType`: Should be "COURT" for court facilities
- `subtype`: One of TENNIS, BASKETBALL, VOLLEYBALL, BADMINTON, SQUASH, RACQUETBALL, PICKLEBALL, MULTIPURPOSE, OTHER
- `status`: Defaults to "AVAILABLE"
- `rateTypeId`: Reference to RateType for pricing
- `metadata`: Court-specific metadata (see below)
- `images`: Array of facility images
- `attributes`: Additional custom attributes (JSON)

## Court Metadata Requirements

**Required:**
- `sportType`: String (e.g., "Basketball", "Tennis") - *Note: Optional for MULTIPURPOSE courts*

**Optional:**
- `surfaceType`: String (e.g., "Hardwood", "Clay", "Hardcourt", "Sand")
- `isIndoor`: Boolean (default: false)
- `hasLighting`: Boolean (default: false)
- `maxPlayers`: Integer (minimum: 1)
- `equipmentProvided`: Array of strings
- `openingHours`: String (e.g., "6:00 AM - 11:00 PM")
- `courtSize`: String (e.g., "Standard", "Full Court", "Half-court")

---

## Example 1: Basketball Court

```json
{
  "facilityTypeId": "507f1f77bcf86cd799439017",
  "identifier": "Basketball Court 1",
  "displayName": "Indoor Basketball Court - Main Arena",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "spaceType": "COURT",
  "subtype": "BASKETBALL",
  "status": "AVAILABLE",
  "rateTypeId": "507f1f77bcf86cd799439030",
  "metadata": {
    "sportType": "Basketball",
    "surfaceType": "Hardwood",
    "isIndoor": true,
    "hasLighting": true,
    "maxPlayers": 10,
    "equipmentProvided": [
      "Basketball",
      "Scoreboard",
      "Benches",
      "Water Cooler"
    ],
    "openingHours": "6:00 AM - 11:00 PM",
    "courtSize": "Full Court"
  },
  "images": [
    {
      "name": "Basketball Court Main View",
      "url": "https://example.com/images/basketball-court-1.jpg",
      "type": "COVER"
    }
  ]
}
```

**Use Case:** Perfect for creating "Basketball 5v5" match events where 10 players are needed.

---

## Example 2: Tennis Court

```json
{
  "facilityTypeId": "507f1f77bcf86cd799439018",
  "identifier": "Tennis Court 1",
  "displayName": "Outdoor Tennis Court - Center Court",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "status": "AVAILABLE",
  "rateTypeId": "507f1f77bcf86cd799439030",
  "metadata": {
    "sportType": "Tennis",
    "surfaceType": "Hardcourt",
    "isIndoor": false,
    "hasLighting": true,
    "maxPlayers": 4,
    "equipmentProvided": [
      "Tennis Balls",
      "Net",
      "Rackets (available for rent)"
    ],
    "openingHours": "7:00 AM - 10:00 PM",
    "courtSize": "Standard"
  }
}
```

---

## Example 3: Multi-Purpose Court

```json
{
  "facilityTypeId": "507f1f77bcf86cd799439019",
  "identifier": "Multi-Purpose Court 1",
  "displayName": "Indoor Multi-Sport Court",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "spaceType": "COURT",
  "subtype": "MULTIPURPOSE",
  "status": "AVAILABLE",
  "rateTypeId": "507f1f77bcf86cd799439030",
  "metadata": {
    "surfaceType": "Synthetic",
    "isIndoor": true,
    "hasLighting": true,
    "maxPlayers": 20,
    "equipmentProvided": [
      "Various Sports Equipment",
      "Nets",
      "Cones",
      "Scoreboard"
    ],
    "openingHours": "6:00 AM - 11:00 PM",
    "courtSize": "Full Court"
  },
  "attributes": {
    "supportedSports": [
      "Basketball",
      "Volleyball",
      "Badminton",
      "Futsal"
    ]
  }
}
```

**Note:** For MULTIPURPOSE courts, `sportType` in metadata is optional.

---

## Example 4: Volleyball Court

```json
{
  "facilityTypeId": "507f1f77bcf86cd799439020",
  "identifier": "Volleyball Court 1",
  "displayName": "Beach Volleyball Court",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "spaceType": "COURT",
  "subtype": "VOLLEYBALL",
  "status": "AVAILABLE",
  "rateTypeId": "507f1f77bcf86cd799439030",
  "metadata": {
    "sportType": "Volleyball",
    "surfaceType": "Sand",
    "isIndoor": false,
    "hasLighting": true,
    "maxPlayers": 12,
    "equipmentProvided": [
      "Volleyball",
      "Net",
      "Boundary Lines"
    ],
    "openingHours": "8:00 AM - 9:00 PM",
    "courtSize": "Standard"
  }
}
```

---

## Minimal Example (Required Fields Only)

```json
{
  "facilityTypeId": "507f1f77bcf86cd799439017",
  "identifier": "Court 1",
  "organizationId": "507f1f77bcf86cd799439011",
  "spaceType": "COURT",
  "subtype": "BASKETBALL",
  "metadata": {
    "sportType": "Basketball"
  }
}
```

---

## API Usage

### Create Facility

```bash
POST /api/facility
Content-Type: application/json

# Use one of the JSON examples above
```

### Then Create Reservation

```bash
POST /api/reservation
Content-Type: application/json

{
  "facilityId": "<facility-id-from-above>",
  "bookingPeriod": {
    "startDateTime": "2025-01-15T18:00:00Z",
    "endDateTime": "2025-01-15T20:00:00Z",
    "numberOfHours": 2
  }
}
```

### Then Create Match Event

```bash
POST /api/match-event
Content-Type: application/json

{
  "reservationId": "<reservation-id-from-above>",
  "title": "Basketball 5v5",
  "description": "Looking for 9 more players",
  "maxParticipants": 10,
  "autoAccept": true,
  "isPublic": true
}
```

---

## Available Court Subtypes

- `TENNIS`
- `BASKETBALL`
- `VOLLEYBALL`
- `BADMINTON`
- `SQUASH`
- `RACQUETBALL`
- `PICKLEBALL`
- `MULTIPURPOSE`
- `OTHER`

---

## Notes

1. **facilityTypeId**: You must create a FacilityType first (or use an existing one) that matches the spaceType and subtype.

2. **OrganizationId**: This should match your organization's ID. The unique constraint `@@unique([organizationId, identifier])` ensures that identifiers are unique within an organization.

3. **Metadata Validation**: The metadata will be validated against the `SportsCourtMetadataSchema` based on the spaceType and subtype.

4. **Images**: Image URLs should point to hosted images. The system may upload to Cloudinary if using multipart/form-data.

5. **Matchmaking Integration**: After creating a court facility, you can create reservations and match events on it for players to join.

