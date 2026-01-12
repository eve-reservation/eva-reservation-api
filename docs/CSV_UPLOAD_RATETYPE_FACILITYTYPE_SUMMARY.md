# CSV Upload Implementation Summary - RateType & FacilityType

## Overview

CSV upload functionality has been successfully added to both **RateType** and **FacilityType** endpoints, allowing bulk creation of rate types and facility types through CSV file uploads.

## Implemented Endpoints

### 1. RateType CSV Upload
- **Endpoint**: `POST /api/RateType/upload-csv`
- **Purpose**: Bulk import pricing structures
- **Controller**: `app/RateType/RateType.controller.ts`
- **Router**: `app/RateType/RateType.router.ts`

### 2. FacilityType CSV Upload
- **Endpoint**: `POST /api/facilityType/upload-csv`
- **Purpose**: Bulk import facility templates
- **Controller**: `app/facilityType/facilityType.controller.ts`
- **Router**: `app/facilityType/facilityType.router.ts`

## Implementation Details

### RateType CSV Upload

#### Required Fields:
- `name` - Rate type name
- `organizationId` - Organization identifier
- `baseRate` - Base rate amount

#### Optional Fields:
- `description` - Rate type description
- `currency` - Currency code (defaults to PHP)
- `rateUnit` - Rate unit enum (HOURLY, DAILY, WEEKLY, MONTHLY, PER_SESSION, PER_PERSON, FLAT_RATE)
- `serviceFee` - Additional service fee
- `tax` - Tax percentage or amount
- `adjustments` - JSON string for seasonal/time-based adjustments
- `isActive` - Boolean (defaults to true)

#### Features:
- Validates numeric fields (baseRate, serviceFee, tax)
- Parses and validates JSON adjustments
- Validates rateUnit enum values
- Activity logging for each created rate type
- Cache invalidation

### FacilityType CSV Upload

#### Required Fields:
- `name` - Facility type name

#### Optional Fields:
- `organizationId` - Organization identifier (MongoDB ObjectId)
- `rateTypeId` - Rate type identifier (MongoDB ObjectId)

#### Features:
- Validates ObjectId formats
- Verifies rateType exists if provided
- Creates proper Prisma relations
- Removes legacy images field from response
- Activity logging for each created facility type
- Cache invalidation

## Common Features (Both Endpoints)

1. **File Validation**:
   - CSV format only
   - 50MB size limit
   - UTF-8 encoding
   - First row must be headers

2. **Row-by-Row Validation**:
   - Each row validated against Zod schemas
   - Validation errors returned with row numbers
   - Partial success supported

3. **Error Handling**:
   - Validation errors (400)
   - Partial success (207)
   - Server errors (500)
   - Detailed error messages

4. **Activity Logging**:
   - Each created record logged
   - Includes user ID and timestamp
   - Special "via CSV" notation

5. **Cache Management**:
   - Automatic cache invalidation after import
   - Patterns: `cache:RateType:list:*` and `cache:facilityType:list:*`

## Documentation

### Comprehensive Guides:
1. **`docs/RATETYPE_CSV_UPLOAD.md`** - Complete RateType CSV guide
   - CSV format specifications
   - Field descriptions and requirements
   - Enum values reference
   - Response format examples
   - Testing instructions
   - Troubleshooting guide

2. **`docs/FACILITYTYPE_CSV_UPLOAD.md`** - Complete FacilityType CSV guide
   - CSV format specifications
   - ObjectId validation
   - Use cases and examples
   - Integration with facility creation
   - Best practices

3. **`docs/CSV_UPLOAD_COMPLETE_GUIDE.md`** - Master guide covering all three CSV upload endpoints
   - Quick reference table
   - Implementation workflow
   - Common best practices
   - Field type reference

### CSV Templates:
1. **`examples/ratetype-upload-template.csv`** - RateType import template with sample data
2. **`examples/facilitytype-upload-template.csv`** - FacilityType import template with sample data

## Testing Results

✅ **Linting**: No errors  
✅ **TypeScript Compilation**: Successful  
✅ **Build**: Successful  
✅ **Code Quality**: All files pass ESLint checks  

## Usage Examples

### RateType CSV Upload

```bash
curl -X POST http://localhost:3000/api/RateType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@ratetype-upload-template.csv"
```

**Sample CSV**:
```csv
name,description,organizationId,baseRate,currency,rateUnit,serviceFee,tax,isActive
Hourly Rate,Standard hourly rate,org-001,100.00,PHP,HOURLY,10.00,12.00,true
Daily Rate,Standard daily rate,org-001,800.00,PHP,DAILY,80.00,12.00,true
```

### FacilityType CSV Upload

```bash
curl -X POST http://localhost:3000/api/facilityType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facilitytype-upload-template.csv"
```

**Sample CSV**:
```csv
name,organizationId,rateTypeId
Guest Room Template,507f1f77bcf86cd799439011,507f1f77bcf86cd799439021
Conference Room Template,507f1f77bcf86cd799439011,507f1f77bcf86cd799439024
```

## Response Format

### Success (201)
```json
{
  "success": true,
  "message": "All rate types created successfully from CSV",
  "statusCode": 201,
  "data": {
    "summary": {
      "totalRows": 3,
      "successful": 3,
      "failed": 0
    },
    "createdRateTypes": [...]
  }
}
```

### Partial Success (207)
```json
{
  "success": true,
  "message": "CSV import completed with 1 error(s)",
  "statusCode": 207,
  "data": {
    "summary": {
      "totalRows": 3,
      "successful": 2,
      "failed": 1
    },
    "createdRateTypes": [...],
    "errors": [
      {
        "name": "Invalid Rate",
        "error": "baseRate must be a positive number"
      }
    ]
  }
}
```

## Files Modified/Created

### Modified Files:
1. `app/RateType/RateType.controller.ts` - Added `uploadCSV` method
2. `app/RateType/RateType.router.ts` - Added CSV upload route
3. `app/facilityType/facilityType.controller.ts` - Added `uploadCSV` method
4. `app/facilityType/facilityType.router.ts` - Added CSV upload route

### Created Files:
1. `docs/RATETYPE_CSV_UPLOAD.md` - RateType CSV documentation
2. `docs/FACILITYTYPE_CSV_UPLOAD.md` - FacilityType CSV documentation
3. `docs/CSV_UPLOAD_COMPLETE_GUIDE.md` - Master CSV guide
4. `docs/CSV_UPLOAD_RATETYPE_FACILITYTYPE_SUMMARY.md` - This file
5. `examples/ratetype-upload-template.csv` - RateType template
6. `examples/facilitytype-upload-template.csv` - FacilityType template

## Integration Workflow

### Recommended Import Order:

```
1. RateType (pricing structures)
   └─ Import via /api/RateType/upload-csv
   
2. FacilityType (facility templates) - optionally reference RateTypes
   └─ Import via /api/facilityType/upload-csv
   
3. Facility (actual facility instances) - reference FacilityTypes
   └─ Import via /api/facility/upload-csv
```

### Example Complete Workflow:

```bash
# Step 1: Import rate types
curl -X POST http://localhost:3000/api/RateType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@rate-types.csv"
# Note the created rate type IDs from response

# Step 2: Import facility types (use rate type IDs from step 1)
curl -X POST http://localhost:3000/api/facilityType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facility-types.csv"
# Note the created facility type IDs from response

# Step 3: Import facilities (use facility type IDs from step 2)
curl -X POST http://localhost:3000/api/facility/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facilities.csv"
```

## Key Features Comparison

| Feature | Facility | RateType | FacilityType |
|---------|----------|----------|--------------|
| Required Fields | 2 (facilityTypeId, identifier) | 3 (name, organizationId, baseRate) | 1 (name) |
| Complex Validation | ✅ Metadata by spaceType/subtype | ✅ Numeric fields, enum | ✅ ObjectId, references |
| JSON Fields | ✅ attributes, metadata | ✅ adjustments | ❌ |
| Reference Validation | ✅ facilityTypeId, rateTypeId | ❌ | ✅ rateTypeId (optional) |
| Image Handling | ✅ Multiple image types | ❌ | ❌ |

## OpenAPI Documentation

All endpoints are fully documented with OpenAPI specifications including:
- Request body schemas
- Response schemas  
- Response codes
- Error responses
- Example requests

## Security & Performance

1. **File Size Limits**: 50MB maximum
2. **Validation**: All data validated before database operations
3. **Transaction Safety**: Each row is created independently
4. **Cache Invalidation**: Automatic cache clearing after successful imports
5. **Activity Logging**: Complete audit trail for all imports
6. **Error Isolation**: Failed rows don't affect successful ones

## Best Practices

1. **Test with Small Files**: Start with 5-10 rows
2. **Validate Before Upload**: Check data format and required fields
3. **Keep ID References**: Document created IDs for subsequent imports
4. **Review Partial Failures**: Check error messages and fix issues
5. **Use Templates**: Start with provided template files

## Future Enhancements (Optional)

1. CSV template download endpoint
2. Dry-run validation endpoint (validate without creating)
3. Update existing records via CSV
4. CSV export functionality
5. Async processing for very large files
6. Progress tracking/webhooks

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.0.0  
**Dependencies**: csv-parser (already installed for Facility CSV upload)
