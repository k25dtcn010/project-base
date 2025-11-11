# Work Schedule Configuration

## Overview
This directory contains work schedule configuration for the company.

## Configuration

### Current Settings
- **Working Days**: Thứ 2 đến Thứ 7 (Monday to Saturday)
- **Days Off**: Chủ nhật (Sunday only)

### File: `work-schedule.ts`

Contains constants and utilities for managing work schedules:

#### Constants
- `DAYS_OF_WEEK`: Enum-like object for day indices (0 = Sunday, 6 = Saturday)
- `WORKING_DAYS`: Array of working days [1, 2, 3, 4, 5, 6] (Mon-Sat)
- `DAYS_OFF`: Array of days off [0] (Sunday only)

#### Utilities
- `isWorkingDay(date: Date): boolean` - Check if a date is a working day
- `isDayOff(date: Date): boolean` - Check if a date is a day off
- `getDayNameVi(dayOfWeek: number): string` - Get Vietnamese day name

## Usage

```typescript
import { WORKING_DAYS, DAYS_OFF, isWorkingDay, isDayOff } from '@project-base/db';

// Check if today is a working day
const today = new Date();
if (isWorkingDay(today)) {
  console.log('Today is a working day');
}

// Check if a specific date is day off
if (isDayOff(today)) {
  console.log('Today is a day off');
}

// Get working days
console.log('Working days:', WORKING_DAYS); // [1, 2, 3, 4, 5, 6]
console.log('Days off:', DAYS_OFF); // [0]
```

## Customization

To change the work schedule:

1. Edit `work-schedule.ts`
2. Update `WORKING_DAYS` and `DAYS_OFF` arrays
3. Example: To add Saturday as day off:
   ```typescript
   export const WORKING_DAYS = [1, 2, 3, 4, 5] as const;
   export const DAYS_OFF = [0, 6] as const;
   ```

## Impact

This configuration affects:
- Attendance seeding logic
- Shift schedule generation
- Working hours calculation
- Overtime calculation
- Reports and analytics
