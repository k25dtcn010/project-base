-- CreateTable
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "company" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "csv_file" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "department" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "color_code" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "employee" (
    "_id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "birthday" TIMESTAMP(3),
    "id_card_number" TEXT,
    "id_card_issue_date" TIMESTAMP(3),
    "id_card_issuer" TEXT,
    "permanent_address" TEXT,
    "phone" TEXT,
    "education" TEXT,
    "start_date" TIMESTAMP(3),
    "relatives_note" TEXT,
    "department_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("_id")
);

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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_key" ON "department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employee_code_key" ON "employee"("employee_code");

-- CreateIndex
CREATE INDEX "employee_department_id_idx" ON "employee"("department_id");

-- CreateIndex
CREATE INDEX "employee_company_id_idx" ON "employee"("company_id");

-- CreateIndex
CREATE INDEX "employee_manager_id_idx" ON "employee"("manager_id");

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
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "department"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employee"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

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
