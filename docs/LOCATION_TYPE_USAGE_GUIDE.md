# Location Type Usage Guide

A comprehensive guide to understanding and using the different location types in the EVA Reservation API.

---

## 📍 Location Type Hierarchy & Usage

### 1. BUILDING - Top-Level Physical Structures

**When to use:** Main physical structures that can stand alone.

**Use cases:**
- Hotels, resorts, towers
- Parking structures/garages
- Sports complexes, clubhouses
- Villas, cottages, pavilions
- Office buildings, conference centers

**Examples:**
- "Bayview Grand Hotel Main Tower"
- "Multi-Level Parking Structure"
- "Sports & Recreation Complex"
- "Villa 105"

**Characteristics:**
- Usually has `parentLocationId: null` (root location)
- Contains address, city, country, GPS coordinates
- Has `buildingType` in metadata (MAIN, ANNEX, TOWER, CLUBHOUSE, etc.)

**Metadata Fields:**
```json
{
  "buildingType": "MAIN",
  "totalFloors": 28,
  "basementLevels": 3,
  "hasElevator": true,
  "elevatorCount": 6,
  "totalArea": 45000,
  "constructionYear": 2015,
  "hasParkingFacility": true,
  "parkingCapacity": 180
}
```

---

### 2. FLOOR - Horizontal Levels Within Buildings

**When to use:** Individual floor/level within a building.

**Use cases:**
- Ground floor, 2nd floor, 15th floor
- Basement levels (B1, B2)
- Parking levels (P1, P2, P3)
- Rooftop level

**Examples:**
- "Ground Floor - Main Lobby & Services"
- "15th Floor - Premium Suites"
- "Parking Level P2"
- "Basement 1 - Storage & Mechanical"
- "Rooftop - Sky Deck"

**Characteristics:**
- Parent is usually a `BUILDING`
- Has `floorNumber` in metadata (0 for ground, negative for basement)
- Can contain multiple areas, wings, or zones

**Metadata Fields:**
```json
{
  "floorNumber": 15,
  "floorLabel": "15th Floor - Bay View",
  "totalArea": 1600,
  "ceilingHeight": 2.8,
  "hasRestrooms": true,
  "hasEmergencyExit": true,
  "capacity": 80,
  "roomCount": 32,
  "zoneType": "RESIDENTIAL"
}
```

---

### 3. WING - Building Sections Spanning Multiple Floors

**When to use:** Large sections of a building that span across multiple floors.

**Use cases:**
- North Wing, South Wing, East Wing, West Wing
- Tower sections
- Building extensions connected to main structure

**Examples:**
- "North Wing - Ocean View Suites (Floors 10-25)"
- "West Wing - Conference & Events"
- "Medical Wing"

**Characteristics:**
- Parent can be `BUILDING` or `FLOOR`
- Typically spans multiple floors (startFloor, endFloor in metadata)
- Used in large hotels, hospitals, or multi-wing complexes

**Metadata Fields:**
```json
{
  "wingIdentifier": "North",
  "startFloor": 10,
  "endFloor": 25,
  "totalArea": 15000,
  "roomCount": 120,
  "zoneType": "RESIDENTIAL",
  "hasOceanView": true,
  "capacity": 300
}
```

---

### 4. AREA - Functional Spaces

**When to use:** Specific functional areas or rooms within a floor or wing.

**Use cases:**
- Lobbies, reception areas
- Restaurants, cafes, bars
- Corridors, atriums
- Conference rooms (as a location)
- Gift shops, spa areas
- Mechanical rooms, storage areas

**Examples:**
- "Grand Lobby & Reception"
- "Sampaguita Restaurant - All Day Dining"
- "Main Corridor - East Side"
- "Rooftop Pool Area"

**Characteristics:**
- Parent is usually `FLOOR` or `WING`
- Has `areaType` in metadata (LOBBY, CORRIDOR, ATRIUM, ROOFTOP, etc.)
- Defines purpose and function
- Can be public or restricted

**Metadata Fields:**
```json
{
  "areaType": "LOBBY",
  "totalArea": 800,
  "ceilingHeight": 8.0,
  "isPublicArea": true,
  "hasClimateControl": true,
  "seatingCapacity": 60,
  "hasWifi": true,
  "operatingHours": "24/7"
}
```

---

### 5. ZONE - Functional/Security Zones

**When to use:** Areas defined by function, security level, or usage type (can span multiple floors/areas).

**Use cases:**
- VIP zones, restricted areas
- Residential vs commercial zones
- Security zones (public, private, restricted)
- Functional zones (spa & wellness, entertainment)
- Operational zones (service areas)

**Examples:**
- "VIP Executive Zone (Floors 20-25)"
- "Spa & Wellness Zone"
- "Casino & Entertainment Zone"
- "Service & Staff Zone"
- "Public Access Zone"

**Characteristics:**
- Parent can be `BUILDING`, `FLOOR`, or `WING`
- Has `zoneType` in metadata (RESIDENTIAL, COMMERCIAL, RECREATIONAL, VIP, etc.)
- Emphasizes security level, access control, or functional grouping
- May require special access (key cards, permissions)

**Metadata Fields:**
```json
{
  "zoneType": "VIP",
  "totalArea": 3000,
  "capacity": 80,
  "securityLevel": "high",
  "requiresKeyCardAccess": true,
  "allowedActivities": ["dining", "lounge", "business_center"],
  "operatingHours": "06:00-23:00"
}
```

---

### 6. SECTION - Organizational Subdivisions

**When to use:** Smaller organizational units within a larger space, numbered/lettered sections.

**Use cases:**
- Parking sections (Section A, Section B)
- Building blocks in a complex
- Numbered sections within a floor
- Room clusters/pods

**Examples:**
- "Parking Section P2-A (Spaces 1-30)"
- "Section B - Family Rooms"
- "Block 3 - Villas 301-315"

**Characteristics:**
- Parent is usually `FLOOR`, `AREA`, or `ZONE`
- Has `sectionIdentifier` in metadata
- Used for organizational/administrative purposes
- Often contains a specific number of units

**Metadata Fields:**
```json
{
  "sectionIdentifier": "P2-A",
  "totalArea": 500,
  "capacity": 30,
  "unitCount": 30,
  "purpose": "Premium_guest_parking",
  "evChargingPoints": 10,
  "securityLevel": "high"
}
```

---

### 7. BLOCK - Independent Building Units in a Complex

**When to use:** Separate but connected building structures within a larger property.

**Use cases:**
- Villa blocks in a resort
- Apartment blocks
- Dormitory blocks
- Building clusters

**Examples:**
- "Block A - Luxury Villas (Units 1-10)"
- "Block C - Family Suites"
- "Staff Quarters Block 2"

**Characteristics:**
- Parent is usually a `BUILDING` or can be root-level
- Semi-independent structures within a complex
- Often has its own entrance and facilities
- Common in resorts, condominiums, or campus-style properties

**Metadata Fields:**
```json
{
  "blockIdentifier": "B",
  "totalArea": 5000,
  "unitCount": 12,
  "buildingStyle": "Mediterranean",
  "floors": 2,
  "hasSharedPool": true,
  "hasSharedGarden": true
}
```

---

### 8. OUTDOOR - Open-Air Spaces

**When to use:** Any outdoor or open-air facility/area.

**Use cases:**
- Gardens, parks, plazas
- Outdoor pools, beaches
- Tennis courts, basketball courts, sports fields
- Rooftop decks, terraces
- Outdoor parking lots
- Playgrounds, picnic areas

**Examples:**
- "Tropical Garden & Infinity Pool"
- "Outdoor Tennis Court Complex"
- "Beachfront & Water Sports Area"
- "Outdoor Staff Parking Lot"
- "Rooftop Sunset Bar & Lounge"

**Characteristics:**
- Can have various parents or be root-level
- Has `outdoorType` in metadata
- Weather-dependent (usually `weatherDependent: true`)
- May have shade, lighting, seating

**Metadata Fields:**
```json
{
  "outdoorType": "GARDEN",
  "totalArea": 5000,
  "hasSeating": true,
  "seatingCapacity": 100,
  "hasLighting": true,
  "hasShade": true,
  "weatherDependent": true,
  "surfaceType": "Landscaped lawn and paved walkways"
}
```

---

### 9. OTHER - Miscellaneous Locations

**When to use:** Locations that don't fit the standard categories.

**Use cases:**
- Unique or specialized spaces
- Temporary structures
- Virtual spaces (for some systems)
- Mixed-use spaces that don't fit elsewhere

**Examples:**
- "Mobile Food Cart Station"
- "Pop-up Event Space"
- "Multi-purpose Hall"

**Characteristics:**
- Flexible classification
- Use when none of the other types fit
- Define custom metadata as needed

---

## 🏗️ Hierarchy Examples

### Example 1: Hotel Hierarchy

```
BUILDING (Grand Hotel)
├── FLOOR (Ground Floor)
│   ├── AREA (Main Lobby)
│   ├── AREA (Restaurant)
│   └── ZONE (Public Access Zone)
├── FLOOR (15th Floor)
│   ├── WING (North Wing - Premium Suites)
│   └── WING (South Wing - Standard Rooms)
└── OUTDOOR (Rooftop Pool)
```

### Example 2: Parking Structure

```
BUILDING (Parking Structure)
├── FLOOR (Level P1)
│   ├── SECTION (Section A - VIP)
│   └── SECTION (Section B - General)
└── FLOOR (Level P2)
    ├── SECTION (Section A - EV Charging)
    └── SECTION (Section B - Compact Cars)
```

### Example 3: Sports Complex

```
BUILDING (Sports Complex)
├── FLOOR (2nd Floor - Indoor Sports)
│   ├── AREA (Fitness Center)
│   └── ZONE (Aquatics Zone)
│       ├── AREA (Olympic Pool)
│       └── AREA (Kids Pool)
└── OUTDOOR (Tennis Courts)
    ├── SECTION (Court 1 - Clay)
    ├── SECTION (Court 2 - Clay)
    └── SECTION (Court 3 - Hardcourt)
```

### Example 4: Resort with Blocks

```
BUILDING (Main Resort Building)
├── FLOOR (Ground Floor)
└── FLOOR (2nd Floor)

BLOCK (Villa Block A)
├── SECTION (Villas 1-5)
└── SECTION (Villas 6-10)

OUTDOOR (Beach Area)
└── ZONE (Water Sports Zone)
```

---

## 💡 Decision Guide

Ask yourself:

1. **Is it a standalone structure?** → Use `BUILDING`
2. **Is it a level within a building?** → Use `FLOOR`
3. **Does it span multiple floors?** → Use `WING` or `ZONE`
4. **Is it defined by function/purpose?** → Use `AREA` or `ZONE`
5. **Is it about security/access control?** → Use `ZONE`
6. **Is it a numbered/lettered subdivision?** → Use `SECTION`
7. **Is it a semi-independent building in a complex?** → Use `BLOCK`
8. **Is it open-air/outdoors?** → Use `OUTDOOR`
9. **Doesn't fit anywhere?** → Use `OTHER`

---

## 📊 Comparison Table

| Type | Typical Parent | Spans Floors? | Access Control? | Indoor/Outdoor | Example |
|------|---------------|---------------|-----------------|----------------|---------|
| BUILDING | None (root) | N/A | No | Both | Hotel Main Tower |
| FLOOR | BUILDING | No | No | Indoor | 15th Floor |
| WING | BUILDING/FLOOR | Yes | Sometimes | Indoor | North Wing (Floors 10-25) |
| AREA | FLOOR/WING | No | Sometimes | Indoor | Main Lobby |
| ZONE | BUILDING/FLOOR/WING | Sometimes | Yes | Both | VIP Executive Zone |
| SECTION | FLOOR/AREA/ZONE | No | No | Both | Parking Section A |
| BLOCK | BUILDING/None | N/A | Sometimes | Both | Villa Block A |
| OUTDOOR | Any/None | No | Sometimes | Outdoor | Tennis Courts |
| OTHER | Any | Varies | Varies | Both | Pop-up Event Space |

---

## 🎯 Best Practices

### 1. Keep Hierarchy Logical
- Parent-child relationships should make spatial sense
- Don't skip logical levels unnecessarily
- Use `path` field to show full hierarchy

### 2. Use Appropriate Metadata
- Each locationType has specific metadata schemas
- Include relevant operational data (capacity, hours, access)
- Add safety information (exits, fire equipment)

### 3. Consider Operations
- Think about how staff will use the locations
- Include booking/reservation relevant data
- Add maintenance and scheduling information

### 4. Plan for Scalability
- Design hierarchy to accommodate future expansion
- Use consistent naming conventions
- Document location codes and identifiers

### 5. Security & Access
- Use `ZONE` for access-controlled areas
- Include security level in metadata
- Document access requirements

---

## 📝 API Examples

### Creating a Building
```bash
POST /api/location
{
  "name": "Grand Hotel Main Tower",
  "locationType": "BUILDING",
  "organizationId": "507f1f77bcf86cd799439012",
  "address": "123 Main St",
  "city": "Manila",
  "country": "PH",
  "metadata": {
    "buildingType": "MAIN",
    "totalFloors": 25
  }
}
```

### Creating a Child Floor
```bash
POST /api/location
{
  "name": "15th Floor",
  "locationType": "FLOOR",
  "parentLocationId": "693a5db0ea257d76232e0a87",
  "organizationId": "507f1f77bcf86cd799439012",
  "metadata": {
    "floorNumber": 15,
    "roomCount": 32
  }
}
```

### Querying by Type
```bash
# Get all buildings
GET /api/location?filter=locationType:BUILDING&document=true

# Get all floors of a specific building
GET /api/location?filter=parentLocationId:693a5db0ea257d76232e0a87,locationType:FLOOR&document=true

# Get all outdoor spaces
GET /api/location?filter=locationType:OUTDOOR&document=true
```

---

## 🔗 Related Documentation

- [Location API Reference](./LOCATION_API_REFERENCE.md)
- [Location Metadata Schemas](./LOCATION_METADATA_GUIDE.md)
- [Facility Type Documentation](./FACILITY_TYPE_DOCS_INDEX.md)

---

This structure gives you maximum flexibility to model any hospitality or commercial property! 🏨🏢🏊‍♂️

