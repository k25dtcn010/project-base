/**
 * Work schedule configuration
 * Define working days and days off for the company
 */

/**
 * Days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

/**
 * Working days configuration
 * Chỉ nghỉ Chủ nhật, làm việc từ thứ 2 đến thứ 7
 */
export const WORKING_DAYS = [
  DAYS_OF_WEEK.MONDAY,    // Thứ 2
  DAYS_OF_WEEK.TUESDAY,   // Thứ 3
  DAYS_OF_WEEK.WEDNESDAY, // Thứ 4
  DAYS_OF_WEEK.THURSDAY,  // Thứ 5
  DAYS_OF_WEEK.FRIDAY,    // Thứ 6
  DAYS_OF_WEEK.SATURDAY,  // Thứ 7 - Làm việc
] as const;

/**
 * Days off configuration
 * Chỉ nghỉ Chủ nhật
 */
export const DAYS_OFF = [
  DAYS_OF_WEEK.SUNDAY, // Chủ nhật
] as const;

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return WORKING_DAYS.includes(dayOfWeek as typeof WORKING_DAYS[number]);
}

/**
 * Check if a date is a day off
 */
export function isDayOff(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return DAYS_OFF.includes(dayOfWeek as typeof DAYS_OFF[number]);
}

/**
 * Get day name in Vietnamese
 */
export function getDayNameVi(dayOfWeek: number): string {
  const dayNames: Record<number, string> = {
    [DAYS_OF_WEEK.SUNDAY]: "Chủ nhật",
    [DAYS_OF_WEEK.MONDAY]: "Thứ 2",
    [DAYS_OF_WEEK.TUESDAY]: "Thứ 3",
    [DAYS_OF_WEEK.WEDNESDAY]: "Thứ 4",
    [DAYS_OF_WEEK.THURSDAY]: "Thứ 5",
    [DAYS_OF_WEEK.FRIDAY]: "Thứ 6",
    [DAYS_OF_WEEK.SATURDAY]: "Thứ 7",
  };
  
  return dayNames[dayOfWeek] || "Không xác định";
}
