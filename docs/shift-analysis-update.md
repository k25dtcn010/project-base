# Shift Analysis System Update

## Tổng quan

Hệ thống phân tích ca làm việc đã được cập nhật để **tự động phát hiện tất cả các ca overlap** khi nhân viên chấm công, thay vì chỉ ghi nhận 1 ca duy nhất như trước đây.

## Vấn đề trước đây

### Hành vi cũ
- Khi nhân viên chấm công từ **7:48 - 17:02**, hệ thống chỉ tạo 1 `AttendanceShift` record:
  - **Ca Hành chính** (08:00-17:00)

### Vấn đề
- Mất thông tin về các ca khác mà nhân viên đã làm việc
- Không thể tính lương chính xác cho các ca Sáng/Tối
- Dữ liệu từ seed (CSV) và production không nhất quán

## Giải pháp mới

### Hành vi mới
- Khi nhân viên chấm công từ **7:48 - 17:02**, hệ thống tạo **3 AttendanceShift records**:
  1. **Ca Sáng** (06:00-08:00): 12 phút (7:48 → 8:00)
  2. **Ca Hành chính** (08:00-17:00): 540 phút (8:00 → 17:00)
  3. **Ca Tối** (17:00-00:00): 2 phút (17:00 → 17:02)

### Logic phát hiện overlap

```typescript
// Với mỗi ca, tính toán overlap giữa [checkIn, checkOut] và [shiftStart, shiftEnd]
const overlapStart = max(checkIn, shiftStart);
const overlapEnd = min(checkOut, shiftEnd);

if (overlapStart < overlapEnd) {
  // Có overlap → Tạo AttendanceShift record
  const duration = overlapEnd - overlapStart;
}
```

## Thay đổi kỹ thuật

### 1. Di chuyển `shift-analyzer.ts`

**Trước:**
```
apps/server/src/services/shift-analyzer.ts
```

**Sau:**
```
packages/db/src/services/shift-analyzer.ts
```

**Lý do:** Cho phép cả seed script và server đều sử dụng cùng logic phân tích.

### 2. Cập nhật Seed File

**Trước:** Tạo `AttendanceShift` thủ công dựa trên shift code từ CSV
```typescript
// Với mỗi record trong CSV
const shift = shiftMap.get(record.shiftCode); // "HC", "S", "T", "D"
await db.attendanceShift.create({
  shiftId: shift.id,
  // ... tính toán thủ công
});
```

**Sau:** Sử dụng `analyzeAttendance()` để tự động phát hiện
```typescript
// Tạo attendance record
const attendance = await db.attendance.create({
  checkInTime: earliestCheckIn,
  checkOutTime: latestCheckOut,
});

// Tự động phân tích và tạo tất cả shifts overlap
await analyzeAttendance(attendance.id);
```

### 3. Export từ DB Package

```typescript
// packages/db/src/index.ts
export { analyzeAttendance } from "./services/shift-analyzer";

// apps/server/src/routes/attendance.ts
import { analyzeAttendance, db } from "@project-base/db";
```

## Cấu hình Ca làm việc

Hệ thống hỗ trợ 4 ca cơ bản:

| Ca | Giờ bắt đầu | Giờ kết thúc | Ghi chú |
|---|---|---|---|
| **Đêm** | 00:00 | 06:00 | Cross-midnight |
| **Sáng** | 06:00 | 08:00 | - |
| **Hành chính** | 08:00 | 17:00 | - |
| **Tối** | 17:00 | 00:00 | Cross-midnight |

### Cross-midnight Shifts

Các ca qua đêm (endTime <= startTime) được xử lý đặc biệt:

```typescript
if (shift.endTime <= shift.startTime) {
  // Ca kết thúc vào ngày hôm sau
  shiftEnd = shiftEnd.add(1, "day");
}
```

## Ví dụ thực tế

### Case 1: Chấm công 7:15 - 17:17

**Input:**
- Check-in: 07:15
- Check-out: 17:17

**Output:**
```json
{
  "attendanceShifts": [
    {
      "shift": "Sáng (06:00-08:00)",
      "duration": 45,
      "late": 75,
      "earlyLeave": 0
    },
    {
      "shift": "Hành chính (08:00-17:00)",
      "duration": 540,
      "late": 0,
      "earlyLeave": 0
    },
    {
      "shift": "Tối (17:00-00:00)",
      "duration": 17,
      "late": 0,
      "earlyLeave": 403
    }
  ]
}
```

### Case 2: Chấm công đúng giờ 8:00 - 17:00

**Input:**
- Check-in: 08:00
- Check-out: 17:00

**Output:**
```json
{
  "attendanceShifts": [
    {
      "shift": "Hành chính (08:00-17:00)",
      "duration": 540,
      "late": 0,
      "earlyLeave": 0
    }
  ]
}
```

Không có overlap với ca Sáng hoặc Tối.

## Tính toán Late/Early Leave

### Late Minutes
Chỉ tính **đi muộn** nếu:
- Check-in **sau** shift start time
- Check-in **trong** khoảng thời gian của ca

```typescript
let lateMinutes = 0;
if (checkIn.isAfter(shiftStart) && checkIn.isBefore(shiftEnd)) {
  lateMinutes = minutesDiff(shiftStart, checkIn);
}
```

### Early Leave Minutes
Chỉ tính **về sớm** nếu:
- Check-out **trước** shift end time
- Check-out **trong** khoảng thời gian của ca

```typescript
let earlyLeaveMinutes = 0;
if (checkOut.isBefore(shiftEnd) && checkOut.isAfter(shiftStart)) {
  earlyLeaveMinutes = minutesDiff(checkOut, shiftEnd);
}
```

## Migration & Re-seeding

### Chạy lại seed
```bash
cd packages/db
bun run prisma db seed
```

Kết quả:
- ✅ Tạo 587 attendance records
- ✅ Tự động phân tích và tạo nhiều shift records
- ✅ Mỗi attendance có thể có 1-4 shifts tùy vào thời gian check-in/out

### Re-analyze dữ liệu cũ (nếu cần)
```bash
cd apps/server
bun run src/scripts/re-analyze-attendance.ts
```

Script này sẽ:
1. Lấy tất cả attendance records có check-out time
2. Xóa các AttendanceShift records cũ
3. Chạy lại `analyzeAttendance()` cho từng record
4. Tạo lại tất cả shift segments với logic mới

## Testing

### Test Case 1: Check-in sớm, check-out muộn
```typescript
// Check-in: 6:30, Check-out: 18:00
// Expected: 3 shifts (Sáng, Hành chính, Tối)
```

### Test Case 2: Check-in/out trong 1 ca
```typescript
// Check-in: 9:00, Check-out: 16:00
// Expected: 1 shift (Hành chính)
```

### Test Case 3: Cross-midnight
```typescript
// Check-in: 23:00, Check-out: 02:00 (ngày hôm sau)
// Expected: 2 shifts (Tối ngày 1, Đêm ngày 2)
```

## API Changes

### Check-out endpoint
**Trước và sau:** Không đổi, vẫn gọi `analyzeAttendance()` sau khi update check-out time

```typescript
POST /api/attendance/check-out
{
  "attendanceId": "xxx"
}

Response:
{
  "attendance": {...},
  "shifts": [
    { "shift": "Sáng", ... },
    { "shift": "Hành chính", ... },
    { "shift": "Tối", ... }
  ]
}
```

## Performance Considerations

- Với mỗi attendance, hệ thống cần check **tối đa 4 ca × số ngày**
- Ví dụ: 1 attendance trong 1 ngày = 4 checks
- Ví dụ: 1 attendance cross 2 ngày = 8 checks
- Vẫn rất nhanh vì chỉ là tính toán đơn giản

## Timezone

Tất cả tính toán sử dụng **Asia/Ho_Chi_Minh (UTC+7)**:

```typescript
const TIMEZONE = "Asia/Ho_Chi_Minh";
const checkIn = dayjs(attendance.checkInTime).tz(TIMEZONE);
```

## Troubleshooting

### Vấn đề: Không tạo được shift mong muốn

**Kiểm tra:**
1. Shift có `isActive = true` không?
2. Timezone có đúng không?
3. Check-in/check-out time có hợp lệ không?

### Vấn đề: Late/early leave không chính xác

**Nguyên nhân:** Logic chỉ tính late/early trong phạm vi ca hiện tại

**Ví dụ:**
- Check-in 7:00, Ca Sáng bắt đầu 6:00
- Không tính late vì check-in trước shift start

## Future Improvements

- [ ] Support flexible shift configurations per company
- [ ] Optimize batch analysis for multiple attendances
- [ ] Add validation rules for shift overlap
- [ ] Dashboard để xem phân bố ca theo nhân viên/phòng ban

## References

- Source code: `packages/db/src/services/shift-analyzer.ts`
- Seed file: `packages/db/prisma/seeds/attendance.seed.ts`
- Test script: `apps/server/src/scripts/re-analyze-attendance.ts`
