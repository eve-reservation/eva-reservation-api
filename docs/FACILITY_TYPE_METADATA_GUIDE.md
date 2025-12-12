# Facility Type Metadata Guide

This guide explains how to use the polymorphic metadata validation for different facility types in the EVA Reservation API.

## Overview

The FacilityType model uses a two-tier hierarchical classification system:
- **`spaceType`**: Primary category (ROOM, COURT, DINING, FITNESS, PARKING, AMENITY, OUTDOOR, OTHER)
- **`subtype`**: Specific type under each space category
- **`metadata`**: JSON object with specific fields based on the spaceType + subtype combination

## Space Types and Subtypes

### ROOM Space Type

#### GUEST_ROOM
Hotel/accommodation rooms with guest-specific amenities.

**Required Metadata Fields:**
- `bedType`: Enum (SINGLE_BED, DOUBLE_BED, QUEEN_BED, KING_BED, etc.)
- `bedCount`: Positive integer
- `maxOccupancy`: Positive integer

**Optional Metadata Fields:**
- `amenities`: Array of amenity enums
- `roomFeatures`: Array of room feature enums
- `floorNumber`: Integer
- `roomSize`: Number (square meters)
- `hasBalcony`: Boolean
- `hasKitchen`: Boolean

**Example Request:**
```json
{
  "name": "Deluxe Ocean View Suite",
  "code": "DLX-201",
  "description": "Spacious suite with ocean view",
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,
    "maxOccupancy": 2,
    "roomFeatures": ["OCEAN_VIEW", "BALCONY", "AIR_CONDITIONING", "WIFI"],
    "amenities": ["ROOM_SERVICE", "MINIBAR"],
    "floorNumber": 2,
    "roomSize": 45.5,
    "hasBalcony": true,
    "hasKitchen": false
  }
}
```

#### CONFERENCE_ROOM
Meeting and conference facilities.

**Required Metadata Fields:**
- `seatingCapacity`: Positive integer

**Optional Metadata Fields:**
- `hasProjector`: Boolean
- `hasWhiteboard`: Boolean
- `hasVideoConferencing`: Boolean
- `hasAudioSystem`: Boolean
- `layout`: String (e.g., "Theater", "Classroom", "U-Shape")
- `equipment`: Array of strings
- `roomSize`: Number
- `hasNaturalLight`: Boolean

**Example Request:**
```json
{
  "name": "Executive Conference Room",
  "code": "CONF-A",
  "spaceType": "ROOM",
  "subtype": "CONFERENCE_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": 20,
    "hasProjector": true,
    "hasWhiteboard": true,
    "hasVideoConferencing": true,
    "hasAudioSystem": true,
    "layout": "U-Shape",
    "equipment": ["Screen", "Microphones", "Speakers"],
    "roomSize": 60,
    "hasNaturalLight": true
  }
}
```

#### OFFICE
Office spaces for work.

**Required Metadata Fields:**
- `capacity`: Positive integer

**Optional Metadata Fields:**
- `hasDesk`: Boolean
- `hasChair`: Boolean
- `hasComputer`: Boolean
- `hasPhone`: Boolean
- `equipment`: Array of strings
- `roomSize`: Number
- `isPrivate`: Boolean

#### STUDIO
Photography, recording, or art studios.

**Required Metadata Fields:**
- `studioType`: String (e.g., "Photography", "Recording", "Art")

**Optional Metadata Fields:**
- `equipment`: Array of strings
- `roomSize`: Number
- `hasSoundproofing`: Boolean
- `hasNaturalLight`: Boolean
- `capacity`: Integer

#### CLASSROOM
Training and education rooms.

**Required Metadata Fields:**
- `seatingCapacity`: Positive integer

**Optional Metadata Fields:**
- `hasProjector`: Boolean
- `hasWhiteboard`: Boolean
- `hasAudioSystem`: Boolean
- `layout`: String
- `equipment`: Array of strings
- `roomSize`: Number

#### BALLROOM
Event and banquet halls.

**Required Metadata Fields:**
- `capacity`: Positive integer
- `roomSize`: Number (required for ballrooms)

**Optional Metadata Fields:**
- `hasDanceFloor`: Boolean
- `hasStage`: Boolean
- `hasAudioSystem`: Boolean
- `hasLighting`: Boolean
- `hasCatering`: Boolean
- `equipment`: Array of strings
- `layout`: String

#### SUITE
Multi-room suites.

**Required Metadata Fields:**
- `bedType`: Enum
- `bedCount`: Positive integer
- `maxOccupancy`: Positive integer
- `numberOfRooms`: Integer (minimum 2)

**Optional Metadata Fields:**
- `amenities`: Array
- `roomFeatures`: Array
- `roomSize`: Number
- `hasLivingRoom`: Boolean
- `hasKitchen`: Boolean
- `hasDiningArea`: Boolean

---

### COURT Space Type

All court subtypes (TENNIS, BASKETBALL, VOLLEYBALL, BADMINTON, SQUASH, RACQUETBALL, PICKLEBALL, MULTIPURPOSE) use the same metadata schema.

**Required Metadata Fields:**
- `sportType`: String (e.g., "Tennis", "Basketball")

**Optional Metadata Fields:**
- `surfaceType`: String (e.g., "Clay", "Hardcourt", "Grass", "Wooden")
- `isIndoor`: Boolean
- `hasLighting`: Boolean
- `maxPlayers`: Integer
- `equipmentProvided`: Array of strings
- `openingHours`: String
- `courtSize`: String (e.g., "Standard", "Half-court")

**Example Request:**
```json
{
  "name": "Indoor Tennis Court 1",
  "code": "TENNIS-01",
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "sportType": "Tennis",
    "surfaceType": "Hardcourt",
    "isIndoor": true,
    "hasLighting": true,
    "maxPlayers": 4,
    "equipmentProvided": ["Balls", "Net"],
    "openingHours": "6:00 AM - 10:00 PM",
    "courtSize": "Standard"
  }
}
```

---

### DINING Space Type

All dining subtypes (FINE_DINING, CASUAL_DINING, CAFE, BAR, LOUNGE, BUFFET, PRIVATE_DINING, FOOD_COURT) use the same metadata schema.

**Required Metadata Fields:**
None (all optional)

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

**Example Request:**
```json
{
  "name": "The Coastal Restaurant",
  "code": "REST-01",
  "spaceType": "DINING",
  "subtype": "FINE_DINING",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "cuisineType": "Mediterranean",
    "seatingCapacity": 80,
    "hasDelivery": false,
    "hasTakeout": true,
    "openingHours": "5:00 PM - 11:00 PM",
    "menuUrl": "https://example.com/menu",
    "avgMealPrice": 75.00,
    "dressCode": "Smart Casual",
    "hasOutdoorSeating": true,
    "hasPrivateDining": true
  }
}
```

---

### FITNESS Space Type

All fitness subtypes (WEIGHT_ROOM, CARDIO_AREA, YOGA_STUDIO, SPIN_STUDIO, CROSSFIT_BOX, PILATES_STUDIO, MULTIPURPOSE) use the same metadata schema.

**Required Metadata Fields:**
None (all optional)

**Optional Metadata Fields:**
- `equipment`: Array of strings
- `hasTrainer`: Boolean
- `hasLockers`: Boolean
- `hasShowers`: Boolean
- `openingHours`: String
- `capacity`: Integer
- `specialtyArea`: String
- `classesOffered`: Array of strings

**Example Request:**
```json
{
  "name": "Main Fitness Center",
  "code": "GYM-01",
  "spaceType": "FITNESS",
  "subtype": "WEIGHT_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "equipment": ["Dumbbells", "Barbells", "Bench Press", "Squat Rack"],
    "hasTrainer": true,
    "hasLockers": true,
    "hasShowers": true,
    "openingHours": "5:00 AM - 11:00 PM",
    "capacity": 30,
    "specialtyArea": "Weights",
    "classesOffered": ["Strength Training", "Powerlifting"]
  }
}
```

---

### PARKING Space Type

All parking subtypes (COVERED, OPEN_LOT, GARAGE, VALET, EV_CHARGING, DISABLED, MOTORCYCLE, BICYCLE) use the same metadata schema.

**Required Metadata Fields:**
None (all optional)

**Optional Metadata Fields:**
- `vehicleType`: String (e.g., "Car", "Motorcycle", "Bicycle")
- `isUnderground`: Boolean
- `isCovered`: Boolean
- `hasElectricCharging`: Boolean
- `chargingType`: String (e.g., "Level 2", "DC Fast Charging")
- `maxVehicleHeight`: Number (meters)
- `maxVehicleWidth`: Number (meters)
- `securityLevel`: String (e.g., "Basic", "Monitored", "Gated")
- `hasCCTV`: Boolean
- `isAccessControlled`: Boolean

**Example Request:**
```json
{
  "name": "Underground Parking Garage",
  "code": "PARK-01",
  "spaceType": "PARKING",
  "subtype": "GARAGE",
  "organizationId": "507f1f77bcf86cd799439011",
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

---

### AMENITY Space Type

All amenity subtypes (SWIMMING_POOL, HOT_TUB, SAUNA, STEAM_ROOM, SPA, LIBRARY, BUSINESS_CENTER, GAME_ROOM, LOUNGE, ROOFTOP, GARDEN) use the same metadata schema.

**Required Metadata Fields:**
- `amenityType`: String (e.g., "Pool", "Spa", "Library")

**Optional Metadata Fields:**
- `capacity`: Integer
- `requiresReservation`: Boolean
- `openingHours`: String
- `ageRestriction`: String (e.g., "Adults Only", "All Ages", "18+")
- `additionalFees`: Number
- `equipment`: Array of strings
- `features`: Array of strings
- `hasSupervision`: Boolean

**Example Request:**
```json
{
  "name": "Rooftop Pool",
  "code": "POOL-01",
  "spaceType": "AMENITY",
  "subtype": "SWIMMING_POOL",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "amenityType": "Swimming Pool",
    "capacity": 50,
    "requiresReservation": false,
    "openingHours": "6:00 AM - 10:00 PM",
    "ageRestriction": "All Ages",
    "additionalFees": 0,
    "equipment": ["Lounge Chairs", "Umbrellas"],
    "features": ["Heated", "Infinity Edge", "Bar Service"],
    "hasSupervision": true
  }
}
```

---

### OUTDOOR Space Type

For outdoor spaces without a predefined subtype.

**Required Metadata Fields:**
- `outdoorType`: String (e.g., "Garden", "Terrace", "Patio", "Courtyard")

**Optional Metadata Fields:**
- `capacity`: Integer
- `area`: Number (square meters)
- `hasSeating`: Boolean
- `hasShade`: Boolean
- `hasLighting`: Boolean
- `features`: Array of strings
- `requiresReservation`: Boolean
- `openingHours`: String

**Example Request:**
```json
{
  "name": "Garden Terrace",
  "code": "OUT-01",
  "spaceType": "OUTDOOR",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "outdoorType": "Terrace",
    "capacity": 40,
    "area": 150,
    "hasSeating": true,
    "hasShade": true,
    "hasLighting": true,
    "features": ["Fire Pit", "Water Feature", "BBQ Area"],
    "requiresReservation": true,
    "openingHours": "Sunrise to Sunset"
  }
}
```

---

### OTHER Space Type

For custom facility types not covered by the standard categories.

**Required Metadata Fields:**
- `customType`: String

**Optional Metadata Fields:**
- `description`: String
- `features`: Array of strings
- `requirements`: Array of strings
- `capacity`: Integer
- `openingHours`: String

**Example Request:**
```json
{
  "name": "Pet Spa",
  "code": "OTHER-01",
  "spaceType": "OTHER",
  "organizationId": "507f1f77bcf86cd799439011",
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

---

## Validation

The API automatically validates metadata based on the `spaceType` and `subtype` combination:

1. **Preprocessing**: Handles form data, parses JSON strings, converts types
2. **Validation**: Ensures metadata matches the expected schema for the space type
3. **Error Messages**: Provides detailed validation errors if metadata is incorrect

### Common Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    {
      "path": ["metadata"],
      "message": "metadata must match the selected spaceType and subtype"
    }
  ]
}
```

### Successful Response

```json
{
  "success": true,
  "message": "FacilityType created successfully",
  "statusCode": 201,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Deluxe Ocean View Suite",
    "code": "DLX-201",
    "description": "Spacious suite with ocean view",
    "spaceType": "ROOM",
    "subtype": "GUEST_ROOM",
    "organizationId": "507f1f77bcf86cd799439011",
    "metadata": {
      "bedType": "KING_BED",
      "bedCount": 1,
      "maxOccupancy": 2,
      "roomFeatures": ["OCEAN_VIEW", "BALCONY"],
      "amenities": ["ROOM_SERVICE"]
    },
    "createdAt": "2025-12-11T10:30:00.000Z",
    "updatedAt": "2025-12-11T10:30:00.000Z"
  }
}
```

---

## Enums Reference

### Bed Types
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

### Room Features (Partial List)
- AIR_CONDITIONING
- HEATING
- WIFI
- TELEVISION
- MINIBAR
- SAFE
- BALCONY
- OCEAN_VIEW
- MOUNTAIN_VIEW
- CITY_VIEW
- WHEELCHAIR_ACCESSIBLE

### Amenities (Partial List)
- ROOM_SERVICE
- LAUNDRY_SERVICE
- VALET_PARKING
- FITNESS_CENTER
- SWIMMING_POOL
- SPA_SERVICES
- RESTAURANT
- BAR_LOUNGE
- CONCIERGE_SERVICE

For complete enum lists, refer to `zod/facilityType.zod.ts`.

---

## Tips

1. **Required vs Optional**: Pay attention to which metadata fields are required vs optional for each space type
2. **Type Safety**: Use the exported TypeScript types for type-safe development
3. **Testing**: Test your metadata validation during development to catch errors early
4. **Documentation**: Keep this guide updated when adding new space types or metadata schemas

