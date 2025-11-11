import { ClockCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ScheduleOutlined } from "@ant-design/icons";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import apiClient from "@/lib/api-client";

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { Option } = Select;

export const Route = createFileRoute("/_workspace/shifts")({
  component: ShiftsPage,
});

interface ShiftAssignment {
  id: string;
  employeeIds: string[];
  employees: Array<{
    id: string;
    fullName: string;
    employeeCode: string;
  }>;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysOfWeek: number[]; // 0-6
  note?: string;
  createdAt: string;
  createdBy: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  department: {
    id: string;
    name: string;
  };
}

interface ShiftType {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "CN" },
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
];

function ShiftsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("assignments");

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "assignments",
              label: (
                <span>
                  <ClockCircleOutlined />
                  Phân ca
                </span>
              ),
              children: <ShiftAssignmentsTab />,
            },
            {
              key: "types",
              label: (
                <span>
                  <ScheduleOutlined />
                  Cấu hình ca
                </span>
              ),
              children: <ShiftTypesTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

// Tab 1: Shift Assignments (Phân ca)
function ShiftAssignmentsTab() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAssignments(), fetchEmployees()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.getShiftSchedules();
      const schedules = response.data || [];

      // Group schedules by shift time and date range to combine multiple employees
      const groupedSchedules = new Map<string, any[]>();

      schedules.forEach((schedule: any) => {
        const key = `${schedule.shift?.startTime}-${schedule.shift?.endTime}-${schedule.scheduledFromDate}-${schedule.scheduledToDate}-${schedule.daysOfWeek}`;
        if (!groupedSchedules.has(key)) {
          groupedSchedules.set(key, []);
        }
        groupedSchedules.get(key)!.push(schedule);
      });

      const transformedAssignments: ShiftAssignment[] = Array.from(groupedSchedules.values()).map(
        (group) => {
          const first = group[0];
          return {
            id: first.id,
            employeeIds: group.map((s: any) => s.employeeId).filter(Boolean),
            employees: group
              .map((s: any) => ({
                id: s.employeeId,
                fullName: s.employee?.fullName || "",
                employeeCode: s.employee?.employeeCode || "",
              }))
              .filter((e: any) => e.id),
            startTime: first.shift?.startTime || "08:00",
            endTime: first.shift?.endTime || "17:00",
            startDate: first.scheduledFromDate,
            endDate: first.scheduledToDate,
            daysOfWeek: JSON.parse(first.daysOfWeek || "[1,2,3,4,5]"),
            note: first.note,
            createdAt: first.createdAt,
            createdBy: first.manager?.fullName || "Unknown",
          };
        },
      );

      setAssignments(transformedAssignments);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      employeeIds: [],
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: dayjs("08:00", "HH:mm"),
      endTime: dayjs("17:00", "HH:mm"),
      dateRange: [dayjs(), dayjs().add(1, "year")],
    });
    setModalOpen(true);
  };

  const handleEdit = (record: ShiftAssignment) => {
    setEditingId(record.id);
    form.setFieldsValue({
      employeeIds: record.employeeIds,
      startTime: dayjs(record.startTime, "HH:mm"),
      endTime: dayjs(record.endTime, "HH:mm"),
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
      daysOfWeek: record.daysOfWeek,
      note: record.note,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteShiftSchedule(id);
      message.success("Xóa phân ca thành công");
      fetchAssignments();
    } catch (error: any) {
      message.error(error.message || "Không thể xóa phân ca");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Create a temporary shift if needed
      let shiftId = "temp-shift-id";

      // Try to find existing shift with same time
      const existingShifts = await apiClient.getAllShifts();
      const matchingShift = existingShifts.data?.find(
        (s: any) =>
          s.startTime === values.startTime.format("HH:mm") &&
          s.endTime === values.endTime.format("HH:mm"),
      );

      if (matchingShift) {
        shiftId = matchingShift.id;
      } else {
        // Create new shift
        const shiftResponse = await apiClient.createShift({
          name: `Ca ${values.startTime.format("HH:mm")}-${values.endTime.format("HH:mm")}`,
          code: `SHIFT_${values.startTime.format("HHmm")}_${values.endTime.format("HHmm")}`,
          startTime: values.startTime.format("HH:mm"),
          endTime: values.endTime.format("HH:mm"),
          breakDuration: 0,
          color: "#1890ff",
        });
        shiftId = shiftResponse.data?.id || (shiftResponse as any).shift?.id;
      }

      // Create schedule for each employee
      const employeeIds = values.employeeIds || [];

      for (const employeeId of employeeIds) {
        const scheduleData = {
          shiftId,
          assignmentType: "employee" as const,
          employeeId,
          employeeGroupId: undefined,
          scheduledFromDate: values.dateRange[0].format("YYYY-MM-DD"),
          scheduledToDate: values.dateRange[1].format("YYYY-MM-DD"),
          daysOfWeek: values.daysOfWeek,
          note: values.note,
          createdBy: "current-user-id", // TODO: Get from auth
        };

        if (editingId) {
          // For edit, update the first one and create new for others
          await apiClient.updateShiftSchedule(editingId, {
            shiftId: scheduleData.shiftId,
            scheduledFromDate: scheduleData.scheduledFromDate,
            scheduledToDate: scheduleData.scheduledToDate,
            daysOfWeek: scheduleData.daysOfWeek,
            note: scheduleData.note,
          });
        } else {
          await apiClient.createShiftSchedule(scheduleData);
        }
      }

      message.success(editingId ? "Cập nhật phân ca thành công" : "Thêm phân ca thành công");
      setModalOpen(false);
      fetchAssignments();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ShiftAssignment> = [
    {
      title: "Nhân viên",
      key: "employees",
      width: 300,
      render: (_, record) => (
        <div>
          {record.employees.slice(0, 3).map((emp, index) => (
            <div
              key={emp.id}
              style={{ marginBottom: index < Math.min(record.employees.length - 1, 2) ? 4 : 0 }}
            >
              <span style={{ fontWeight: 500 }}>{emp.fullName}</span>
              <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
                ({emp.employeeCode})
              </span>
            </div>
          ))}
          {record.employees.length > 3 && (
            <Tag color="blue" style={{ marginTop: 4 }}>
              +{record.employees.length - 3} người khác
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Giờ làm việc",
      key: "time",
      width: 150,
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          <span>
            {record.startTime} - {record.endTime}
          </span>
        </Space>
      ),
    },
    {
      title: "Khoảng thời gian",
      key: "dateRange",
      width: 200,
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startDate).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            đến {dayjs(record.endDate).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày trong tuần",
      dataIndex: "daysOfWeek",
      key: "daysOfWeek",
      width: 200,
      render: (days: number[]) => (
        <Space size={4} wrap>
          {days.sort().map((day) => {
            const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day);
            return (
              <Tag key={day} color="default">
                {dayInfo?.label}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa phân ca này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm phân ca
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={assignments}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phân ca`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingId ? "Chỉnh sửa phân ca" : "Thêm phân ca mới"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}
        okText={editingId ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            employeeIds: [],
            daysOfWeek: [1, 2, 3, 4, 5],
          }}
        >
          <Form.Item
            label="Nhân viên"
            name="employeeIds"
            rules={[{ required: true, message: "Vui lòng chọn ít nhất một nhân viên" }]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Chọn nhân viên"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              maxTagCount="responsive"
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.employeeCode}) - ${emp.department.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item label="Giờ làm việc">
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="startTime"
                noStyle
                rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu" }]}
              >
                <TimePicker format="HH:mm" placeholder="Giờ bắt đầu" style={{ width: "50%" }} />
              </Form.Item>
              <Form.Item
                name="endTime"
                noStyle
                rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc" }]}
              >
                <TimePicker format="HH:mm" placeholder="Giờ kết thúc" style={{ width: "50%" }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="Khoảng thời gian"
            name="dateRange"
            rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
          >
            <RangePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <Form.Item
            label="Ngày trong tuần"
            name="daysOfWeek"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ít nhất một ngày trong tuần",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các ngày làm việc"
              options={DAYS_OF_WEEK.map((day) => ({
                value: day.value,
                label: day.label,
              }))}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// Tab 2: Shift Types Configuration (Cấu hình ca)
function ShiftTypesTab() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchShiftTypes();
  }, []);

  const fetchShiftTypes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllShifts();
      setShiftTypes(response.data || []);
    } catch (error) {
      console.error("Failed to fetch shift types:", error);
      message.error("Không thể tải danh sách loại ca");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: ShiftType) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      startTime: dayjs(record.startTime, "HH:mm"),
      endTime: dayjs(record.endTime, "HH:mm"),
      description: record.description,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteShift(id);
      message.success("Xóa loại ca thành công");
      fetchShiftTypes();
    } catch (error: any) {
      message.error(error.message || "Không thể xóa loại ca");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiClient.toggleShift(id);
      message.success("Cập nhật trạng thái thành công");
      fetchShiftTypes();
    } catch (error: any) {
      message.error(error.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const data = {
        name: values.name,
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        description: values.description,
        isActive: values.isActive ?? true,
      };

      if (editingId) {
        await apiClient.updateShift(editingId, data);
        message.success("Cập nhật loại ca thành công");
      } else {
        await apiClient.createShift({
          ...data,
          code: `SHIFT_${data.startTime.replace(":", "")}_${data.endTime.replace(":", "")}`,
          breakDuration: 0,
          color: "#1890ff",
        });
        message.success("Thêm loại ca thành công");
      }

      setModalOpen(false);
      fetchShiftTypes();
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const getShiftDuration = (startTime: string, endTime: string): string => {
    const start = dayjs(startTime, "HH:mm");
    let end = dayjs(endTime, "HH:mm");

    // Handle cross-midnight shifts
    if (end.isSameOrBefore(start)) {
      end = end.add(1, "day");
    }

    const hours = end.diff(start, "hour", true);
    return `${hours}h`;
  };

  const isCrossMidnight = (startTime: string, endTime: string): boolean => {
    return endTime <= startTime;
  };

  const shiftTypeColumns: ColumnsType<ShiftType> = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (text, record) => (
        <Space>
          <Tag color={record.isActive ? "blue" : "default"}>{text}</Tag>
          {isCrossMidnight(record.startTime, record.endTime) && <Tag color="orange">Qua đêm</Tag>}
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      width: 150,
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          <span>
            {record.startTime} - {record.endTime}
          </span>
        </Space>
      ),
    },
    {
      title: "Thời lượng",
      key: "duration",
      width: 100,
      render: (_, record) => getShiftDuration(record.startTime, record.endTime),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggle(record.id)}
          checkedChildren="Kích hoạt"
          unCheckedChildren="Vô hiệu"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa loại ca"
            description="Bạn có chắc chắn muốn xóa loại ca này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm loại ca
        </Button>
      </div>

      <Table
        columns={shiftTypeColumns}
        dataSource={shiftTypes}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} loại ca`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingId ? "Chỉnh sửa loại ca" : "Thêm loại ca mới"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
        okText={editingId ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
          }}
        >
          <Form.Item
            label="Tên ca"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên ca" }]}
          >
            <Input placeholder="Ví dụ: Hành chính, Tối, Đêm, Sáng" />
          </Form.Item>

          <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
            <Form.Item
              label="Giờ bắt đầu"
              name="startTime"
              style={{ flex: 1, marginBottom: 0 }}
              rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu" }]}
            >
              <TimePicker format="HH:mm" placeholder="Giờ bắt đầu" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Giờ kết thúc"
              name="endTime"
              style={{ flex: 1, marginBottom: 0 }}
              rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc" }]}
            >
              <TimePicker format="HH:mm" placeholder="Giờ kết thúc" style={{ width: "100%" }} />
            </Form.Item>
          </Space.Compact>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả chi tiết về ca làm việc này"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Kích hoạt" unCheckedChildren="Vô hiệu" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
