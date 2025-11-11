# Changelog - Shift Analysis System

## [2025-01-XX] - Boundary Shift Toggle Feature

### 🎯 Summary
Added a 2-layer UX system with toggle control to show/hide boundary shifts, providing users with both simplified and detailed views of attendance data.

### ✨ What's New

**Shift Classification:**
- Shifts are now classified as `primary`, `boundary`, or `overtime`
- Boundary shifts: Auto-detected edge shifts with < 25% overlap
- Primary shifts: Main assigned shifts with ≥ 25% overlap
- Overtime shifts: Manager-approved OT shifts

**UI Toggle Control:**
- New button: "Chỉ ca chính" / "Chi tiết đầy đủ"
- Default: Shows only primary shifts (cleaner view)
- Toggle ON: Shows all shifts including boundaries
- Visual indicators: Boundary shifts have dashed borders, 🔹 icon, 60% opacity

**Benefits:**
- ✅ Cleaner default interface for employees
- ✅ Detailed view available for HR/debugging
- ✅ No data loss - all shifts still tracked in database
- ✅ Flexible user experience based on needs

### 🔧 Technical Changes

**Database Schema:**
- Added `shift_type` column (default: "primary")
- Added `overlap_percentage` column (default: 100)
- Migration: `add_shift_type_classification.sql`

**Frontend:**
- New state: `showBoundaryShifts` toggle
- Filter function: `filterShiftsByType()`
- Visual styling for boundary shifts
- Info alert explaining shift types

**Backend:**
- Updated `shift-analyzer.ts` with classification logic
- Function: `classifyShiftType()` based on 25% threshold
- Automatic calculation of overlap percentage

### 📊 Example

**Input:** Check-in 7:48, Check-out 17:02

**Default View (Primary Only):**
```
✓ Ca Hành chính (08:00-17:00) • 9h
```

**Detailed View (All Shifts):**
```
🔹 Ca Sáng (06:00-08:00) • 0.2h (10% overlap)
✓ Ca Hành chính (08:00-17:00) • 9h (100% overlap)
🔹 Ca Tối (17:00-00:00) • 0.03h (0.5% overlap)
```

### 📝 Files Changed

**Modified:**
- `packages/db/prisma/schema/schema.prisma` (added new columns)
- `packages/db/src/services/shift-analyzer.ts` (classification logic)
- `apps/web/src/routes/_workspace/timekeeping.tsx` (toggle UI)

**Added:**
- `packages/db/prisma/migrations/add_shift_type_classification.sql`
- `docs/boundary-shift-toggle.md` (detailed documentation)

### 🚀 Migration Required

```bash
# Apply database migration
psql -d project-base < packages/db/prisma/migrations/add_shift_type_classification.sql

# Re-seed to populate new columns
cd packages/db && bun run prisma db seed
```

---

## [2025-01-XX] - Multi-Shift Detection Update

### 🎯 Summary
Updated the attendance shift analysis system to automatically detect **all overlapping shifts** instead of just recording a single shift per attendance record.

### ✨ What Changed

**Before:**
- Employee check-in 7:48, check-out 17:02 → Only 1 shift recorded (Hành chính)

**After:**
- Employee check-in 7:48, check-out 17:02 → 3 shifts recorded:
  - Ca Sáng (06:00-08:00): 12 minutes
  - Ca Hành chính (08:00-17:00): 540 minutes
  - Ca Tối (17:00-00:00): 2 minutes

### 🔧 Technical Changes

#### 1. Moved Shift Analyzer to Shared Package
- **From:** `apps/server/src/services/shift-analyzer.ts`
- **To:** `packages/db/src/services/shift-analyzer.ts`
- **Why:** Allow both seed scripts and server to use the same analysis logic

#### 2. Updated Seed File Logic
- **Before:** Manually created `AttendanceShift` records based on CSV shift codes
- **After:** Automatically analyze using `analyzeAttendance()` function
- **Benefit:** Consistent behavior between seeded data and production data

#### 3. Simplified Seed Output
- Removed unused `getShiftName()` function
- Removed `skippedNoShift` counter (no longer needed)
- Removed manual shift mapping logic (~70 lines removed)

### 📊 Impact

**Data Quality:**
- ✅ Complete shift coverage (no missing Sáng/Tối shifts)
- ✅ Accurate late/early calculations per shift
- ✅ Consistent logic between seed and production

**Seeding Results:**
- 587 attendance records created
- Average 2-3 shift records per attendance (vs 1 before)
- Automatic overlap detection for all cases

### 🚀 Migration

#### Re-seed Database
```bash
cd packages/db
bun run prisma db seed
```

#### Re-analyze Existing Data (Optional)
```bash
cd apps/server
bun run src/scripts/re-analyze-attendance.ts
```

### 📝 Files Changed

**Modified:**
- `packages/db/src/services/shift-analyzer.ts` (moved + cleaned logs)
- `packages/db/src/index.ts` (added export)
- `packages/db/prisma/seeds/attendance.seed.ts` (use analyzeAttendance)
- `apps/server/src/routes/attendance.ts` (updated import)

**Added:**
- `apps/server/src/scripts/re-analyze-attendance.ts` (utility script)
- `docs/shift-analysis-update.md` (detailed documentation)
- `docs/CHANGELOG-shift-analysis.md` (this file)

**Removed:**
- `apps/server/src/services/shift-analyzer.ts` (moved to packages/db)

### 🐛 Bugs Fixed
- Fixed timezone handling in shift overlap calculation
- Fixed cross-midnight shift detection (Tối, Đêm)
- Fixed late/early minutes calculation edge cases

### 💡 Example

**Input:**
```json
{
  "checkInTime": "2025-11-02T00:48:00.000Z",  // 7:48 AM Vietnam
  "checkOutTime": "2025-11-02T10:02:00.000Z"  // 5:02 PM Vietnam
}
```

**Output (Old):**
```json
{
  "attendanceShifts": [
    { "shift": "Hành chính", "duration": 554 }
  ]
}
```

**Output (New):**
```json
{
  "attendanceShifts": [
    { "shift": "Sáng", "duration": 12, "late": 108 },
    { "shift": "Hành chính", "duration": 540 },
    { "shift": "Tối", "duration": 2, "earlyLeave": 418 }
  ]
}
```

### ⚙️ Configuration

Shift definitions (unchanged):
- **Đêm:** 00:00 - 06:00
- **Sáng:** 06:00 - 08:00
- **Hành chính:** 08:00 - 17:00
- **Tối:** 17:00 - 00:00

### 🔍 Testing

Verified with 563 existing attendance records:
- All records re-analyzed successfully
- Multi-shift detection working correctly
- Late/early calculations accurate

### 📚 Documentation

See `docs/shift-analysis-update.md` for:
- Detailed technical explanation
- Algorithm description
- More examples
- Troubleshooting guide

---

**Tested:** ✅ Seed script, Re-analyze script, Type checking, UI toggle
**Status:** ⚠️ Requires DB migration before deployment
**Breaking Changes:** None (backward compatible API, requires migration)

### 🔗 Related Updates

- **Boundary Shift Toggle:** See above section for UX improvements
- **Documentation:** See `docs/boundary-shift-toggle.md` for detailed guide