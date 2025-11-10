-- CreateTable
CREATE TABLE "shift" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3),
    "location" TEXT,
    "note" TEXT,
    "is_missing_check_out" BOOLEAN NOT NULL DEFAULT false,
    "manager_confirmed_by" TEXT,
    "manager_confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "attendance_shift" (
    "_id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "work_date" DATE NOT NULL,
    "actual_start_time" TIMESTAMP(3) NOT NULL,
    "actual_end_time" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_leave_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_shift_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "shift_schedule" (
    "_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "scheduled_from_date" DATE NOT NULL,
    "scheduled_to_date" DATE NOT NULL,
    "note" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_schedule_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "attendance_request" (
    "_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "requested_date" DATE NOT NULL,
    "from_time" TIMESTAMP(3) NOT NULL,
    "to_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_request_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "attendance_employee_id_idx" ON "attendance"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_check_in_time_idx" ON "attendance"("check_in_time");

-- CreateIndex
CREATE INDEX "attendance_shift_attendance_id_idx" ON "attendance_shift"("attendance_id");

-- CreateIndex
CREATE INDEX "attendance_shift_shift_id_idx" ON "attendance_shift"("shift_id");

-- CreateIndex
CREATE INDEX "attendance_shift_work_date_idx" ON "attendance_shift"("work_date");

-- CreateIndex
CREATE INDEX "shift_schedule_employee_id_idx" ON "shift_schedule"("employee_id");

-- CreateIndex
CREATE INDEX "shift_schedule_shift_id_idx" ON "shift_schedule"("shift_id");

-- CreateIndex
CREATE INDEX "shift_schedule_scheduled_from_date_scheduled_to_date_idx" ON "shift_schedule"("scheduled_from_date", "scheduled_to_date");

-- CreateIndex
CREATE INDEX "attendance_request_employee_id_idx" ON "attendance_request"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_request_status_idx" ON "attendance_request"("status");

-- CreateIndex
CREATE INDEX "attendance_request_requested_date_idx" ON "attendance_request"("requested_date");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_manager_confirmed_by_fkey" FOREIGN KEY ("manager_confirmed_by") REFERENCES "employee"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_shift" ADD CONSTRAINT "attendance_shift_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_shift" ADD CONSTRAINT "attendance_shift_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_shift" ADD CONSTRAINT "attendance_shift_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employee"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_schedule" ADD CONSTRAINT "shift_schedule_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_schedule" ADD CONSTRAINT "shift_schedule_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_schedule" ADD CONSTRAINT "shift_schedule_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employee"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_request" ADD CONSTRAINT "attendance_request_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_request" ADD CONSTRAINT "attendance_request_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_request" ADD CONSTRAINT "attendance_request_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employee"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
