# Space Types, Subtypes & Enum Values - Complete Reference

## Table of Contents
1. [ROOM Space Type](#room-space-type)
2. [COURT Space Type](#court-space-type)
3. [DINING Space Type](#dining-space-type)
4. [FITNESS Space Type](#fitness-space-type)
5. [PARKING Space Type](#parking-space-type)
6. [AMENITY Space Type](#amenity-space-type)
7. [OUTDOOR Space Type](#outdoor-space-type)
8. [OTHER Space Type](#other-space-type)
9. [Complete Enum Reference](#complete-enum-reference)

---

## ROOM Space Type

### Available Subtypes

| Subtype | Description | Use Case |
|---------|-------------|----------|
| `GUEST_ROOM` | Hotel/accommodation rooms | Hotels, resorts, B&Bs |
| `CONFERENCE_ROOM` | Meeting and conference facilities | Business centers, hotels |
| `OFFICE` | Office workspaces | Co-working, corporate offices |
| `STUDIO` | Photography/recording/art studios | Creative spaces |
| `CLASSROOM` | Training and education rooms | Schools, training centers |
| `BALLROOM` | Event and banquet halls | Hotels, event venues |
| `SUITE` | Multi-room accommodation suites | Luxury hotels, extended stays |
| `OTHER` | Custom room types | Any custom use case |

---

### GUEST_ROOM

**Metadata Schema**: `GuestRoomMetadata`

#### Required Fields
- `bedType` (BedType enum)
- `bedCount` (number, min: 1)
- `maxOccupancy` (number, min: 1)

#### Optional Fields
- `amenities` (array of Amenity enum)
- `roomFeatures` (array of RoomFeature enum)
- `floorNumber` (number)
- `roomSize` (number, in square meters)
- `hasBalcony` (boolean)
- `hasKitchen` (boolean)

#### Valid Enums

**BedType**:
```
SINGLE_BED
DOUBLE_BED
QUEEN_BED
KING_BED
TWIN_BED
BUNK_BED
SOFA_BED
MURPHY_BED
DAYBED
FUTON
```

**RoomFeature** (42 values):
```
AIR_CONDITIONING, HEATING, WIFI, TELEVISION, MINIBAR, SAFE, 
BALCONY, TERRACE, KITCHEN, KITCHENETTE, BATHROOM, 
PRIVATE_BATHROOM, SHARED_BATHROOM, JACUZZI, BATHTUB, SHOWER,
HAIR_DRYER, TOWELS, LINENS, IRON, IRONING_BOARD, CLOSET,
WARDROBE, WORK_DESK, SEATING_AREA, DINING_AREA, FIREPLACE,
OCEAN_VIEW, MOUNTAIN_VIEW, GARDEN_VIEW, CITY_VIEW, POOL_VIEW,
PARKING, PET_FRIENDLY, SMOKING_ALLOWED, NON_SMOKING,
WHEELCHAIR_ACCESSIBLE, ELEVATOR_ACCESS, SOUNDPROOF, BLACKOUT_CURTAINS
```

**Amenity** (42 values):
```
CONCIERGE_SERVICE, ROOM_SERVICE, LAUNDRY_SERVICE, DRY_CLEANING,
VALET_PARKING, BUSINESS_CENTER, FITNESS_CENTER, SWIMMING_POOL,
HOT_TUB, SAUNA, STEAM_ROOM, SPA_SERVICES, MASSAGE_SERVICES,
RESTAURANT, BAR_LOUNGE, COFFEE_SHOP, GIFT_SHOP,
CONFERENCE_FACILITIES, MEETING_ROOMS, BANQUET_HALLS,
WEDDING_SERVICES, CHILDCARE_SERVICES, PET_SERVICES,
AIRPORT_SHUTTLE, CAR_RENTAL, TOUR_DESK, CURRENCY_EXCHANGE,
ATM, LUGGAGE_STORAGE, WAKE_UP_CALL, NEWSPAPER_DELIVERY,
COMPLIMENTARY_BREAKFAST, HAPPY_HOUR, LIBRARY, GAME_ROOM,
TENNIS_COURT, GOLF_COURSE, BEACH_ACCESS, SKI_ACCESS,
HIKING_TRAILS, BICYCLE_RENTAL
```

#### Example Request
```json
{
  "name": "Deluxe King Room",
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,
    "maxOccupancy": 2,
    "roomFeatures": ["WIFI", "AIR_CONDITIONING", "OCEAN_VIEW", "MINIBAR"],
    "amenities": ["ROOM_SERVICE", "CONCIERGE_SERVICE"],
    "floorNumber": 5,
    "roomSize": 40,
    "hasBalcony": true,
    "hasKitchen": false
  }
}
```

---

### CONFERENCE_ROOM

**Metadata Schema**: `ConferenceRoomMetadata`

#### Required Fields
- `seatingCapacity` (number, min: 1)

#### Optional Fields
- `hasProjector` (boolean)
- `hasWhiteboard` (boolean)
- `hasVideoConferencing` (boolean)
- `hasAudioSystem` (boolean)
- `layout` (string, e.g., "Theater", "Classroom", "U-Shape")
- `equipment` (array of strings)
- `roomSize` (number)
- `hasNaturalLight` (boolean)

#### Example Request
```json
{
  "name": "Executive Boardroom",
  "spaceType": "ROOM",
  "subtype": "CONFERENCE_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": 20,
    "hasProjector": true,
    "hasWhiteboard": true,
    "hasVideoConferencing": true,
    "hasAudioSystem": true,
    "layout": "Boardroom",
    "equipment": ["4K Display", "Video Conference System", "Wireless Mic"],
    "roomSize": 60,
    "hasNaturalLight": true
  }
}
```

---

### OFFICE

**Metadata Schema**: `OfficeMetadata`

#### Required Fields
- `capacity` (number, min: 1)

#### Optional Fields
- `hasDesk` (boolean)
- `hasChair` (boolean)
- `hasComputer` (boolean)
- `hasPhone` (boolean)
- `equipment` (array of strings)
- `roomSize` (number)
- `isPrivate` (boolean)

#### Example Request
```json
{
  "name": "Private Office 101",
  "spaceType": "ROOM",
  "subtype": "OFFICE",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "capacity": 1,
    "hasDesk": true,
    "hasChair": true,
    "hasComputer": false,
    "hasPhone": true,
    "equipment": ["Desk", "Ergonomic Chair", "Filing Cabinet"],
    "roomSize": 15,
    "isPrivate": true
  }
}
```

---

### STUDIO

**Metadata Schema**: `StudioMetadata`

#### Required Fields
- `studioType` (string, e.g., "Photography", "Recording", "Art")

#### Optional Fields
- `equipment` (array of strings)
- `roomSize` (number)
- `hasSoundproofing` (boolean)
- `hasNaturalLight` (boolean)
- `capacity` (number)

#### Example Request
```json
{
  "name": "Photography Studio A",
  "spaceType": "ROOM",
  "subtype": "STUDIO",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "studioType": "Photography",
    "equipment": ["Lighting Rig", "Backdrop", "Cameras", "Props"],
    "roomSize": 80,
    "hasSoundproofing": true,
    "hasNaturalLight": true,
    "capacity": 10
  }
}
```

---

### CLASSROOM

**Metadata Schema**: `ClassroomMetadata`

#### Required Fields
- `seatingCapacity` (number, min: 1)

#### Optional Fields
- `hasProjector` (boolean)
- `hasWhiteboard` (boolean)
- `hasAudioSystem` (boolean)
- `layout` (string)
- `equipment` (array of strings)
- `roomSize` (number)

#### Example Request
```json
{
  "name": "Training Room 201",
  "spaceType": "ROOM",
  "subtype": "CLASSROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "seatingCapacity": 30,
    "hasProjector": true,
    "hasWhiteboard": true,
    "hasAudioSystem": true,
    "layout": "Classroom",
    "equipment": ["Desks", "Chairs", "Projector Screen"],
    "roomSize": 70
  }
}
```

---

### BALLROOM

**Metadata Schema**: `BallroomMetadata`

#### Required Fields
- `capacity` (number, min: 1)
- `roomSize` (number, required for ballrooms)

#### Optional Fields
- `hasDanceFloor` (boolean)
- `hasStage` (boolean)
- `hasAudioSystem` (boolean)
- `hasLighting` (boolean)
- `hasCatering` (boolean)
- `equipment` (array of strings)
- `layout` (string)

#### Example Request
```json
{
  "name": "Grand Ballroom",
  "spaceType": "ROOM",
  "subtype": "BALLROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "capacity": 500,
    "roomSize": 800,
    "hasDanceFloor": true,
    "hasStage": true,
    "hasAudioSystem": true,
    "hasLighting": true,
    "hasCatering": true,
    "equipment": ["Sound System", "Stage Lighting", "DJ Booth"],
    "layout": "Open Floor"
  }
}
```

---

### SUITE

**Metadata Schema**: `SuiteMetadata`

#### Required Fields
- `bedType` (BedType enum)
- `bedCount` (number, min: 1)
- `maxOccupancy` (number, min: 1)
- `numberOfRooms` (number, min: 2)

#### Optional Fields
- `amenities` (array of Amenity enum)
- `roomFeatures` (array of RoomFeature enum)
- `roomSize` (number)
- `hasLivingRoom` (boolean)
- `hasKitchen` (boolean)
- `hasDiningArea` (boolean)

#### Valid Enums
Same as GUEST_ROOM: BedType, RoomFeature, Amenity

#### Example Request
```json
{
  "name": "Presidential Suite",
  "spaceType": "ROOM",
  "subtype": "SUITE",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 2,
    "maxOccupancy": 6,
    "numberOfRooms": 3,
    "amenities": ["ROOM_SERVICE", "CONCIERGE_SERVICE"],
    "roomFeatures": ["OCEAN_VIEW", "BALCONY", "KITCHEN", "DINING_AREA"],
    "roomSize": 150,
    "hasLivingRoom": true,
    "hasKitchen": true,
    "hasDiningArea": true
  }
}
```

---

## COURT Space Type

### Available Subtypes

| Subtype | Description |
|---------|-------------|
| `TENNIS` | Tennis courts |
| `BASKETBALL` | Basketball courts |
| `VOLLEYBALL` | Volleyball courts |
| `BADMINTON` | Badminton courts |
| `SQUASH` | Squash courts |
| `RACQUETBALL` | Racquetball courts |
| `PICKLEBALL` | Pickleball courts |
| `MULTIPURPOSE` | Multi-sport courts |
| `OTHER` | Custom court types |

### All Court Subtypes (except OTHER)

**Metadata Schema**: `SportsCourtMetadata`

#### Required Fields
- `sportType` (string, e.g., "Tennis", "Basketball", "Volleyball")

#### Optional Fields
- `surfaceType` (string, e.g., "Clay", "Hardcourt", "Grass", "Wooden")
- `isIndoor` (boolean)
- `hasLighting` (boolean)
- `maxPlayers` (number)
- `equipmentProvided` (array of strings)
- `openingHours` (string)
- `courtSize` (string, e.g., "Standard", "Half-court")

#### Example Request
```json
{
  "name": "Indoor Tennis Court 1",
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
    "openingHours": "6:00 AM - 11:00 PM",
    "courtSize": "Standard"
  }
}
```

---

## DINING Space Type

### Available Subtypes

| Subtype | Description |
|---------|-------------|
| `FINE_DINING` | Upscale fine dining restaurants |
| `CASUAL_DINING` | Casual dining establishments |
| `CAFE` | Coffee shops and cafés |
| `BAR` | Bars and pubs |
| `LOUNGE` | Lounges and social spaces |
| `BUFFET` | Buffet-style dining |
| `PRIVATE_DINING` | Private dining rooms |
| `FOOD_COURT` | Food court spaces |
| `OTHER` | Custom dining types |

### All Dining Subtypes (except OTHER)

**Metadata Schema**: `DiningMetadata`

#### Required Fields
None (all fields are optional)

#### Optional Fields
- `cuisineType` (string, e.g., "Italian", "Japanese", "French")
- `seatingCapacity` (number)
- `hasDelivery` (boolean)
- `hasTakeout` (boolean)
- `openingHours` (string)
- `menuUrl` (string, URL)
- `avgMealPrice` (number)
- `dressCode` (string, e.g., "Casual", "Smart Casual", "Formal")
- `hasOutdoorSeating` (boolean)
- `hasPrivateDining` (boolean)

#### Example Request
```json
{
  "name": "La Bella Vista",
  "spaceType": "DINING",
  "subtype": "FINE_DINING",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "cuisineType": "Italian",
    "seatingCapacity": 80,
    "hasDelivery": false,
    "hasTakeout": false,
    "openingHours": "6:00 PM - 11:00 PM",
    "menuUrl": "https://example.com/menu",
    "avgMealPrice": 85.00,
    "dressCode": "Smart Casual",
    "hasOutdoorSeating": true,
    "hasPrivateDining": true
  }
}
```

---

## FITNESS Space Type

### Available Subtypes

| Subtype | Description |
|---------|-------------|
| `WEIGHT_ROOM` | Weight/strength training area |
| `CARDIO_AREA` | Cardio equipment area |
| `YOGA_STUDIO` | Yoga and meditation studio |
| `SPIN_STUDIO` | Spinning/cycling studio |
| `CROSSFIT_BOX` | CrossFit training facility |
| `PILATES_STUDIO` | Pilates studio |
| `MULTIPURPOSE` | Multi-purpose fitness space |
| `OTHER` | Custom fitness types |

### All Fitness Subtypes (except OTHER)

**Metadata Schema**: `FitnessMetadata`

#### Required Fields
None (all fields are optional)

#### Optional Fields
- `equipment` (array of strings)
- `hasTrainer` (boolean)
- `hasLockers` (boolean)
- `hasShowers` (boolean)
- `openingHours` (string)
- `capacity` (number)
- `specialtyArea` (string, e.g., "Cardio", "Weights", "Yoga")
- `classesOffered` (array of strings)

#### Example Request
```json
{
  "name": "Main Fitness Center",
  "spaceType": "FITNESS",
  "subtype": "WEIGHT_ROOM",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "equipment": ["Dumbbells", "Barbells", "Bench Press", "Squat Rack", "Cable Machines"],
    "hasTrainer": true,
    "hasLockers": true,
    "hasShowers": true,
    "openingHours": "5:00 AM - 11:00 PM",
    "capacity": 40,
    "specialtyArea": "Strength Training",
    "classesOffered": ["Personal Training", "Group Classes"]
  }
}
```

---

## PARKING Space Type

### Available Subtypes

| Subtype | Description |
|---------|-------------|
| `COVERED` | Covered parking |
| `OPEN_LOT` | Open parking lot |
| `GARAGE` | Parking garage |
| `VALET` | Valet parking service |
| `EV_CHARGING` | Electric vehicle charging stations |
| `DISABLED` | Disabled/handicap parking |
| `MOTORCYCLE` | Motorcycle parking |
| `BICYCLE` | Bicycle parking |
| `OTHER` | Custom parking types |

### All Parking Subtypes (except OTHER)

**Metadata Schema**: `ParkingMetadata`

#### Required Fields
None (all fields are optional)

#### Optional Fields
- `vehicleType` (string, e.g., "Car", "Motorcycle", "Bicycle")
- `isUnderground` (boolean)
- `isCovered` (boolean)
- `hasElectricCharging` (boolean)
- `chargingType` (string, e.g., "Level 2", "DC Fast Charging")
- `maxVehicleHeight` (number, in meters)
- `maxVehicleWidth` (number, in meters)
- `securityLevel` (string, e.g., "Basic", "Monitored", "Gated")
- `hasCCTV` (boolean)
- `isAccessControlled` (boolean)

#### Example Request
```json
{
  "name": "Underground Parking Garage",
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

## AMENITY Space Type

### Available Subtypes

| Subtype | Description |
|---------|-------------|
| `SWIMMING_POOL` | Swimming pools |
| `HOT_TUB` | Hot tubs and jacuzzis |
| `SAUNA` | Saunas |
| `STEAM_ROOM` | Steam rooms |
| `SPA` | Spa facilities |
| `LIBRARY` | Library and reading rooms |
| `BUSINESS_CENTER` | Business center |
| `GAME_ROOM` | Game and recreation rooms |
| `LOUNGE` | Lounge areas |
| `ROOFTOP` | Rooftop spaces |
| `GARDEN` | Garden areas |
| `OTHER` | Custom amenity types |

### All Amenity Subtypes (except OTHER)

**Metadata Schema**: `AmenitySpaceMetadata`

#### Required Fields
- `amenityType` (string, e.g., "Swimming Pool", "Spa", "Library")

#### Optional Fields
- `capacity` (number)
- `requiresReservation` (boolean)
- `openingHours` (string)
- `ageRestriction` (string, e.g., "Adults Only", "All Ages", "18+")
- `additionalFees` (number)
- `equipment` (array of strings)
- `features` (array of strings)
- `hasSupervision` (boolean)

#### Example Request
```json
{
  "name": "Rooftop Infinity Pool",
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
    "equipment": ["Lounge Chairs", "Umbrellas", "Towels"],
    "features": ["Heated", "Infinity Edge", "Bar Service", "Cabanas"],
    "hasSupervision": true
  }
}
```

---

## OUTDOOR Space Type

### No Predefined Subtypes

**Metadata Schema**: `OutdoorMetadata`

#### Required Fields
- `outdoorType` (string, e.g., "Garden", "Terrace", "Patio", "Courtyard")

#### Optional Fields
- `capacity` (number)
- `area` (number, in square meters)
- `hasSeating` (boolean)
- `hasShade` (boolean)
- `hasLighting` (boolean)
- `features` (array of strings)
- `requiresReservation` (boolean)
- `openingHours` (string)

#### Example Request
```json
{
  "name": "Garden Terrace",
  "spaceType": "OUTDOOR",
  "organizationId": "507f1f77bcf86cd799439011",
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

---

## OTHER Space Type

### Custom Facility Types

**Metadata Schema**: `OtherMetadata`

#### Required Fields
- `customType` (string, describe your custom facility type)

#### Optional Fields
- `description` (string)
- `features` (array of strings)
- `requirements` (array of strings)
- `capacity` (number)
- `openingHours` (string)

#### Example Request
```json
{
  "name": "Pet Spa & Grooming",
  "spaceType": "OTHER",
  "organizationId": "507f1f77bcf86cd799439011",
  "metadata": {
    "customType": "Pet Grooming Facility",
    "description": "Full-service pet grooming and spa",
    "features": ["Bathing", "Grooming", "Nail Trimming", "Massage", "Daycare"],
    "requirements": ["Pet Vaccination Records", "Pet Behavior Assessment"],
    "capacity": 8,
    "openingHours": "9:00 AM - 6:00 PM"
  }
}
```

---

## Complete Enum Reference

### BedType Enum (10 values)
Used in: GUEST_ROOM, SUITE

```
SINGLE_BED       - Single bed (twin size)
DOUBLE_BED       - Double/full bed
QUEEN_BED        - Queen size bed
KING_BED         - King size bed
TWIN_BED         - Twin bed
BUNK_BED         - Bunk bed (stacked)
SOFA_BED         - Convertible sofa bed
MURPHY_BED       - Wall bed/Murphy bed
DAYBED           - Daybed
FUTON            - Futon
```

### RoomFeature Enum (42 values)
Used in: GUEST_ROOM, SUITE

```
# Climate Control
AIR_CONDITIONING
HEATING

# Technology
WIFI
TELEVISION

# In-Room Amenities
MINIBAR
SAFE
IRON
IRONING_BOARD
HAIR_DRYER

# Room Layout
BALCONY
TERRACE
SEATING_AREA
DINING_AREA
WORK_DESK

# Kitchen Facilities
KITCHEN
KITCHENETTE

# Bathroom Features
BATHROOM
PRIVATE_BATHROOM
SHARED_BATHROOM
JACUZZI
BATHTUB
SHOWER

# Linens & Storage
TOWELS
LINENS
CLOSET
WARDROBE

# Special Features
FIREPLACE
SOUNDPROOF
BLACKOUT_CURTAINS

# Views
OCEAN_VIEW
MOUNTAIN_VIEW
GARDEN_VIEW
CITY_VIEW
POOL_VIEW

# Accessibility & Policies
PARKING
PET_FRIENDLY
SMOKING_ALLOWED
NON_SMOKING
WHEELCHAIR_ACCESSIBLE
ELEVATOR_ACCESS
```

### Amenity Enum (42 values)
Used in: GUEST_ROOM, SUITE

```
# Guest Services
CONCIERGE_SERVICE
ROOM_SERVICE
LAUNDRY_SERVICE
DRY_CLEANING
VALET_PARKING

# Business Facilities
BUSINESS_CENTER
CONFERENCE_FACILITIES
MEETING_ROOMS

# Recreation & Wellness
FITNESS_CENTER
SWIMMING_POOL
HOT_TUB
SAUNA
STEAM_ROOM
SPA_SERVICES
MASSAGE_SERVICES
TENNIS_COURT
GOLF_COURSE

# Dining & Entertainment
RESTAURANT
BAR_LOUNGE
COFFEE_SHOP
GIFT_SHOP
COMPLIMENTARY_BREAKFAST
HAPPY_HOUR
LIBRARY
GAME_ROOM

# Event Services
BANQUET_HALLS
WEDDING_SERVICES

# Family Services
CHILDCARE_SERVICES
PET_SERVICES

# Transportation & Activities
AIRPORT_SHUTTLE
CAR_RENTAL
TOUR_DESK
BICYCLE_RENTAL

# Convenience Services
CURRENCY_EXCHANGE
ATM
LUGGAGE_STORAGE
WAKE_UP_CALL
NEWSPAPER_DELIVERY

# Outdoor Activities
BEACH_ACCESS
SKI_ACCESS
HIKING_TRAILS
```

---

## Quick Reference Table

| Space Type | Subtypes Count | Required Fields | Optional Fields | Uses Enums |
|------------|----------------|-----------------|-----------------|------------|
| ROOM | 8 | Varies by subtype | Varies by subtype | Yes (BedType, RoomFeature, Amenity) |
| COURT | 9 | sportType | 7 | No |
| DINING | 9 | None | 10 | No |
| FITNESS | 8 | None | 8 | No |
| PARKING | 9 | None | 10 | No |
| AMENITY | 12 | amenityType | 7 | No |
| OUTDOOR | 0 | outdoorType | 8 | No |
| OTHER | 0 | customType | 5 | No |

---

## Validation Rules

### General Rules
1. **SpaceType** is always required
2. **Subtype** is optional but recommended
3. **Metadata** structure must match the spaceType + subtype combination
4. **Enum values** are case-sensitive and must match exactly

### Field Type Rules
- **Strings**: Free text unless specified as enum
- **Numbers**: Positive integers for counts, decimals allowed for measurements
- **Booleans**: true/false
- **Arrays**: Can be empty [] but must be valid array type
- **Enums**: Must match predefined values exactly

---

## Error Handling

When validation fails, you'll receive detailed error messages including:
- Required fields list
- Optional fields list
- Schema name
- Example valid metadata

See `docs/ENHANCED_ERROR_RESPONSES.md` for examples.

---

**Document Version**: 1.0.0  
**Last Updated**: December 11, 2025  
**Related Docs**:
- `FACILITY_TYPE_METADATA_GUIDE.md` - Usage guide with examples
- `ENHANCED_ERROR_RESPONSES.md` - Error message examples
- `FACILITY_TYPE_IMPLEMENTATION_SUMMARY.md` - Implementation details

