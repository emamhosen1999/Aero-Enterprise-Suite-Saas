# 🚀 PATENTABLE FEATURES - API QUICK REFERENCE

## 📡 API Endpoints for Linear Continuity & GPS Validation

**Base URL**: `http://aeos365.test/api/rfi`  
**Authentication**: Required (`auth:sanctum` middleware)

---

## 1️⃣ Visual Map Data (LinearProgressMap Component)

**Endpoint**: `GET /linear-continuity/grid`

**Purpose**: Get color-coded segment data for visual strip map display

**Query Parameters**:
```
project_id (required, integer)    - Project ID
layer (required, string)          - Layer code (sub_base, base_course, etc.)
start_chainage (required, float)  - Start chainage in km (e.g., 0.000)
end_chainage (required, float)    - End chainage in km (e.g., 10.000)
segment_size (optional, float)    - Segment size in km (default: 0.1)
```

**Example Request**:
```bash
curl -X GET "http://aeos365.test/api/rfi/linear-continuity/grid?project_id=1&layer=sub_base&start_chainage=0.000&end_chainage=10.000&segment_size=0.1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "grid": [
    {"start": 0.0, "end": 0.1, "status": "complete", "rfis": 1},
    {"start": 0.1, "end": 0.2, "status": "complete", "rfis": 1},
    {"start": 0.2, "end": 0.3, "status": "gap", "rfis": 0},
    ...
  ],
  "coverage": 95.5,
  "gaps": [
    {"start": 0.2, "end": 0.3, "length": 0.1}
  ],
  "can_approve": true,
  "violations": []
}
```

**Status Values**:
- `complete` - Segment fully covered by approved RFIs (green)
- `incomplete` - Segment partially covered or pending (yellow)
- `gap` - No RFIs covering this segment (red)
- `blocked` - Prerequisite layer incomplete (gray)

---

## 2️⃣ Layer Continuity Validation (Form Submission Check)

**Endpoint**: `POST /linear-continuity/validate`

**Purpose**: Validate if new RFI can be approved based on layer sequence rules

**Request Body**:
```json
{
  "project_id": 1,
  "layer": "surface_course",
  "start_chainage": 0.000,
  "end_chainage": 1.000
}
```

**Example Request**:
```bash
curl -X POST "http://aeos365.test/api/rfi/linear-continuity/validate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "layer": "surface_course",
    "start_chainage": 0.000,
    "end_chainage": 1.000
  }'
```

**Success Response** (can approve):
```json
{
  "can_approve": true,
  "coverage": 98.5,
  "gaps": [],
  "violations": [],
  "blocking": false,
  "message": "All prerequisites satisfied. Ready for approval."
}
```

**Blocked Response** (cannot approve):
```json
{
  "can_approve": false,
  "coverage": 85.2,
  "gaps": [
    {"layer": "tack_coat", "start": 0.5, "end": 0.8, "length": 0.3}
  ],
  "violations": [
    {
      "type": "prerequisite_incomplete",
      "layer": "tack_coat",
      "coverage": 85.2,
      "required": 95.0,
      "message": "Prerequisite layer 'tack_coat' has insufficient coverage (85.2% < 95%)"
    }
  ],
  "blocking": true,
  "message": "Cannot approve due to incomplete prerequisite layers"
}
```

**Violation Types**:
- `prerequisite_incomplete` - Previous layer < 95% coverage
- `gap_in_prerequisite` - Previous layer has gaps in work range
- `prerequisite_not_approved` - Previous layer RFIs not approved
- `out_of_sequence` - Skipped intermediate layers

---

## 3️⃣ AI Work Location Suggestion (Smart Planning)

**Endpoint**: `POST /linear-continuity/suggest-location`

**Purpose**: Get AI-recommended next work location based on gap analysis

**Request Body**:
```json
{
  "project_id": 1,
  "layer": "sub_base",
  "start_chainage": 0.000,  // Optional - limit search range
  "end_chainage": 10.000     // Optional
}
```

**Example Request**:
```bash
curl -X POST "http://aeos365.test/api/rfi/linear-continuity/suggest-location" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "layer": "sub_base"
  }'
```

**Response (Gap Found)**:
```json
{
  "suggested_location": {
    "start": 3.000,
    "end": 3.200,
    "length": 0.200
  },
  "message": "Largest gap detected at Ch 3.000 - 3.200. Recommended for next work location."
}
```

**Response (No Gaps)**:
```json
{
  "suggested_location": null,
  "message": "No gaps found. Layer has 100% coverage."
}
```

**Use Cases**:
- "Suggest Next" button in LinearProgressMap
- Daily work planning automation
- Crew dispatch optimization

---

## 4️⃣ Coverage Analysis (Analytics)

**Endpoint**: `GET /linear-continuity/coverage`

**Purpose**: Detailed coverage statistics for specific layer/range

**Query Parameters**:
```
project_id (required)
layer (required)
start_chainage (required)
end_chainage (required)
```

**Example Request**:
```bash
curl -X GET "http://aeos365.test/api/rfi/linear-continuity/coverage?project_id=1&layer=base_course&start_chainage=0.000&end_chainage=5.000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "project_id": 1,
  "layer": "base_course",
  "range": {"start": 0.0, "end": 5.0, "length": 5.0},
  "coverage_percentage": 87.4,
  "total_rfis": 12,
  "approved_rfis": 9,
  "submitted_rfis": 2,
  "draft_rfis": 1,
  "gaps": [
    {"start": 2.5, "end": 3.1, "length": 0.6}
  ],
  "segments": [
    {"start": 0.0, "end": 2.5, "status": "complete"},
    {"start": 2.5, "end": 3.1, "status": "gap"},
    {"start": 3.1, "end": 5.0, "status": "complete"}
  ]
}
```

---

## 5️⃣ Dashboard Statistics (Overview)

**Endpoint**: `GET /linear-continuity/stats`

**Purpose**: Get high-level statistics for dashboard display

**Query Parameters**:
```
project_id (required)
```

**Example Request**:
```bash
curl -X GET "http://aeos365.test/api/rfi/linear-continuity/stats?project_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "total_layers": 7,
  "active_rfis": 45,
  "validated_rfis": 38,
  "avg_coverage": 72.5,
  "blocked_approvals": 3,
  "layer_breakdown": [
    {"layer": "sub_base", "coverage": 95.2},
    {"layer": "base_course", "coverage": 87.4},
    {"layer": "prime_coat", "coverage": 68.1},
    {"layer": "binder_course", "coverage": 55.0},
    {"layer": "tack_coat", "coverage": 42.0},
    {"layer": "surface_course", "coverage": 15.0},
    {"layer": "markings", "coverage": 0.0}
  ]
}
```

**Used By**: LinearContinuityDashboard.jsx (StatsCards component)

---

## 6️⃣ GPS Location Validation (Anti-Fraud)

**Endpoint**: `POST /geofencing/validate`

**Purpose**: Verify if GPS location matches claimed chainage position

**Request Body**:
```json
{
  "project_id": 1,
  "latitude": 23.8103,
  "longitude": 90.4125,
  "claimed_chainage": 0.000,
  "tolerance_meters": 50  // Optional, default: 50m
}
```

**Example Request**:
```bash
curl -X POST "http://aeos365.test/api/rfi/geofencing/validate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "latitude": 23.8103,
    "longitude": 90.4125,
    "claimed_chainage": 0.000,
    "tolerance_meters": 50
  }'
```

**Valid Location Response**:
```json
{
  "valid": true,
  "distance": 12.5,
  "expected_location": {
    "latitude": 23.8104,
    "longitude": 90.4126
  },
  "message": "Location verified. Distance within tolerance (12.5m < 50m).",
  "reason": null
}
```

**Invalid Location Response**:
```json
{
  "valid": false,
  "distance": 235.7,
  "expected_location": {
    "latitude": 23.8104,
    "longitude": 90.4126
  },
  "message": "Location verification failed",
  "reason": "Distance (235.7m) exceeds tolerance (50m). Possible fraud."
}
```

**Error Responses**:

*No Alignment Points*:
```json
{
  "valid": false,
  "message": "No alignment points found for project. Cannot validate location.",
  "reason": "missing_alignment_data"
}
```

*Chainage Out of Range*:
```json
{
  "valid": false,
  "message": "Claimed chainage 15.500 is outside project range (0.000 - 10.000).",
  "reason": "chainage_out_of_range"
}
```

---

## 🔐 Authentication

All endpoints require Bearer token authentication:

```bash
# Get token (login)
curl -X POST "http://aeos365.test/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Use token in subsequent requests
curl -X GET "http://aeos365.test/api/rfi/linear-continuity/stats?project_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Layer Codes Reference

| Layer Code | Order | Name | Prerequisite |
|------------|-------|------|--------------|
| `sub_base` | 1 | Earthwork & Sub-base | None (base layer) |
| `base_course` | 2 | Base Course | sub_base |
| `prime_coat` | 3 | Prime Coat | base_course |
| `binder_course` | 4 | Binder Course | prime_coat |
| `tack_coat` | 5 | Tack Coat | binder_course |
| `surface_course` | 6 | Surface Course | tack_coat |
| `markings` | 7 | Road Markings | surface_course |

---

## 🚨 Error Handling

**Standard Error Response Format**:
```json
{
  "message": "Validation failed",
  "errors": {
    "project_id": ["The project id field is required."],
    "layer": ["The selected layer is invalid."]
  }
}
```

**HTTP Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error (check logs)

---

## 🧪 Testing with Postman

**Import Collection**:
1. Create new Postman collection: "AEOS365 - Linear Continuity API"
2. Set environment variable: `base_url` = `http://aeos365.test`
3. Set environment variable: `token` = `YOUR_BEARER_TOKEN`
4. Add requests for all 6 endpoints above
5. Use `{{base_url}}` and `{{token}}` in requests

**Quick Test Script** (Postman Tests tab):
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('coverage');
    pm.expect(jsonData).to.have.property('can_approve');
});
```

---

## 📝 Frontend Integration Example

**Using with Axios in React**:

```javascript
import axios from 'axios';

// Get completion grid for map
const fetchGridData = async (projectId, layer, startCh, endCh) => {
  const response = await axios.get(route('rfi.linear-continuity.grid'), {
    params: { 
      project_id: projectId, 
      layer, 
      start_chainage: startCh, 
      end_chainage: endCh 
    }
  });
  return response.data;
};

// Validate continuity before form submission
const validateContinuity = async (formData) => {
  try {
    const response = await axios.post(
      route('rfi.linear-continuity.validate'), 
      formData
    );
    
    if (!response.data.can_approve) {
      showToast.error(response.data.message);
      return false;
    }
    return true;
  } catch (error) {
    showToast.error('Validation failed');
    return false;
  }
};

// Get AI suggestion
const getSuggestedLocation = async (projectId, layer) => {
  const response = await axios.post(
    route('rfi.linear-continuity.suggest-location'),
    { project_id: projectId, layer }
  );
  
  if (response.data.suggested_location) {
    return response.data.suggested_location;
  }
  return null;
};
```

---

## 🎯 Rate Limiting

**Default Limits** (adjust in middleware):
- Authenticated users: 60 requests/minute
- Guest users: Not allowed (auth required)

**Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
```

---

## 📚 Related Documentation

- [PATENTABLE_FEATURES_INTEGRATION_COMPLETE.md](./PATENTABLE_FEATURES_INTEGRATION_COMPLETE.md) - Full implementation guide
- [LinearContinuityValidator.php](../packages/aero-rfi/src/Services/LinearContinuityValidator.php) - Algorithm documentation
- [GeoFencingService.php](../packages/aero-rfi/src/Services/GeoFencingService.php) - GPS validation logic

---

**Need Help?** Check Laravel logs: `storage/logs/laravel.log`

**Happy Testing! 🚀**
