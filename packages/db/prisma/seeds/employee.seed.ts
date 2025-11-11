import { join } from "path";

import prisma from "../../src/index";
import { mapDepartmentName, parseCsvFile } from "../../src/utils/csv-parser";

// Company data
const companiesData = [
  {
    name: "Tiến Dư HO",
    csvFile: "tienduho.seed.csv",
    isActive: true,
  },
  {
    name: "Tiến Dư HCM",
    csvFile: "tienduhcm.seed.csv",
    isActive: true,
  },
  {
    name: "Bemos",
    csvFile: "bemos.seed.csv",
    isActive: true,
  },
  {
    name: "Admart",
    csvFile: "admart.seed.csv",
    isActive: true,
  },
  {
    name: "Ibright",
    csvFile: "ibright.seed.csv",
    isActive: true,
  },
  {
    name: "Bình Giang",
    csvFile: "binhgiang.seed.csv",
    isActive: true,
  },
  {
    name: "TITC",
    csvFile: "titc.seed.csv",
    isActive: true,
  },
];

// Department hierarchy data
const level1Data = [
  {
    name: "Ban giám đốc",
    code: "BGD",
    description: "Board of Directors",
    colorCode: "#1F2937",
    level: 1,
    parentCode: null,
  },
];

const level2Data = [
  {
    name: "Phòng R&D",
    code: "RD",
    description: "Research & Development",
    colorCode: "#3B82F6",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Xưởng Sản xuất",
    code: "SX",
    description: "Manufacturing Factory",
    colorCode: "#DC2626",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Quản lý công việc",
    code: "QLCV",
    description: "Work Management",
    colorCode: "#059669",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng Kinh doanh - Khách hàng",
    code: "KDKH",
    description: "Sales & Customer Service Department",
    colorCode: "#3182CE",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng Nhân sự",
    code: "NS",
    description: "Human Resources Department",
    colorCode: "#D69E2E",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng Kế toán",
    code: "KT",
    description: "Accounting Department",
    colorCode: "#38A169",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng KTTC",
    code: "KTTC",
    description: "Technical Control & Construction Planning",
    colorCode: "#06B6D4",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng Thiết kế",
    code: "TD",
    description: "Design Department",
    colorCode: "#EC4899",
    level: 2,
    parentCode: "BGD",
  },
  {
    name: "Phòng IT",
    code: "IT",
    description: "Information Technology",
    colorCode: "#8B5CF6",
    level: 2,
    parentCode: "BGD",
  },
];

const level3Data = [
  // Under KDKH (Kinh doanh - Khách hàng)
  {
    name: "Phòng Kinh doanh",
    code: "KD",
    description: "Sales Department",
    colorCode: "#2563EB",
    level: 3,
    parentCode: "KDKH",
  },
  {
    name: "Phòng Khách hàng",
    code: "KH",
    description: "Customer Service Department",
    colorCode: "#1E40AF",
    level: 3,
    parentCode: "KDKH",
  },
  {
    name: "Phòng Mkt",
    code: "MKT",
    description: "Marketing Department",
    colorCode: "#F97316",
    level: 3,
    parentCode: "KDKH",
  },
  // Under NS (Nhân sự)
  {
    name: "Tổ Hậu cận",
    code: "THC",
    description: "Support Team (Logistics, Security, Maintenance)",
    colorCode: "#B4860B",
    level: 3,
    parentCode: "NS",
  },
  // Under KT (Kế toán)
  {
    name: "Kho",
    code: "KHO",
    description: "Warehouse & Inventory",
    colorCode: "#7C2D12",
    level: 3,
    parentCode: "KT",
  },
  // Under KTTC (Kỹ thuật Thi công)
  {
    name: "Phòng QC/Kiểm soát",
    code: "QC",
    description: "Quality Control",
    colorCode: "#0891B2",
    level: 3,
    parentCode: "KTTC",
  },
  {
    name: "Phòng Kỹ thuật",
    code: "KT2",
    description: "Technical Department",
    colorCode: "#0E7490",
    level: 3,
    parentCode: "KTTC",
  },
  // Under TD (Thiết kế)
  {
    name: "Thiết kế hình ảnh",
    code: "TKHH",
    description: "Graphic Design",
    colorCode: "#EE82EE",
    level: 3,
    parentCode: "TD",
  },
  // Under MKT (Marketing)
  {
    name: "Content Mkt",
    code: "CMKT",
    description: "Content Marketing",
    colorCode: "#FBBF24",
    level: 3,
    parentCode: "MKT",
  },
  // Under SX (Xưởng Sản xuất)
  {
    name: "Quản Đốc",
    code: "QD",
    description: "Production Supervisor",
    colorCode: "#A16207",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Chà nhám",
    code: "CN",
    description: "Sanding Work",
    colorCode: "#D1D5DB",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Thợ mộc",
    code: "TM",
    description: "Carpenter",
    colorCode: "#92400E",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Máy CNC",
    code: "CNC",
    description: "CNC Machine Operations",
    colorCode: "#404040",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Đóng gói",
    code: "DG",
    description: "Packaging",
    colorCode: "#78350F",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Thợ Sơn",
    code: "TS",
    description: "Painting Work",
    colorCode: "#FCD34D",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Thợ phụ",
    code: "TP",
    description: "Assistant Worker",
    colorCode: "#CCCCCC",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Sơn lót",
    code: "SL",
    description: "Primer Coating",
    colorCode: "#E5E7EB",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "Phụ CNC",
    code: "PCNC",
    description: "CNC Assistant",
    colorCode: "#6B7280",
    level: 3,
    parentCode: "SX",
  },
  {
    name: "PKHG",
    code: "PKHG",
    description: "Equipment Maintenance Specialist",
    colorCode: "#92400E",
    level: 3,
    parentCode: "SX",
  },
];

// Employee manager relationships
const relationships: Record<string, string | null> = {
  // Level 1
  TD0001: null, // CEO

  // Level 2
  TD0002: "TD0001",
  TD0003: "TD0001",
  TD0987: "TD0001",
  TD0986: "TD0001",
  BR90002: "TD0001",

  // Level 3 - Department Heads
  TD0332: "TD0001",
  TD0065: "TD0001",
  TD0259: "TD0001",
  TD0627: "TD0001",
  TD0034: "TD0001",
  TD0594: "TD0001",

  // Phòng Kế toán
  TD0116: "TD0332",
  TD0196: "TD0332",
  TD1413: "TD0332",
  TD0702: "TD0332",
  TD1332: "TD0332",
  TD1389: "TD0332",
  TD1138: "TD0332",
  BG25002: "TD0332",
  TD0427: "TD0332",

  // Phòng Khách hàng
  TD0369: "TD0001",
  TD1324: "TD0369",
  TD1325: "TD0369",
  TD1392: "TD0369",

  // Phòng KHG
  TD0011: "TD0001",
  TD0086: "TD0011",
  TD0399: "TD0086",
  TD0096: "TD0086",
  TD1038: "TD0086",
  TD1042: "TD0086",
  TD0804: "TD0011",
  TD0896: "TD0804",
  TD1233: "TD0804",
  TD1385: "TD0804",

  // Phòng Kinh doanh
  BR90003: "TD0001",
  TD0146: "BR90003",
  TD0385: "BR90003",
  TD0631: "BR90003",
  TD0884: "BR90003",
  TD1380: "BR90003",
  TD1396: "BR90003",
  TD1410: "BR90003",
  TD1067: "BR90003",
  TD1076: "BR90003",

  // Phòng KTTC
  TD0038: "TD0065",
  TD0971: "TD0065",
  TD0786: "TD0038",
  TD0269: "TD0038",
  TD1301: "TD0971",
  TD1391: "TD0971",
  TD0100: "TD0065",
  TD0635: "TD0100",
  TD0762: "TD0100",
  TD0826: "TD0100",
  TD0824: "TD0100",
  TD0956: "TD0100",
  TD1137: "TD0100",
  TD1145: "TD0100",
  TD1213: "TD0100",
  TD1182: "TD0100",
  TD1228: "TD0100",
  TD0746: "TD0100",
  TD1240: "TD0100",
  TD1248: "TD0100",
  TD1283: "TD0100",
  TD1316: "TD0100",
  TD1326: "TD0100",
  TD1158: "TD0100",
  TD1334: "TD0100",
  TD1342: "TD0100",
  TD1365: "TD0100",
  TD1372: "TD0100",
  TD1373: "TD0100",
  TD1379: "TD0100",
  TD1401: "TD0100",
  TD0687: "TD0100",
  TD0496: "TD0100",
  TD1412: "TD0100",
  TD0996: "TD0065",
  TD1207: "TD0065",
  TD0438: "TD0065",
  TD1298: "TD0065",
  TD1322: "TD0065",
  TD0373: "TD0065",
  TD1280: "TD0065",

  // Phòng Marketing
  TD1331: "TD0001",
  TD1393: "TD1331",
  TD1241: "TD1331",
  TD1281: "TD1331",
  BM0226: "TD1331",

  // Phòng Nhân sự
  TD1243: "TD0594",
  TD1377: "TD0594",
  TD1122: "TD0594",
  TD1279: "TD0594",
  BG25003: "TD0594",
  BG25005: "TD0594",
  BG25004: "TD0594",

  // Phòng R&D
  TD1203: "TD0627",
  TD1343: "TD0627",

  // Phòng Thiết kế
  TD0728: "TD0259",
  TD0843: "TD0259",
  TD0452: "TD0259",
  TD0999: "TD0843",
  TD1405: "TD0843",
  TD1223: "TD0259",
  TD1348: "TD0259",
  TD1398: "TD0259",
  TD1402: "TD0259",
  BR90001: "TD0259",
  BR90004: "BR90001",

  // Phòng IT
  TD1090: "TD0002",

  // Quản lý công việc
  TD0260: "TD0001",

  // Xưởng Sản xuất
  TD0039: "TD0034",
  TD1357: "TD0034",
  TD0045: "TD0034",
  BM0020: "TD0034",
  TD1036: "TD1357",
  TD0226: "TD1357",
  TD1387: "TD1357",
  TD0518: "TD1357",
  TD0694: "TD1357",
  TD0959: "TD1357",
  TD1388: "TD1357",
  TD0119: "TD1357",
  TD0599: "TD1357",
  TD1047: "TD1357",
  TD1327: "TD1357",
  TD0251: "TD1357",
  TD0682: "TD1357",
  TD0790: "TD1357",
  TD0591: "TD1357",
  TD0945: "TD1357",
  TD1143: "TD1357",
  TD1245: "TD1357",
  TD1246: "TD1357",
  TD0057: "TD1357",
  TD0922: "TD0057",
  TD0633: "TD1357",
  TD1032: "TD1357",
  TD1075: "TD1357",
  TD1359: "TD1357",
  TD1166: "TD1357",
  TD1376: "TD1357",
  TD1227: "TD1357",
  TD0681: "TD1357",
  TD1195: "TD1357",
  TD0044: "TD1357",
  TD1375: "TD1357",
  TD0673: "TD1357",
  TD0938: "TD1357",
  BG25007: "TD1357",
  BG25006: "TD1357",
  TD0740: "TD1357",
  TD0742: "TD1357",
  TD0367: "TD1357",
  TD0028: "TD1357",
  TD0692: "TD1357",
  TD0555: "TD1357",
  TD0794: "TD1357",
  TD1060: "TD1357",
  TD0544: "TD1357",
  TD1078: "TD1357",
  TD1131: "TD1357",
  TD1139: "TD1357",
  TD1180: "TD1357",
  TD1275: "TD1357",
  TD1295: "TD1357",
  TD1297: "TD1357",
  TD1304: "TD1357",
  TD1314: "TD1357",
  TD1318: "TD1357",
  TD1319: "TD1357",
  TD1336: "TD1357",
  TD1347: "TD1357",
  TD1368: "TD1357",
  TD1394: "TD1357",
  TD1409: "TD1357",
  BM0015: "TD1357",
  BM0017: "TD1357",
  BM0073: "TD1357",
  BM0166: "TD1357",
  BM0165: "TD1357",
  BM0196: "TD1357",
  BM0124: "TD1357",
  BM0235: "TD1357",
  BM0159: "TD1357",
  BM0230: "TD1357",
  BM0070: "TD1357",
  BM0057: "TD1357",
  BM0022: "TD1357",
};

export async function seedEmployeeData() {
  console.log("🌱 Seeding employee data...");

  // 1. Seed Departments (Level 1 -> 2 -> 3)
  console.log("📁 Creating departments...");

  const departmentMap = new Map<string, string>(); // code -> id
  let deptsCreated = 0;
  let deptsSkipped = 0;

  // Level 1
  for (const dept of level1Data) {
    const existing = await prisma.department.findUnique({
      where: { code: dept.code },
    });

    if (existing) {
      departmentMap.set(dept.code, existing.id);
      deptsSkipped++;
    } else {
      const created = await prisma.department.create({
        data: {
          name: dept.name,
          code: dept.code,
          level: dept.level,
          description: dept.description,
          colorCode: dept.colorCode,
        },
      });
      departmentMap.set(dept.code, created.id);
      deptsCreated++;
    }
  }

  // Level 2
  for (const dept of level2Data) {
    const existing = await prisma.department.findUnique({
      where: { code: dept.code },
    });

    if (existing) {
      departmentMap.set(dept.code, existing.id);
      deptsSkipped++;
    } else {
      const parentId = dept.parentCode ? departmentMap.get(dept.parentCode) : null;
      const created = await prisma.department.create({
        data: {
          name: dept.name,
          code: dept.code,
          level: dept.level,
          description: dept.description,
          colorCode: dept.colorCode,
          parentId,
        },
      });
      departmentMap.set(dept.code, created.id);
      deptsCreated++;
    }
  }

  // Level 3
  for (const dept of level3Data) {
    const existing = await prisma.department.findUnique({
      where: { code: dept.code },
    });

    if (existing) {
      departmentMap.set(dept.code, existing.id);
      deptsSkipped++;
    } else {
      const parentId = dept.parentCode ? departmentMap.get(dept.parentCode) : null;
      const created = await prisma.department.create({
        data: {
          name: dept.name,
          code: dept.code,
          level: dept.level,
          description: dept.description,
          colorCode: dept.colorCode,
          parentId,
        },
      });
      departmentMap.set(dept.code, created.id);
      deptsCreated++;
    }
  }

  console.log(`✅ Departments: ${deptsCreated} created, ${deptsSkipped} already existed`);

  // 2. Seed Companies
  console.log("🏢 Creating companies...");

  const companyMap = new Map<string, string>(); // csvFile -> id
  let companiesCreated = 0;
  let companiesSkipped = 0;

  for (const company of companiesData) {
    const existing = await prisma.company.findFirst({
      where: { csvFile: company.csvFile },
    });

    if (existing) {
      companyMap.set(company.csvFile, existing.id);
      companiesSkipped++;
    } else {
      const created = await prisma.company.create({
        data: {
          name: company.name,
          csvFile: company.csvFile,
          isActive: company.isActive,
        },
      });
      companyMap.set(company.csvFile, created.id);
      companiesCreated++;
    }
  }

  console.log(`✅ Companies: ${companiesCreated} created, ${companiesSkipped} already existed`);

  // 3. Seed Employees from CSV files
  console.log("👥 Creating employees from CSV files...");

  const employeeCodeToId = new Map<string, string>();
  let totalEmployeesCreated = 0;
  let totalEmployeesSkipped = 0;

  for (const company of companiesData) {
    const csvPath = join(__dirname, company.csvFile);
    const companyId = companyMap.get(company.csvFile);

    if (!companyId) {
      console.warn(`⚠️  Company ID not found for ${company.csvFile}`);
      continue;
    }

    try {
      const employees = parseCsvFile(csvPath);
      let companyCreated = 0;
      let companySkipped = 0;

      for (const emp of employees) {
        if (!emp.employeeCode) {
          console.warn(`⚠️  Skipping employee with no code in ${company.csvFile}`);
          continue;
        }

        // Check if employee already exists
        const existing = await prisma.employee.findUnique({
          where: { employeeCode: emp.employeeCode },
        });

        if (existing) {
          employeeCodeToId.set(emp.employeeCode, existing.id);
          companySkipped++;
          totalEmployeesSkipped++;
          continue;
        }

        // Map department
        const deptCode = mapDepartmentName(emp.department);
        const departmentId = departmentMap.get(deptCode);

        if (!departmentId) {
          console.warn(
            `⚠️  Department not found for ${emp.department} (mapped to ${deptCode}), skipping ${emp.employeeCode}`,
          );
          continue;
        }

        // Create employee without manager first
        try {
          const created = await prisma.employee.create({
            data: {
              employeeCode: emp.employeeCode,
              fullName: emp.fullName,
              gender: emp.gender,
              position: emp.position,
              role: emp.role,
              birthday: emp.birthday,
              idCardNumber: emp.idCardNumber,
              idCardIssueDate: emp.idCardIssueDate,
              idCardIssuer: emp.idCardIssuer,
              permanentAddress: emp.permanentAddress,
              phone: emp.phone,
              education: emp.education,
              startDate: emp.startDate,
              relativesNote: emp.relativesNote,
              departmentId,
              companyId,
            },
          });

          employeeCodeToId.set(emp.employeeCode, created.id);
          companyCreated++;
          totalEmployeesCreated++;
        } catch (error) {
          console.warn(`⚠️  Failed to create employee ${emp.employeeCode}:`, error);
        }
      }

      console.log(`   ✓ ${company.name}: ${companyCreated} created, ${companySkipped} skipped`);
    } catch (error) {
      console.error(`❌ Error processing ${company.csvFile}:`, error);
    }
  }

  console.log(
    `✅ Employees: ${totalEmployeesCreated} created, ${totalEmployeesSkipped} already existed`,
  );

  // 4. Update manager relationships
  console.log("🔗 Updating manager relationships...");

  let relationshipsUpdated = 0;

  for (const [employeeCode, managerCode] of Object.entries(relationships)) {
    if (!managerCode) continue; // Skip CEO and employees without managers

    const employeeId = employeeCodeToId.get(employeeCode);
    const managerId = employeeCodeToId.get(managerCode);

    if (employeeId && managerId) {
      try {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { managerId },
        });
        relationshipsUpdated++;
      } catch (error) {
        console.warn(`⚠️  Failed to update manager for ${employeeCode} -> ${managerCode}:`, error);
      }
    } else {
      if (!employeeId) {
        console.warn(`⚠️  Employee ${employeeCode} not found in database`);
      }
      if (!managerId) {
        console.warn(`⚠️  Manager ${managerCode} not found in database`);
      }
    }
  }

  console.log(`✅ Updated ${relationshipsUpdated} manager relationships`);
  console.log("🎉 Employee data seeding completed!");
}
