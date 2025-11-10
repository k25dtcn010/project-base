import { AccessTime, CheckCircle, Warning } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

dayjs.extend(isoWeek);

export const Route = createFileRoute("/_workspace/timekeeping")({
  component: TimekeepingComponent,
});

interface AttendanceShift {
  id: string;
  shiftId: string;
  workDate: string;
  actualStartTime: string;
  actualEndTime: string;
  durationMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  isApproved: boolean;
  note: string | null;
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface Attendance {
  id: string;
  employeeId: string;
  checkInTime: string;
  checkOutTime: string | null;
  location: string | null;
  note: string | null;
  isMissingCheckOut: boolean;
  attendanceShifts: AttendanceShift[];
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: {
      name: string;
    };
  };
}

interface ApiResponse {
  data: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ViewMode = "monthly" | "weekly";

interface DayData {
  date: string;
  shifts: AttendanceShift[];
  totalMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
}

interface TableRecord {
  key: string;
  week?: string;
  [key: string]: any;
}

function TimekeepingComponent() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock employee ID - replace with actual logged-in user
  const employeeId = "cm3cn3m1k0000d3nj4bv0u3fe";

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate, viewMode]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const startOfPeriod =
        viewMode === "monthly"
          ? currentDate.startOf("month").format("YYYY-MM-DD")
          : currentDate.startOf("isoWeek").format("YYYY-MM-DD");

      const endOfPeriod =
        viewMode === "monthly"
          ? currentDate.endOf("month").format("YYYY-MM-DD")
          : currentDate.endOf("isoWeek").format("YYYY-MM-DD");

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/attendance/employee/${employeeId}?from=${startOfPeriod}&to=${endOfPeriod}&limit=100`
      );

      if (response.ok) {
        const result: ApiResponse = await response.json();
        setAttendanceData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handlePrevious = () => {
    setCurrentDate((prev) => prev.subtract(1, viewMode === "monthly" ? "month" : "week"));
  };

  const handleNext = () => {
    setCurrentDate((prev) => prev.add(1, viewMode === "monthly" ? "month" : "week"));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  // Process attendance data into day-based structure
  const dayDataMap = useMemo(() => {
    const map = new Map<string, DayData>();

    attendanceData.forEach((attendance) => {
      attendance.attendanceShifts.forEach((shift) => {
        const dateKey = dayjs(shift.workDate).format("YYYY-MM-DD");
        const existing = map.get(dateKey);

        if (existing) {
          existing.shifts.push(shift);
          existing.totalMinutes += shift.durationMinutes;
          existing.lateMinutes += shift.lateMinutes;
          existing.earlyMinutes += shift.earlyLeaveMinutes;
        } else {
          map.set(dateKey, {
            date: dateKey,
            shifts: [shift],
            totalMinutes: shift.durationMinutes,
            lateMinutes: shift.lateMinutes,
            earlyMinutes: shift.earlyLeaveMinutes,
          });
        }
      });
    });

    return map;
  }, [attendanceData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalHours = 0;
    let totalLateMinutes = 0;
    let totalEarlyMinutes = 0;
    let approvedDays = 0;
    let pendingDays = 0;

    dayDataMap.forEach((dayData) => {
      totalHours += dayData.totalMinutes / 60;
      totalLateMinutes += dayData.lateMinutes;
      totalEarlyMinutes += dayData.earlyMinutes;

      const hasApproved = dayData.shifts.some((s) => s.isApproved);
      const hasPending = dayData.shifts.some((s) => !s.isApproved);

      if (hasApproved) approvedDays++;
      if (hasPending) pendingDays++;
    });

    return {
      totalHours: totalHours.toFixed(1),
      totalLateMinutes,
      totalEarlyMinutes,
      approvedDays,
      pendingDays,
      workingDays: dayDataMap.size,
    };
  }, [dayDataMap]);

  // Render shift cell content
  const renderShiftCell = (dateStr: string) => {
    const dayData = dayDataMap.get(dateStr);
    if (!dayData || dayData.shifts.length === 0) {
      return <Typography variant="body2" color="text.disabled">-</Typography>;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {dayData.shifts.map((shift, idx) => (
          <Box key={idx} sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Tag color={shift.isApproved ? "green" : "gold"}>
                {shift.shift.name}
              </Tag>
              <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                {dayjs(shift.actualStartTime).format("HH:mm")} - {dayjs(shift.actualEndTime).format("HH:mm")}
              </Typography>
            </Box>
            {shift.lateMinutes > 0 && (
              <Tag color="warning" icon={<Warning style={{ fontSize: 12 }} />}>
                Muộn {shift.lateMinutes}p
              </Tag>
            )}
            {shift.earlyLeaveMinutes > 0 && (
              <Tag color="error">Sớm {shift.earlyLeaveMinutes}p</Tag>
            )}
            {shift.note && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                {shift.note}
              </Typography>
            )}
          </Box>
        ))}
        <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 600, mt: 0.5 }}>
          {(dayData.totalMinutes / 60).toFixed(1)}h
        </Typography>
      </Box>
    );
  };

  // Generate columns and data for monthly view
  const monthlyColumns: ColumnsType<TableRecord> = useMemo(() => {
    const daysInMonth = currentDate.daysInMonth();
    const cols: ColumnsType<TableRecord> = [
      {
        title: "Tuần",
        dataIndex: "week",
        key: "week",
        fixed: "left",
        width: 80,
        align: "center",
      },
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentDate.date(day);
      const isWeekend = date.day() === 0 || date.day() === 6;
      const dateStr = date.format("YYYY-MM-DD");

      cols.push({
        title: (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
              {day}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.65rem", display: "block", color: isWeekend ? "error.main" : "text.secondary" }}>
              {date.format("dd")}
            </Typography>
          </Box>
        ),
        dataIndex: `day_${day}`,
        key: `day_${day}`,
        width: 120,
        align: "center",
        render: () => renderShiftCell(dateStr),
      });
    }

    return cols;
  }, [currentDate, dayDataMap]);

  const monthlyData: TableRecord[] = useMemo(() => {
    const weeks = Math.ceil(currentDate.daysInMonth() / 7);
    const data: TableRecord[] = [];

    for (let week = 0; week < weeks; week++) {
      const record: TableRecord = {
        key: `week_${week}`,
        week: `W${week + 1}`,
      };

      for (let day = 1; day <= currentDate.daysInMonth(); day++) {
        record[`day_${day}`] = day;
      }

      data.push(record);
    }

    return data.slice(0, 1); // Single row for monthly view
  }, [currentDate]);

  // Generate columns and data for weekly view
  const weeklyColumns: ColumnsType<TableRecord> = useMemo(() => {
    const cols: ColumnsType<TableRecord> = [];
    const startOfWeek = currentDate.startOf("isoWeek");

    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, "day");
      const dateStr = date.format("YYYY-MM-DD");
      const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      const isWeekend = i >= 5;

      cols.push({
        title: (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isWeekend ? "error.main" : "inherit" }}>
              {dayNames[i]}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {date.format("DD/MM")}
            </Typography>
          </Box>
        ),
        dataIndex: `day_${i}`,
        key: `day_${i}`,
        width: 150,
        align: "center",
        render: () => renderShiftCell(dateStr),
      });
    }

    return cols;
  }, [currentDate, dayDataMap]);

  const weeklyData: TableRecord[] = useMemo(() => {
    return [
      {
        key: "week_1",
      },
    ];
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AccessTime sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Chấm công
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="monthly">Tháng</ToggleButton>
          <ToggleButton value="weekly">Tuần</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Tổng giờ làm</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>
              {summary.totalHours}h
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Số ngày làm</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {summary.workingDays}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Đi muộn</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "warning.main" }}>
              {summary.totalLateMinutes}p
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Về sớm</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "error.main" }}>
              {summary.totalEarlyMinutes}p
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Đã duyệt</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "success.main" }}>
              {summary.approvedDays}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Chờ duyệt</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "warning.main" }}>
              {summary.pendingDays}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mb: 2 }}>
        <button onClick={handlePrevious} style={{ padding: "8px 16px", cursor: "pointer" }}>
          ◀ Trước
        </button>
        <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 200, textAlign: "center" }}>
          {viewMode === "monthly"
            ? currentDate.format("MMMM YYYY")
            : `Tuần ${currentDate.isoWeek()} - ${currentDate.format("YYYY")}`}
        </Typography>
        <button onClick={handleNext} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Sau ▶
        </button>
        <button onClick={handleToday} style={{ padding: "8px 16px", cursor: "pointer", marginLeft: 16 }}>
          Hôm nay
        </button>
      </Box>

      {/* Table */}
      <Card>
        <Table
          columns={viewMode === "monthly" ? monthlyColumns : weeklyColumns}
          dataSource={viewMode === "monthly" ? monthlyData : weeklyData}
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content" }}
          bordered
          size="small"
        />
      </Card>
    </Container>
  );
}
