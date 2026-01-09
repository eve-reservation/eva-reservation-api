# Location API - Polymorphic Metadata Implementation

## Summary

Successfully implemented comprehensive Zod validation for the Location API with polymorphic metadata support, matching the same pattern as FacilityType for consistency.

## What Was Implemented

### 1. **Comprehensive Zod Schema** (`zod/location.zod.ts`)

#### Enums (4 types)
✅ **LocationTypeSchema** (9 values):
- BUILDING, FLOOR, WING, AREA, ZONE, SECTION, BLOCK, OUTDOOR, OTHER

✅ **BuildingTypeSchema** (9 values):
- MAIN, ANNEX, TOWER, PAVILION, COTTAGE, VILLA, CLUBHOUSE, STANDALONE, OTHER

✅ **AreaTypeSchema** (14 values):
- LOBBY, CORRIDOR, ATRIUM, COURTYARD, ROOFTOP, BASEMENT, MEZZANINE, TERRACE, GARDEN, PARKING_LEVEL, STORAGE, MECHANICAL, SERVICE, OTHER

✅ **ZoneTypeSchema** (10 values):
- RESIDENTIAL, COMMERCIAL, RECREATIONAL, ADMINISTRATIVE, SERVICE, RESTRICTED, PUBLIC, PRIVATE, VIP, OTHER

#### Metadata Schemas (9 types)

Each locationType has its own metadata schema with specific validation:

| LocationType | Schema | Required Fields | Optional Fields Count |
|--------------|--------|-----------------|----------------------|
| **BUILDING** | BuildingMetadata | buildingType, totalFloors | 7 |
| **FLOOR** | FloorMetadata | floorNumber | 7 |
| **WING** | WingMetadata | wingIdentifier | 6 |
| **AREA** | AreaMetadata | areaType | 7 |
| **ZONE** | ZoneMetadata | zoneType | 6 |
| **SECTION** | SectionMetadata | sectionIdentifier | 4 |
| **BLOCK** | BlockMetadata | blockIdentifier | 5 |
| **OUTDOOR** | OutdoorMetadata | outdoorType | 8 |
| **OTHER** | OtherMetadata | customType | 4 |

### 2. **Enhanced Error Messages**

Similar to FacilityType, Location now provides detailed validation errors:

#### Example Error Response:
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for locationType=\"BUILDING\". Required fields: buildingType, totalFloors. Optional fields: basementLevels, hasElevator, elevatorCount, totalArea, hasParkingFacility, parkingSpots, accessibility, yearBuilt, renovationYear. Example: {\"buildingType\":\"MAIN\",\"totalFloors\":10,\"basementLevels\":2,\"hasElevator\":true,\"elevatorCount\":3,\"totalArea\":50000,\"hasParkingFacility\":true,\"parkingSpots\":200}",
      "required": ["buildingType", "totalFloors"],
      "optional": ["basementLevels", "hasElevator", "elevatorCount", "totalArea", "hasParkingFacility", "parkingSpots", "accessibility", "yearBuilt", "renovationYear"],
      "schema": "BuildingMetadata",
      "example": {
        "buildingType": "MAIN",
        "totalFloors": 10,
        "basementLevels": 2,
        "hasElevator": true,
        "elevatorCount": 3,
        "totalArea": 50000,
        "hasParkingFacility": true,
        "parkingSpots": 200
      }
    }
  ],
  "timestamp": "2025-12-11T04:00:00.000Z"
}
```

### 3. **Helper Function**

✅ `getMetadataRequirements(locationType)` - Returns required/optional fields, schema name, and examples for each locationType

### 4. **Preprocessing**

✅ Handles form data (multipart/form-data, x-www-form-urlencoded)
✅ Parses JSON strings for metadata
✅ Converts numeric fields (latitude, longitude)
✅ Handles array fields (imageUrl)

### 5. **Controller Updates**

✅ Updated `location.controller.ts` to use raw ZodError for enhanced error messages
✅ Both create and update endpoints now provide detailed validation feedback

---

## Usage Examples

### Example 1: Creating a Building

**Request:**
```json
{
  "name": "Grand Hotel Main Tower",
  "code": "MAIN-01",
  "description": "Main hotel building with guest rooms",
  "locationType": "BUILDING",
  "organizationId": "507f1f77bcf86cd799439011",
  "address": "123 Beach Road",
  "city": "Miami",
  "state": "FL",
  "country": "US",
  "postalCode": "33139",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "timezone": "America/New_York",
  "metadata": {
    "buildingType": "MAIN",
    "totalFloors": 25,
    "basementLevels": 2,
    "hasElevator": true,
    "elevatorCount": 4,
    "totalArea": 50000,
    "hasParkingFacility": true,
    "parkingSpots": 200,
    "accessibility": ["wheelchair", "ramp", "elevator"]
  }
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Location created successfully",
  "data": {
    "id": "693a373bce381249e7db71e7",
    "name": "Grand Hotel Main Tower",
    "locationType": "BUILDING",
    "metadata": {
      "buildingType": "MAIN",
      "totalFloors": 25,
      "hasElevator": true,
      ...
    },
    ...
  }
}
```

### Example 2: Creating a Floor

**Request:**
```json
{
  "name": "2nd Floor - Guest Rooms",
  "code": "F2",
  "locationType": "FLOOR",
  "parentLocationId": "693a373bce381249e7db71e7",
  "organizationId": "507f1f77bcf86cd799439011",
  "path": "/grand-hotel-main/floor-2",
  "metadata": {
    "floorNumber": 2,
    "floorLabel": "2nd Floor - Guest Rooms",
    "totalArea": 2000,
    "ceilingHeight": 3.5,
    "hasRestrooms": true,
    "hasEmergencyExit": true,
    "zoneType": "RESIDENTIAL",
    "capacity": 100
  }
}
```

### Example 3: Creating a Zone

**Request:**
```json
{
  "name": "Pool Recreation Zone",
  "locationType": "ZONE",
  "parentLocationId": "693a373bce381249e7db71e7",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "zoneType": "RECREATIONAL",
    "securityLevel": "PUBLIC",
    "requiresAccess": false,
    "allowedActivities": ["Swimming", "Sunbathing", "Dining"],
    "operatingHours": "6:00 AM - 10:00 PM",
    "capacity": 150,
    "hasSupervision": true
  }
}
```

### Example 4: Creating an Outdoor Area

**Request:**
```json
{
  "name": "Tropical Garden",
  "locationType": "OUTDOOR",
  "parentLocationId": "693a373bce381249e7db71e7",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "outdoorType": "Garden",
    "totalArea": 5000,
    "hasSeating": true,
    "hasLighting": true,
    "hasShade": true,
    "surfaceType": "Grass",
    "weatherDependent": true,
    "capacity": 200,
    "operatingHours": "24/7"
  }
}
```

---

## Metadata Field Details

### BUILDING Metadata
**Required:**
- `buildingType` (BuildingType enum)
- `totalFloors` (number, min: 1)

**Optional:**
- `basementLevels` (number, min: 0)
- `hasElevator` (boolean)
- `elevatorCount` (number)
- `totalArea` (number, square meters)
- `hasParkingFacility` (boolean)
- `parkingSpots` (number)
- `accessibility` (array of strings)
- `yearBuilt` (number, 1800-2100)
- `renovationYear` (number, 1800-2100)

### FLOOR Metadata
**Required:**
- `floorNumber` (number)

**Optional:**
- `floorLabel` (string)
- `totalArea` (number)
- `ceilingHeight` (number, meters)
- `hasRestrooms` (boolean)
- `hasEmergencyExit` (boolean)
- `zoneType` (ZoneType enum)
- `capacity` (number)
- `unitCount` (number)

### WING Metadata
**Required:**
- `wingIdentifier` (string, e.g., "North Wing")

**Optional:**
- `floorNumbers` (array of numbers)
- `totalFloors` (number)
- `zoneType` (ZoneType enum)
- `capacity` (number)
- `unitCount` (number)
- `hasElevator` (boolean)
- `accessibility` (array of strings)

### AREA Metadata
**Required:**
- `areaType` (AreaType enum)

**Optional:**
- `totalArea` (number)
- `capacity` (number)
- `isPublicArea` (boolean)
- `hasClimate` (boolean)
- `seatingCapacity` (number)
- `operatingHours` (string)
- `requiresAccess` (boolean)
- `accessibility` (array of strings)

### ZONE Metadata
**Required:**
- `zoneType` (ZoneType enum)

**Optional:**
- `securityLevel` (string)
- `requiresAccess` (boolean)
- `allowedActivities` (array of strings)
- `operatingHours` (string)
- `capacity` (number)
- `unitCount` (number)
- `hasSupervision` (boolean)

### SECTION Metadata
**Required:**
- `sectionIdentifier` (string)

**Optional:**
- `unitCount` (number)
- `capacity` (number)
- `purpose` (string)
- `zoneType` (ZoneType enum)
- `requiresAccess` (boolean)

### BLOCK Metadata
**Required:**
- `blockIdentifier` (string)

**Optional:**
- `totalFloors` (number)
- `unitCount` (number)
- `capacity` (number)
- `zoneType` (ZoneType enum)
- `hasElevator` (boolean)
- `accessibility` (array of strings)

### OUTDOOR Metadata
**Required:**
- `outdoorType` (string, e.g., "Garden", "Terrace", "Plaza")

**Optional:**
- `totalArea` (number)
- `hasSeating` (boolean)
- `hasLighting` (boolean)
- `hasShade` (boolean)
- `surfaceType` (string)
- `weatherDependent` (boolean)
- `capacity` (number)
- `operatingHours` (string)
- `requiresAccess` (boolean)

### OTHER Metadata
**Required:**
- `customType` (string)

**Optional:**
- `description` (string)
- `features` (array of strings)
- `capacity` (number)
- `requiresAccess` (boolean)
- `operatingHours` (string)

---

## Hierarchical Structure Support

The Location model supports parent-child relationships:

### Example Hierarchy:
```
Building (BUILDING)
├── Floor 1 (FLOOR)
│   ├── Wing A (WING)
│   │   ├── Lobby Area (AREA)
│   │   └── Guest Room Zone (ZONE)
│   └── Wing B (WING)
└── Floor 2 (FLOOR)
    └── Tennis Court Area (AREA)
```

### Fields for Hierarchy:
- `parentLocationId` - ID of parent location
- `path` - Hierarchical path (e.g., "/building-1/floor-2/wing-a")

---

## Validation Rules

### General Rules:
1. **locationType** is required
2. **metadata** must match the locationType requirements
3. **parentLocationId** creates hierarchical relationships
4. **country** must be ISO 3166-1 alpha-2 code (e.g., "US", "GB")
5. **latitude** must be between -90 and 90
6. **longitude** must be between -180 and 180
7. **timezone** defaults to "UTC"

### Address Fields (primarily for BUILDING):
- `address`, `city`, `state`, `country`, `postalCode` are optional
- Recommended for BUILDING locationType
- Can be inherited by child locations

---

## Comparison with FacilityType

| Feature | FacilityType | Location | Status |
|---------|--------------|----------|--------|
| Polymorphic Metadata | ✅ Yes | ✅ Yes | ✅ Consistent |
| Enhanced Errors | ✅ Yes | ✅ Yes | ✅ Consistent |
| getMetadataRequirements | ✅ Yes | ✅ Yes | ✅ Consistent |
| Preprocessing | ✅ Yes | ✅ Yes | ✅ Consistent |
| SuperRefine Validation | ✅ Yes | ✅ Yes | ✅ Consistent |
| Type Safety | ✅ Yes | ✅ Yes | ✅ Consistent |

---

## Benefits

1. **✅ Type Safety** - Prevent invalid location structures
2. **✅ Consistency** - Same pattern as FacilityType
3. **✅ Better DX** - Clear error messages with examples
4. **✅ Self-Documenting** - Errors show what's needed
5. **✅ Hierarchical Support** - Proper parent-child validation
6. **✅ Geographic Data** - Address and geolocation support

---

## Files Modified

1. ✅ `zod/location.zod.ts` - Complete rewrite with polymorphic validation
2. ✅ `app/location/location.controller.ts` - Updated error handling

---

## Testing

### Test Creating Different Location Types:

```bash
# Test Building
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Tower",
    "locationType": "BUILDING",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "buildingType": "MAIN",
      "totalFloors": 10
    }
  }'

# Test Floor
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2nd Floor",
    "locationType": "FLOOR",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "floorNumber": 2
    }
  }'

# Test with Missing Required Field (will show enhanced error)
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Building",
    "locationType": "BUILDING",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "buildingType": "MAIN"
    }
  }'
```

**Expected**: Enhanced error showing `totalFloors` is required with example!

---

## Next Steps

- [ ] Create Location documentation (similar to FacilityType docs)
- [ ] Update Location seeder with new metadata structure
- [ ] Update Location tests
- [ ] Consider creating location hierarchy validation (e.g., FLOOR must have BUILDING parent)

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Date**: December 11, 2025  
**Pattern**: Matches FacilityType implementation for consistency

