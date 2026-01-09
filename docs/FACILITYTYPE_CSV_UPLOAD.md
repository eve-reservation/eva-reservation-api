# FacilityType CSV Upload Guide

## Overview

The FacilityType CSV upload feature allows you to bulk create multiple facility types by uploading a CSV file. This is useful for importing facility templates efficiently.

## Endpoint

```
POST /api/facilityType/upload-csv
```

**Content-Type**: `multipart/form-data`

**Required Field**: `file` (CSV file)

## CSV Format

### Required Columns

| Column Name | Type   | Required | Description        | Example             |
| ----------- | ------ | -------- | ------------------ | ------------------- |
| name        | String | Yes      | Facility type name | Guest Room Template |

### Optional Columns

| Column Name    | Type   | Required | Description                                | Example                  |
| -------------- | ------ | -------- | ------------------------------------------ | ------------------------ |
| description    | String | No       | Facility type description                  | Standard guest room      |
| code           | String | No       | Facility type code (for reference)         | GR-STD                   |
| spaceType      | Enum   | No       | Space type classification (see below)      | ROOM                     |
| subtype        | String | No       | Subtype based on spaceType (see below)     | GUEST_ROOM               |
| organizationId | String | No       | Organization identifier (MongoDB ObjectId) | 507f1f77bcf86cd799439011 |

## Space Type & Subtype Enums

### SpaceType Values

- `ROOM` - Indoor enclosed spaces (hotel rooms, conference rooms, offices)
- `COURT` - Sports/recreation courts (tennis, basketball, etc.)
- `DINING` - Food & beverage spaces (restaurant, cafe, bar)
- `FITNESS` - Gym and fitness facilities
- `PARKING` - Parking spaces/lots
- `AMENITY` - Pool, spa, lounge, etc.
- `OUTDOOR` - Outdoor spaces (garden, terrace, etc.)
- `OTHER`

### Subtype Values (by SpaceType)

**When spaceType = ROOM:**

- `GUEST_ROOM`, `CONFERENCE_ROOM`, `OFFICE`, `STUDIO`, `CLASSROOM`, `BALLROOM`, `SUITE`, `OTHER`

**When spaceType = COURT:**

- `TENNIS`, `BASKETBALL`, `VOLLEYBALL`, `BADMINTON`, `SQUASH`, `RACQUETBALL`, `PICKLEBALL`, `MULTIPURPOSE`, `OTHER`

**When spaceType = DINING:**

- `FINE_DINING`, `CASUAL_DINING`, `CAFE`, `BAR`, `LOUNGE`, `BUFFET`, `PRIVATE_DINING`, `FOOD_COURT`, `OTHER`

**When spaceType = FITNESS:**

- `WEIGHT_ROOM`, `CARDIO_AREA`, `YOGA_STUDIO`, `SPIN_STUDIO`, `CROSSFIT_BOX`, `PILATES_STUDIO`, `MULTIPURPOSE`, `OTHER`

**When spaceType = PARKING:**

- `COVERED`, `OPEN_LOT`, `GARAGE`, `VALET`, `EV_CHARGING`, `DISABLED`, `MOTORCYCLE`, `BICYCLE`, `OTHER`

**When spaceType = AMENITY:**

- `SWIMMING_POOL`, `HOT_TUB`, `SAUNA`, `STEAM_ROOM`, `SPA`, `LIBRARY`, `BUSINESS_CENTER`, `GAME_ROOM`, `LOUNGE`, `ROOFTOP`, `GARDEN`, `OTHER`

## CSV Template Examples

### Example 1: Complete Facility Types with Classification

```csv
name,description,code,spaceType,subtype,organizationId
Guest Room Template,Standard guest room,GR-STD,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Deluxe Room Template,Deluxe guest room with premium amenities,GR-DLX,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Executive Suite Template,Executive suite with multiple rooms,RM-EXEC,ROOM,SUITE,507f1f77bcf86cd799439011
Conference Room Template,Meeting and conference room,CR-CONF,ROOM,CONFERENCE_ROOM,507f1f77bcf86cd799439011
Tennis Court Template,Standard tennis court,CT-TEN,COURT,TENNIS,507f1f77bcf86cd799439011
Basketball Court Template,Indoor basketball court,CT-BSK,COURT,BASKETBALL,507f1f77bcf86cd799439011
Swimming Pool Template,Olympic-size swimming pool,AM-POOL,AMENITY,SWIMMING_POOL,507f1f77bcf86cd799439011
Parking Space Template,Covered parking space,PK-COV,PARKING,COVERED,507f1f77bcf86cd799439011
```

### Example 2: Basic Facility Types (Without Classification)

```csv
name,code,organizationId
Guest Room Template,GR-001,507f1f77bcf86cd799439011
Conference Room Template,CR-001,507f1f77bcf86cd799439011
Tennis Court Template,TC-001,507f1f77bcf86cd799439011
Swimming Pool Template,SP-001,507f1f77bcf86cd799439011
Parking Space Template,PS-001,507f1f77bcf86cd799439011
```

### Example 3: Minimal (Name Only)

```csv
name
Basic Room
Basic Court
Basic Parking
Basic Pool
Basic Gym
```

## Response Format

### Success Response (201)

All facility types created successfully:

```json
{
	"success": true,
	"message": "All facility types created successfully from CSV",
	"statusCode": 201,
	"data": {
		"summary": {
			"totalRows": 3,
			"successful": 3,
			"failed": 0
		},
		"createdFacilityTypes": [
			{
				"id": "507f1f77bcf86cd799439017",
				"name": "Guest Room Template",
				"organizationId": "507f1f77bcf86cd799439011",
				"createdAt": "2026-01-09T00:00:00.000Z",
				"updatedAt": "2026-01-09T00:00:00.000Z"
			}
			// ... more facility types
		]
	}
}
```

### Partial Success Response (207)

Some facility types created, some failed:

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
		"createdFacilityTypes": [
			// Successfully created facility types
		],
		"errors": [
			{
				"name": "Invalid Template",
				"error": "Validation failed: Name is required"
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
			"name": "Room Template",
			"errors": [
				{
					"field": "name",
					"message": "Name must be at most 255 characters"
				}
			]
		},
		{
			"row": 3,
			"name": "N/A",
			"errors": [
				{
					"field": "name",
					"message": "Name is required and must be a non-empty string"
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

2. **Name Field**:
    - Required for all rows
    - Maximum length: 255 characters
    - Must be a non-empty string

3. **Code Field**:
    - Optional unique identifier for the facility type
    - Useful for internal reference or integration purposes
    - Example: `GR-STD`, `CT-TEN`, `AM-POOL`

4. **SpaceType & Subtype**:
    - `spaceType` must be one of the valid enum values (case-sensitive)
    - `subtype` should match the spaceType (see enum lists above)
    - Both are optional but help with classification

5. **ObjectId Fields**:
    - `organizationId` must be a valid MongoDB ObjectId (24 hex characters)
    - Example format: `507f1f77bcf86cd799439011`

6. **Validation**:
    - Each row is validated before creation
    - If validation fails for any row, that row is skipped
    - Other valid rows will still be created
    - Detailed error messages are returned for failed rows

## Testing

You can test the endpoint using curl:

```bash
curl -X POST http://localhost:3000/api/facilityType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facility-types.csv"
```

Or using Postman:

1. Create a new POST request to `/api/facilityType/upload-csv`
2. Go to Body tab
3. Select "form-data"
4. Add a key named "file" with type "File"
5. Choose your CSV file
6. Send the request

## Best Practices

1. **Start Small**: Test with a small CSV file (5-10 rows) first
2. **Verify IDs**: Ensure all ObjectIds exist in your database before importing
3. **Unique Names**: While not enforced by unique constraint, use meaningful unique names for clarity
4. **Organize by Purpose**: Group similar facility types together in your CSV
5. **Review Errors**: If some rows fail, review the error messages and fix the CSV before re-uploading

## Troubleshooting

### Common Issues

1. **"Only CSV files are allowed"**
    - Make sure your file has a .csv extension
    - Verify the file MIME type is text/csv

2. **"Name is required and must be a non-empty string"**
    - Ensure every row has a name value
    - Check for empty cells in the name column

3. **"Invalid ObjectId format"**
    - Ensure organizationId is 24 hex characters
    - Check for typos in the ID

4. **"Name must be at most 255 characters"**
    - Shorten the name field
    - Use abbreviations if necessary

5. **"Invalid spaceType value"**
    - Ensure spaceType matches one of the enum values exactly
    - Values are case-sensitive (use ROOM not room)

## Use Cases

### Hotel Room Types

```csv
name,description,code,spaceType,subtype,organizationId
Standard Single,Single bed standard room,RM-STD-S,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Standard Double,Double bed standard room,RM-STD-D,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Deluxe King,King bed deluxe room,RM-DLX-K,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Executive Suite,Executive suite with living area,RM-EXEC,ROOM,SUITE,507f1f77bcf86cd799439011
Presidential Suite,Presidential suite with multiple rooms,RM-PRES,ROOM,SUITE,507f1f77bcf86cd799439011
```

### Sports Facilities

```csv
name,description,code,spaceType,subtype,organizationId
Indoor Tennis Court,Climate-controlled indoor tennis,CT-TEN-IN,COURT,TENNIS,507f1f77bcf86cd799439011
Outdoor Tennis Court,Open-air tennis court,CT-TEN-OUT,COURT,TENNIS,507f1f77bcf86cd799439011
Basketball Court,Full-size basketball court,CT-BSK,COURT,BASKETBALL,507f1f77bcf86cd799439011
Volleyball Court,Sand volleyball court,CT-VLB,COURT,VOLLEYBALL,507f1f77bcf86cd799439011
Badminton Court,Indoor badminton court,CT-BAD,COURT,BADMINTON,507f1f77bcf86cd799439011
```

### Meeting Spaces

```csv
name,description,code,spaceType,subtype,organizationId
Small Conference Room,Seats up to 10 people,CR-SM,ROOM,CONFERENCE_ROOM,507f1f77bcf86cd799439011
Large Conference Room,Seats up to 50 people,CR-LG,ROOM,CONFERENCE_ROOM,507f1f77bcf86cd799439011
Board Room,Executive boardroom,CR-BD,ROOM,CONFERENCE_ROOM,507f1f77bcf86cd799439011
Training Room,Training and workshop room,CR-TR,ROOM,CLASSROOM,507f1f77bcf86cd799439011
Auditorium,Large auditorium for events,CR-AUD,ROOM,BALLROOM,507f1f77bcf86cd799439011
```

## Integration with Facility Creation

After creating facility types via CSV upload, you can:

1. Use these facility types when creating individual facilities
2. Reference the facility type IDs in the facility creation API
3. The facility will inherit pricing and other properties from the facility type

Example:

```bash
# After CSV import, use the created facilityTypeId
curl -X POST http://localhost:3000/api/facility \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityTypeId": "507f1f77bcf86cd799439017",
    "identifier": "Room-101",
    "displayName": "Deluxe Ocean View Suite"
  }'
```

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.0.0
