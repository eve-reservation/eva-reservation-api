# Database Entity Relationship Diagram (ERD)

This diagram shows the complete database structure and relationships between all entities in the EVA Reservation API.

```mermaid
erDiagram
    Person ||--o{ User : "has"
    Person ||--o{ Guest : "optionally linked"
    
    User {
        ObjectId id PK
        String organizationId
        ObjectId personId FK
        String userName
        String email UK
        String password
        Status status
        DateTime lastLogin
    }
    
    Person {
        ObjectId id PK
        String organizationId
        PersonalInfo personalInfo
        ContactInfo contactInfo
        Identification identification
        Metadata metadata
    }
    
    Location ||--o{ Location : "parent-child"
    Location ||--o{ Facility : "contains"
    
    Location {
        ObjectId id PK
        String name
        String code
        LocationType locationType
        ObjectId parentLocationId FK
        String organizationId
        String address
        Json metadata
    }
    
    FacilityType ||--o{ Facility : "defines"
    RateType ||--o{ Facility : "prices"
    
    FacilityType {
        ObjectId id PK
        String name
        String description
        SpaceType spaceType
        String subtype
        String organizationId
    }
    
    RateType {
        ObjectId id PK
        String name
        Float baseRate
        String currency
        RateUnit rateUnit
        String organizationId
        Float serviceFee
        Float tax
    }
    
    Facility ||--o{ Reservation : "booked via"
    
    Facility {
        ObjectId id PK
        ObjectId facilityTypeId FK
        ObjectId locationId FK
        ObjectId rateTypeId FK
        String identifier UK
        String displayName
        String organizationId
        SpaceType spaceType
        String subtype
        Json attributes
        Json metadata
        FacilityStatus status
    }
    
    Reservation ||--o{ Guest : "includes"
    Reservation ||--o| MatchEvent : "may have"
    
    Reservation {
        ObjectId id PK
        String organizationId
        ReservationUser user
        ObjectId facilityId FK
        ReservationStatus status
        Int guestCount
        String confirmationCode UK
        String reservationNumber UK
        Json addOns
        reservationPeriod bookingPeriod
        PricingBase pricingBase
        Charges charges
        Taxes taxes
        Discounts discounts
        Totals totals
    }
    
    Guest {
        ObjectId id PK
        String organizationId
        ObjectId reservationId FK
        ObjectId personId FK
        String firstName
        String lastName
        String email
        String phone
        Boolean isPrimaryGuest
    }
    
    MatchEvent ||--o{ MatchParticipant : "has"
    
    MatchEvent {
        ObjectId id PK
        ObjectId reservationId FK UK
        String createdBy
        String organizationId
        String title
        String description
        Int maxParticipants
        Int minParticipants
        Boolean allowWaitlist
        MatchEventStatus status
        Boolean isPublic
        Boolean autoAccept
        String skillLevel
    }
    
    MatchParticipant {
        ObjectId id PK
        ObjectId matchEventId FK
        String userId
        String personId
        String guestId
        ParticipantStatus status
        DateTime joinedAt
        DateTime acceptedAt
        DateTime confirmedAt
    }
    
    Addon {
        ObjectId id PK
        String name
        String description
        String organizationId
        Float price
        String currency
        Boolean isActive
    }
    
    Template {
        ObjectId id PK
        String name
        String description
        String type
        String organizationId
    }
```

## Key Relationships

### Person & User System
- **Person** → **User**: One person can have multiple user accounts (1:N)
- **Person** → **Guest**: Guests can optionally link to Person records for full details (1:N)

### Location Hierarchy
- **Location** → **Location**: Self-referential for hierarchical structure (Building → Floor → Wing → Area)
- **Location** → **Facility**: Locations contain multiple facilities (1:N)

### Facility Configuration
- **FacilityType** → **Facility**: Template defines multiple facility instances (1:N)
- **RateType** → **Facility**: Pricing structure applied to multiple facilities (1:N)

### Reservation System
- **Facility** → **Reservation**: Each facility can have multiple reservations (1:N)
- **Reservation** → **Guest**: Each reservation can include multiple guests (1:N)
- **Reservation** → **MatchEvent**: Optional one-to-one relationship for social/sport events

### Match Event System
- **MatchEvent** → **MatchParticipant**: Each event has multiple participants (1:N)

### Standalone Entities
- **Addon**: Available add-ons for reservations (referenced via JSON in Reservation)
- **Template**: Reusable configuration templates for the system
