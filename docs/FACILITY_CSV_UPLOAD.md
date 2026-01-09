# Facility CSV Upload Guide

## Overview

The Facility CSV upload feature allows you to bulk create multiple facilities by uploading a CSV file. This is useful for importing large numbers of facilities into the system efficiently.

## Endpoint

```
POST /api/facility/upload-csv
```

**Content-Type**: `multipart/form-data`

**Required Field**: `file` (CSV file)

## CSV Format

### Required Columns

| Column Name      | Type   | Required | Description                                    | Example                        |
| ---------------- | ------ | -------- | ---------------------------------------------- | ------------------------------ |
| facilityTypeId   | String | Yes      | MongoDB ObjectId of the facility type          | 507f1f77bcf86cd799439011       |
| identifier       | String | Yes      | Unique identifier for the facility             | Room-101                       |

### Optional Columns

| Column Name      | Type   | Required | Description                                    | Example                        |
| ---------------- | ------ | -------- | ---------------------------------------------- | ------------------------------ |
| displayName      | String | No       | Human-readable display name                    | Executive Suite 101            |
| organizationId   | String | No       | Organization ID                                | org-001                        |
| locationId       | String | No       | MongoDB ObjectId of the location               | 507f1f77bcf86cd799439012       |
| rateTypeId       | String | No       | MongoDB ObjectId of the rate type              | 507f1f77bcf86cd799439013       |
| spaceType        | Enum   | No       | Type of space (see SpaceType enum below)       | ROOM                           |
| subtype          | String | No       | Subtype based on spaceType (see below)         | GUEST_ROOM                     |
| status           | Enum   | No       | Facility status (defaults to AVAILABLE)        | AVAILABLE                      |
| attributes       | JSON   | No       | Custom attributes as JSON string               | {"feature":"value"}            |
| metadata         | JSON   | No       | Space-specific metadata as JSON string         | {"bedType":"KING"}             |

## Enums

### SpaceType
- `ROOM` - Indoor enclosed spaces (hotel rooms, conference rooms, offices)
- `COURT` - Sports/recreation courts (tennis, basketball, etc.)
- `DINING` - Food & beverage spaces (restaurant, cafe, bar)
- `FITNESS` - Gym and fitness facilities
- `PARKING` - Parking spaces/lots
- `AMENITY` - Pool, spa, lounge, etc.
- `OUTDOOR` - Outdoor spaces (garden, terrace, etc.)
- `OTHER`

### RoomSubtype (when spaceType = ROOM)
- `GUEST_ROOM` - Hotel/accommodation rooms
- `CONFERENCE_ROOM` - Meeting/conference rooms
- `OFFICE` - Office spaces
- `STUDIO` - Photography/recording studio
- `CLASSROOM` - Training/education rooms
- `BALLROOM` - Event/banquet halls
- `SUITE` - Multi-room suites
- `OTHER`

### CourtSubtype (when spaceType = COURT)
- `TENNIS`
- `BASKETBALL`
- `VOLLEYBALL`
- `BADMINTON`
- `SQUASH`
- `RACQUETBALL`
- `PICKLEBALL`
- `MULTIPURPOSE`
- `OTHER`

### DiningSubtype (when spaceType = DINING)
- `FINE_DINING`
- `CASUAL_DINING`
- `CAFE`
- `BAR`
- `LOUNGE`
- `BUFFET`
- `PRIVATE_DINING`
- `FOOD_COURT`
- `OTHER`

### FitnessSubtype (when spaceType = FITNESS)
- `WEIGHT_ROOM`
- `CARDIO_AREA`
- `YOGA_STUDIO`
- `SPIN_STUDIO`
- `CROSSFIT_BOX`
- `PILATES_STUDIO`
- `MULTIPURPOSE`
- `OTHER`

### ParkingSubtype (when spaceType = PARKING)
- `COVERED`
- `OPEN_LOT`
- `GARAGE`
- `VALET`
- `EV_CHARGING`
- `DISABLED`
- `MOTORCYCLE`
- `BICYCLE`
- `OTHER`

### AmenitySubtype (when spaceType = AMENITY)
- `SWIMMING_POOL`
- `HOT_TUB`
- `SAUNA`
- `STEAM_ROOM`
- `SPA`
- `LIBRARY`
- `BUSINESS_CENTER`
- `GAME_ROOM`
- `LOUNGE`
- `ROOFTOP`
- `GARDEN`
- `OTHER`

### FacilityStatus
- `AVAILABLE` - Ready to be reserved/used
- `OCCUPIED` - Currently in use
- `RESERVED` - Reserved but not yet occupied
- `MAINTENANCE` - Under maintenance/repair
- `CLEANING` - Being cleaned/prepared
- `OUT_OF_SERVICE` - Temporarily unavailable
- `BLOCKED` - Manually blocked (not available for booking)

## Metadata Examples

Metadata is specific to the `spaceType` and `subtype` combination. Here are examples:

### ROOM + GUEST_ROOM
```json
{
  "bedType": "KING",
  "bedCount": 1,
  "maxOccupancy": 2,
  "roomFeatures": ["AC", "TV", "WiFi"],
  "amenities": ["Mini Bar", "Coffee Maker"]
}
```

### ROOM + CONFERENCE_ROOM
```json
{
  "seatingCapacity": 20,
  "layout": "Boardroom",
  "hasProjector": true,
  "hasVideoConferencing": true,
  "whiteboard": true
}
```

### COURT + TENNIS
```json
{
  "surfaceType": "Hard Court",
  "isIndoor": false,
  "hasLights": true,
  "maxPlayers": 4
}
```

### COURT + BASKETBALL
```json
{
  "surfaceType": "Hardwood",
  "isIndoor": true,
  "hasLights": true,
  "maxPlayers": 10,
  "hoopCount": 2
}
```

### DINING + FINE_DINING
```json
{
  "cuisineType": "Italian",
  "seatingCapacity": 50,
  "dresscode": "Smart Casual",
  "avgMealPrice": 75.00
}
```

### FITNESS + YOGA_STUDIO
```json
{
  "capacity": 15,
  "hasShowers": true,
  "hasLockers": true,
  "floorType": "Bamboo",
  "equipment": ["Mats", "Blocks", "Straps"]
}
```

### PARKING + COVERED
```json
{
  "vehicleType": "Car",
  "isReserved": false,
  "floor": 2,
  "zone": "A",
  "hasEVCharging": false
}
```

## CSV Template Examples

### Example 1: Hotel Rooms

```csv
facilityTypeId,identifier,displayName,organizationId,locationId,rateTypeId,spaceType,subtype,status,metadata
507f1f77bcf86cd799439011,Room-101,Executive Suite 101,org-001,507f1f77bcf86cd799439012,507f1f77bcf86cd799439013,ROOM,GUEST_ROOM,AVAILABLE,"{""bedType"":""KING"",""bedCount"":1,""maxOccupancy"":2}"
507f1f77bcf86cd799439011,Room-102,Deluxe Room 102,org-001,507f1f77bcf86cd799439012,507f1f77bcf86cd799439013,ROOM,GUEST_ROOM,AVAILABLE,"{""bedType"":""QUEEN"",""bedCount"":2,""maxOccupancy"":4}"
507f1f77bcf86cd799439011,Room-103,Standard Room 103,org-001,507f1f77bcf86cd799439012,507f1f77bcf86cd799439013,ROOM,GUEST_ROOM,AVAILABLE,"{""bedType"":""TWIN"",""bedCount"":2,""maxOccupancy"":2}"
```

### Example 2: Sports Courts

```csv
facilityTypeId,identifier,displayName,organizationId,locationId,rateTypeId,spaceType,subtype,status,metadata
507f1f77bcf86cd799439014,Court-T1,Tennis Court 1,org-001,507f1f77bcf86cd799439015,507f1f77bcf86cd799439016,COURT,TENNIS,AVAILABLE,"{""surfaceType"":""Hard Court"",""isIndoor"":false,""hasLights"":true,""maxPlayers"":4}"
507f1f77bcf86cd799439014,Court-B1,Basketball Court 1,org-001,507f1f77bcf86cd799439015,507f1f77bcf86cd799439016,COURT,BASKETBALL,AVAILABLE,"{""surfaceType"":""Hardwood"",""isIndoor"":true,""hasLights"":true,""maxPlayers"":10}"
507f1f77bcf86cd799439014,Court-V1,Volleyball Court 1,org-001,507f1f77bcf86cd799439015,507f1f77bcf86cd799439016,COURT,VOLLEYBALL,AVAILABLE,"{""surfaceType"":""Sand"",""isIndoor"":false,""hasLights"":true,""maxPlayers"":12}"
```

### Example 3: Mixed Facilities (Minimal Data)

```csv
facilityTypeId,identifier,displayName,organizationId
507f1f77bcf86cd799439011,Conference-A,Conference Room A,org-001
507f1f77bcf86cd799439011,Conference-B,Conference Room B,org-001
507f1f77bcf86cd799439014,Gym-Main,Main Gym,org-001
507f1f77bcf86cd799439014,Pool-1,Swimming Pool,org-001
```

## Response Format

### Success Response (201)

All facilities created successfully:

```json
{
  "success": true,
  "message": "All facilities created successfully from CSV",
  "statusCode": 201,
  "data": {
    "summary": {
      "totalRows": 3,
      "successful": 3,
      "failed": 0
    },
    "createdFacilities": [
      {
        "id": "507f1f77bcf86cd799439017",
        "facilityTypeId": "507f1f77bcf86cd799439011",
        "identifier": "Room-101",
        "displayName": "Executive Suite 101",
        "organizationId": "org-001",
        "status": "AVAILABLE",
        "createdAt": "2026-01-09T00:00:00.000Z",
        "updatedAt": "2026-01-09T00:00:00.000Z"
      }
      // ... more facilities
    ]
  }
}
```

### Partial Success Response (207)

Some facilities created, some failed:

```json
{
  "success": true,
  "message": "CSV import completed with 1 error(s)",
  "statusCode": 207,
  "data": {
    "summary": {
      "totalRows": 3,
      "successful": 2,
      "failed": 1
    },
    "createdFacilities": [
      // Successfully created facilities
    ],
    "errors": [
      {
        "identifier": "Room-102",
        "error": "Duplicate facility: A facility with identifier \"Room-102\" already exists for this organization"
      }
    ]
  }
}
```

### Validation Error Response (400)

CSV data validation failed:

```json
{
  "success": false,
  "message": "CSV validation failed for 2 row(s)",
  "statusCode": 400,
  "errors": [
    {
      "row": 2,
      "identifier": "Room-101",
      "errors": [
        {
          "field": "facilityTypeId",
          "message": "FacilityType with ID 507f1f77bcf86cd799439999 not found"
        }
      ]
    },
    {
      "row": 3,
      "identifier": "Room-102",
      "errors": [
        {
          "field": "metadata",
          "message": "Invalid JSON in metadata column"
        }
      ]
    }
  ]
}
```

## Important Notes

1. **CSV File Format**: 
   - The first row must contain column headers
   - Use UTF-8 encoding
   - File size limit: 50MB
   - Only CSV files are accepted

2. **JSON Fields**:
   - `attributes` and `metadata` columns must contain valid JSON
   - Use double quotes inside JSON strings
   - Escape quotes properly: `"{""key"":""value""}"`

3. **Validation**:
   - Each row is validated before creation
   - If validation fails for any row, that row is skipped
   - Other valid rows will still be created
   - Detailed error messages are returned for failed rows

4. **References**:
   - `facilityTypeId` must exist in the database
   - `locationId` (if provided) must exist in the database
   - `rateTypeId` (if provided) must exist in the database

5. **Unique Constraints**:
   - The combination of `organizationId` and `identifier` must be unique
   - Duplicate entries will fail with an error message

6. **Metadata Validation**:
   - Metadata structure is validated based on `spaceType` and `subtype`
   - See metadata examples above for required fields

## Testing

You can test the endpoint using curl:

```bash
curl -X POST http://localhost:3000/api/facility/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facilities.csv"
```

Or using Postman:
1. Create a new POST request to `/api/facility/upload-csv`
2. Go to Body tab
3. Select "form-data"
4. Add a key named "file" with type "File"
5. Choose your CSV file
6. Send the request

## Best Practices

1. **Start Small**: Test with a small CSV file (5-10 rows) first
2. **Verify IDs**: Ensure all referenced IDs (facilityTypeId, locationId, rateTypeId) exist in your database
3. **Valid JSON**: Test your JSON strings in a JSON validator before adding to CSV
4. **Unique Identifiers**: Use a consistent naming convention for identifiers (e.g., Room-101, Court-T1)
5. **Review Errors**: If some rows fail, review the error messages and fix the CSV before re-uploading

## Troubleshooting

### Common Issues

1. **"Only CSV files are allowed"**
   - Make sure your file has a .csv extension
   - Verify the file MIME type is text/csv

2. **"Invalid JSON in metadata column"**
   - Check JSON syntax
   - Ensure quotes are properly escaped
   - Test JSON in an online validator

3. **"FacilityType not found"**
   - Verify the facilityTypeId exists in your database
   - Check for typos in the ID

4. **"Duplicate facility"**
   - Check if a facility with the same identifier already exists for the organization
   - Use unique identifiers for each facility

5. **"Subtype does not match the specified spaceType"**
   - Ensure the subtype is valid for the given spaceType
   - Refer to the enum lists above
