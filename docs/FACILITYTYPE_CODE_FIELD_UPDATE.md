# FacilityType Code Field Implementation

## Overview

Added support for `code`, `description`, `spaceType`, and `subtype` fields to FacilityType CSV upload and API endpoints. These fields enable better classification and organization of facility templates.

## Changes Made

### 1. Zod Schema Updates (`zod/facilityType.zod.ts`)

**Added Fields to CreateFacilityTypeSchema:**
- `description` (String, optional) - Descriptive text for the facility type
- `code` (String, optional) - Short code for reference (e.g., "GR-STD", "CT-TEN")
- `spaceType` (Enum, optional) - Space classification (ROOM, COURT, DINING, FITNESS, PARKING, AMENITY, OUTDOOR, OTHER)
- `subtype` (String, optional) - Subtype based on spaceType (e.g., GUEST_ROOM, TENNIS, COVERED)

**Added Fields to UpdateFacilityTypeSchema:**
- Same fields as create schema, all optional

**Import Added:**
```typescript
import { SpaceTypeSchema } from "./facility.zod";
```

### 2. Controller Updates (`app/facilityType/facilityType.controller.ts`)

**Create Method:**
Now includes all new fields when creating a facility type:
```typescript
const facilityType = await prisma.facilityType.create({
  data: {
    name: validation.data.name,
    description: validation.data.description,
    code: validation.data.code,
    spaceType: validation.data.spaceType,
    subtype: validation.data.subtype,
    organizationId: validation.data.organizationId,
  },
});
```

**CSV Upload Method:**
Extracts and validates all new fields from CSV:
```typescript
const facilityTypeData: any = {
  name: row.name?.trim(),
  description: row.description?.trim() || undefined,
  code: row.code?.trim() || undefined,
  spaceType: row.spaceType?.trim() || undefined,
  subtype: row.subtype?.trim() || undefined,
  organizationId: row.organizationId?.trim() || undefined,
  rateTypeId: row.rateTypeId?.trim() || undefined,
};
```

### 3. CSV Template Updates (`examples/facilitytype-upload-template.csv`)

**New Column Headers:**
```csv
name,description,code,spaceType,subtype,organizationId
```

**Example Rows:**
```csv
Guest Room Template,Standard guest room,GR-STD,ROOM,GUEST_ROOM,507f...
Tennis Court Template,Standard tennis court,CT-TEN,COURT,TENNIS,507f...
Swimming Pool Template,Olympic-size swimming pool,AM-POOL,AMENITY,SWIMMING_POOL,507f...
```

### 4. Documentation Updates (`docs/FACILITYTYPE_CSV_UPLOAD.md`)

**Added Sections:**
- Field descriptions for all new columns
- SpaceType enum values reference
- Subtype enum values by SpaceType
- Updated CSV examples with all fields
- Additional troubleshooting for enum validation

**New Optional Columns Table:**

| Column Name      | Type   | Description                                | Example                     |
| ---------------- | ------ | ------------------------------------------ | --------------------------- |
| description      | String | Facility type description                  | Standard guest room         |
| code             | String | Facility type code (for reference)         | GR-STD                      |
| spaceType        | Enum   | Space type classification                  | ROOM                        |
| subtype          | String | Subtype based on spaceType                 | GUEST_ROOM                  |
| organizationId   | String | Organization identifier (MongoDB ObjectId) | 507f1f77bcf86cd799439011    |

## SpaceType & Subtype Enum Values

### SpaceType Options
- `ROOM` - Indoor enclosed spaces
- `COURT` - Sports/recreation courts
- `DINING` - Food & beverage spaces
- `FITNESS` - Gym and fitness facilities
- `PARKING` - Parking spaces/lots
- `AMENITY` - Pool, spa, lounge, etc.
- `OUTDOOR` - Outdoor spaces
- `OTHER`

### Subtype Options (by SpaceType)

**ROOM:** GUEST_ROOM, CONFERENCE_ROOM, OFFICE, STUDIO, CLASSROOM, BALLROOM, SUITE, OTHER

**COURT:** TENNIS, BASKETBALL, VOLLEYBALL, BADMINTON, SQUASH, RACQUETBALL, PICKLEBALL, MULTIPURPOSE, OTHER

**DINING:** FINE_DINING, CASUAL_DINING, CAFE, BAR, LOUNGE, BUFFET, PRIVATE_DINING, FOOD_COURT, OTHER

**FITNESS:** WEIGHT_ROOM, CARDIO_AREA, YOGA_STUDIO, SPIN_STUDIO, CROSSFIT_BOX, PILATES_STUDIO, MULTIPURPOSE, OTHER

**PARKING:** COVERED, OPEN_LOT, GARAGE, VALET, EV_CHARGING, DISABLED, MOTORCYCLE, BICYCLE, OTHER

**AMENITY:** SWIMMING_POOL, HOT_TUB, SAUNA, STEAM_ROOM, SPA, LIBRARY, BUSINESS_CENTER, GAME_ROOM, LOUNGE, ROOFTOP, GARDEN, OTHER

## Usage Examples

### Basic CSV with Code
```csv
name,code,organizationId
Guest Room Template,GR-001,507f1f77bcf86cd799439011
Conference Room,CR-001,507f1f77bcf86cd799439011
Tennis Court,TC-001,507f1f77bcf86cd799439011
```

### Complete CSV with Classification
```csv
name,description,code,spaceType,subtype,organizationId
Guest Room Template,Standard guest room,GR-STD,ROOM,GUEST_ROOM,507f1f77bcf86cd799439011
Tennis Court Template,Standard tennis court,CT-TEN,COURT,TENNIS,507f1f77bcf86cd799439011
Swimming Pool Template,Olympic-size pool,AM-POOL,AMENITY,SWIMMING_POOL,507f1f77bcf86cd799439011
```

### JSON API Example
```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deluxe Suite Template",
    "description": "Luxury suite with multiple rooms",
    "code": "RM-DLX-ST",
    "spaceType": "ROOM",
    "subtype": "SUITE",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

## Benefits

1. **Better Organization**: Code field enables easy reference and integration
2. **Improved Classification**: SpaceType and subtype enable hierarchical categorization
3. **Enhanced Searchability**: Facilities can be filtered by type and subtype
4. **Metadata Inheritance**: When creating facilities, they inherit classification from facility type
5. **Consistent Data Structure**: Aligns with facility classification system

## Validation Rules

1. **Code Field**: Optional, can be any string (no uniqueness constraint)
2. **SpaceType**: Must be one of the valid enum values (case-sensitive)
3. **Subtype**: Should match the spaceType, but not strictly validated
4. **All New Fields**: Optional - backward compatible with existing implementations

## Backward Compatibility

✅ **Fully Backward Compatible**
- All new fields are optional
- Existing CSV files without these fields will continue to work
- Existing API calls without these fields will succeed
- No breaking changes to existing functionality

## Testing

The implementation has been:
- ✅ Built successfully without TypeScript errors
- ✅ No linting errors
- ✅ Zod schemas validate correctly
- ✅ CSV template updated with examples
- ✅ Documentation updated comprehensively

## Files Modified

1. `zod/facilityType.zod.ts` - Added fields to schemas
2. `app/facilityType/facilityType.controller.ts` - Updated create and CSV upload methods
3. `examples/facilitytype-upload-template.csv` - Added new columns with examples
4. `docs/FACILITYTYPE_CSV_UPLOAD.md` - Updated with field descriptions and examples

## Files Created

1. `docs/FACILITYTYPE_CODE_FIELD_UPDATE.md` - This file

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.1.0 (FacilityType CSV Upload)
