# 📋 API Specification for Backend Development

Dựa trên Mock Service hiện có, dưới đây là danh sách đầy đủ các API cần thiết để phát triển backend.

---

## 🔐 1. AUTHENTICATION APIs

### 1.1 Sign In
```
Method: POST
URL: /api/auth/signin
Headers: 
  - Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string",
  "deviceId": "string (optional)",
  "deviceInfo": {
    "brand": "string",
    "model": "string",
    "osVersion": "string",
    "platform": "string (ios|android|web)"
  }
}

Response Success (200):
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "user-001",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "role": "employee|manager|admin",
      "department": "Engineering"
    },
    "session": {
      "sessionId": "session_12345",
      "deviceId": "device_id_hash",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActivityAt": "2024-01-15T10:30:00Z"
    }
  }
}

Response Error:
{
  "success": false,
  "message": "User not found|Invalid password|Device mismatch|Account locked"
}

Error Codes:
  - 401: Invalid credentials
  - 403: Device not registered / Device mismatch
  - 404: User not found
  - 429: Too many login attempts
  - 500: Server error
```

### 1.2 Sign Out
```
Method: POST
URL: /api/auth/signout
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body: {}

Response (200):
{
  "success": true,
  "message": "Sign out successful"
}
```

### 1.3 Get Current Session
```
Method: GET
URL: /api/auth/session
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "user-001",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "role": "employee",
      "department": "Engineering",
      "profileImage": "url_or_null"
    },
    "session": {
      "sessionId": "session_12345",
      "deviceId": "device_id_hash",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActivityAt": "2024-01-15T10:35:00Z"
    }
  }
}

Response Error (401/403):
{
  "success": false,
  "message": "Session expired|Invalid token|Unauthorized"
}
```

### 1.4 Refresh Token
```
Method: POST
URL: /api/auth/refresh
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Response Success (200):
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 86400 (seconds)
  }
}
```

### 1.5 Get Current User
```
Method: GET
URL: /api/auth/me
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "id": "user-001",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "employee",
    "department": "Engineering",
    "profileImage": "url_or_null"
  }
}
```

---

## ⏰ 2. ATTENDANCE APIs

### 2.1 Check In
```
Method: POST
URL: /api/attendance/checkin
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "location": {
    "latitude": "double",
    "longitude": "double",
    "accuracy": "double",
    "altitude": "double"
  },
  "network": {
    "wifiName": "string (nullable)",
    "wifiBSSID": "string (nullable)",
    "wifiIP": "string (nullable)",
    "mobileIP": "string (nullable)",
    "connectionType": "wifi|mobile|unknown"
  },
  "device": {
    "deviceId": "string",
    "deviceBrand": "string",
    "deviceModel": "string",
    "osVersion": "string",
    "platform": "ios|android|web",
    "isPhysicalDevice": "boolean"
  },
  "photo": "base64_string (nullable)",
  "timestamp": "2024-01-15T08:00:15Z"
}

Response Success (200):
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": "record_12345",
    "userId": "user-001",
    "type": "check_in",
    "timestamp": "2024-01-15T08:00:15Z",
    "location": { ... },
    "network": { ... },
    "device": { ... }
  }
}

Response Validation:
- Allow only ONE check-in per day per user
- Check if already checked in (error if yes)
- Validate location accuracy (optional)

Error Codes:
  - 400: Already checked in today
  - 401: Unauthorized
  - 422: Invalid location data
```

### 2.2 Check Out
```
Method: POST
URL: /api/attendance/checkout
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "location": { ... },
  "network": { ... },
  "device": { ... },
  "photo": "base64_string (nullable)",
  "timestamp": "2024-01-15T17:30:42Z"
}

Response Success (200):
{
  "success": true,
  "message": "Check-out successful (lần 1)",
  "data": {
    "id": "record_12346",
    "userId": "user-001",
    "type": "check_out",
    "timestamp": "2024-01-15T17:30:42Z",
    "location": { ... },
    "network": { ... },
    "device": { ... }
  },
  "workingHours": "9.51",
  "checkOutCount": 1
}

Response Validation:
- Allow multiple check-outs per day (for flexible work)
- Require prior check-in
- Calculate working hours from first check-in to this check-out
- Track check-out count

Error Codes:
  - 400: No check-in found for today
  - 401: Unauthorized
  - 422: Invalid location data
```

### 2.3 Get Today's Attendance Status
```
Method: GET
URL: /api/attendance/status
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "lastCheckIn": "2024-01-15T08:00:15Z",
    "lastCheckOut": "2024-01-15T17:30:42Z",
    "isCheckedIn": false,
    "workingHours": 9.51,
    "totalCheckOuts": 1
  }
}

Response (No records today) (200):
{
  "success": true,
  "data": {
    "lastCheckIn": null,
    "lastCheckOut": null,
    "isCheckedIn": false,
    "workingHours": 0,
    "totalCheckOuts": 0
  }
}
```

### 2.4 Get Today's Records
```
Method: GET
URL: /api/attendance/today
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": [
    {
      "id": "record_12345",
      "userId": "user-001",
      "type": "check_in",
      "timestamp": "2024-01-15T08:00:15Z",
      "location": { ... },
      "network": { ... },
      "device": { ... }
    },
    {
      "id": "record_12346",
      "userId": "user-001",
      "type": "check_out",
      "timestamp": "2024-01-15T17:30:42Z",
      "location": { ... },
      "network": { ... },
      "device": { ... }
    }
  ]
}
```

### 2.5 Get Today's Working Hours
```
Method: GET
URL: /api/attendance/working-hours
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "workingHours": 9.51,
    "totalDuration": "9h 30m 42s"
  }
}
```

### 2.6 Get Attendance History
```
Method: GET
URL: /api/attendance/history
Query Params:
  - startDate: "2024-01-01" (YYYY-MM-DD)
  - endDate: "2024-01-31" (YYYY-MM-DD)
  - page: 1 (optional, default 1)
  - limit: 50 (optional, default 50)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record_12345",
        "userId": "user-001",
        "date": "2024-01-15",
        "checkInTime": "08:00:15",
        "checkOutTime": "17:30:42",
        "workingHours": 9.51,
        "location": { ... },
        "network": { ... },
        "device": { ... }
      }
    ],
    "totalRecords": 15,
    "page": 1,
    "totalPages": 1
  }
}
```

### 2.7 Get Attendance Stats
```
Method: GET
URL: /api/attendance/stats
Query Params:
  - startDate: "2024-01-01"
  - endDate: "2024-01-31"

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 2,
    "totalWorkingHours": 180.5,
    "averageWorkingHours": 9.03,
    "lateArrivals": 3,
    "earlyDepartures": 1
  }
}
```

---

## 📅 3. LEAVE APIs

### 3.1 Get Leave Balances
```
Method: GET
URL: /api/leave/balances
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "leaves": [
      {
        "id": "leave-1",
        "type": "Annual",
        "totalDays": 15,
        "usedDays": 3,
        "remainingDays": 12,
        "year": 2024,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z"
      },
      {
        "id": "leave-2",
        "type": "Sick",
        "totalDays": 5,
        "usedDays": 0,
        "remainingDays": 5,
        "year": 2024,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z"
      },
      {
        "id": "leave-3",
        "type": "Personal",
        "totalDays": 3,
        "usedDays": 1,
        "remainingDays": 2,
        "year": 2024,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z"
      }
    ],
    "summary": {
      "totalRemaining": 19,
      "totalUsed": 4,
      "totalDays": 23
    }
  }
}
```

### 3.2 Get Leave By ID
```
Method: GET
URL: /api/leave/{leaveId}
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "id": "leave-1",
    "type": "Annual",
    "totalDays": 15,
    "usedDays": 3,
    "remainingDays": 12,
    "year": 2024,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

### 3.3 Request Leave
```
Method: POST
URL: /api/leave/request
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "leaveType": "Annual|Sick|Personal|Unpaid",
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "numberOfDays": 3,
  "reason": "Cần đi công tác",
  "attachment": "base64_string (optional)"
}

Response Success (200):
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": "LR001",
    "employeeId": "user-001",
    "leaveType": "Annual",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-03T23:59:59Z",
    "numberOfDays": 3,
    "reason": "Cần đi công tác",
    "status": "Pending",
    "requestDate": "2024-01-15T10:30:00Z",
    "approverComments": null
  }
}

Validation:
- Check if user has sufficient balance
- Check for overlapping requests
- Validate date range
- Validate leave type

Error Codes:
  - 400: Insufficient leave balance | Invalid date range
  - 409: Overlapping leave request
  - 422: Validation error
```

### 3.4 Get Leave Requests
```
Method: GET
URL: /api/leave/requests
Query Params:
  - status: "Pending|Approved|Rejected" (optional)
  - page: 1 (optional)
  - limit: 50 (optional)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "LR001",
        "employeeId": "user-001",
        "leaveType": "Annual",
        "startDate": "2024-02-01T00:00:00Z",
        "endDate": "2024-02-03T23:59:59Z",
        "numberOfDays": 3,
        "reason": "Cần đi công tác",
        "status": "Pending",
        "requestDate": "2024-01-15T10:30:00Z",
        "approverComments": null
      },
      {
        "id": "LR002",
        "employeeId": "user-001",
        "leaveType": "Personal",
        "startDate": "2024-01-10T00:00:00Z",
        "endDate": "2024-01-11T23:59:59Z",
        "numberOfDays": 2,
        "reason": "Sự kiện gia đình",
        "status": "Approved",
        "requestDate": "2024-01-05T09:15:00Z",
        "approverComments": "Approved - Family event",
        "approvedDate": "2024-01-05T14:30:00Z",
        "approverId": "user-manager-001"
      }
    ],
    "totalRequests": 15,
    "page": 1,
    "totalPages": 1
  }
}
```

### 3.5 Cancel Leave Request
```
Method: DELETE
URL: /api/leave/request/{requestId}
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "message": "Leave request cancelled successfully"
}

Validation:
- Only allow cancellation if status is "Pending"
- Cannot cancel approved/rejected requests

Error Codes:
  - 400: Cannot cancel non-pending request
  - 404: Leave request not found
  - 403: Insufficient permission
```

### 3.6 Get Leave History
```
Method: GET
URL: /api/leave/history
Query Params:
  - startDate: "2024-01-01"
  - endDate: "2024-01-31"
  - page: 1 (optional)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "leaves": [
      {
        "id": "LR002",
        "date": "2024-01-10",
        "type": "Personal",
        "status": "Approved",
        "approverName": "Manager Name"
      }
    ],
    "totalDays": 2
  }
}
```

---

## ⏱️ 4. OVERTIME (OT) APIs

### 4.1 Get OT Requests
```
Method: GET
URL: /api/ot/requests
Query Params:
  - status: "Pending|Approved|Rejected" (optional)
  - page: 1 (optional)
  - limit: 50 (optional)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "OT001",
        "employeeId": "user-001",
        "requestDate": "2024-01-10T14:30:00Z",
        "otDate": "2024-01-12T00:00:00Z",
        "startTime": "08:00",
        "endTime": "17:00",
        "hours": 9.0,
        "reason": "Hoàn thành project nhập liệu",
        "status": "Approved",
        "approverComments": "Approved - Important project",
        "approvedDate": "2024-01-10T15:00:00Z"
      },
      {
        "id": "OT002",
        "employeeId": "user-001",
        "requestDate": "2024-01-13T10:00:00Z",
        "otDate": "2024-01-14T00:00:00Z",
        "startTime": "19:00",
        "endTime": "22:00",
        "hours": 3.0,
        "reason": "Fix bug critical",
        "status": "Pending",
        "approverComments": null
      }
    ],
    "totalRequests": 12,
    "page": 1,
    "totalPages": 1
  }
}
```

### 4.2 Get OT Request By ID
```
Method: GET
URL: /api/ot/{requestId}
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "id": "OT001",
    "employeeId": "user-001",
    "requestDate": "2024-01-10T14:30:00Z",
    "otDate": "2024-01-12T00:00:00Z",
    "startTime": "08:00",
    "endTime": "17:00",
    "hours": 9.0,
    "reason": "Hoàn thành project nhập liệu",
    "status": "Approved"
  }
}
```

### 4.3 Create OT Request
```
Method: POST
URL: /api/ot/request
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "otDate": "2024-02-15",
  "startTime": "19:00",
  "endTime": "22:00",
  "hours": 3.0,
  "reason": "Fix bug critical trong hệ thống"
}

Response Success (200):
{
  "success": true,
  "message": "OT request submitted successfully",
  "data": {
    "id": "OT005",
    "employeeId": "user-001",
    "requestDate": "2024-01-15T10:30:00Z",
    "otDate": "2024-02-15T00:00:00Z",
    "startTime": "19:00",
    "endTime": "22:00",
    "hours": 3.0,
    "reason": "Fix bug critical",
    "status": "Pending"
  }
}

Validation:
- Validate start/end time format (HH:MM)
- Validate hours calculation
- Check if exceeding monthly OT limit
- Prevent duplicate requests for same date

Error Codes:
  - 400: Invalid time format | Exceeding OT limit
  - 409: Duplicate OT request
  - 422: Validation error
```

### 4.4 Update OT Request
```
Method: PUT
URL: /api/ot/{requestId}
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "startTime": "19:00",
  "endTime": "23:00",
  "hours": 4.0,
  "reason": "Extended OT work"
}

Response Success (200):
{
  "success": true,
  "message": "OT request updated successfully",
  "data": { ... }
}

Validation:
- Only allow update if status is "Pending"
- Cannot update approved/rejected requests
```

### 4.5 Cancel OT Request
```
Method: DELETE
URL: /api/ot/{requestId}
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "message": "OT request cancelled successfully"
}

Validation:
- Only allow cancellation if status is "Pending"
```

### 4.6 Get OT Summary
```
Method: GET
URL: /api/ot/summary
Query Params:
  - month: "2024-01" (optional, default current month)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "month": "2024-01",
    "totalHours": 16.0,
    "approvedHours": 16.0,
    "pendingHours": 3.0,
    "rejectedHours": 3.0,
    "requests": 4,
    "approvedRequests": 2,
    "pendingRequests": 1,
    "rejectedRequests": 1
  }
}
```

### 4.7 Get OT History
```
Method: GET
URL: /api/ot/history
Query Params:
  - startDate: "2024-01-01"
  - endDate: "2024-01-31"
  - page: 1 (optional)

Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "OT001",
        "date": "2024-01-12",
        "hours": 9.0,
        "status": "Approved"
      }
    ],
    "totalHours": 25.0
  }
}
```

---

## 👥 5. EMPLOYEE/USER PROFILE APIs

### 5.1 Get User Profile
```
Method: GET
URL: /api/user/profile
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "id": "user-001",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "phone": "0123456789",
    "department": "Engineering",
    "position": "Senior Developer",
    "joinDate": "2020-01-15T00:00:00Z",
    "profileImage": "url_or_null",
    "role": "employee",
    "manager": {
      "id": "manager-001",
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    }
  }
}
```

### 5.2 Update User Profile
```
Method: PUT
URL: /api/user/profile
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "fullName": "John Doe Updated",
  "phone": "0987654321",
  "profileImage": "base64_string (optional)"
}

Response Success (200):
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

### 5.3 Change Password
```
Method: POST
URL: /api/user/change-password
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Request Body:
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}

Response Success (200):
{
  "success": true,
  "message": "Password changed successfully"
}

Error Codes:
  - 400: Current password incorrect | Passwords do not match
  - 422: Password too weak
```

---

## 📊 6. DASHBOARD/SUMMARY APIs

### 6.1 Get Dashboard Summary
```
Method: GET
URL: /api/dashboard/summary
Headers:
  - Authorization: Bearer {token}

Response Success (200):
{
  "success": true,
  "data": {
    "attendance": {
      "todayCheckIn": "08:00:15",
      "todayCheckOut": "17:30:42",
      "todayWorkingHours": 9.51,
      "isCheckedIn": false,
      "lastCheckIn": "2024-01-15T08:00:15Z",
      "lastCheckOut": "2024-01-15T17:30:42Z"
    },
    "leave": {
      "totalRemaining": 19,
      "totalUsed": 4,
      "pendingRequests": 1,
      "upcomingLeave": {
        "startDate": "2024-02-01",
        "endDate": "2024-02-03",
        "type": "Annual"
      }
    },
    "ot": {
      "thisMonthHours": 16.0,
      "approvedHours": 16.0,
      "pendingHours": 3.0,
      "monthlyLimit": 50.0,
      "percentageUsed": 32.0
    }
  }
}
```

---

## 🔧 7. GENERAL GUIDELINES

### Response Format
All API responses should follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Description of what happened (optional)",
  "data": { }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "details": { }
}
```

### HTTP Status Codes
- **200**: OK - Request successful
- **201**: Created - Resource created
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Missing/invalid token
- **403**: Forbidden - Insufficient permission
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource conflict (duplicate)
- **422**: Unprocessable Entity - Validation error
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error

### Authentication
- All protected endpoints require `Authorization: Bearer {token}` header
- Token should be JWT format
- Include device ID for attendance tracking

### Validation Rules
1. **Email**: Valid email format
2. **Password**: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
3. **Dates**: ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
4. **Time**: HH:MM 24-hour format
5. **Phone**: Valid phone number format

### Pagination
- Default limit: 50
- Max limit: 100
- Include `page`, `totalPages`, `totalRecords` in response

### Rate Limiting
- Implement rate limiting: 100 requests per minute per user
- Return 429 status when exceeded

### Logging
- Log all API calls with: timestamp, user ID, endpoint, method, status
- Log all authentication attempts
- Log all approval/rejection actions

---

## 📝 Demo Users for Testing

```
1. Admin User
   Email: admin@example.com
   Password: changethis
   Role: admin

2. Employee - John Doe
   Email: john.doe@example.com
   Password: password123
   Role: employee
   Department: Engineering

3. Manager - Jane Smith
   Email: jane.smith@example.com
   Password: password123
   Role: manager
   Department: Sales

4. Employee - Bob Wilson
   Email: bob.wilson@example.com
   Password: password123
   Role: employee
   Department: Finance
```

---

## 🗄️ Database Schema Recommendations

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  profile_image TEXT,
  role ENUM('admin', 'manager', 'employee'),
  manager_id VARCHAR(36),
  device_id VARCHAR(255),
  join_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('check_in', 'check_out'),
  timestamp TIMESTAMP NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  wifi_name VARCHAR(255),
  wifi_bssid VARCHAR(255),
  device_id VARCHAR(255),
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  photo LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_date (user_id, DATE(timestamp))
);
```

### Leave Table
```sql
CREATE TABLE leaves (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('Annual', 'Sick', 'Personal', 'Unpaid'),
  total_days INT,
  used_days INT DEFAULT 0,
  remaining_days INT,
  year INT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Leave Requests Table
```sql
CREATE TABLE leave_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  leave_type ENUM('Annual', 'Sick', 'Personal', 'Unpaid'),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INT,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approver_id VARCHAR(36),
  approver_comments TEXT,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);
```

### OT Requests Table
```sql
CREATE TABLE ot_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  ot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours DECIMAL(5,2),
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approver_id VARCHAR(36),
  approver_comments TEXT,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);
```

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2024  
**Status**: Ready for Backend Development
