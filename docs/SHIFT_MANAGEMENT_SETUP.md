# Shift Management - Setup Guide

## Tổng quan

Hệ thống quản lý phân ca đơn giản, cho phép:

- ✅ Chọn nhiều nhân viên cùng lúc
- ✅ Thời gian linh hoạt (giờ vào - giờ ra tùy chỉnh)
- ✅ Khoảng thời gian (từ ngày - đến ngày)
- ✅ Chọn ngày trong tuần
- ✅ Sử dụng Ant Design

## Bước 1: Chạy Migration

### Với Docker (Khuyến nghị)

```bash
# Chạy migration SQL
cat packages/db/prisma/migrations/manual_add_shift_fields.sql | \
  docker exec -i project-base-dev-postgres psql -U postgres -d project-base

# Xóa Prisma generated cũ và tạo mới
rm -rf packages/db/prisma/generated
cd packages/db && bunx prisma generate

# Restart server
docker-compose restart server
```

### Với PostgreSQL Local

```bash
# Kết nối database
psql -U postgres -d project-base

# Chạy migration
\i packages/db/prisma/migrations/manual_add_shift_fields.sql

# Generate Prisma Client
cd packages/db && bunx prisma generate
```

## Bước 2: Kiểm tra Database

```sql
-- Kiểm tra cột mới trong shift table
\d shift

-- Kiểm tra employee_group table
\d employee_group

-- Kiểm tra shift_schedule table
\d shift_schedule

-- Xem data
SELECT _id, name, code, start_time, end_time, work_duration FROM shift LIMIT 5;
```

## Bước 3: Khởi động Server

### Docker

```bash
# Kiểm tra logs
docker logs project-base-server -f

# Server sẽ tự động reload với code mới
```

### Local Development

```bash
# Backend
cd apps/server
bun run dev

# Frontend (terminal khác)
cd apps/web
bun run dev
```

## Bước 4: Test Tính năng

1. Mở trình duyệt: `http://localhost:3001/shifts`
2. Click "Thêm phân ca"
3. Điền form:
   - Chọn nhiều nhân viên
   - Giờ làm: 08:00 - 17:00
   - Khoảng thời gian: 01/01/2024 đến 31/12/2024
   - Ngày trong tuần: T2, T3, T4, T5, T6
4. Click "Thêm mới"

## Cấu trúc Files

### Backend

```
apps/server/src/routes/
├── employee.ts           # API lấy danh sách nhân viên
├── shift.ts             # API quản lý shift definitions
└── shift-schedule.ts    # API phân ca cho nhân viên
```

### Frontend

```
apps/web/src/
├── lib/
│   └── api-client.ts    # API client functions
└── routes/_workspace/
    └── shifts.tsx       # Trang quản lý phân ca
```

### Database

```
packages/db/prisma/
├── schema/schema.prisma
└── migrations/
    └── manual_add_shift_fields.sql
```

## API Endpoints

### Employees

```
GET  /api/employees              # Lấy tất cả nhân viên
GET  /api/employees/:id          # Lấy thông tin 1 nhân viên
GET  /api/employees/search       # Tìm kiếm nhân viên
```

### Shifts

```
GET  /api/shifts                 # Lấy các shift đang active
GET  /api/shifts/all             # Lấy tất cả shifts
POST /api/shifts                 # Tạo shift mới (tự động)
PUT  /api/shifts/:id             # Cập nhật shift
```

### Shift Schedules

```
GET    /api/shift-schedules              # Lấy tất cả phân ca
POST   /api/shift-schedules              # Tạo phân ca mới
PUT    /api/shift-schedules/:id          # Cập nhật phân ca
DELETE /api/shift-schedules/:id          # Xóa phân ca
```

## Cách hoạt động

### Tạo phân ca mới

1. User chọn nhiều nhân viên (A, B, C)
2. User chọn giờ: 08:00 - 17:00
3. User chọn ngày: 01/01/2024 - 31/12/2024
4. User chọn các ngày: T2-T6

**Hệ thống xử lý:**

```javascript
// 1. Tìm hoặc tạo shift
shift = findShift("08:00", "17:00") || createShift("08:00", "17:00");

// 2. Tạo schedule cho MỖI nhân viên
for (employee in [A, B, C]) {
  createShiftSchedule({
    employeeId: employee.id,
    shiftId: shift.id,
    from: "2024-01-01",
    to: "2024-12-31",
    daysOfWeek: [1, 2, 3, 4, 5],
  });
}
```

### Hiển thị danh sách

```javascript
// 1. Load tất cả shift_schedules
schedules = getShiftSchedules()

// 2. Nhóm theo: time + dateRange + daysOfWeek
grouped = groupBy(schedules, (s) =>
  `${s.startTime}-${s.endTime}-${s.from}-${s.to}-${s.daysOfWeek}`
)

// 3. Gộp nhân viên
result = grouped.map(group => ({
  employees: group.map(s => s.employee),
  time: group[0].time,
  dateRange: group[0].dateRange,
  ...
}))
```

## Troubleshooting

### Lỗi: "No employees in dropdown"

```bash
# Kiểm tra API
curl http://localhost:3000/api/employees

# Kiểm tra database
docker exec project-base-dev-postgres psql -U postgres -d project-base \
  -c "SELECT COUNT(*) FROM employee;"

# Xem logs
docker logs project-base-server -f
```

### Lỗi: "Cannot create schedule"

```bash
# Kiểm tra shift table
docker exec project-base-dev-postgres psql -U postgres -d project-base \
  -c "SELECT * FROM shift;"

# Kiểm tra migration đã chạy chưa
docker exec project-base-dev-postgres psql -U postgres -d project-base \
  -c "\d shift_schedule"
```

### Lỗi: "NaN in work_duration"

```sql
-- Chạy lại calculation
UPDATE shift
SET work_duration = CASE
  WHEN EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60 < 0
  THEN (EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60) + 1440
  ELSE (EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60)
END
WHERE work_duration = 0 OR work_duration IS NULL;
```

### Lỗi: EPERM khi generate Prisma

```bash
# Dừng server trước
docker-compose stop server

# Xóa generated cũ
rm -rf packages/db/prisma/generated

# Generate lại
cd packages/db && bunx prisma generate

# Khởi động server
docker-compose up -d server
```

## Database Schema

### shift table

```sql
_id                 VARCHAR(255) PRIMARY KEY
name                VARCHAR(255)
code                VARCHAR(255) UNIQUE      -- Mới
start_time          VARCHAR(50)
end_time            VARCHAR(50)
break_duration      INTEGER DEFAULT 0        -- Mới
work_duration       INTEGER DEFAULT 0        -- Mới
color               VARCHAR(50)              -- Mới
description         TEXT
is_active           BOOLEAN
auto_approve        BOOLEAN                  -- Mới
company_id          VARCHAR(255)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### shift_schedule table

```sql
_id                   VARCHAR(255) PRIMARY KEY
employee_id           VARCHAR(255)           -- Nullable
employee_group_id     VARCHAR(255)           -- Mới
shift_id              VARCHAR(255)
scheduled_from_date   DATE
scheduled_to_date     DATE
days_of_week          TEXT                   -- Mới: JSON [0-6]
note                  TEXT
created_by            VARCHAR(255)
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### employee_group table (Mới)

```sql
_id             VARCHAR(255) PRIMARY KEY
name            VARCHAR(255)
description     TEXT
created_by      VARCHAR(255)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### employee_group_member table (Mới)

```sql
_id                VARCHAR(255) PRIMARY KEY
employee_group_id  VARCHAR(255)
employee_id        VARCHAR(255)
created_at         TIMESTAMP

UNIQUE(employee_group_id, employee_id)
```

## Validation Rules

### Form Frontend

- ✅ Nhân viên: Bắt buộc, >= 1 người
- ✅ Giờ làm: Bắt buộc, HH:mm format
- ✅ Khoảng thời gian: Bắt buộc, from <= to
- ✅ Ngày trong tuần: Bắt buộc, >= 1 ngày
- ℹ️ Ghi chú: Tùy chọn

### Backend API

- ✅ Kiểm tra shift tồn tại
- ✅ Kiểm tra employee tồn tại
- ✅ Validate date range
- ⚠️ Không check conflict (cho phép trùng lịch)

## Features Roadmap

### Phase 1 ✅ (Completed)

- [x] Basic shift assignment
- [x] Multiple employee selection
- [x] Flexible time input
- [x] Date range selection
- [x] Days of week selection
- [x] Ant Design UI

### Phase 2 (Planned)

- [ ] Conflict detection (cảnh báo khi trùng lịch)
- [ ] Batch operations (import Excel)
- [ ] Template shifts (mẫu phân ca)
- [ ] Export reports

### Phase 3 (Future)

- [ ] Rotation schedules (luân phiên)
- [ ] Overtime tracking
- [ ] Integration with timekeeping
- [ ] Mobile app support

## Quick Commands

```bash
# Chạy migration
cat packages/db/prisma/migrations/manual_add_shift_fields.sql | \
  docker exec -i project-base-dev-postgres psql -U postgres -d project-base

# Generate Prisma
cd packages/db && bunx prisma generate

# Restart server
docker-compose restart server

# View logs
docker logs project-base-server -f

# Check employees
curl http://localhost:3000/api/employees | jq '.data | length'

# Check shifts
curl http://localhost:3000/api/shifts/all | jq '.data'

# Check schedules
curl http://localhost:3000/api/shift-schedules | jq '.data | length'
```

## Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker logs project-base-server`
2. Kiểm tra database: Chạy các query SQL ở phần Troubleshooting
3. Restart server: `docker-compose restart server`
4. Xóa cache: `rm -rf packages/db/prisma/generated`

## Liên hệ

- Documentation: `docs/features/shift-management-simple.md`
- API Code: `apps/server/src/routes/`
- Frontend Code: `apps/web/src/routes/_workspace/shifts.tsx`
