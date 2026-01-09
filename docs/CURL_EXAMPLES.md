# cURL Examples for FacilityType and Facility

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require Bearer token authentication:

```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## FacilityType Endpoints

### 1. Create FacilityType (ROOM - GUEST_ROOM)

```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Deluxe King Room",
    "code": "DLX-KING",
    "description": "Spacious deluxe room with king bed",
    "spaceType": "ROOM",
    "subtype": "GUEST_ROOM",
    "organizationId": "507f1f77bcf86cd799439011",
    "rateTypeId": "507f1f77bcf86cd799439020"
  }'
```

### 2. Create FacilityType (ROOM - CONFERENCE_ROOM)

```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Executive Boardroom",
    "code": "BRD-001",
    "description": "Premium boardroom for executive meetings",
    "spaceType": "ROOM",
    "subtype": "CONFERENCE_ROOM",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

### 3. Create FacilityType (COURT - TENNIS)

```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Indoor Tennis Court",
    "code": "TENNIS-IN",
    "description": "Professional indoor tennis court",
    "spaceType": "COURT",
    "subtype": "TENNIS",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

### 4. Create FacilityType (DINING - FINE_DINING)

```bash
curl -X POST http://localhost:3000/api/facilityType \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Coastal Fine Dining",
    "code": "DINE-FINE",
    "description": "Upscale fine dining restaurant",
    "spaceType": "DINING",
    "subtype": "FINE_DINING",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

---

## Facility Endpoints

### 1. Create Facility (GUEST_ROOM with Metadata)

**Note:** Metadata is now stored on Facility, not FacilityType. The metadata must match the spaceType/subtype of the referenced FacilityType.

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 2. Create Facility (CONFERENCE_ROOM with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 3. Create Facility (SUITE with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 4. Create Facility (TENNIS COURT with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
      "equipmentProvided": ["Balls", "Net"],
      "openingHours": "6:00 AM - 11:00 PM",
      "courtSize": "Standard"
    }
  }'
```

### 5. Create Facility (DINING - FINE_DINING with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 6. Create Facility (FITNESS - WEIGHT_ROOM with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 7. Create Facility (PARKING - GARAGE with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 8. Create Facility (AMENITY - SWIMMING_POOL with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 9. Create Facility (OUTDOOR with Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
  }'
```

### 10. Create Facility with Images (Multipart Form Data)

**Note:** Images are uploaded using multipart/form-data. You can upload multiple image types in a single request.

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "facilityTypeId=507f1f77bcf86cd799439011" \
  -F "identifier=Room 101" \
  -F "displayName=Deluxe Ocean View Suite" \
  -F "organizationId=507f1f77bcf86cd799439011" \
  -F "locationId=507f1f77bcf86cd799439025" \
  -F "status=AVAILABLE" \
  -F 'metadata={"bedType":"KING_BED","bedCount":1,"maxOccupancy":2,"amenities":["ROOM_SERVICE"],"roomFeatures":["WIFI","OCEAN_VIEW"]}' \
  -F "coverImages=@/path/to/cover.jpg" \
  -F "featuredImages=@/path/to/featured1.jpg" \
  -F "galleryImages=@/path/to/gallery1.jpg" \
  -F "galleryImages=@/path/to/gallery2.jpg" \
  -F "thumbnailImages=@/path/to/thumbnail.jpg" \
  -F "interiorImages=@/path/to/interior1.jpg" \
  -F "exteriorImages=@/path/to/exterior1.jpg"
```

**Supported Image Field Types:**

- `coverImages` - Main cover/hero image (max 3)
- `featuredImages` - Featured images (max 5)
- `galleryImages` - Gallery images (max 10)
- `thumbnailImages` - Thumbnail/preview images (max 3)
- `floorPlanImages` - Floor plan/layout images (max 5)
- `exteriorImages` - Exterior view images (max 5)
- `interiorImages` - Interior view images (max 5)
- `amenityImages` - Amenity-specific images (max 5)
- `images` - Generic images (fallback, tagged as GALLERY, max 10)

### 11. Update Facility with Images (Add New Images)

**Note:** This adds new images to existing ones. Existing images are preserved unless explicitly removed.

```bash
curl -X PATCH http://localhost:3000/api/facility/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "displayName=Updated Deluxe Suite" \
  -F "coverImages=@/path/to/new-cover.jpg" \
  -F "galleryImages=@/path/to/new-gallery1.jpg" \
  -F "galleryImages=@/path/to/new-gallery2.jpg"
```

### 12. Update Facility Images (Replace All Images)

**Note:** To replace all images, send the complete images array as JSON. Images not in this list will be deleted from Cloudinary.

```bash
curl -X PATCH http://localhost:3000/api/facility/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "images": [
      {
        "name": "cover-image",
        "url": "https://cloudinary.com/image1.jpg",
        "type": "COVER"
      },
      {
        "name": "gallery-image-1",
        "url": "https://cloudinary.com/image2.jpg",
        "type": "GALLERY"
      }
    ]
  }'
```

### 13. Update Facility with Images and Metadata (Multipart Form Data)

```bash
curl -X PATCH http://localhost:3000/api/facility/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "displayName=Premium Ocean View Suite" \
  -F 'metadata={"bedType":"KING_BED","bedCount":1,"maxOccupancy":2,"roomSize":50,"hasBalcony":true}' \
  -F "coverImages=@/path/to/new-cover.jpg" \
  -F "galleryImages=@/path/to/gallery3.jpg" \
  -F "interiorImages=@/path/to/interior2.jpg"
```

### 14. Create Facility (Minimal - No Metadata)

```bash
curl -X POST http://localhost:3000/api/facility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "facilityTypeId": "507f1f77bcf86cd799439011",
    "identifier": "Room 102",
    "organizationId": "507f1f77bcf86cd799439011",
    "status": "AVAILABLE"
  }'
```

---

## Important Notes

### FacilityType

- **No metadata field**: Metadata has been removed from FacilityType
- **No images field**: Images have been removed from FacilityType (images are now on Facility instances)
- **Required fields**: `name`, `spaceType`, `organizationId`
- **Optional fields**: `code`, `description`, `subtype`, `rateTypeId`, `path`

### Facility

- **Metadata is required**: When creating a Facility, if you provide `metadata`, it must match the `spaceType` and `subtype` of the referenced `facilityTypeId`
- **Images**: Images are stored on Facility instances, not on FacilityType templates
- **Required fields**: `facilityTypeId`, `identifier`, `organizationId`
- **Optional fields**: `displayName`, `locationId`, `attributes`, `metadata`, `images`, `status` (defaults to "AVAILABLE")
- **Metadata validation**: The metadata will be validated based on the FacilityType's spaceType and subtype
- **Image upload**: Use multipart/form-data for image uploads. Multiple image types can be uploaded in a single request
- **Image update**: When updating images:
    - Adding new images: Upload files via multipart/form-data - they will be added to existing images
    - Replacing all images: Send complete `images` array as JSON - images not in the list will be deleted
    - Images are automatically uploaded to Cloudinary and organized by organizationId and image type

### Metadata Requirements by Type

#### GUEST_ROOM (ROOM)

- **Required**: `bedType`, `bedCount`, `maxOccupancy`
- **Optional**: `amenities`, `roomFeatures`, `floorNumber`, `roomSize`, `hasBalcony`, `hasKitchen`

#### CONFERENCE_ROOM (ROOM)

- **Required**: `seatingCapacity`
- **Optional**: `hasProjector`, `hasWhiteboard`, `hasVideoConferencing`, `hasAudioSystem`, `layout`, `equipment`, `roomSize`, `hasNaturalLight`

#### SUITE (ROOM)

- **Required**: `bedType`, `bedCount`, `maxOccupancy`, `numberOfRooms`
- **Optional**: `amenities`, `roomFeatures`, `roomSize`, `hasLivingRoom`, `hasKitchen`, `hasDiningArea`

#### TENNIS COURT (COURT)

- **Required**: `sportType`
- **Optional**: `surfaceType`, `isIndoor`, `hasLighting`, `maxPlayers`, `equipmentProvided`, `openingHours`, `courtSize`

#### FINE_DINING (DINING)

- **Required**: None
- **Optional**: `cuisineType`, `seatingCapacity`, `hasDelivery`, `hasTakeout`, `openingHours`, `menuUrl`, `avgMealPrice`, `dressCode`, `hasOutdoorSeating`, `hasPrivateDining`

#### WEIGHT_ROOM (FITNESS)

- **Required**: None
- **Optional**: `equipment`, `hasTrainer`, `hasLockers`, `hasShowers`, `openingHours`, `capacity`, `specialtyArea`, `classesOffered`

#### GARAGE (PARKING)

- **Required**: None
- **Optional**: `vehicleType`, `isUnderground`, `isCovered`, `hasElectricCharging`, `chargingType`, `maxVehicleHeight`, `maxVehicleWidth`, `securityLevel`, `hasCCTV`, `isAccessControlled`

#### SWIMMING_POOL (AMENITY)

- **Required**: `amenityType`
- **Optional**: `capacity`, `requiresReservation`, `openingHours`, `ageRestriction`, `additionalFees`, `equipment`, `features`, `hasSupervision`

#### OUTDOOR

- **Required**: `outdoorType`
- **Optional**: `capacity`, `area`, `hasSeating`, `hasShade`, `hasLighting`, `features`, `requiresReservation`, `openingHours`

---

## Response Format

### Success Response (201 Created - Facility)

```json
{
	"status": "success",
	"message": "Facility created successfully",
	"data": {
		"id": "507f1f77bcf86cd799439011",
		"facilityTypeId": "507f1f77bcf86cd799439011",
		"identifier": "Room 101",
		"displayName": "Deluxe Ocean View Suite",
		"organizationId": "507f1f77bcf86cd799439011",
		"locationId": "507f1f77bcf86cd799439025",
		"status": "AVAILABLE",
		"images": [
			{
				"name": "cover-image",
				"url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/facilities/org123/cover/cover.jpg",
				"type": "COVER"
			},
			{
				"name": "gallery-image-1",
				"url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/facilities/org123/gallery/gallery1.jpg",
				"type": "GALLERY"
			}
		],
		"metadata": {
			"bedType": "KING_BED",
			"bedCount": 1,
			"maxOccupancy": 2
		},
		"createdAt": "2025-12-22T02:35:13.963Z",
		"updatedAt": "2025-12-22T02:35:13.963Z"
	},
	"code": 201,
	"timestamp": "2025-12-22T02:35:14.744Z"
}
```

### Success Response (200 Updated - Facility with Images)

```json
{
	"status": "success",
	"message": "Facility updated successfully",
	"data": {
		"facility": {
			"id": "507f1f77bcf86cd799439011",
			"identifier": "Room 101",
			"displayName": "Updated Deluxe Suite",
			"images": [
				{
					"name": "existing-image",
					"url": "https://cloudinary.com/existing.jpg",
					"type": "COVER"
				},
				{
					"name": "new-cover",
					"url": "https://cloudinary.com/new-cover.jpg",
					"type": "COVER"
				}
			]
		},
		"uploadedImages": {
			"count": 2,
			"images": [
				{
					"name": "new-cover",
					"url": "https://cloudinary.com/new-cover.jpg",
					"type": "COVER"
				},
				{
					"name": "new-gallery",
					"url": "https://cloudinary.com/new-gallery.jpg",
					"type": "GALLERY"
				}
			]
		},
		"deletedImages": {
			"count": 1,
			"publicIds": ["facilities/org123/gallery/old-image"]
		}
	},
	"code": 200,
	"timestamp": "2025-12-22T02:40:15.123Z"
}
```

### Success Response (201 Created - FacilityType)

```json
{
  "status": "success",
  "message": "FacilityType created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Deluxe King Room",
    "spaceType": "ROOM",
    "subtype": "GUEST_ROOM",
    ...
  }
}
```

### Error Response (400 Bad Request)

```json
{
	"status": "error",
	"message": "Validation failed",
	"errors": [
		{
			"field": "metadata",
			"message": "Metadata validation failed for spaceType=\"ROOM\" and subtype=\"GUEST_ROOM\". Required fields: bedType, bedCount, maxOccupancy..."
		}
	]
}
```

### Error Response (500 Image Upload Failed)

```json
{
	"status": "error",
	"message": "Failed to upload images",
	"errors": [
		{
			"field": "images",
			"message": "Cloudinary upload error: Invalid image format"
		}
	]
}
```
