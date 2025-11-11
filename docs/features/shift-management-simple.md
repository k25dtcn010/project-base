# Shift Management - Simplified Version

## Overview

Hệ thống quản lý phân ca đơn giản, tập trung vào việc ghi nhận nhân viên làm việc theo ca, với giờ vào - giờ ra, từ ngày nào đến ngày nào.

## Features

### 1. Quản lý phân ca

- **Chọn nhiều nhân viên**: Có thể phân ca cho nhiều nhân viên cùng lúc
- **Thời gian linh hoạt**: Tự do chọn giờ bắt đầu và giờ kết thúc
- **Khoảng thời gian**: Chọn từ ngày - đến ngày
- **Ngày trong tuần**: Chọn các ngày áp dụng (Thứ 2-Chủ nhật)
- **Ghi chú**: Thêm ghi chú nếu cần

### 2. Đặc điểm

- ✅ Không cần định nghĩa ca trước
- ✅ Không tính toán giờ nghỉ, giờ làm
- ✅ Tự động tạo shift definition khi cần
- ✅ Giao diện đơn giản, dễ sử dụng
- ✅ Sử dụng Ant Design

## User Interface

### Trang chính

- **Header**: "Quản lý phân ca" với nút "Thêm phân ca"
- **Bảng danh sách**: Hiển thị tất cả phân ca đã tạo

### Cột trong bảng

| Cột              | Mô tả                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Nhân viên        | Danh sách nhân viên được phân ca (hiển thị tối đa 3, sau đó +X người khác) |
| Giờ làm việc     | Giờ bắt đầu - Giờ kết thúc (VD: 08:00 - 17:00)                             |
| Khoảng thời gian | Từ ngày - Đến ngày                                                         |
| Ngày trong tuần  | Các tag hiển thị ngày (T2, T3, T4...)                                      |
| Ghi chú          | Ghi chú của phân ca                                                        |
| Người tạo        | Người tạo phân ca                                                          |
| Thao tác         | Sửa / Xóa                                                                  |

### Form thêm/sửa phân ca

```
┌─────────────────────────────────────┐
│ Thêm phân ca mới                    │
├─────────────────────────────────────┤
│                                     │
│ Nhân viên *                         │
│ [Select Multiple]                   │
│ ▼ Chọn nhân viên                   │
│                                     │
│ Giờ làm việc                        │
│ [08:00] - [17:00]                  │
│                                     │
│ Khoảng thời gian *                  │
│ [01/01/2024] đến [31/12/2024]      │
│                                     │
│ Ngày trong tuần *                   │
│ [Select Multiple]                   │
│ ▼ T2, T3, T4, T5, T6               │
│                                     │
│ Ghi chú                             │
│ [Textarea]                          │
│                                     │
│         [Hủy]  [Thêm mới]          │
└─────────────────────────────────────┘
```

## Technical Implementation

### Database Schema

#### Shift Table

```sql
shift (
  _id,
  name,              -- Tự động: "Ca 08:00-17:00"
  code,              -- Tự động: "SHIFT_0800_1700"
  start_time,        -- "08:00"
  end_time,          -- "17:00"
  break_duration,    -- 0 (không dùng)
  work_duration,     -- Tự động tính
  color,             -- Default: "#1890ff"
  is_active,
  auto_approve,
  created_at,
  updated_at
)
```

#### Shift Schedule Table

```sql
shift_schedule (
  _id,
  employee_id,              -- ID nhân viên
  employee_group_id,        -- NULL (không dùng)
  shift_id,                 -- Reference to shift
  scheduled_from_date,      -- Từ ngày
  scheduled_to_date,        -- Đến ngày
  days_of_week,            -- JSON: [1,2,3,4,5]
  note,
  created_by,
  created_at,
  updated_at
)
```

### API Endpoints

#### Employees

```
GET  /api/employees           - Get all employees
GET  /api/employees/:id       - Get employee by ID
GET  /api/employees/search    - Search employees
```

#### Shifts

```
GET  /api/shifts              - Get active shifts
GET  /api/shifts/all          - Get all shifts
POST /api/shifts              - Create shift (auto)
PUT  /api/shifts/:id          - Update shift
```

#### Shift Schedules

```
GET    /api/shift-schedules              - Get all schedules
POST   /api/shift-schedules              - Create schedule
PUT    /api/shift-schedules/:id          - Update schedule
DELETE /api/shift-schedules/:id          - Delete schedule
```

### Frontend Implementation

#### Component Structure

```
shifts.tsx
├─ Card (Header + Table)
│  ├─ Button "Thêm phân ca"
│  └─ Table (Ant Design)
│
└─ Modal (Form)
   └─ Form (Ant Design)
      ├─ Select Multiple (Nhân viên)
      ├─ TimePicker Range (Giờ)
      ├─ DatePicker Range (Ngày)
      ├─ Select Multiple (Ngày trong tuần)
      └─ TextArea (Ghi chú)
```

#### Data Flow

```
1. User fills form
2. Submit form
3. Find or create shift with matching time
4. Create schedule for EACH employee
5. Reload list
```

## Business Logic

### Tạo phân ca mới

```javascript
for each employee in selectedEmployees:
  1. Find shift with matching startTime and endTime
  2. If not found, create new shift
  3. Create shift_schedule record with:
     - employeeId
     - shiftId
     - scheduledFromDate
     - scheduledToDate
     - daysOfWeek
     - note
```

### Hiển thị danh sách

```javascript
1. Load all shift_schedules
2. Group by: startTime + endTime + dateRange + daysOfWeek
3. Combine employees in same group
4. Display grouped records
```

### Cập nhật phân ca

```javascript
1. Update the shift_schedule record
2. Keep shift reference if time unchanged
3. Create new shift if time changed
```

### Xóa phân ca

```javascript
1. Delete shift_schedule record
2. Keep shift record for history
```

## Migration

### Required Changes

1. ✅ Add columns to `shift` table:
   - `code`, `break_duration`, `work_duration`, `color`, `auto_approve`

2. ✅ Add `employee_group` and `employee_group_member` tables

3. ✅ Update `shift_schedule` table:
   - Add `employee_group_id`
   - Add `days_of_week`
   - Make `employee_id` nullable

### Run Migration

```bash
# Docker environment
cat packages/db/prisma/migrations/manual_add_shift_fields.sql | \
  docker exec -i project-base-dev-postgres psql -U postgres -d project-base

# Generate Prisma Client
cd packages/db && bunx prisma generate

# Restart server
docker-compose restart server
```

## API Examples

### Get all employees

```bash
curl http://localhost:3000/api/employees
```

**Response:**

```json
{
  "data": [
    {
      "id": "emp1",
      "employeeCode": "TD0001",
      "fullName": "Nguyễn Văn A",
      "department": {
        "id": "dept1",
        "name": "Phòng IT"
      }
    }
  ]
}
```

### Create shift schedule

```bash
curl -X POST http://localhost:3000/api/shift-schedules \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "shift123",
    "assignmentType": "employee",
    "employeeId": "emp1",
    "scheduledFromDate": "2024-01-01",
    "scheduledToDate": "2024-12-31",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "note": "Ca hành chính",
    "createdBy": "admin"
  }'
```

### Get shift schedules

```bash
curl http://localhost:3000/api/shift-schedules
```

## Validation Rules

### Form Validation

- ✅ Nhân viên: Bắt buộc, ít nhất 1 người
- ✅ Giờ làm việc: Bắt buộc, start < end hoặc overnight
- ✅ Khoảng thời gian: Bắt buộc, from <= to
- ✅ Ngày trong tuần: Bắt buộc, ít nhất 1 ngày
- ℹ️ Ghi chú: Tùy chọn

### Business Rules

- ⚠️ Có thể trùng lịch (không check conflict)
- ✅ Tự động tạo shift nếu chưa tồn tại
- ✅ Mỗi nhân viên = 1 schedule record
- ✅ Giữ lại shift khi xóa schedule

## Future Enhancements

### Phase 1 (Current)

- [x] Basic shift assignment
- [x] Multiple employee selection
- [x] Flexible time input
- [x] Date range and weekdays

### Phase 2 (Planned)

- [ ] Conflict detection
- [ ] Batch operations
- [ ] Import from Excel
- [ ] Export schedule report

### Phase 3 (Future)

- [ ] Shift templates
- [ ] Rotation schedules
- [ ] Overtime tracking
- [ ] Integration with timekeeping

## Troubleshooting

### Problem: No employees in dropdown

**Solution:** Check employee API endpoint

```bash
curl http://localhost:3000/api/employees
docker logs project-base-server
```

### Problem: Cannot create schedule

**Solution:** Check server logs and database

```bash
docker logs project-base-server -f
docker exec project-base-dev-postgres psql -U postgres -d project-base \
  -c "SELECT * FROM shift_schedule ORDER BY created_at DESC LIMIT 5;"
```

### Problem: NaN in work duration

**Solution:** Run work duration calculation

```sql
UPDATE shift
SET work_duration = CASE
  WHEN EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60 < 0
  THEN (EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60) + 1440
  ELSE (EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60)
END
WHERE work_duration = 0 OR work_duration IS NULL;
```

## References

- Frontend: `apps/web/src/routes/_workspace/shifts.tsx`
- API Client: `apps/web/src/lib/api-client.ts`
- Server Routes: `apps/server/src/routes/`
  - `employee.ts`
  - `shift.ts`
  - `shift-schedule.ts`
- Database Schema: `packages/db/prisma/schema/schema.prisma`
- Migration: `packages/db/prisma/migrations/manual_add_shift_fields.sql`

## Summary

Hệ thống quản lý phân ca đã được đơn giản hóa với các đặc điểm chính:

- ✅ Chọn nhiều nhân viên cùng lúc
- ✅ Giờ làm linh hoạt (không cần định nghĩa ca trước)
- ✅ Từ ngày - đến ngày
- ✅ Chọn ngày trong tuần
- ✅ Sử dụng Ant Design
- ✅ Kết nối API thật (198 nhân viên)
- ✅ Giao diện đơn giản, dễ sử dụng

Không còn quản lý shift definitions riêng biệt, hệ thống tự động tạo shift khi cần!
