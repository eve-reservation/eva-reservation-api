# RateType CSV Upload Guide

## Overview

The RateType CSV upload feature allows you to bulk create multiple rate types by uploading a CSV file. This is useful for importing pricing structures efficiently.

## Endpoint

```
POST /api/RateType/upload-csv
```

**Content-Type**: `multipart/form-data`

**Required Field**: `file` (CSV file)

## CSV Format

### Required Columns

| Column Name      | Type   | Required | Description                       | Example           |
| ---------------- | ------ | -------- | --------------------------------- | ----------------- |
| name             | String | Yes      | Rate type name                    | Hourly Rate       |
| organizationId   | String | Yes      | Organization identifier           | org-001           |
| baseRate         | Number | Yes      | Base rate amount                  | 100.00            |

### Optional Columns

| Column Name      | Type   | Required | Description                       | Example           |
| ---------------- | ------ | -------- | --------------------------------- | ----------------- |
| description      | String | No       | Rate type description             | Standard hourly   |
| currency         | String | No       | Currency code (defaults to PHP)   | PHP               |
| rateUnit         | Enum   | No       | Rate unit type (see below)        | HOURLY            |
| serviceFee       | Number | No       | Additional service fee            | 10.00             |
| tax              | Number | No       | Tax percentage or amount          | 12.00             |
| adjustments      | JSON   | No       | Seasonal/time-based adjustments   | {"peak":150}      |
| isActive         | Boolean| No       | Active status (defaults to true)  | true              |

## Rate Unit Enum

The `rateUnit` column accepts the following values:
- `HOURLY` - Per hour rate
- `DAILY` - Per day rate
- `WEEKLY` - Per week rate
- `MONTHLY` - Per month rate
- `PER_SESSION` - Per session rate
- `PER_PERSON` - Per person rate
- `FLAT_RATE` - Flat rate (one-time fee)

## CSV Template Examples

### Example 1: Basic Rate Types

```csv
name,organizationId,baseRate,description,currency,rateUnit,isActive
Hourly Rate,org-001,100.00,Standard hourly rate,PHP,HOURLY,true
Daily Rate,org-001,800.00,Standard daily rate,PHP,DAILY,true
Weekly Rate,org-001,5000.00,Weekly package rate,PHP,WEEKLY,true
Monthly Rate,org-001,20000.00,Monthly membership,PHP,MONTHLY,true
```

### Example 2: Rate Types with Service Fees and Tax

```csv
name,organizationId,baseRate,currency,rateUnit,serviceFee,tax,description,isActive
Premium Hourly,org-001,150.00,PHP,HOURLY,15.00,12.00,Premium hourly rate with service fee,true
Session Pass,org-001,500.00,PHP,PER_SESSION,50.00,12.00,Single session pass,true
Group Rate,org-001,1200.00,PHP,PER_PERSON,0,12.00,Per person group rate,true
Flat Fee,org-001,3000.00,PHP,FLAT_RATE,300.00,12.00,One-time flat fee,true
```

### Example 3: Rate Types with Adjustments

```csv
name,organizationId,baseRate,currency,rateUnit,adjustments,description
Peak Hourly,org-001,120.00,PHP,HOURLY,"{""weekendMultiplier"":1.5,""holidayMultiplier"":2.0}",Peak hour pricing
Off-Peak Hourly,org-001,80.00,PHP,HOURLY,"{""weekdayDiscount"":0.8}",Off-peak hour pricing
Seasonal Daily,org-001,900.00,PHP,DAILY,"{""summerRate"":1000,""winterRate"":800}",Seasonal daily rate
```

## Response Format

### Success Response (201)

All rate types created successfully:

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
    "createdRateTypes": [
      {
        "id": "507f1f77bcf86cd799439017",
        "name": "Hourly Rate",
        "organizationId": "org-001",
        "baseRate": 100,
        "currency": "PHP",
        "rateUnit": "HOURLY",
        "isActive": true,
        "createdAt": "2026-01-09T00:00:00.000Z",
        "updatedAt": "2026-01-09T00:00:00.000Z"
      }
      // ... more rate types
    ]
  }
}
```

### Partial Success Response (207)

Some rate types created, some failed:

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
    "createdRateTypes": [
      // Successfully created rate types
    ],
    "errors": [
      {
        "name": "Invalid Rate",
        "error": "Validation failed: baseRate must be a positive number"
      }
    ]
  }
}
```

### Validation Error Response (400)

CSV data validation failed:

```json
{
  "success": false,
  "message": "CSV validation failed for 2 row(s)",
  "statusCode": 400,
  "errors": [
    {
      "row": 2,
      "name": "Hourly Rate",
      "errors": [
        {
          "field": "baseRate",
          "message": "Expected number, received string"
        }
      ]
    },
    {
      "row": 3,
      "name": "Daily Rate",
      "errors": [
        {
          "field": "organizationId",
          "message": "organizationId is required"
        }
      ]
    }
  ]
}
```

## Important Notes

1. **CSV File Format**:
   - The first row must contain column headers
   - Use UTF-8 encoding
   - File size limit: 50MB
   - Only CSV files are accepted

2. **Numeric Fields**:
   - `baseRate`, `serviceFee`, and `tax` must be valid numbers
   - Do not include currency symbols or commas
   - Use decimal point (.) for decimal values

3. **JSON Fields**:
   - `adjustments` column must contain valid JSON
   - Use double quotes inside JSON strings
   - Escape quotes properly: `"{""key"":""value""}"`

4. **Boolean Fields**:
   - `isActive` accepts: `true`, `false`, `TRUE`, `FALSE`, `1`, `0`
   - Defaults to `true` if not provided

5. **Validation**:
   - Each row is validated before creation
   - If validation fails for any row, that row is skipped
   - Other valid rows will still be created
   - Detailed error messages are returned for failed rows

6. **Rate Unit**:
   - Must be one of the valid enum values (case-sensitive)
   - If not provided, rate unit will be null

## Testing

You can test the endpoint using curl:

```bash
curl -X POST http://localhost:3000/api/RateType/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@rate-types.csv"
```

Or using Postman:
1. Create a new POST request to `/api/RateType/upload-csv`
2. Go to Body tab
3. Select "form-data"
4. Add a key named "file" with type "File"
5. Choose your CSV file
6. Send the request

## Best Practices

1. **Start Small**: Test with a small CSV file (5-10 rows) first
2. **Validate Data**: Ensure all numeric values are properly formatted
3. **Valid JSON**: Test your JSON strings in a JSON validator before adding to CSV
4. **Consistent Naming**: Use a consistent naming convention for rate types
5. **Review Errors**: If some rows fail, review the error messages and fix the CSV before re-uploading

## Troubleshooting

### Common Issues

1. **"Only CSV files are allowed"**
   - Make sure your file has a .csv extension
   - Verify the file MIME type is text/csv

2. **"Invalid JSON in adjustments column"**
   - Check JSON syntax
   - Ensure quotes are properly escaped
   - Test JSON in an online validator

3. **"Expected number, received string"**
   - Remove currency symbols from numeric fields
   - Remove commas from numbers
   - Use decimal point (.) not comma (,)

4. **"organizationId is required"**
   - Ensure every row has an organizationId value
   - Check for empty cells in required columns

5. **"Invalid rate unit value"**
   - Ensure rateUnit matches one of the enum values exactly
   - Values are case-sensitive (use HOURLY not hourly)

## Examples

### Minimal CSV (Required Fields Only)

```csv
name,organizationId,baseRate
Basic Hourly,org-001,100
Basic Daily,org-001,800
Basic Weekly,org-001,5000
```

### Complete CSV (All Fields)

```csv
name,description,organizationId,baseRate,currency,rateUnit,serviceFee,tax,adjustments,isActive
Premium Hourly,Premium rate for peak hours,org-001,150.00,PHP,HOURLY,15.00,12.00,"{""peakMultiplier"":1.5}",true
Standard Daily,Standard daily rate,org-001,800.00,PHP,DAILY,80.00,12.00,,true
Group Session,Group session pricing,org-001,500.00,PHP,PER_SESSION,50.00,12.00,"{""minParticipants"":5}",true
Membership,Monthly membership fee,org-001,20000.00,PHP,MONTHLY,0,12.00,,true
```

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.0.0
