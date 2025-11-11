-- Add shift type classification columns to attendance_shift table
-- Migration: add_shift_type_classification

-- Add shiftType column (enum-like string: "primary" | "boundary" | "overtime")
ALTER TABLE "attendance_shift"
ADD COLUMN "shift_type" TEXT NOT NULL DEFAULT 'primary';

-- Add overlapPercentage column (percentage of shift duration covered)
ALTER TABLE "attendance_shift"
ADD COLUMN "overlap_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100;

-- Add comment for documentation
COMMENT ON COLUMN "attendance_shift"."shift_type" IS 'Type of shift: primary (assigned), boundary (auto-detected < 25%), or overtime (approved OT)';
COMMENT ON COLUMN "attendance_shift"."overlap_percentage" IS 'Percentage of shift duration covered by actual work time';

-- Create index for filtering by shift type (optional, for performance)
CREATE INDEX "idx_attendance_shift_type" ON "attendance_shift"("shift_type");

-- Update existing records to calculate their overlap percentage
-- This is a one-time update for existing data
UPDATE "attendance_shift"
SET "overlap_percentage" = CASE
  WHEN s.start_time <= s.end_time THEN
    -- Normal shift (within same day)
    (EXTRACT(EPOCH FROM ("actual_end_time" - "actual_start_time")) / 60.0) /
    (EXTRACT(EPOCH FROM (
      (DATE '2000-01-01' + s.end_time::TIME) - (DATE '2000-01-01' + s.start_time::TIME)
    )) / 60.0) * 100
  ELSE
    -- Cross-midnight shift
    (EXTRACT(EPOCH FROM ("actual_end_time" - "actual_start_time")) / 60.0) /
    (EXTRACT(EPOCH FROM (
      (DATE '2000-01-02' + s.end_time::TIME) - (DATE '2000-01-01' + s.start_time::TIME)
    )) / 60.0) * 100
END
FROM "shift" s
WHERE "attendance_shift"."shift_id" = s."_id";

-- Update shift_type based on calculated overlap percentage
UPDATE "attendance_shift"
SET "shift_type" = CASE
  WHEN "overlap_percentage" < 25 THEN 'boundary'
  ELSE 'primary'
END;
