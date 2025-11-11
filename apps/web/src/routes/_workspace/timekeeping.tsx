import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, Badge, Button, Card, DatePicker, Radio, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useMemo, useState } from "react";

dayjs.extend(isoWeek);

export const Route = createFileRoute("/_workspace/timekeeping")({
  component: TimekeepingPage,
});

// ---------- Types ----------
type ViewMode = "weekly" | "monthly";

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  description?: string;
  companyId?: string;
}

export interface ShiftRecord {
  shift: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  checkIn?: string;
  checkOut?: string;
  actualCheckIn?: string; // Giờ chấm công thực tế
  actualCheckOut?: string; // Giờ chấm công thực tế
  hours: number;
  missingHours: number;
  color: string;
  isApproved: boolean;
}

export interface DayRecord {
  shifts: ShiftRecord[];
  isHoliday?: boolean;
}

export interface WeeklyRow {
  key: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  mon: DayRecord;
  tue: DayRecord;
  wed: DayRecord;
  thu: DayRecord;
  fri: DayRecord;
  sat: DayRecord;
  sun: DayRecord;
}

export interface MonthDay {
  day: number;
  shifts: ShiftRecord[];
  isHoliday?: boolean;
}

export interface MonthlyRow {
  key: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  days: MonthDay[];
}

export interface AttendanceShift {
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
  shiftType?: string; // "primary" | "boundary" | "overtime"
  overlapPercentage?: number; // Percentage of shift duration covered
  shift: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
  attendance: {
    id: string;
    employeeId: string;
    checkInTime: string;
    checkOutTime: string | null;
    employee: {
      id: string;
      employeeCode: string;
      fullName: string;
      department: {
        name: string;
      };
    };
  };
}

export interface EmployeeAttendanceData {
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: {
      name: string;
    };
  };
  attendanceShifts: AttendanceShift[];
}

// ---------- Utils ----------
const getShiftOrder = (shiftName: string): number => {
  const name = shiftName.toLowerCase();
  if (name.includes("sáng") || name.includes("morning")) {
    return 1;
  }
  if (name.includes("hành chính") || name.includes("admin")) {
    return 2;
  }
  if (name.includes("tối") || name.includes("evening") || name.includes("afternoon")) {
    return 3;
  }
  if (name.includes("đêm") || name.includes("night")) {
    return 4;
  }
  return 5; // Unknown shifts go last
};

const sortShiftsByOrder = (shifts: ShiftRecord[]): ShiftRecord[] => {
  return [...shifts].sort((a, b) => {
    const orderA = getShiftOrder(a.shiftName);
    const orderB = getShiftOrder(b.shiftName);
    return orderA - orderB;
  });
};

const getShiftColor = (shiftName: string): string => {
  const name = shiftName.toLowerCase();
  if (name.includes("hành chính") || name.includes("admin") || name.includes("morning")) {
    return "blue";
  }
  if (name.includes("tối") || name.includes("evening") || name.includes("afternoon")) {
    return "orange";
  }
  if (name.includes("đêm") || name.includes("night")) {
    return "purple";
  }
  return "green";
};

const calculateStandardHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
};

const convertShiftToRecord = (
  attendanceShift: AttendanceShift,
): ShiftRecord & { shiftType?: string; overlapPercentage?: number } => {
  const standardHours = calculateStandardHours(
    attendanceShift.shift.startTime,
    attendanceShift.shift.endTime,
  );
  const actualHours = attendanceShift.durationMinutes / 60;
  const missingHours = Math.max(0, standardHours - actualHours);

  return {
    shift: attendanceShift.shift.name,
    shiftName: attendanceShift.shift.name,
    shiftStartTime: attendanceShift.shift.startTime,
    shiftEndTime: attendanceShift.shift.endTime,
    checkIn: dayjs(attendanceShift.actualStartTime).format("HH:mm"),
    checkOut: dayjs(attendanceShift.actualEndTime).format("HH:mm"),
    actualCheckIn: dayjs(attendanceShift.attendance.checkInTime).format("HH:mm"),
    actualCheckOut: attendanceShift.attendance.checkOutTime 
      ? dayjs(attendanceShift.attendance.checkOutTime).format("HH:mm")
      : undefined,
    hours: Math.round(actualHours * 10) / 10,
    missingHours: Math.round(missingHours * 10) / 10,
    color: getShiftColor(attendanceShift.shift.name),
    isApproved: attendanceShift.isApproved,
    shiftType: (attendanceShift as any).shiftType || "primary",
    overlapPercentage: (attendanceShift as any).overlapPercentage || 100,
  };
};

const filterShiftsByType = (shifts: ShiftRecord[], showBoundary: boolean): ShiftRecord[] => {
  let filteredShifts = shifts;
  
  if (!showBoundary) {
    // Only show primary shifts (hide boundary shifts with < 25% overlap)
    filteredShifts = shifts.filter((shift) => {
      const shiftType = (shift as any).shiftType || "primary";
      return shiftType === "primary" || shiftType === "overtime";
    });
  }
  
  // Sort shifts by order: sáng - hành chính - tối - đêm
  return sortShiftsByOrder(filteredShifts);
};

// ---------- Helpers ----------
const calcWeeklyTotals = (r: WeeklyRow) => {
  const days = [r.mon, r.tue, r.wed, r.thu, r.fri, r.sat, r.sun];
  let totalHours = 0;
  let totalMissing = 0;
  let totalShifts = 0;

  days.forEach((day) => {
    day.shifts.forEach((shift) => {
      totalHours += shift.hours;
      totalMissing += shift.missingHours;
      totalShifts++;
    });
  });

  return { totalHours, totalMissing, totalShifts };
};

const calcMonthlyTotals = (r: MonthlyRow) => {
  let totalHours = 0;
  let totalMissing = 0;
  let totalShifts = 0;

  r.days.forEach((day) => {
    day.shifts.forEach((shift) => {
      totalHours += shift.hours;
      totalMissing += shift.missingHours;
      totalShifts++;
    });
  });

  return { totalHours, totalMissing, totalShifts };
};

const DayCell = (day: DayRecord) => {
  if (day.isHoliday) {
    return (
      <div style={{ textAlign: "center", color: "#999" }}>
        <Tag color="default">Nghỉ</Tag>
      </div>
    );
  }

  if (!day.shifts || day.shifts.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#ccc" }}>
        <span>-</span>
      </div>
    );
  }

  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      {day.shifts.map((shift, idx) => (
        <div key={idx} style={{ width: "100%" }}>
          <div
            key={idx}
            style={{
              marginBottom: 4,
              opacity: (shift as any).shiftType === "boundary" ? 0.6 : 1,
            }}
          >
            <Tooltip
              title={
                (shift as any).shiftType === "boundary"
                  ? `Ca biên (${(shift as any).overlapPercentage?.toFixed(1)}% overlap) - ${
                      shift.isApproved ? "Đã duyệt" : "Chờ duyệt"
                    }`
                  : shift.isApproved
                    ? "Đã được phê duyệt"
                    : "Chờ quản lý phê duyệt" +
                      (shift.missingHours > 0 ? ` • Thiếu ${shift.missingHours}h` : "")
              }
            >
              <Tag
                icon={
                  shift.missingHours > 0 ? (
                    <WarningOutlined />
                  ) : shift.isApproved ? (
                    <CheckCircleOutlined />
                  ) : (
                    <ClockCircleOutlined />
                  )
                }
                color={
                  shift.missingHours > 0 ? "error" : shift.isApproved ? shift.color : "processing"
                }
                style={{
                  margin: 0,
                  width: "100%",
                  borderStyle: (shift as any).shiftType === "boundary" ? "dashed" : "solid",
                }}
              >
                {(shift as any).shiftType === "boundary" && "🔹 "}
                {shift.shiftName}
              </Tag>
            </Tooltip>
            {shift.actualCheckIn && (
              <div
                style={{
                  fontSize: 11,
                  color:
                    shift.missingHours > 0 ? "#ff4d4f" : shift.isApproved ? "#52c41a" : "#faad14",
                  marginTop: 2,
                  fontWeight: shift.missingHours > 0 ? 500 : 400,
                }}
              >
                Vào: {shift.actualCheckIn} - Ra: {shift.actualCheckOut || "..."}
              </div>
            )}
            <Typography variant="caption" style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {shift.hours}h
              {shift.missingHours > 0 && (
                <span style={{ color: "#ff4d4f", marginLeft: 4 }}>(-{shift.missingHours}h)</span>
              )}
            </Typography>
          </div>
        </div>
      ))}
    </Space>
  );
};

const MonthDayCell = (d: MonthDay) => {
  if (d.isHoliday) {
    return (
      <Tooltip title="Ngày nghỉ">
        <Tag color="default" style={{ margin: 0, cursor: "pointer", fontSize: 10 }}>
          Nghỉ
        </Tag>
      </Tooltip>
    );
  }

  if (!d.shifts || d.shifts.length === 0) {
    return <span style={{ color: "#ccc" }}>-</span>;
  }

  const tip = (
    <div>
      <div>
        <strong>Ngày {d.day}</strong>
      </div>
      {d.shifts.map((shift, idx) => (
        <div
          key={idx}
          style={{
            marginTop: 8,
            borderTop: idx > 0 ? "1px solid #ddd" : "",
            paddingTop: idx > 0 ? 8 : 0,
          }}
        >
          <div>
            <strong>
              {shift.shiftName} ({shift.shiftStartTime} - {shift.shiftEndTime})
            </strong>
          </div>
          {shift.actualCheckIn && (
            <div>
              Vào: {shift.actualCheckIn} - Ra: {shift.actualCheckOut || "..."}
            </div>
          )}
          <div>
            Giờ công: {shift.hours}h
            {shift.missingHours > 0 && (
              <span style={{ color: "#ff4d4f", marginLeft: 4 }}>
                (Thiếu: {shift.missingHours}h)
              </span>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            {shift.isApproved ? (
              <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 9 }}>
                Đã duyệt
              </Tag>
            ) : (
              <Tag icon={<ClockCircleOutlined />} color="processing" style={{ fontSize: 9 }}>
                Chờ duyệt
              </Tag>
            )}
            {shift.missingHours > 0 && (
              <Tag icon={<WarningOutlined />} color="error" style={{ fontSize: 9, marginLeft: 4 }}>
                Thiếu {shift.missingHours}h
              </Tag>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip title={tip}>
      <Space direction="vertical" size={2} style={{ width: "100%" }}>
        {d.shifts.map((shift, idx) => {
          const statusIcon =
            shift.missingHours > 0 ? (
              <WarningOutlined />
            ) : shift.isApproved ? (
              <CheckCircleOutlined />
            ) : (
              <ClockCircleOutlined />
            );

          const statusColor =
            shift.missingHours > 0 ? "error" : shift.isApproved ? shift.color : "processing";

          return (
            <Tag key={idx} icon={statusIcon} color={statusColor} style={{ fontSize: 9, margin: 0 }}>
              {shift.shift}
            </Tag>
          );
        })}
      </Space>
    </Tooltip>
  );
};

// ---------- Weekly Columns ----------
const buildWeeklyColumns = (weekLabel: string): ColumnsType<WeeklyRow> => [
  { title: "Mã NV", dataIndex: "employeeCode", key: "employeeCode", fixed: "left", width: 100 },
  { title: "Họ tên", dataIndex: "name", key: "name", fixed: "left", width: 160 },
  { title: "Phòng ban", dataIndex: "department", key: "department", fixed: "left", width: 120 },
  {
    title: weekLabel,
    key: "week",
    children: [
      {
        title: "T2",
        key: "mon",
        dataIndex: "mon",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "T3",
        key: "tue",
        dataIndex: "tue",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "T4",
        key: "wed",
        dataIndex: "wed",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "T5",
        key: "thu",
        dataIndex: "thu",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "T6",
        key: "fri",
        dataIndex: "fri",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "T7",
        key: "sat",
        dataIndex: "sat",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
      {
        title: "CN",
        key: "sun",
        dataIndex: "sun",
        width: 180,
        render: (d: DayRecord) => DayCell(d),
      },
    ],
  },
  {
    title: "Tổng giờ",
    key: "totalHours",
    fixed: "right",
    width: 110,
    render: (_: any, r: WeeklyRow) => (
      <Typography variant="caption">{calcWeeklyTotals(r).totalHours.toFixed(1)}h</Typography>
    ),
  },
  {
    title: "Giờ thiếu",
    key: "totalMissing",
    fixed: "right",
    width: 110,
    render: (_: any, r: WeeklyRow) => (
      <Typography
        variant="caption"
        style={{ color: calcWeeklyTotals(r).totalMissing > 0 ? "#ff4d4f" : "inherit" }}
      >
        {calcWeeklyTotals(r).totalMissing > 0
          ? `${calcWeeklyTotals(r).totalMissing.toFixed(1)}h`
          : "-"}
      </Typography>
    ),
  },
];

// ---------- Monthly Columns ----------
const buildMonthlyColumns = (monthTitle: string, daysInMonth: number): ColumnsType<MonthlyRow> => [
  { title: "Mã NV", dataIndex: "employeeCode", key: "employeeCode", fixed: "left", width: 90 },
  { title: "Họ tên", dataIndex: "name", key: "name", fixed: "left", width: 150 },
  { title: "Phòng ban", dataIndex: "department", key: "department", fixed: "left", width: 110 },
  {
    title: monthTitle,
    key: "month",
    children: Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        title: `${day}`,
        key: `day${day}`,
        width: 70,
        align: "center" as const,
        render: (_: any, r: MonthlyRow) => {
          const d = r.days.find((x) => x.day === day);
          return d ? MonthDayCell(d) : <Typography>-</Typography>;
        },
      };
    }),
  },
  {
    title: "Tổng giờ",
    key: "totalHours",
    fixed: "right",
    width: 110,
    render: (_: any, r: MonthlyRow) => (
      <Typography variant="caption">{calcMonthlyTotals(r).totalHours.toFixed(1)}h</Typography>
    ),
  },
  {
    title: "Giờ thiếu",
    key: "totalMissing",
    fixed: "right",
    width: 110,
    render: (_: any, r: MonthlyRow) => (
      <Typography
        variant="caption"
        style={{ color: calcMonthlyTotals(r).totalMissing > 0 ? "#ff4d4f" : "inherit" }}
      >
        {calcMonthlyTotals(r).totalMissing > 0
          ? `${calcMonthlyTotals(r).totalMissing.toFixed(1)}h`
          : "-"}
      </Typography>
    ),
  },
];

function TimekeepingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendanceData[]>([]);
  const [showBoundaryShifts, setShowBoundaryShifts] = useState(false);
  const tableHeight = 560;

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const startOfMonth = currentDate.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = currentDate.endOf("month").format("YYYY-MM-DD");

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/attendance/all?from=${startOfMonth}&to=${endOfMonth}`,
      );

      if (response.ok) {
        const result = await response.json();
        setAttendanceData(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process data into weekly format
  const weeklyData = useMemo(() => {
    const startOfWeek = currentDate.startOf("isoWeek");
    const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));

    return attendanceData.map((empData) => {
      const employee = empData.employee;
      const shifts = empData.attendanceShifts;

      // Group shifts by date
      const shiftsByDate = new Map<string, ShiftRecord[]>();
      shifts.forEach((shift) => {
        const dateKey = dayjs(shift.workDate).format("YYYY-MM-DD");
        if (!shiftsByDate.has(dateKey)) {
          shiftsByDate.set(dateKey, []);
        }
        shiftsByDate.get(dateKey)!.push(convertShiftToRecord(shift));
      });

      // Filter shifts based on showBoundaryShifts setting
      shiftsByDate.forEach((dayShifts, dateKey) => {
        shiftsByDate.set(dateKey, filterShiftsByType(dayShifts, showBoundaryShifts));
      });

      // Map to week days
      const [mon, tue, wed, thu, fri, sat, sun] = weekDates.map((date) => {
        const dateKey = date.format("YYYY-MM-DD");
        const dayShifts = shiftsByDate.get(dateKey) || [];
        const isWeekend = date.day() === 0 || date.day() === 6;

        return {
          shifts: dayShifts,
          isHoliday: isWeekend && dayShifts.length === 0,
        };
      });

      return {
        key: employee.id,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
        department: employee.department.name,
        mon,
        tue,
        wed,
        thu,
        fri,
        sat,
        sun,
      };
    });
  }, [attendanceData, currentDate, showBoundaryShifts]);

  // Process data into monthly format
  const monthlyData = useMemo(() => {
    const daysInMonth = currentDate.daysInMonth();

    return attendanceData.map((empData) => {
      const employee = empData.employee;
      const shifts = empData.attendanceShifts;

      // Group shifts by date
      const shiftsByDate = new Map<string, ShiftRecord[]>();
      shifts.forEach((shift) => {
        const dateKey = dayjs(shift.workDate).format("YYYY-MM-DD");
        if (!shiftsByDate.has(dateKey)) {
          shiftsByDate.set(dateKey, []);
        }
        shiftsByDate.get(dateKey)!.push(convertShiftToRecord(shift));
      });

      // Filter shifts based on showBoundaryShifts setting
      shiftsByDate.forEach((dayShifts, dateKey) => {
        shiftsByDate.set(dateKey, filterShiftsByType(dayShifts, showBoundaryShifts));
      });

      // Map to month days
      const days: MonthDay[] = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = currentDate.date(day);
        const dateKey = date.format("YYYY-MM-DD");
        const dayShifts = shiftsByDate.get(dateKey) || [];
        const isWeekend = date.day() === 0 || date.day() === 6;

        return {
          day,
          shifts: dayShifts,
          isHoliday: isWeekend && dayShifts.length === 0,
        };
      });

      return {
        key: employee.id,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
        department: employee.department.name,
        days,
      };
    });
  }, [attendanceData, currentDate, showBoundaryShifts]);

  const weekLabel = useMemo(() => {
    const startOfWeek = currentDate.startOf("isoWeek");
    const endOfWeek = currentDate.endOf("isoWeek");
    return `Tuần ${currentDate.isoWeek()} (${startOfWeek.format("DD/MM")} - ${endOfWeek.format("DD/MM")})`;
  }, [currentDate]);

  const monthTitle = useMemo(() => {
    return currentDate.format("MMMM YYYY");
  }, [currentDate]);

  const daysInMonth = currentDate.daysInMonth();

  const weeklyCols = useMemo(() => buildWeeklyColumns(weekLabel), [weekLabel]);
  const monthlyCols = useMemo(
    () => buildMonthlyColumns(monthTitle, daysInMonth),
    [monthTitle, daysInMonth],
  );

  const weeklySummary = (pageData: readonly WeeklyRow[]) => {
    let totalHours = 0,
      totalMissing = 0,
      totalShifts = 0;
    pageData.forEach((r) => {
      const t = calcWeeklyTotals(r);
      totalHours += t.totalHours;
      totalMissing += t.totalMissing;
      totalShifts += t.totalShifts;
    });
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={3}>
            <strong>Tổng cộng</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} colSpan={7} />
          <Table.Summary.Cell index={10}>
            <strong>{totalHours.toFixed(1)}h</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={11}>
            <strong style={{ color: totalMissing > 0 ? "#ff4d4f" : "inherit" }}>
              {totalMissing > 0 ? `${totalMissing.toFixed(1)}h` : "-"}
            </strong>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  const monthlySummary = (pageData: readonly MonthlyRow[]) => {
    let totalHours = 0,
      totalMissing = 0,
      totalShifts = 0;
    pageData.forEach((r) => {
      const t = calcMonthlyTotals(r);
      totalHours += t.totalHours;
      totalMissing += t.totalMissing;
      totalShifts += t.totalShifts;
    });
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={3}>
            <strong>Tổng cộng</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} colSpan={daysInMonth} />
          <Table.Summary.Cell index={3 + daysInMonth}>
            <strong>{totalHours.toFixed(1)}h</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3 + daysInMonth + 1}>
            <strong style={{ color: totalMissing > 0 ? "#ff4d4f" : "inherit" }}>
              {totalMissing > 0 ? `${totalMissing.toFixed(1)}h` : "-"}
            </strong>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  const handlePrev = () => {
    setCurrentDate((prev) => prev.subtract(1, viewMode === "monthly" ? "month" : "week"));
  };

  const handleNext = () => {
    setCurrentDate((prev) => prev.add(1, viewMode === "monthly" ? "month" : "week"));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  const handleViewModeChange = (e: any) => {
    setViewMode(e.target.value);
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" style={{ fontWeight: 600 }}>
          Bảng chấm công
        </Typography>

        <Space>
          <Radio.Group value={viewMode} onChange={handleViewModeChange}>
            <Radio.Button value="weekly">📅 Theo tuần</Radio.Button>
            <Radio.Button value="monthly">📆 Theo tháng</Radio.Button>
          </Radio.Group>
          <Tooltip
            title={
              showBoundaryShifts
                ? "Click để ẩn các ca biên (overlap < 25%)"
                : "Click để hiển thị tất cả ca, bao gồm ca biên"
            }
          >
            <Button
              type={showBoundaryShifts ? "primary" : "default"}
              icon={showBoundaryShifts ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              onClick={() => setShowBoundaryShifts(!showBoundaryShifts)}
            >
              {showBoundaryShifts ? "Chi tiết đầy đủ" : "Chỉ ca chính"}
              {!showBoundaryShifts && (
                <Badge
                  count="Đã lọc"
                  style={{
                    backgroundColor: "#52c41a",
                    marginLeft: 8,
                    fontSize: 10,
                  }}
                />
              )}
            </Button>
          </Tooltip>
          <Button icon={<LeftOutlined />} onClick={handlePrev}>
            {viewMode === "monthly" ? "Tháng trước" : "Tuần trước"}
          </Button>
          <DatePicker
            value={currentDate}
            onChange={handleDateChange}
            picker={viewMode === "monthly" ? "month" : "week"}
            format={viewMode === "monthly" ? "MMMM YYYY" : "[Tuần] w, YYYY"}
            placeholder={viewMode === "monthly" ? "Chọn tháng" : "Chọn tuần"}
            style={{ width: 200 }}
          />
          <Button icon={<RightOutlined />} onClick={handleNext}>
            {viewMode === "monthly" ? "Tháng sau" : "Tuần sau"}
          </Button>
          <Button type="primary" icon={<CalendarOutlined />} onClick={handleToday}>
            Hôm nay
          </Button>
        </Space>
      </div>

      {showBoundaryShifts && (
        <Alert
          message="Chế độ hiển thị chi tiết đầy đủ"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>
                Đang hiển thị <strong>tất cả các ca</strong>, bao gồm:
              </p>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  <strong>Ca chính:</strong> Ca được phân công chính thức
                </li>
                <li>
                  <strong>🔹 Ca biên (boundary):</strong> Ca phát sinh tự động khi nhân viên làm
                  việc xuyên khung giờ (overlap &lt; 25%)
                </li>
              </ul>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                💡 <em>Gợi ý:</em> Click nút "Chi tiết đầy đủ" để chỉ hiển thị ca chính, giúp giao
                diện gọn gàng hơn.
              </p>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Card bordered={false} style={{ background: "#fff" }}>
        {viewMode === "weekly" ? (
          <Table<WeeklyRow>
            columns={weeklyCols}
            dataSource={weeklyData}
            scroll={{ x: "max-content", y: tableHeight }}
            sticky
            bordered
            pagination={false}
            loading={loading}
            summary={weeklySummary}
            rowKey="key"
          />
        ) : (
          <Table<MonthlyRow>
            columns={monthlyCols}
            dataSource={monthlyData}
            scroll={{ x: "max-content", y: tableHeight }}
            sticky
            bordered
            pagination={false}
            loading={loading}
            summary={monthlySummary}
            rowKey="key"
            size="small"
          />
        )}
      </Card>
    </div>
  );
}
