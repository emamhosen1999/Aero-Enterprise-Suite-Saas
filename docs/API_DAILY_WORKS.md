# Daily Works API Documentation

## Overview
The Daily Works module provides RESTful API endpoints for managing construction daily work entries, including RFI (Request for Inspection) tracking, work assignments, and inspection results.

## Base URL
All endpoints are prefixed with the application's base URL.

## Authentication
All endpoints require authentication via Laravel Sanctum or session-based authentication.

## Permissions
- `daily-works.view` - View daily works
- `daily-works.create` - Create new daily works
- `daily-works.update` - Update existing daily works
- `daily-works.delete` - Delete daily works
- `daily-works.import` - Import daily works from Excel
- `daily-works.export` - Export daily works to Excel/PDF

---

## Endpoints

### 1. Get Daily Works Page
**GET** `/daily-works`

Returns the main Daily Works page with initial data.

**Permissions:** `daily-works.view`

**Response:**
```json
{
  "title": "Daily Works",
  "allInCharges": [...],
  "juniors": [...],
  "reports": [...],
  "jurisdictions": [...],
  "users": [...]
}
```

---

### 2. Get Paginated Daily Works
**GET** `/daily-works-paginate`

Fetches paginated daily works data with filtering and sorting.

**Permissions:** `daily-works.view`

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `perPage` (integer, optional) - Items per page (default: 15)
- `search` (string, optional) - Search term
- `status` (string, optional) - Filter by status (new, in-progress, completed, rejected, resubmission, pending)
- `type` (string, optional) - Filter by type (Embankment, Structure, Pavement)
- `incharge` (integer, optional) - Filter by incharge user ID
- `assigned` (integer, optional) - Filter by assigned user ID
- `date_from` (date, optional) - Filter by start date
- `date_to` (date, optional) - Filter by end date

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-11-26",
      "number": "S2025-1126-001",
      "status": "new",
      "inspection_result": null,
      "type": "Structure",
      "description": "Bridge foundation work",
      "location": "K05+560-K05+660",
      "side": "Both",
      "qty_layer": "100 MT",
      "planned_time": "2025-11-26 08:00:00",
      "incharge": 5,
      "assigned": 12,
      "completion_time": null,
      "inspection_details": null,
      "resubmission_count": 0,
      "resubmission_date": null,
      "rfi_submission_date": "2025-11-26",
      "created_at": "2025-11-26T10:00:00.000000Z",
      "updated_at": "2025-11-26T10:00:00.000000Z",
      "deleted_at": null,
      "inchargeUser": {...},
      "assignedUser": {...},
      "reports": [...]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  }
}
```

---

### 3. Get All Daily Works
**GET** `/daily-works-all`

Fetches all daily works without pagination (for exports/reports).

**Permissions:** `daily-works.view`

**Query Parameters:** Same as paginated endpoint

---

### 4. Create Daily Work
**POST** `/add-daily-work`

Creates a new daily work entry.

**Permissions:** `daily-works.create`

**Request Body:**
```json
{
  "date": "2025-11-26",
  "number": "S2025-1126-001",
  "time": "08:00",
  "status": "new",
  "inspection_result": null,
  "type": "Structure",
  "description": "Bridge foundation work",
  "location": "K05+560-K05+660",
  "side": "Both",
  "qty_layer": "100 MT",
  "completion_time": null,
  "inspection_details": null
}
```

**Validation Rules:**
- `date` - required, date
- `number` - required, string, must be unique
- `time` - required, string
- `status` - required, one of: new, in-progress, completed, rejected, resubmission, pending
- `inspection_result` - required when status is "completed", one of: pass, fail, conditional, pending, approved, rejected
- `type` - required, string
- `description` - required, string
- `location` - required, string, must start with 'K' and be in range K0-K48
- `side` - required, string
- `qty_layer` - required when type is "Embankment"
- `completion_time` - required when status is "completed"
- `inspection_details` - optional, string

**Response:**
```json
{
  "message": "Daily work added successfully",
  "dailyWork": {...}
}
```

---

### 5. Update Daily Work
**POST** `/update-daily-work`

Updates an existing daily work entry.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "date": "2025-11-26",
  "number": "S2025-1126-001",
  "planned_time": "08:00",
  "status": "completed",
  "inspection_result": "pass",
  "type": "Structure",
  "description": "Bridge foundation work - Updated",
  "location": "K05+560-K05+660",
  "side": "Both",
  "qty_layer": "100 MT",
  "completion_time": "2025-11-26 16:00:00",
  "inspection_details": "All checks passed"
}
```

**Response:**
```json
{
  "message": "Daily work updated successfully",
  "dailyWork": {...}
}
```

---

### 6. Delete Daily Work
**DELETE** `/delete-daily-work`

Soft deletes a daily work entry.

**Permissions:** `daily-works.delete`

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "message": "Daily work 'S2025-1126-001' deleted successfully",
  "deletedDailyWork": {
    "id": 1,
    "number": "S2025-1126-001",
    "description": "Bridge foundation work"
  }
}
```

---

### 7. Update Status
**POST** `/daily-works/status`

Updates the status of a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "status": "completed"
}
```

---

### 8. Update Completion Time
**POST** `/daily-works/completion-time`

Updates the completion time of a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "completion_time": "2025-11-26 16:00:00"
}
```

---

### 9. Update RFI Submission Time
**POST** `/daily-works/submission-time`

Updates the RFI submission date.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "rfi_submission_date": "2025-11-26"
}
```

---

### 10. Update Inspection Details
**POST** `/daily-works/inspection-details`

Updates inspection details and result.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "inspection_details": "All structural elements verified",
  "inspection_result": "pass"
}
```

---

### 11. Update Incharge
**POST** `/daily-works/incharge`

Updates the incharge (supervisor) for a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "incharge": 5
}
```

---

### 12. Update Assigned User
**POST** `/daily-works/assigned`

Updates the assigned user for a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "assigned": 12
}
```

---

### 13. Import Daily Works
**POST** `/import-daily-works`

Imports daily works from an Excel file.

**Permissions:** `daily-works.import`

**Request Body (multipart/form-data):**
- `file` - Excel file (.xlsx, .csv)

**Excel Format:**
| Column | Field | Example | Required |
|--------|-------|---------|----------|
| A | Date | 2025-11-26 | Yes |
| B | RFI Number | S2025-1126-001 | Yes |
| C | Work Type | Structure | Yes |
| D | Description | Bridge foundation work | Yes |
| E | Location/Chainage | K05+560-K05+660 | Yes |
| F | Quantity/Layer | 100 MT | No |

**Response:**
```json
{
  "message": "Import completed successfully",
  "results": {
    "total": 50,
    "success": 48,
    "failed": 2,
    "errors": [...]
  }
}
```

---

### 14. Download Import Template
**GET** `/download-daily-works-template`

Downloads an Excel template for importing daily works.

**Permissions:** `daily-works.import`

**Response:** Excel file download

---

### 15. Export Daily Works
**POST** `/daily-works/export`

Exports daily works to Excel or PDF.

**Permissions:** `daily-works.export`

**Request Body:**
```json
{
  "format": "xlsx",
  "filters": {
    "date_from": "2025-11-01",
    "date_to": "2025-11-30",
    "status": "completed",
    "type": "Structure"
  }
}
```

**Response:** File download (Excel or PDF)

---

### 16. Get Statistics
**GET** `/daily-works/statistics`

Fetches statistical data for daily works.

**Permissions:** `daily-works.view`

**Response:**
```json
{
  "total": 150,
  "by_status": {
    "new": 20,
    "in-progress": 35,
    "completed": 80,
    "resubmission": 10,
    "rejected": 5
  },
  "by_type": {
    "Structure": 50,
    "Embankment": 60,
    "Pavement": 40
  },
  "completion_rate": 53.33,
  "average_completion_time": 8.5,
  "resubmission_rate": 6.67
}
```

---

## Status Values
- `new` - Newly created work
- `in-progress` - Work in progress
- `completed` - Work completed
- `rejected` - Work rejected
- `resubmission` - Work resubmitted after rejection
- `pending` - Work pending review

## Inspection Result Values
- `pass` - Inspection passed
- `fail` - Inspection failed
- `conditional` - Conditional pass
- `pending` - Inspection pending
- `approved` - Inspection approved
- `rejected` - Inspection rejected

## Work Types
- `Structure` - Structural work (bridges, culverts, etc.)
- `Embankment` - Earthwork/embankment
- `Pavement` - Road surface work

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized."
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "number": ["A daily work with the same RFI number already exists."],
    "status": ["Status must be one of: new, in-progress, completed, rejected, resubmission, pending."]
  }
}
```

### 500 Server Error
```json
{
  "message": "An error occurred while processing your request.",
  "error": "Error details..."
}
```

---

## Activity Logging

All create, update, and delete operations are automatically logged using Spatie ActivityLog. Activity logs include:
- User who performed the action
- Timestamp
- Old and new values for updates
- IP address and user agent

Activity logs can be retrieved via the activity log API (separate documentation).

---

## Notes

1. **Unique RFI Numbers**: Each daily work must have a unique RFI number to prevent duplicates.

2. **Automatic Incharge Assignment**: When creating a daily work, the incharge is automatically assigned based on the location/chainage using the jurisdiction system.

3. **Soft Deletes**: Deleted daily works are soft-deleted and can be restored if needed.

4. **File Attachments**: Daily works support file attachments (RFI documents, photos) via Spatie MediaLibrary.

5. **Relationships**: Daily works can be linked to reports via the `daily_work_has_report` pivot table.

6. **Pagination**: Default pagination is 15 items per page. Maximum is 100 items per page.

7. **Date Format**: All dates should be in `Y-m-d` format (2025-11-26).

8. **DateTime Format**: All datetime fields should be in ISO 8601 format (2025-11-26T16:00:00Z).
