# Enhanced Validation Error Responses

## Overview

The FacilityType API now provides detailed, context-aware validation error messages that tell you exactly what fields are required and optional based on your `spaceType` and `subtype` combination.

## Error Response Structure

```typescript
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": string,
      "message": string,
      "required": string[],      // NEW: Required fields for this spaceType/subtype
      "optional": string[],      // NEW: Optional fields for this spaceType/subtype
      "schema": string,          // NEW: Schema name being validated against
      "example": object          // NEW: Example of valid metadata
    }
  ],
  "timestamp": string
}
```

## Examples

### Example 1: Missing Required Fields - Guest Room

**Request:**
```json
POST /api/facilityType
{
  "name": "Deluxe Suite",
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED"
    // Missing: bedCount and maxOccupancy
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"GUEST_ROOM\". Required fields: bedType, bedCount, maxOccupancy. Optional fields: amenities, roomFeatures, floorNumber, roomSize, hasBalcony, hasKitchen. Example: {\"bedType\":\"KING_BED\",\"bedCount\":1,\"maxOccupancy\":2,\"roomFeatures\":[\"WIFI\",\"AIR_CONDITIONING\"],\"amenities\":[\"ROOM_SERVICE\"],\"roomSize\":45}",
      "required": [
        "bedType",
        "bedCount",
        "maxOccupancy"
      ],
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
        "amenities": ["ROOM_SERVICE"],
        "roomSize": 45
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

### Example 2: Invalid Field Type - Conference Room

**Request:**
```json
POST /api/facilityType
{
  "name": "Executive Boardroom",
  "spaceType": "ROOM",
  "subtype": "CONFERENCE_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": "twenty"  // Should be a number
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"CONFERENCE_ROOM\". Required fields: seatingCapacity. Optional fields: hasProjector, hasWhiteboard, hasVideoConferencing, hasAudioSystem, layout, equipment, roomSize, hasNaturalLight. Example: {\"seatingCapacity\":20,\"hasProjector\":true,\"hasVideoConferencing\":true,\"equipment\":[\"Screen\",\"Whiteboard\"]}",
      "required": [
        "seatingCapacity"
      ],
      "optional": [
        "hasProjector",
        "hasWhiteboard",
        "hasVideoConferencing",
        "hasAudioSystem",
        "layout",
        "equipment",
        "roomSize",
        "hasNaturalLight"
      ],
      "schema": "ConferenceRoomMetadata",
      "example": {
        "seatingCapacity": 20,
        "hasProjector": true,
        "hasVideoConferencing": true,
        "equipment": ["Screen", "Whiteboard"]
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

### Example 3: Tennis Court Missing Required Field

**Request:**
```json
POST /api/facilityType
{
  "name": "Indoor Tennis Court",
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "surfaceType": "Hardcourt",
    "isIndoor": true
    // Missing: sportType (required)
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"COURT\" and subtype=\"TENNIS\". Required fields: sportType. Optional fields: surfaceType, isIndoor, hasLighting, maxPlayers, equipmentProvided, openingHours, courtSize. Example: {\"sportType\":\"Tennis\",\"surfaceType\":\"Hardcourt\",\"isIndoor\":true,\"maxPlayers\":4}",
      "required": [
        "sportType"
      ],
      "optional": [
        "surfaceType",
        "isIndoor",
        "hasLighting",
        "maxPlayers",
        "equipmentProvided",
        "openingHours",
        "courtSize"
      ],
      "schema": "SportsCourtMetadata",
      "example": {
        "sportType": "Tennis",
        "surfaceType": "Hardcourt",
        "isIndoor": true,
        "maxPlayers": 4
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

### Example 4: Dining - No Required Fields

**Request:**
```json
POST /api/facilityType
{
  "name": "Coastal Restaurant",
  "spaceType": "DINING",
  "subtype": "FINE_DINING",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": "fifty"  // Invalid: should be number
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"DINING\" and subtype=\"FINE_DINING\". Required fields: None. Optional fields: cuisineType, seatingCapacity, hasDelivery, hasTakeout, openingHours, menuUrl, avgMealPrice, dressCode, hasOutdoorSeating, hasPrivateDining. Example: {\"cuisineType\":\"Italian\",\"seatingCapacity\":50,\"hasDelivery\":false}",
      "required": [],
      "optional": [
        "cuisineType",
        "seatingCapacity",
        "hasDelivery",
        "hasTakeout",
        "openingHours",
        "menuUrl",
        "avgMealPrice",
        "dressCode",
        "hasOutdoorSeating",
        "hasPrivateDining"
      ],
      "schema": "DiningMetadata",
      "example": {
        "cuisineType": "Italian",
        "seatingCapacity": 50,
        "hasDelivery": false
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

### Example 5: Amenity Space (Swimming Pool)

**Request:**
```json
POST /api/facilityType
{
  "name": "Rooftop Pool",
  "spaceType": "AMENITY",
  "subtype": "SWIMMING_POOL",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "capacity": 50
    // Missing: amenityType (required)
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"AMENITY\" and subtype=\"SWIMMING_POOL\". Required fields: amenityType. Optional fields: capacity, requiresReservation, openingHours, ageRestriction, additionalFees, equipment, features, hasSupervision. Example: {\"amenityType\":\"Swimming Pool\",\"capacity\":50,\"requiresReservation\":false}",
      "required": [
        "amenityType"
      ],
      "optional": [
        "capacity",
        "requiresReservation",
        "openingHours",
        "ageRestriction",
        "additionalFees",
        "equipment",
        "features",
        "hasSupervision"
      ],
      "schema": "AmenitySpaceMetadata",
      "example": {
        "amenityType": "Swimming Pool",
        "capacity": 50,
        "requiresReservation": false
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

### Example 6: Suite (Multi-room)

**Request:**
```json
POST /api/facilityType
{
  "name": "Presidential Suite",
  "spaceType": "ROOM",
  "subtype": "SUITE",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 2
    // Missing: maxOccupancy and numberOfRooms (required)
  }
}
```

**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"SUITE\". Required fields: bedType, bedCount, maxOccupancy, numberOfRooms. Optional fields: amenities, roomFeatures, roomSize, hasLivingRoom, hasKitchen, hasDiningArea. Example: {\"bedType\":\"QUEEN_BED\",\"bedCount\":2,\"maxOccupancy\":4,\"numberOfRooms\":2,\"hasLivingRoom\":true}",
      "required": [
        "bedType",
        "bedCount",
        "maxOccupancy",
        "numberOfRooms"
      ],
      "optional": [
        "amenities",
        "roomFeatures",
        "roomSize",
        "hasLivingRoom",
        "hasKitchen",
        "hasDiningArea"
      ],
      "schema": "SuiteMetadata",
      "example": {
        "bedType": "QUEEN_BED",
        "bedCount": 2,
        "maxOccupancy": 4,
        "numberOfRooms": 2,
        "hasLivingRoom": true
      }
    }
  ],
  "timestamp": "2025-12-11T02:45:17.647Z"
}
```

## Benefits of Enhanced Error Messages

1. **Immediate Clarity**: Know exactly what fields are required vs optional
2. **Example Provided**: See a working example of valid metadata
3. **Schema Reference**: Understand which schema is being validated against
4. **Better Developer Experience**: Faster debugging and integration
5. **Self-Documenting**: Error messages serve as inline documentation

## How to Use the Error Response

When you receive a validation error:

1. **Check the `required` array** - These fields MUST be present
2. **Review the `optional` array** - These fields CAN be included
3. **Look at the `example` object** - Copy and adapt this structure
4. **Reference the `schema` name** - Find detailed docs in `FACILITY_TYPE_METADATA_GUIDE.md`

## Quick Fix Guide

### Common Fixes:

**Missing required field:**
```javascript
// ❌ Error: Missing bedCount
{
  "metadata": {
    "bedType": "KING_BED",
    "maxOccupancy": 2
  }
}

// ✅ Fixed: All required fields present
{
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,          // Added
    "maxOccupancy": 2
  }
}
```

**Wrong field type:**
```javascript
// ❌ Error: seatingCapacity should be number
{
  "metadata": {
    "seatingCapacity": "20"
  }
}

// ✅ Fixed: Using number type
{
  "metadata": {
    "seatingCapacity": 20
  }
}
```

**Wrong subtype for space:**
```javascript
// ❌ Error: GUEST_ROOM doesn't use sportType
{
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "metadata": {
    "sportType": "Tennis"
  }
}

// ✅ Fixed: Use COURT space type for sports
{
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "metadata": {
    "sportType": "Tennis"
  }
}
```

## Testing

To test the enhanced error messages:

```bash
# Missing required field
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room",
    "spaceType": "ROOM",
    "subtype": "GUEST_ROOM",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "bedType": "KING_BED"
    }
  }'

# Invalid field type
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Conference Room",
    "spaceType": "ROOM",
    "subtype": "CONFERENCE_ROOM",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "seatingCapacity": "twenty"
    }
  }'
```

## Related Documentation

- **Usage Guide**: `FACILITY_TYPE_METADATA_GUIDE.md`
- **Implementation Details**: `FACILITY_TYPE_IMPLEMENTATION_SUMMARY.md`
- **Schema Reference**: `zod/facilityType.zod.ts`

---

**Version**: 2.0.0 (Enhanced Error Messages)  
**Updated**: December 11, 2025

