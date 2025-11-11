# Boundary Shift Toggle Feature

## 📋 Overview

The **Boundary Shift Toggle** feature provides a 2-layer UX system for displaying attendance shifts, allowing users to switch between a simplified view (primary shifts only) and a detailed view (all shifts including boundary shifts).

## 🎯 Problem Solved

When employees check in/out across multiple shift periods (e.g., 7:48 AM - 5:02 PM), the system automatically detects all overlapping shifts:

- **Ca Sáng** (06:00-08:00): 12 minutes
- **Ca Hành chính** (08:00-17:00): 540 minutes  
- **Ca Tối** (17:00-00:00): 2 minutes

While this is technically accurate, displaying all three shifts can create visual clutter and confusion for regular users who only care about their primary shift (Hành chính).

## 🔹 Shift Classification

### Shift Types

| Type | Definition | Criteria | Example |
|------|------------|----------|---------|
| **Primary** | Main assigned shift with significant overlap | Overlap ≥ 25% of shift duration | Check-in 8:00, working full Hành chính shift |
| **Boundary** | Auto-detected edge shifts with minimal overlap | Overlap < 25% of shift duration | Check-in 7:48, only 12min of Sáng shift |
| **Overtime** | Approved overtime shifts | Manager approved, request-based | Approved OT 20:00-22:00 |

### Calculation Logic

```typescript
const shiftDuration = getShiftDurationMinutes(shift.startTime, shift.endTime);
const overlapPercentage = (actualDuration / shiftDuration) * 100;

if (overlapPercentage < 25) {
  shiftType = "boundary";
} else {
  shiftType = "primary";
}
```

## 🎨 User Interface

### Default View (Boundary Shifts Hidden)

**Button Label:** "Chỉ ca chính" with green "Đã lọc" badge

**Display:**
- ✅ Primary shifts (overlap ≥ 25%)
- ✅ Overtime shifts (approved)
- ❌ Boundary shifts (hidden)

**Benefits:**
- Clean, uncluttered interface
- Focus on main work shifts
- Reduced visual noise

### Detailed View (All Shifts Shown)

**Button Label:** "Chi tiết đầy đủ" (primary button style)

**Display:**
- ✅ Primary shifts (solid border)
- ✅ Boundary shifts (dashed border, 60% opacity, 🔹 icon)
- ✅ Overtime shifts

**Visual Indicators for Boundary Shifts:**
- 🔹 Icon prefix
- Dashed border style
- 60% opacity
- Tooltip shows overlap percentage

**Info Alert:**
```
Chế độ hiển thị chi tiết đầy đủ

Đang hiển thị tất cả các ca, bao gồm:
• Ca chính: Ca được phân công chính thức
• 🔹 Ca biên (boundary): Ca phát sinh tự động khi nhân viên làm 
  việc xuyên khung giờ (overlap < 25%)

💡 Gợi ý: Click nút "Chi tiết đầy đủ" để chỉ hiển thị ca chính, 
giúp giao diện gọn gàng hơn.
```

## 🔧 Technical Implementation

### Database Schema

```prisma
model AttendanceShift {
  // ... existing fields
  shiftType         String    @default("primary") @map("shift_type") 
  overlapPercentage Float     @default(100) @map("overlap_percentage")
}
```

**Migration:** `add_shift_type_classification.sql`

### Frontend State Management

```typescript
const [showBoundaryShifts, setShowBoundaryShifts] = useState(false);

const filterShiftsByType = (shifts: ShiftRecord[], showBoundary: boolean) => {
  if (showBoundary) return shifts;
  
  return shifts.filter(shift => 
    shift.shiftType === "primary" || shift.shiftType === "overtime"
  );
};
```

### Shift Type Detection

Located in: `packages/db/src/services/shift-analyzer.ts`

```typescript
function classifyShiftType(
  overlapPercentage: number,
): ShiftType {
  const BOUNDARY_THRESHOLD = 25; // 25% threshold
  
  if (overlapPercentage < BOUNDARY_THRESHOLD) {
    return "boundary";
  }
  
  return "primary";
}
```

## 📊 Examples

### Example 1: Early Arrival

**Check-in:** 07:15  
**Check-out:** 17:00

**Without Toggle (Detailed View):**
```
🔹 Ca Sáng (06:00-08:00)
   07:15-08:00 • 0.75h • Late 75min

✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h
```

**With Toggle (Primary Only):**
```
✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h
```

### Example 2: Late Departure

**Check-in:** 08:00  
**Check-out:** 17:17

**Without Toggle:**
```
✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h

🔹 Ca Tối (17:00-00:00)
   17:00-17:17 • 0.28h
```

**With Toggle:**
```
✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h
```

### Example 3: Full Day Work

**Check-in:** 07:48  
**Check-out:** 17:02

**Without Toggle:**
```
🔹 Ca Sáng (06:00-08:00)
   07:48-08:00 • 0.2h (10% overlap)

✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h (100% overlap)

🔹 Ca Tối (17:00-00:00)
   17:00-17:02 • 0.03h (0.5% overlap)
```

**With Toggle:**
```
✓ Ca Hành chính (08:00-17:00)
   08:00-17:00 • 9h
```

## 🎛️ Configuration

### Boundary Threshold

Default: **25%**

Located in: `shift-analyzer.ts`

```typescript
const BOUNDARY_THRESHOLD = 25; // 25% threshold for boundary shifts
```

**Adjustable values:**
- **15-20%:** More strict, fewer boundary shifts
- **25-30%:** Balanced (recommended)
- **35-40%:** More lenient, more shifts classified as primary

### Default Toggle State

Current: `showBoundaryShifts = false` (hidden by default)

To change default:
```typescript
const [showBoundaryShifts, setShowBoundaryShifts] = useState(true); // Show by default
```

## 🔍 Use Cases

### For Employees
**Default View (Primary Only):**
- Quick view of main work shift
- No confusion about "extra" shifts
- Clear understanding of work hours

**Detailed View (All Shifts):**
- Verify early arrival/late departure
- Check if all work time is tracked
- Debug discrepancies

### For HR/Managers
**Default View:**
- Quick overview of attendance
- Focus on main shifts
- Less visual clutter

**Detailed View:**
- Audit all work periods
- Verify overtime calculations
- Debug edge cases

### For Payroll
**Detailed View Recommended:**
- Calculate exact work hours including boundaries
- Track all overtime (even small amounts)
- Ensure accurate compensation

## 📈 Benefits

| Aspect | Benefit |
|--------|---------|
| **UX** | Cleaner interface, less cognitive load |
| **Accuracy** | All data still stored, nothing lost |
| **Flexibility** | Users choose level of detail |
| **Debugging** | Detailed view helps troubleshoot |
| **Training** | Easier for new users to understand |

## 🚀 Future Enhancements

- [ ] User preference persistence (save toggle state per user)
- [ ] Company-level default configuration
- [ ] Custom threshold per shift type
- [ ] Visual analytics showing boundary shift distribution
- [ ] Export options with/without boundary shifts

## 🐛 Troubleshooting

### Issue: Boundary shifts still showing when toggle is off

**Check:**
1. Verify `showBoundaryShifts` state value
2. Ensure `filterShiftsByType` is applied to data
3. Check useMemo dependencies include `showBoundaryShifts`

### Issue: All shifts classified as primary

**Check:**
1. Database migration completed successfully
2. `overlapPercentage` calculated correctly
3. `BOUNDARY_THRESHOLD` value appropriate

### Issue: Toggle button not working

**Check:**
1. State update function called correctly
2. React re-render triggered
3. No conflicting state management

## 📚 Related Documentation

- [Shift Analysis System Update](./shift-analysis-update.md)
- [Changelog - Shift Analysis](./CHANGELOG-shift-analysis.md)
- Database Migration: `add_shift_type_classification.sql`
- Source Code: `apps/web/src/routes/_workspace/timekeeping.tsx`

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ Implemented, pending DB migration