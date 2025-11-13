-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "connection_type" TEXT,
ADD COLUMN     "device_brand" TEXT,
ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "device_model" TEXT,
ADD COLUMN     "is_physical_device" BOOLEAN,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "mobile_ip" TEXT,
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "wifi_bssid" TEXT,
ADD COLUMN     "wifi_ip" TEXT,
ADD COLUMN     "wifi_name" TEXT;

-- AlterTable
ALTER TABLE "attendance_shift" ADD COLUMN     "overlap_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "shift_type" TEXT NOT NULL DEFAULT 'primary';

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "device_brand" TEXT,
ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "device_model" TEXT,
ADD COLUMN     "last_activity_at" TIMESTAMP(3),
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "platform" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "department" TEXT,
ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "join_date" TIMESTAMP(3),
ADD COLUMN     "manager_id" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'employee';

-- CreateTable
CREATE TABLE "leave" (
    "_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "total_days" INTEGER NOT NULL,
    "used_days" INTEGER NOT NULL DEFAULT 0,
    "remaining_days" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "number_of_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approver_id" TEXT,
    "approver_comments" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_date" TIMESTAMP(3),
    "attachment" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "overtime_request" (
    "_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ot_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approver_id" TEXT,
    "approver_comments" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_request_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "leave_user_id_idx" ON "leave"("user_id");

-- CreateIndex
CREATE INDEX "leave_year_idx" ON "leave"("year");

-- CreateIndex
CREATE INDEX "leave_request_user_id_idx" ON "leave_request"("user_id");

-- CreateIndex
CREATE INDEX "leave_request_status_idx" ON "leave_request"("status");

-- CreateIndex
CREATE INDEX "leave_request_start_date_end_date_idx" ON "leave_request"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "overtime_request_user_id_idx" ON "overtime_request"("user_id");

-- CreateIndex
CREATE INDEX "overtime_request_status_idx" ON "overtime_request"("status");

-- CreateIndex
CREATE INDEX "overtime_request_ot_date_idx" ON "overtime_request"("ot_date");

-- CreateIndex
CREATE INDEX "user_manager_id_idx" ON "user"("manager_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leave" ADD CONSTRAINT "leave_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_request" ADD CONSTRAINT "overtime_request_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
