# Aero Enterprise Suite - API Documentation

## 🚀 Quick Start

### Base URL
```
Production: https://api.your-domain.com/api/v1
Staging: https://staging-api.your-domain.com/api/v1
Local: http://localhost:8000/api/v1
```

### Authentication
All API requests require authentication via Bearer tokens:
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Tenant Context
For tenant-scoped endpoints, include tenant context:
```http
X-Tenant-ID: tenant123
# OR use subdomain: https://tenant123.your-domain.com/api/v1
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "remember": true
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "roles": ["admin"],
      "permissions": ["users.create", "users.update"]
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2026-02-28T10:30:00.000000Z"
  },
  "message": "Login successful"
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password",
  "password_confirmation": "password",
  "tenant_subdomain": "acme-corp"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer YOUR_TOKEN
```

### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer YOUR_TOKEN
```

### Get Current User
```http
GET /auth/user
Authorization: Bearer YOUR_TOKEN
```

---

## 👥 Users Management

### List Users
```http
GET /users?page=1&per_page=15&search=john&role=admin&department=engineering
Authorization: Bearer YOUR_TOKEN
X-Tenant-ID: tenant123
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["admin"],
      "department": {
        "id": 1,
        "name": "Engineering"
      },
      "status": "active",
      "created_at": "2026-01-01T00:00:00.000000Z"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 125,
      "total_pages": 9
    }
  }
}
```

### Create User
```http
POST /users
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password",
  "department_id": 2,
  "role_ids": [2, 3],
  "employee_id": "EMP001",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }
}
```

### Update User
```http
PUT /users/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "John Updated",
  "department_id": 3,
  "status": "inactive"
}
```

### Delete User
```http
DELETE /users/1
Authorization: Bearer YOUR_TOKEN
```

### Send User Invitation
```http
POST /users/invite
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "email": "newuser@example.com",
  "role_ids": [2],
  "department_id": 1,
  "message": "Welcome to our team!"
}
```

---

## 🏢 HRM Module

### Employees

#### List Employees
```http
GET /hrm/employees?department=engineering&status=active&page=1
Authorization: Bearer YOUR_TOKEN
```

#### Employee Details
```http
GET /hrm/employees/1
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "employee_id": "EMP001",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "department": {
      "id": 1,
      "name": "Engineering"
    },
    "designation": {
      "id": 1,
      "title": "Senior Developer"
    },
    "salary": 75000,
    "hire_date": "2025-01-15",
    "status": "active",
    "skills": ["PHP", "React", "MySQL"],
    "performance_rating": 4.5
  }
}
```

### Leave Management

#### Apply for Leave
```http
POST /hrm/leaves
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "leave_type_id": 1,
  "start_date": "2026-02-01",
  "end_date": "2026-02-05",
  "reason": "Personal vacation",
  "half_day": false
}
```

#### Approve/Reject Leave
```http
PUT /hrm/leaves/1/status
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "status": "approved",
  "comments": "Approved for personal time"
}
```

### Timesheet Management

#### Submit Timesheet
```http
POST /hrm/timesheets
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "date": "2026-01-28",
  "entries": [
    {
      "project_id": 1,
      "task_description": "Frontend development",
      "hours": 8.5,
      "billable": true
    }
  ]
}
```

---

## 💰 Finance Module

### Accounts

#### Chart of Accounts
```http
GET /finance/accounts?type=asset&active=true
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "1000",
      "name": "Cash",
      "type": "asset",
      "subtype": "current_asset",
      "balance": 25000.00,
      "parent_id": null,
      "is_active": true
    }
  ]
}
```

### Transactions

#### Create Transaction
```http
POST /finance/transactions
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "description": "Office supplies purchase",
  "transaction_date": "2026-01-28",
  "reference": "INV-2026-001",
  "entries": [
    {
      "account_id": 15,
      "debit": 500.00,
      "credit": 0
    },
    {
      "account_id": 1,
      "debit": 0,
      "credit": 500.00
    }
  ]
}
```

### Invoices

#### Create Invoice
```http
POST /finance/invoices
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "customer_id": 1,
  "invoice_number": "INV-2026-001",
  "issue_date": "2026-01-28",
  "due_date": "2026-02-28",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 99.99,
      "description": "Premium Service"
    }
  ],
  "tax_rate": 10.0,
  "discount_amount": 20.00
}
```

#### Process Payment
```http
POST /finance/invoices/1/payments
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "amount": 199.98,
  "payment_method": "bank_transfer",
  "payment_date": "2026-01-28",
  "reference": "TXN123456",
  "notes": "Full payment received"
}
```

---

## 🏭 Manufacturing Module

### Products

#### List Products
```http
GET /manufacturing/products?category=electronics&status=active
Authorization: Bearer YOUR_TOKEN
```

### Work Orders

#### Create Work Order
```http
POST /manufacturing/work-orders
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "product_id": 1,
  "quantity": 100,
  "priority": "high",
  "due_date": "2026-02-15",
  "notes": "Rush order for client"
}
```

### Quality Control

#### Submit Quality Check
```http
POST /manufacturing/quality-checks
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "work_order_id": 1,
  "inspector_id": 2,
  "tests": [
    {
      "test_name": "Dimension Check",
      "result": "pass",
      "measured_value": 10.2,
      "tolerance_min": 10.0,
      "tolerance_max": 10.5
    }
  ]
}
```

---

## 🔗 Blockchain Module

### Networks

#### List Blockchain Networks
```http
GET /blockchain/networks
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Ethereum",
      "type": "ethereum",
      "chain_id": 1,
      "rpc_endpoint": "https://mainnet.infura.io/v3/...",
      "native_token": "ETH",
      "status": "active"
    }
  ]
}
```

### Wallets

#### Create Wallet
```http
POST /blockchain/wallets
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Main Wallet",
  "blockchain_id": 1,
  "type": "hot",
  "generate_new": true
}
```

#### Get Wallet Balance
```http
GET /blockchain/wallets/1/balance
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "data": {
    "wallet_id": 1,
    "balances": [
      {
        "token_symbol": "ETH",
        "balance": "1.5",
        "usd_value": 3750.00
      },
      {
        "token_symbol": "USDC",
        "balance": "1000.0",
        "usd_value": 1000.00
      }
    ],
    "total_usd_value": 4750.00
  }
}
```

### Transactions

#### Send Transaction
```http
POST /blockchain/transactions
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "from_wallet_id": 1,
  "to_address": "0x742d35Cc6635C0532925A3b8D039C4C27F7e1F",
  "amount": "0.1",
  "token_symbol": "ETH",
  "gas_limit": 21000,
  "gas_price": "20000000000"
}
```

### Smart Contracts

#### Deploy Contract
```http
POST /blockchain/contracts
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "My Token",
  "blockchain_id": 1,
  "contract_type": "erc20",
  "source_code": "pragma solidity ^0.8.0;...",
  "constructor_params": {
    "name": "MyToken",
    "symbol": "MTK",
    "totalSupply": 1000000
  }
}
```

---

## 🌐 IoT Module

### Devices

#### Register Device
```http
POST /iot/devices
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Temperature Sensor #1",
  "device_type": "sensor",
  "model": "TempSense Pro",
  "location": "Warehouse A",
  "network_config": {
    "protocol": "mqtt",
    "topic": "sensors/temp/001"
  }
}
```

#### Send Sensor Data
```http
POST /iot/devices/1/data
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "readings": [
    {
      "sensor_type": "temperature",
      "value": 23.5,
      "unit": "celsius",
      "timestamp": "2026-01-28T10:30:00Z"
    }
  ]
}
```

---

## 📊 Analytics Module

### Reports

#### Generate Report
```http
POST /analytics/reports
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "report_type": "sales_summary",
  "date_range": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "filters": {
    "department": "sales",
    "product_category": "electronics"
  },
  "format": "json"
}
```

### Dashboards

#### Get Dashboard Data
```http
GET /analytics/dashboards/executive?period=last_30_days
Authorization: Bearer YOUR_TOKEN
```

---

## ❌ Error Responses

### Error Format
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password must be at least 8 characters."
    ]
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 📝 Rate Limiting

- **General API**: 1000 requests per hour per user
- **Authentication**: 60 requests per hour per IP
- **File uploads**: 100 requests per hour per user
- **Blockchain operations**: 500 requests per hour per user

---

## 🔄 Pagination

All list endpoints support pagination:
```http
GET /users?page=2&per_page=25&sort=created_at&order=desc
```

**Pagination Response:**
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "current_page": 2,
      "per_page": 25,
      "total": 150,
      "total_pages": 6,
      "has_next_page": true,
      "has_prev_page": true
    }
  }
}
```

---

## 🔍 Filtering & Searching

Most endpoints support filtering and searching:
```http
GET /products?search=laptop&category=electronics&price_min=500&price_max=2000&status=active
```

---

*Last updated: January 28, 2026*
*API Version: 1.0.0*