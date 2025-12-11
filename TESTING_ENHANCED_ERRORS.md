# Testing Enhanced Error Messages

## Quick Test Guide

### Prerequisites
- Ensure your API server is running
- Have a REST client (cURL, Postman, or Thunder Client)

### Test 1: Missing Required Fields (Guest Room)

**Request:**
```bash
POST http://localhost:3000/api/facilityType
Content-Type: application/json

{
  "name": "Test Room",
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED"
  }
}
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "errors": [
    {
      "field": "metadata",
      "message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"GUEST_ROOM\". Required fields: bedType, bedCount, maxOccupancy. Optional fields: ...",
      "required": ["bedType", "bedCount", "maxOccupancy"],
      "optional": ["amenities", "roomFeatures", "floorNumber", "roomSize", "hasBalcony", "hasKitchen"],
      "schema": "GuestRoomMetadata",
      "example": {
        "bedType": "KING_BED",
        "bedCount": 1,
        "maxOccupancy": 2,
        ...
      }
    }
  ]
}
```

### Test 2: Invalid Field Type (Conference Room)

**Request:**
```bash
POST http://localhost:3000/api/facilityType
Content-Type: application/json

{
  "name": "Conference Room",
  "spaceType": "ROOM",
  "subtype": "CONFERENCE_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": "twenty"
  }
}
```

**What to Look For:**
- Error shows `required: ["seatingCapacity"]`
- Example shows correct format: `"seatingCapacity": 20` (number)

### Test 3: Tennis Court

**Request:**
```bash
POST http://localhost:3000/api/facilityType
Content-Type: application/json

{
  "name": "Tennis Court",
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "surfaceType": "Clay"
  }
}
```

**What to Look For:**
- Error shows `required: ["sportType"]`
- Example shows: `"sportType": "Tennis"`

### Test 4: Correct Request (Should Succeed)

**Request:**
```bash
POST http://localhost:3000/api/facilityType
Content-Type: application/json

{
  "name": "Deluxe Room",
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,
    "maxOccupancy": 2,
    "roomFeatures": ["WIFI", "AIR_CONDITIONING"],
    "roomSize": 45
  }
}
```

**Expected:** Success (201) with created facility type

## Using cURL Commands

### Test 1:
```bash
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
```

### Test 2:
```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conference Room",
    "spaceType": "ROOM",
    "subtype": "CONFERENCE_ROOM",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "seatingCapacity": "twenty"
    }
  }'
```

### Test 3:
```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis Court",
    "spaceType": "COURT",
    "subtype": "TENNIS",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "surfaceType": "Clay"
    }
  }'
```

## What to Verify

For each error response, check that it includes:

✅ `required` array - Shows exactly what fields are mandatory  
✅ `optional` array - Shows what fields can be included  
✅ `schema` string - References the validation schema name  
✅ `example` object - Provides a working example to copy  
✅ Detailed message - Human-readable explanation  

## Comparing Old vs New

### Old Error (Before Enhancement):
```json
{
  "errors": [{
    "field": "metadata",
    "message": "metadata must match the selected spaceType and subtype"
  }]
}
```
❌ No indication of what's wrong  
❌ No field lists  
❌ No examples  

### New Error (After Enhancement):
```json
{
  "errors": [{
    "field": "metadata",
    "message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"GUEST_ROOM\". Required fields: bedType, bedCount, maxOccupancy...",
    "required": ["bedType", "bedCount", "maxOccupancy"],
    "optional": ["amenities", "roomFeatures", ...],
    "schema": "GuestRoomMetadata",
    "example": {...}
  }]
}
```
✅ Clear error message  
✅ Complete field lists  
✅ Working example  
✅ Schema reference  

## Success!

If you see the enhanced error responses with all the additional fields (`required`, `optional`, `schema`, `example`), the feature is working correctly! 🎉

---

For more examples, see `docs/ENHANCED_ERROR_RESPONSES.md`

