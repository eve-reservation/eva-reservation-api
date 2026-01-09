# Facility Metadata Implementation - Summary

## Overview

This document provides a comprehensive guide to creating facilities with polymorphic metadata validation based on the FacilityType's `spaceType` and `subtype` fields. The metadata validation system ensures that facility metadata matches the expected schema for each space type/subtype combination using Zod schemas.

## Key Concepts

### Facility vs FacilityType

- **FacilityType**: Template/blueprint that defines the structure (spaceType, subtype, pricing)
- **Facility**: Actual instance of a facility with specific metadata (e.g., "Room 101" with specific bed type, "Tennis Court 1" with specific surface type)

### Metadata Validation Flow

1. **Facility Creation**: Client sends facility data with `facilityTypeId` and optional `metadata`
2. **FacilityType Lookup**: System fetches the FacilityType to get `spaceType` and `subtype`
3. **Metadata Validation**: System validates the metadata against the appropriate Zod schema based on spaceType + subtype
4. **Facility Storage**: If validation passes, facility is created with the validated metadata

## Metadata Schema Mapping

The metadata validation uses different Zod schemas based on the FacilityType's `spaceType` and `subtype`:

| Space Type | Subtype                  | Metadata Schema                                | Required Fields                                |
| ---------- | ------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| ROOM       | GUEST_ROOM               | GuestRoomMetadataSchema                        | bedType, bedCount, maxOccupancy                |
| ROOM       | CONFERENCE_ROOM          | ConferenceRoomMetadataSchema                   | seatingCapacity                                |
| ROOM       | OFFICE                   | OfficeMetadataSchema                           | capacity                                       |
| ROOM       | STUDIO                   | StudioMetadataSchema                           | studioType                                     |
| ROOM       | CLASSROOM                | ClassroomMetadataSchema                        | seatingCapacity                                |
| ROOM       | BALLROOM                 | BallroomMetadataSchema                         | capacity, roomSize                             |
| ROOM       | SUITE                    | SuiteMetadataSchema                            | bedType, bedCount, maxOccupancy, numberOfRooms |
| ROOM       | OTHER                    | OtherMetadataSchema                            | customType                                     |
| COURT      | \* (except MULTIPURPOSE) | SportsCourtMetadataSchema                      | sportType                                      |
| COURT      | MULTIPURPOSE             | SportsCourtMetadataSchema (sportType optional) | -                                              |
| COURT      | OTHER                    | OtherMetadataSchema                            | customType                                     |
| DINING     | \* (except OTHER)        | DiningMetadataSchema                           | -                                              |
| DINING     | OTHER                    | OtherMetadataSchema                            | customType                                     |
| FITNESS    | \* (except OTHER)        | FitnessMetadataSchema                          | -                                              |
| FITNESS    | OTHER                    | OtherMetadataSchema                            | customType                                     |
| PARKING    | \* (except OTHER)        | ParkingMetadataSchema                          | -                                              |
| PARKING    | OTHER                    | OtherMetadataSchema                            | customType                                     |
| AMENITY    | \* (except OTHER)        | AmenitySpaceMetadataSchema                     | amenityType                                    |
| AMENITY    | OTHER                    | OtherMetadataSchema                            | customType                                     |
| OUTDOOR    | -                        | OutdoorMetadataSchema                          | outdoorType                                    |
| OTHER      | -                        | OtherMetadataSchema                            | customType                                     |

## API Examples

### 1. Create Guest Room Facility (ROOM - GUEST_ROOM)

**Required Metadata Fields:**

- `bedType`: Enum (SINGLE_BED, DOUBLE_BED, QUEEN_BED, KING_BED, etc.)
- `bedCount`: Integer (minimum 1)
- `maxOccupancy`: Integer (minimum 1)

**Optional Metadata Fields:**

- `amenities`: Array of Amenity enums
- `roomFeatures`: Array of RoomFeature enums
- `floorNumber`: Integer
- `roomSize`: Number (square meters)
- `hasBalcony`: Boolean
- `hasKitchen`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439011",
  "identifier": "Room 101",
  "displayName": "Deluxe Ocean View Suite",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,
    "maxOccupancy": 2,
    "amenities": ["ROOM_SERVICE", "CONCIERGE_SERVICE", "LAUNDRY_SERVICE"],
    "roomFeatures": ["WIFI", "AIR_CONDITIONING", "OCEAN_VIEW", "BALCONY"],
    "floorNumber": 2,
    "roomSize": 45.5,
    "hasBalcony": true,
    "hasKitchen": false
  }
}
```

### 2. Create Conference Room Facility (ROOM - CONFERENCE_ROOM)

**Required Metadata Fields:**

- `seatingCapacity`: Integer (minimum 1)

**Optional Metadata Fields:**

- `hasProjector`: Boolean
- `hasWhiteboard`: Boolean
- `hasVideoConferencing`: Boolean
- `hasAudioSystem`: Boolean
- `layout`: String
- `equipment`: Array of strings
- `roomSize`: Number
- `hasNaturalLight`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439014",
  "identifier": "Conference Room A",
  "displayName": "Executive Boardroom",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "seatingCapacity": 20,
    "hasProjector": true,
    "hasWhiteboard": true,
    "hasVideoConferencing": true,
    "hasAudioSystem": true,
    "layout": "Boardroom",
    "equipment": ["4K Display", "Video Conferencing System", "Wireless Presentation"],
    "roomSize": 50,
    "hasNaturalLight": true
  }
}
```

### 3. Create Office Facility (ROOM - OFFICE)

**Required Metadata Fields:**

- `capacity`: Integer (minimum 1)

**Optional Metadata Fields:**

- `hasDesk`: Boolean
- `hasChair`: Boolean
- `hasComputer`: Boolean
- `hasPhone`: Boolean
- `equipment`: Array of strings
- `roomSize`: Number
- `isPrivate`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439015",
  "identifier": "Office 305",
  "displayName": "Private Executive Office",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "capacity": 1,
    "hasDesk": true,
    "hasChair": true,
    "hasComputer": true,
    "hasPhone": true,
    "equipment": ["Dual Monitor Setup", "Ergonomic Chair", "Phone System"],
    "roomSize": 25,
    "isPrivate": true
  }
}
```

### 4. Create Suite Facility (ROOM - SUITE)

**Required Metadata Fields:**

- `bedType`: Enum
- `bedCount`: Integer (minimum 1)
- `maxOccupancy`: Integer (minimum 1)
- `numberOfRooms`: Integer (minimum 2)

**Optional Metadata Fields:**

- `amenities`: Array of Amenity enums
- `roomFeatures`: Array of RoomFeature enums
- `roomSize`: Number
- `hasLivingRoom`: Boolean
- `hasKitchen`: Boolean
- `hasDiningArea`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439013",
  "identifier": "Suite 205",
  "displayName": "Family Suite",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "bedType": "QUEEN_BED",
    "bedCount": 2,
    "maxOccupancy": 5,
    "numberOfRooms": 2,
    "amenities": ["ROOM_SERVICE", "CONCIERGE_SERVICE"],
    "roomFeatures": ["WIFI", "AIR_CONDITIONING", "KITCHEN", "DINING_AREA", "CITY_VIEW"],
    "roomSize": 80,
    "hasLivingRoom": true,
    "hasKitchen": true,
    "hasDiningArea": true
  }
}
```

### 5. Create Tennis Court Facility (COURT - TENNIS)

**Required Metadata Fields:**

- `sportType`: String

**Optional Metadata Fields:**

- `surfaceType`: String
- `isIndoor`: Boolean
- `hasLighting`: Boolean
- `maxPlayers`: Integer
- `equipmentProvided`: Array of strings
- `openingHours`: String
- `courtSize`: String

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439017",
  "identifier": "Tennis Court 1",
  "displayName": "Indoor Tennis Court A",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "sportType": "Tennis",
    "surfaceType": "Hardcourt",
    "isIndoor": true,
    "hasLighting": true,
    "maxPlayers": 4,
    "equipmentProvided": ["Balls", "Net", "Rackets"],
    "openingHours": "6:00 AM - 11:00 PM",
    "courtSize": "Standard"
  }
}
```

### 6. Create Multipurpose Court Facility (COURT - MULTIPURPOSE)

**Note:** For MULTIPURPOSE courts, `sportType` is optional.

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439018",
  "identifier": "Court Multipurpose 1",
  "displayName": "Multipurpose Sports Court",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "surfaceType": "Hardcourt",
    "isIndoor": true,
    "hasLighting": true,
    "maxPlayers": 10,
    "equipmentProvided": ["Balls", "Nets"],
    "openingHours": "7:00 AM - 10:00 PM",
    "courtSize": "Full Court"
  }
}
```

### 7. Create Fine Dining Facility (DINING - FINE_DINING)

**Required Metadata Fields:**

- None (all fields are optional)

**Optional Metadata Fields:**

- `cuisineType`: String
- `seatingCapacity`: Integer
- `hasDelivery`: Boolean
- `hasTakeout`: Boolean
- `openingHours`: String
- `menuUrl`: String (URL)
- `avgMealPrice`: Number
- `dressCode`: String
- `hasOutdoorSeating`: Boolean
- `hasPrivateDining`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439020",
  "identifier": "Restaurant Main",
  "displayName": "Coastal Fine Dining",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "cuisineType": "Mediterranean",
    "seatingCapacity": 80,
    "hasDelivery": false,
    "hasTakeout": false,
    "openingHours": "6:00 PM - 11:00 PM",
    "menuUrl": "https://example.com/menu",
    "avgMealPrice": 75.0,
    "dressCode": "Smart Casual",
    "hasOutdoorSeating": true,
    "hasPrivateDining": true
  }
}
```

### 8. Create Fitness Center Facility (FITNESS - WEIGHT_ROOM)

**Required Metadata Fields:**

- None (all fields are optional)

**Optional Metadata Fields:**

- `equipment`: Array of strings
- `hasTrainer`: Boolean
- `hasLockers`: Boolean
- `hasShowers`: Boolean
- `openingHours`: String
- `capacity`: Integer
- `specialtyArea`: String
- `classesOffered`: Array of strings

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439022",
  "identifier": "Gym Main",
  "displayName": "Main Fitness Center",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "equipment": ["Treadmills", "Ellipticals", "Dumbbells", "Barbells", "Bench Press", "Squat Rack"],
    "hasTrainer": true,
    "hasLockers": true,
    "hasShowers": true,
    "openingHours": "5:00 AM - 11:00 PM",
    "capacity": 40,
    "specialtyArea": "Weights & Cardio",
    "classesOffered": ["Strength Training", "Personal Training"]
  }
}
```

### 9. Create Parking Facility (PARKING - GARAGE)

**Required Metadata Fields:**

- None (all fields are optional)

**Optional Metadata Fields:**

- `vehicleType`: String
- `isUnderground`: Boolean
- `isCovered`: Boolean
- `hasElectricCharging`: Boolean
- `chargingType`: String
- `maxVehicleHeight`: Number (meters)
- `maxVehicleWidth`: Number (meters)
- `securityLevel`: String
- `hasCCTV`: Boolean
- `isAccessControlled`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439024",
  "identifier": "Parking B12",
  "displayName": "Underground Parking Spot B12",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "vehicleType": "Car",
    "isUnderground": true,
    "isCovered": true,
    "hasElectricCharging": true,
    "chargingType": "Level 2",
    "maxVehicleHeight": 2.1,
    "maxVehicleWidth": 2.5,
    "securityLevel": "Gated",
    "hasCCTV": true,
    "isAccessControlled": true
  }
}
```

### 10. Create Swimming Pool Facility (AMENITY - SWIMMING_POOL)

**Required Metadata Fields:**

- `amenityType`: String

**Optional Metadata Fields:**

- `capacity`: Integer
- `requiresReservation`: Boolean
- `openingHours`: String
- `ageRestriction`: String
- `additionalFees`: Number
- `equipment`: Array of strings
- `features`: Array of strings
- `hasSupervision`: Boolean

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439026",
  "identifier": "Pool Rooftop",
  "displayName": "Rooftop Infinity Pool",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "amenityType": "Swimming Pool",
    "capacity": 50,
    "requiresReservation": false,
    "openingHours": "6:00 AM - 10:00 PM",
    "ageRestriction": "All Ages",
    "additionalFees": 0,
    "equipment": ["Lounge Chairs", "Umbrellas", "Towels"],
    "features": ["Heated", "Infinity Edge", "Bar Service", "Cabanas"],
    "hasSupervision": true
  }
}
```

### 11. Create Outdoor Facility (OUTDOOR)

**Required Metadata Fields:**

- `outdoorType`: String

**Optional Metadata Fields:**

- `capacity`: Integer
- `area`: Number (square meters)
- `hasSeating`: Boolean
- `hasShade`: Boolean
- `hasLighting`: Boolean
- `features`: Array of strings
- `requiresReservation`: Boolean
- `openingHours`: String

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439028",
  "identifier": "Terrace Garden",
  "displayName": "Garden Terrace",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "outdoorType": "Terrace",
    "capacity": 40,
    "area": 150,
    "hasSeating": true,
    "hasShade": true,
    "hasLighting": true,
    "features": ["Fire Pit", "Water Feature", "BBQ Area", "Outdoor Kitchen"],
    "requiresReservation": true,
    "openingHours": "Sunrise to Sunset"
  }
}
```

### 12. Create Custom Facility (OTHER)

**Required Metadata Fields:**

- `customType`: String

**Optional Metadata Fields:**

- `description`: String
- `features`: Array of strings
- `requirements`: Array of strings
- `capacity`: Integer
- `openingHours`: String

```bash
POST /api/facility
Content-Type: application/json

{
  "facilityTypeId": "507f1f77bcf86cd799439029",
  "identifier": "Pet Spa 1",
  "displayName": "Pet Grooming & Spa",
  "organizationId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439025",
  "status": "AVAILABLE",
  "metadata": {
    "customType": "Pet Grooming & Spa",
    "description": "Full-service pet grooming and spa facility",
    "features": ["Bathing", "Grooming", "Nail Trimming", "Massage"],
    "requirements": ["Pet Vaccination Records"],
    "capacity": 6,
    "openingHours": "9:00 AM - 6:00 PM"
  }
}
```

## Form Data Support

When using `multipart/form-data` or `application/x-www-form-urlencoded`, metadata should be sent as a JSON string:

```bash
POST /api/facility
Content-Type: multipart/form-data

facilityTypeId=507f1f77bcf86cd799439011
identifier=Room 101
displayName=Deluxe Ocean View Suite
organizationId=507f1f77bcf86cd799439011
locationId=507f1f77bcf86cd799439025
status=AVAILABLE
metadata={"bedType":"KING_BED","bedCount":1,"maxOccupancy":2,"roomFeatures":["WIFI","AIR_CONDITIONING"],"hasBalcony":true}
```

## Validation Behavior

### Successful Validation

✅ Metadata matches the spaceType + subtype requirements  
✅ All required fields are present  
✅ Field types are correct  
✅ Enum values are valid  
✅ Numeric constraints are met (e.g., min values)

### Validation Errors

❌ Missing required metadata fields  
❌ Invalid metadata structure for spaceType/subtype  
❌ Invalid enum values  
❌ Type mismatches (e.g., string instead of number)  
❌ Invalid constraints (e.g., negative numbers where positive required)

**Example Error Response:**

```json
{
	"success": false,
	"message": "Metadata validation failed",
	"statusCode": 400,
	"errors": [
		{
			"field": "metadata",
			"message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"GUEST_ROOM\". Required fields: bedType, bedCount, maxOccupancy. Optional fields: amenities, roomFeatures, floorNumber, roomSize, hasBalcony, hasKitchen. Example: {\"bedType\":\"KING_BED\",\"bedCount\":1,\"maxOccupancy\":2,\"roomFeatures\":[\"WIFI\",\"AIR_CONDITIONING\"],\"roomSize\":45}",
			"requirements": {
				"required": ["bedType", "bedCount", "maxOccupancy"],
				"optional": [
					"amenities",
					"roomFeatures",
					"floorNumber",
					"roomSize",
					"hasBalcony",
					"hasKitchen"
				],
				"schema": "GuestRoomMetadata",
				"example": {
					"bedType": "KING_BED",
					"bedCount": 1,
					"maxOccupancy": 2,
					"roomFeatures": ["WIFI", "AIR_CONDITIONING"],
					"roomSize": 45
				}
			}
		}
	]
}
```

## Implementation Details

### Controller Integration

The facility controller (`app/facility/facility.controller.ts`) handles metadata validation:

1. **Create Operation**:
    - Validates request data using `CreateFacilitySchema`
    - Fetches FacilityType to get `spaceType` and `subtype`
    - Calls `validateFacilityMetadata()` to validate metadata
    - Creates facility if validation passes

2. **Update Operation**:
    - Validates request data using `UpdateFacilitySchema`
    - Fetches FacilityType (uses new `facilityTypeId` if provided, otherwise existing)
    - Validates metadata if provided
    - Updates facility if validation passes

### Validation Function

The `validateFacilityMetadata()` function in `zod/facility.zod.ts`:

- Accepts metadata, spaceType, and subtype
- Parses JSON string if metadata is a string
- Routes to appropriate Zod schema based on spaceType + subtype
- Returns validation result with error message and requirements if validation fails

### Zod Schema Location

All metadata schemas are defined in:

- `zod/metadata.zod.ts` - Contains all metadata schema definitions
- `zod/facility.zod.ts` - Contains `validateFacilityMetadata()` function that uses the schemas

## Enum Values Reference

### BedType Enum

- SINGLE_BED
- DOUBLE_BED
- QUEEN_BED
- KING_BED
- TWIN_BED
- BUNK_BED
- SOFA_BED
- MURPHY_BED
- DAYBED
- FUTON

### RoomFeature Enum (Common)

- AIR_CONDITIONING
- HEATING
- WIFI
- TELEVISION
- BALCONY
- OCEAN_VIEW
- MOUNTAIN_VIEW
- KITCHEN
- PRIVATE_BATHROOM
- ... (38 total features)

See `zod/metadata.zod.ts` for complete enum lists.

## Best Practices

1. **Always provide required fields**: Check the metadata schema requirements for each spaceType/subtype combination
2. **Use proper enum values**: Enum values are case-sensitive and must match exactly
3. **Validate before sending**: Validate metadata structure client-side when possible
4. **Handle validation errors gracefully**: Error responses include detailed requirements and examples
5. **Use appropriate data types**: Numbers for numeric fields, arrays for list fields, booleans for flags
6. **Metadata is optional**: You can create a facility without metadata, but if provided, it must be valid
7. **FacilityType must exist**: Ensure the `facilityTypeId` references an existing FacilityType with matching spaceType/subtype

## Troubleshooting

### Common Issues

**Issue**: Validation fails with "Metadata validation failed"  
**Solution**: Check that all required fields are present and types are correct. Review the error response for specific requirements.

**Issue**: Enum values not accepted  
**Solution**: Ensure enum values match exactly (case-sensitive). Check `zod/metadata.zod.ts` for valid enum values.

**Issue**: Form data metadata not parsing  
**Solution**: Ensure metadata is sent as a JSON string when using form data: `metadata={"bedType":"KING_BED","bedCount":1}`

**Issue**: FacilityType not found  
**Solution**: Ensure the `facilityTypeId` exists and is a valid ObjectId.

**Issue**: Metadata doesn't match FacilityType  
**Solution**: Ensure the metadata structure matches the FacilityType's spaceType and subtype. A GUEST_ROOM requires bedType, bedCount, maxOccupancy, but a CONFERENCE_ROOM requires seatingCapacity.

## Bulk CSV Upload

For creating multiple facilities at once, use the CSV upload endpoint. This is useful for importing large numbers of facilities efficiently.

**Endpoint**: `POST /api/facility/upload-csv`

**Example**:

```bash
curl -X POST http://localhost:3000/api/facility/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facilities.csv"
```

**CSV Template**: See `examples/facility-upload-template.csv` for a sample CSV file.

**Detailed Documentation**: See `docs/FACILITY_CSV_UPLOAD.md` for comprehensive CSV upload guide including:
- CSV format and column specifications
- Metadata formatting for CSV
- Validation and error handling
- Response formats
- Best practices and troubleshooting

## Related Documentation

- `docs/FACILITY_CSV_UPLOAD.md` - **NEW** Comprehensive CSV upload guide for bulk facility creation
- `docs/FACILITY_TYPE_IMPLEMENTATION_SUMMARY.md` - FacilityType metadata implementation
- `docs/FACILITY_TYPE_METADATA_GUIDE.md` - Detailed metadata guide for FacilityTypes
- `docs/CURL_EXAMPLES.md` - API examples with curl commands
- `zod/facility.zod.ts` - Facility Zod schemas and validation
- `zod/metadata.zod.ts` - Metadata Zod schemas
- `examples/facility-upload-template.csv` - **NEW** Sample CSV template for bulk upload

---

**Implementation Date**: December 11, 2025  
**Last Updated**: January 9, 2026  
**Status**: ✅ Complete and Tested  
**Version**: 1.1.0
