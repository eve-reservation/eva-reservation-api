# CSV Upload - Complete Implementation Guide

## Overview

CSV upload functionality has been implemented for three endpoints:
1. **Facility** (`/api/facility/upload-csv`)
2. **RateType** (`/api/RateType/upload-csv`)
3. **FacilityType** (`/api/facilityType/upload-csv`)

This allows bulk creation of records through CSV file uploads.

## Quick Reference

| Endpoint | Documentation | Template | Use Case |
|----------|--------------|----------|----------|
| `/api/facility/upload-csv` | [FACILITY_CSV_UPLOAD.md](FACILITY_CSV_UPLOAD.md) | [facility-upload-template.csv](../examples/facility-upload-template.csv) | Bulk import facility instances (rooms, courts, etc.) |
| `/api/RateType/upload-csv` | [RATETYPE_CSV_UPLOAD.md](RATETYPE_CSV_UPLOAD.md) | [ratetype-upload-template.csv](../examples/ratetype-upload-template.csv) | Bulk import pricing structures |
| `/api/facilityType/upload-csv` | [FACILITYTYPE_CSV_UPLOAD.md](FACILITYTYPE_CSV_UPLOAD.md) | [facilitytype-upload-template.csv](../examples/facilitytype-upload-template.csv) | Bulk import facility templates |

## Common Features

All three CSV upload endpoints share these features:

### 1. File Requirements
- **File Type**: CSV only (`.csv` extension)
- **File Size**: Maximum 50MB
- **Encoding**: UTF-8
- **Format**: First row must contain headers

### 2. Response Codes
- **201**: All records created successfully
- **207**: Partial success (some created, some failed)
- **400**: Validation errors or empty CSV
- **500**: Server error

### 3. Validation
- Row-by-row validation with detailed error messages
- Partial success supported (continues even if some rows fail)
- Error responses include row numbers and specific field errors

### 4. Activity Logging
- Each created record is logged for audit purposes
- Includes user ID, action, and timestamp

### 5. Cache Invalidation
- Automatically invalidates relevant caches after import

## Implementation Order Recommendation

For a complete setup, import in this order:

```
1. RateType (pricing structures)
   ↓
2. FacilityType (facility templates) - optionally link to RateTypes
   ↓
3. Facility (actual facility instances) - link to FacilityTypes and RateTypes
```

### Example Workflow

```bash
# Step 1: Import rate types
curl -X POST http://localhost:3000/api/RateType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@rate-types.csv"

# Step 2: Import facility types (use rate type IDs from step 1)
curl -X POST http://localhost:3000/api/facilityType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facility-types.csv"

# Step 3: Import facilities (use facility type IDs from step 2)
curl -X POST http://localhost:3000/api/facility/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@facilities.csv"
```

## Testing with Postman

### Create a Collection

1. **Import RateTypes**:
   - Method: POST
   - URL: `{{baseUrl}}/api/RateType/upload-csv`
   - Body: form-data
   - Key: `file` (type: File)
   - Value: Select `ratetype-upload-template.csv`

2. **Import FacilityTypes**:
   - Method: POST
   - URL: `{{baseUrl}}/api/facilityType/upload-csv`
   - Body: form-data
   - Key: `file` (type: File)
   - Value: Select `facilitytype-upload-template.csv`

3. **Import Facilities**:
   - Method: POST
   - URL: `{{baseUrl}}/api/facility/upload-csv`
   - Body: form-data
   - Key: `file` (type: File)
   - Value: Select `facility-upload-template.csv`

## Common CSV Best Practices

### 1. Start Small
Test with 5-10 rows before importing hundreds of records.

### 2. Validate Data
- Check for required fields
- Verify IDs exist in the database
- Test JSON syntax for complex fields

### 3. Handle Errors Gracefully
- Review error messages carefully
- Fix errors in the CSV file
- Re-upload only the failed rows

### 4. Use Consistent Naming
- Use a naming convention (e.g., `Room-101`, `Court-T1`)
- Be consistent across all CSVs

### 5. Document Your IDs
Keep a reference of created IDs for use in subsequent imports:

```markdown
## Created IDs Reference

### Rate Types
- Hourly Rate: 507f1f77bcf86cd799439021
- Daily Rate: 507f1f77bcf86cd799439022

### Facility Types
- Guest Room: 507f1f77bcf86cd799439031
- Tennis Court: 507f1f77bcf86cd799439032
```

## Error Handling Guide

### Validation Errors (400)
**Cause**: Data doesn't match schema requirements

**Solutions**:
- Check required fields are present
- Verify data types (numbers, strings, booleans)
- Validate ObjectId formats
- Test JSON syntax

### Partial Success (207)
**Cause**: Some rows valid, some invalid

**What to do**:
- Review the `errors` array in response
- Fix only the failed rows
- Re-upload the corrected data

### Server Error (500)
**Cause**: Database or server issue

**What to do**:
- Check server logs
- Verify database connection
- Try again later if temporary issue

## Field Type Reference

### String Fields
- Must be text
- Check for minimum/maximum length requirements
- Example: `"Guest Room"`

### Number Fields
- Must be numeric (no currency symbols or commas)
- Use decimal point (.) for decimals
- Example: `100.00`, `12`, `1500.50`

### Boolean Fields
- Accepts: `true`, `false`, `TRUE`, `FALSE`, `1`, `0`
- Example: `true`

### ObjectId Fields
- Must be 24 hexadecimal characters
- Example: `507f1f77bcf86cd799439011`

### JSON Fields
- Must be valid JSON
- Use double quotes for property names and string values
- Escape quotes in CSV: `"{""key"":""value""}"`
- Example: `"{""bedType"":""KING"",""count"":1}"`

### Enum Fields
- Must match exactly (case-sensitive)
- See documentation for valid values
- Example: `HOURLY`, `ROOM`, `AVAILABLE`

## Advanced Features

### Facility CSV - Metadata Validation
The facility CSV upload includes metadata validation based on `spaceType` and `subtype`:

```csv
facilityTypeId,identifier,spaceType,subtype,metadata
507f...,Room-101,ROOM,GUEST_ROOM,"{""bedType"":""KING"",""bedCount"":1}"
507f...,Court-T1,COURT,TENNIS,"{""surfaceType"":""Hard Court""}"
```

Metadata is automatically validated against the appropriate schema.

### RateType CSV - Adjustments
Rate types support seasonal or time-based adjustments:

```csv
name,baseRate,adjustments
Peak Hours,150,"{""weekendMultiplier"":1.5,""holidayMultiplier"":2.0}"
```

## Files Reference

### Documentation Files
- `docs/FACILITY_CSV_UPLOAD.md` - Comprehensive facility CSV guide
- `docs/RATETYPE_CSV_UPLOAD.md` - Rate type CSV guide
- `docs/FACILITYTYPE_CSV_UPLOAD.md` - Facility type CSV guide
- `docs/CSV_UPLOAD_IMPLEMENTATION.md` - Technical implementation for facilities
- `docs/CSV_UPLOAD_COMPLETE_GUIDE.md` - This file

### Template Files
- `examples/facility-upload-template.csv` - Facility import template
- `examples/ratetype-upload-template.csv` - Rate type import template
- `examples/facilitytype-upload-template.csv` - Facility type import template

### Controller Files
- `app/facility/facility.controller.ts` - Facility controller with CSV upload
- `app/RateType/RateType.controller.ts` - Rate type controller with CSV upload
- `app/facilityType/facilityType.controller.ts` - Facility type controller with CSV upload

### Router Files
- `app/facility/facility.router.ts` - Facility routes including CSV upload
- `app/RateType/RateType.router.ts` - Rate type routes including CSV upload
- `app/facilityType/facilityType.router.ts` - Facility type routes including CSV upload

## Support

For issues or questions:
1. Check the specific endpoint documentation
2. Review the CSV template files
3. Test with small sample files
4. Check server logs for detailed error messages

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.0.0
