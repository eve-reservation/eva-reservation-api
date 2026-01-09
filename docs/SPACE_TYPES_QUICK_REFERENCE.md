# Space Types Quick Reference - Cheat Sheet

## 📋 Quick Lookup Table

### ROOM Space Type

| Subtype | Required | Optional | Enums Used |
|---------|----------|----------|------------|
| **GUEST_ROOM** | bedType, bedCount, maxOccupancy | amenities, roomFeatures, floorNumber, roomSize, hasBalcony, hasKitchen | BedType, RoomFeature, Amenity |
| **CONFERENCE_ROOM** | seatingCapacity | hasProjector, hasWhiteboard, hasVideoConferencing, hasAudioSystem, layout, equipment, roomSize, hasNaturalLight | None |
| **OFFICE** | capacity | hasDesk, hasChair, hasComputer, hasPhone, equipment, roomSize, isPrivate | None |
| **STUDIO** | studioType | equipment, roomSize, hasSoundproofing, hasNaturalLight, capacity | None |
| **CLASSROOM** | seatingCapacity | hasProjector, hasWhiteboard, hasAudioSystem, layout, equipment, roomSize | None |
| **BALLROOM** | capacity, roomSize | hasDanceFloor, hasStage, hasAudioSystem, hasLighting, hasCatering, equipment, layout | None |
| **SUITE** | bedType, bedCount, maxOccupancy, numberOfRooms | amenities, roomFeatures, roomSize, hasLivingRoom, hasKitchen, hasDiningArea | BedType, RoomFeature, Amenity |
| **OTHER** | customType | description, features, requirements, capacity, openingHours | None |

### COURT Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **All Courts** (TENNIS, BASKETBALL, VOLLEYBALL, BADMINTON, SQUASH, RACQUETBALL, PICKLEBALL, MULTIPURPOSE) | sportType | surfaceType, isIndoor, hasLighting, maxPlayers, equipmentProvided, openingHours, courtSize |
| **OTHER** | customType | description, features, requirements, capacity, openingHours |

### DINING Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **All Dining** (FINE_DINING, CASUAL_DINING, CAFE, BAR, LOUNGE, BUFFET, PRIVATE_DINING, FOOD_COURT) | None | cuisineType, seatingCapacity, hasDelivery, hasTakeout, openingHours, menuUrl, avgMealPrice, dressCode, hasOutdoorSeating, hasPrivateDining |
| **OTHER** | customType | description, features, requirements, capacity, openingHours |

### FITNESS Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **All Fitness** (WEIGHT_ROOM, CARDIO_AREA, YOGA_STUDIO, SPIN_STUDIO, CROSSFIT_BOX, PILATES_STUDIO, MULTIPURPOSE) | None | equipment, hasTrainer, hasLockers, hasShowers, openingHours, capacity, specialtyArea, classesOffered |
| **OTHER** | customType | description, features, requirements, capacity, openingHours |

### PARKING Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **All Parking** (COVERED, OPEN_LOT, GARAGE, VALET, EV_CHARGING, DISABLED, MOTORCYCLE, BICYCLE) | None | vehicleType, isUnderground, isCovered, hasElectricCharging, chargingType, maxVehicleHeight, maxVehicleWidth, securityLevel, hasCCTV, isAccessControlled |
| **OTHER** | customType | description, features, requirements, capacity, openingHours |

### AMENITY Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **All Amenities** (SWIMMING_POOL, HOT_TUB, SAUNA, STEAM_ROOM, SPA, LIBRARY, BUSINESS_CENTER, GAME_ROOM, LOUNGE, ROOFTOP, GARDEN) | amenityType | capacity, requiresReservation, openingHours, ageRestriction, additionalFees, equipment, features, hasSupervision |
| **OTHER** | customType | description, features, requirements, capacity, openingHours |

### OUTDOOR Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **No Subtypes** | outdoorType | capacity, area, hasSeating, hasShade, hasLighting, features, requiresReservation, openingHours |

### OTHER Space Type

| Subtype | Required | Optional |
|---------|----------|----------|
| **Custom Types** | customType | description, features, requirements, capacity, openingHours |

---

## 🎯 Enum Values Quick List

### BedType (10)
```
SINGLE_BED, DOUBLE_BED, QUEEN_BED, KING_BED, TWIN_BED,
BUNK_BED, SOFA_BED, MURPHY_BED, DAYBED, FUTON
```

### RoomFeature (42)
```
AIR_CONDITIONING, HEATING, WIFI, TELEVISION, MINIBAR, SAFE, BALCONY,
TERRACE, KITCHEN, KITCHENETTE, BATHROOM, PRIVATE_BATHROOM, SHARED_BATHROOM,
JACUZZI, BATHTUB, SHOWER, HAIR_DRYER, TOWELS, LINENS, IRON, IRONING_BOARD,
CLOSET, WARDROBE, WORK_DESK, SEATING_AREA, DINING_AREA, FIREPLACE,
OCEAN_VIEW, MOUNTAIN_VIEW, GARDEN_VIEW, CITY_VIEW, POOL_VIEW, PARKING,
PET_FRIENDLY, SMOKING_ALLOWED, NON_SMOKING, WHEELCHAIR_ACCESSIBLE,
ELEVATOR_ACCESS, SOUNDPROOF, BLACKOUT_CURTAINS
```

### Amenity (42)
```
CONCIERGE_SERVICE, ROOM_SERVICE, LAUNDRY_SERVICE, DRY_CLEANING, VALET_PARKING,
BUSINESS_CENTER, FITNESS_CENTER, SWIMMING_POOL, HOT_TUB, SAUNA, STEAM_ROOM,
SPA_SERVICES, MASSAGE_SERVICES, RESTAURANT, BAR_LOUNGE, COFFEE_SHOP, GIFT_SHOP,
CONFERENCE_FACILITIES, MEETING_ROOMS, BANQUET_HALLS, WEDDING_SERVICES,
CHILDCARE_SERVICES, PET_SERVICES, AIRPORT_SHUTTLE, CAR_RENTAL, TOUR_DESK,
CURRENCY_EXCHANGE, ATM, LUGGAGE_STORAGE, WAKE_UP_CALL, NEWSPAPER_DELIVERY,
COMPLIMENTARY_BREAKFAST, HAPPY_HOUR, LIBRARY, GAME_ROOM, TENNIS_COURT,
GOLF_COURSE, BEACH_ACCESS, SKI_ACCESS, HIKING_TRAILS, BICYCLE_RENTAL
```

---

## 📝 Common Examples

### Guest Room (Hotel)
```json
{
  "spaceType": "ROOM",
  "subtype": "GUEST_ROOM",
  "metadata": {
    "bedType": "KING_BED",
    "bedCount": 1,
    "maxOccupancy": 2
  }
}
```

### Tennis Court
```json
{
  "spaceType": "COURT",
  "subtype": "TENNIS",
  "metadata": {
    "sportType": "Tennis",
    "isIndoor": true
  }
}
```

### Restaurant
```json
{
  "spaceType": "DINING",
  "subtype": "FINE_DINING",
  "metadata": {
    "cuisineType": "Italian",
    "seatingCapacity": 50
  }
}
```

### Gym
```json
{
  "spaceType": "FITNESS",
  "subtype": "WEIGHT_ROOM",
  "metadata": {
    "equipment": ["Dumbbells", "Treadmills"],
    "capacity": 30
  }
}
```

### Swimming Pool
```json
{
  "spaceType": "AMENITY",
  "subtype": "SWIMMING_POOL",
  "metadata": {
    "amenityType": "Swimming Pool",
    "capacity": 50
  }
}
```

---

## ⚡ Tips

1. **Case Sensitive**: All enum values are UPPER_CASE with underscores
2. **Required First**: Always include required fields before optional ones
3. **Validation**: Use enhanced errors to see what's missing
4. **Enums**: Only GUEST_ROOM and SUITE use BedType, RoomFeature, Amenity enums

---

## 🔗 Related Docs

- **Full Reference**: `SPACE_TYPES_AND_ENUMS_REFERENCE.md`
- **Usage Guide**: `FACILITY_TYPE_METADATA_GUIDE.md`
- **Error Examples**: `ENHANCED_ERROR_RESPONSES.md`

---

**Last Updated**: December 11, 2025

