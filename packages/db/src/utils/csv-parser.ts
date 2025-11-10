import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

export interface CsvEmployee {
  employeeCode: string;
  fullName: string;
  gender: string;
  position: string;
  role: string;
  department: string;
  birthday?: Date;
  idCardNumber?: string;
  idCardIssueDate?: Date;
  idCardIssuer?: string;
  permanentAddress?: string;
  phone?: string;
  education?: string;
  startDate?: Date;
  relativesNote?: string;
}

/**
 * Parse CSV file and return employee data
 * Handles both formats: with and without STT column
 */
export function parseCsvFile(filePath: string): CsvEmployee[] {
  const fileContent = readFileSync(filePath, "utf-8");
  
  // Remove BOM if present
  const content = fileContent.replace(/^\uFEFF/, "");
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return records.map((record: any) => {
    // Handle both column name variations
    const employeeCode = record["Mã NV"] || record["Mã nhân viên"] || "";
    const fullName = record["Họ Và Tên"] || "";
    const gender = record["Giới Tính"] || "";
    const position = record["Chức Vụ"] || "";
    const role = record["Nhiệm vụ"] || "";
    const department = record["Phòng Ban"] || "";
    const birthdayStr = record["birthday"] || "";
    const idCardNumber = record["Số CCCD"] || "";
    const idCardIssueDateStr = record["Ngày Cấp"] || "";
    const idCardIssuer = record["Nơi Cấp"] || "";
    const permanentAddress = record["Hộ Khẩu Thường Trú(theo CCCD)"] || "";
    const startDateStr = record["Ngày Bắt Đầu"] || "";
    const phone = record["Số Điện Thoại"] || record["Số Điện Thoại (string)"] || "";
    const education =
      record["Trình độ"] ||
      record["Nghề Nghiệp/Trình Độ"] ||
      record["Nghề nghiệp/Trình độ"] ||
      "";
    const relativesNote = record["Thông tin người thân"] || record["Thông tin người thân (string)"] || "";

    return {
      employeeCode: employeeCode.trim(),
      fullName: fullName.trim(),
      gender: gender.trim().toLowerCase(),
      position: position.trim().toLowerCase(),
      role: role.trim().toLowerCase(),
      department: department.trim().toLowerCase(),
      birthday: normalizeDate(birthdayStr),
      idCardNumber: idCardNumber.trim() || undefined,
      idCardIssueDate: normalizeDate(idCardIssueDateStr),
      idCardIssuer: idCardIssuer.trim() || undefined,
      permanentAddress: permanentAddress.trim() || undefined,
      phone: normalizePhone(phone),
      education: education.trim() || undefined,
      startDate: normalizeDate(startDateStr),
      relativesNote: relativesNote.trim() || undefined,
    };
  });
}

/**
 * Normalize date string to Date object
 * Handles formats: DD/MM/YYYY, M/D/YYYY, DD-MM-YYYY
 */
export function normalizeDate(dateStr: string): Date | undefined {
  if (!dateStr || dateStr.trim() === "") return undefined;

  const cleaned = dateStr.trim();

  // Try different date formats
  const formats = [
    // DD/MM/YYYY or D/M/YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match && match[1] && match[2] && match[3]) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
      const year = parseInt(match[3], 10);

      const date = new Date(year, month, day);
      
      // Validate the date
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  return undefined;
}

/**
 * Normalize phone number
 * Removes spaces and standardizes format
 */
export function normalizePhone(phone: string): string | undefined {
  if (!phone || phone.trim() === "") return undefined;

  // Remove all spaces and special characters except digits and +
  const cleaned = phone.replace(/[^\d+]/g, "");

  return cleaned || undefined;
}

/**
 * Map department name from CSV to department code
 */
export function mapDepartmentName(deptName: string): string {
  const normalized = deptName.trim().toLowerCase();

  const departmentNameToCode: Record<string, string> = {
    // Level 1
    "ban giám đốc": "BGD",
    // Level 2
    "phòng kinh doanh - khách hàng": "KDKH",
    "phòng nhân sự": "NS",
    "phòng ns": "NS",
    "phòng hcns": "NS",
    "phòng kế toán": "KT",
    "phòng kttc": "KTTC",
    "phòng thiết kế": "TD",
    "phòng it": "IT",
    "phòng mkt": "MKT",
    "phòng r&d": "RD",
    "xưởng sản xuất": "SX",
    "quản lý công việc": "QLCV",
    // Level 3
    "phòng kinh doanh": "KD",
    "phòng khách hàng": "KH",
    "phòng khg": "KH",
    "kinh doanh": "KD",
    "tổ hậu cận": "THC",
    "kho": "KHO",
    "phòng qc/ kiểm soát": "QC",
    "phòng kỹ thuật": "KT2",
    "thiết kế hình ảnh": "TKHH",
    "phòng thiết kế hình ảnh": "TKHH",
    "content mkt": "CMKT",
    "quản đốc": "QD",
    "chà nhám": "CN",
    "thợ mộc": "TM",
    "máy cnc": "CNC",
    "đóng gói": "DG",
    "thợ sơn": "TS",
    "thợ phụ": "TP",
    "sơn lót": "SL",
    "phụ cnc": "PCNC",
    "pkhg": "PKHG",
  };

  return departmentNameToCode[normalized] || "BGD"; // Default to BGD if not found
}
