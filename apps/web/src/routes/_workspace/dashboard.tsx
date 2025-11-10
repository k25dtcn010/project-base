import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarTodayIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  ContentCut as ContentCutIcon,
  Description as DescriptionIcon,
  Factory as FactoryIcon,
  FileUpload as FileUploadIcon,
  Handshake as HandshakeIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  LocalOffer as LocalOfferIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Warehouse as WarehouseIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  Grow,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorkspaceTabs } from "@/components/tab/useWorkspaceTabs";

export const Route = createFileRoute("/_workspace/dashboard")({
  component: DashboardComponent,
});

interface StatCard {
  labelKey: string;
  value: string | number;
  suffix?: string;
  color?: string;
}

interface ModuleItem {
  labelKey: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgColor: string;
}

interface ModuleGroup {
  key: string;
  titleKey: string;
  icon: React.ReactNode;
  color: string;
  moduleCount: number;
  items: ModuleItem[];
}

const stats: StatCard[] = [
  {
    labelKey: "dashboard.stats.inventory",
    value: 454,
    color: "#2196F3",
  },
  {
    labelKey: "dashboard.stats.pendingApproval",
    value: 0,
    color: "#FF9800",
  },
  {
    labelKey: "dashboard.stats.monthlyRevenue",
    value: "0",
    suffix: "VNĐ",
    color: "#4CAF50",
  },
  {
    labelKey: "dashboard.stats.employees",
    value: 200,
    color: "#9C27B0",
  },
];

const moduleGroups: ModuleGroup[] = [
  {
    key: "stock",
    titleKey: "dashboard.modules.stock.title",
    icon: <WarehouseIcon sx={{ fontSize: 48 }} />,
    color: "#1a73e8",
    moduleCount: 6,
    items: [
      {
        labelKey: "dashboard.modules.stock.items.addMaterial",
        icon: <AddIcon />,
        path: "/stock/add-material",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.stock.items.exportRequest",
        icon: <FileUploadIcon />,
        path: "/stock/export-request",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
      {
        labelKey: "dashboard.modules.stock.items.approveRequest",
        icon: <CheckCircleIcon />,
        path: "/stock/approve-request",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
      {
        labelKey: "dashboard.modules.stock.items.inventoryReport",
        icon: <InventoryIcon />,
        path: "/stock/inventory-report",
        color: "#f39c12",
        bgColor: "#fff8e1",
      },
      {
        labelKey: "dashboard.modules.stock.items.approvalReport",
        icon: <DescriptionIcon />,
        path: "/stock/approval-report",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.stock.items.history",
        icon: <HistoryIcon />,
        path: "/stock/history",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
    ],
  },
  {
    key: "hrm",
    titleKey: "dashboard.modules.hrm.title",
    icon: <PeopleIcon sx={{ fontSize: 48 }} />,
    color: "#17a2b8",
    moduleCount: 2,
    items: [
      {
        labelKey: "dashboard.modules.hrm.items.management",
        icon: <PeopleIcon />,
        path: "/employees",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.hrm.items.payroll",
        icon: <ScheduleIcon />,
        path: "/payroll",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
    ],
  },
  {
    key: "projects",
    titleKey: "dashboard.modules.projects.title",
    icon: <WorkIcon sx={{ fontSize: 48 }} />,
    color: "#6f42c1",
    moduleCount: 3,
    items: [
      {
        labelKey: "dashboard.modules.projects.items.management",
        icon: <WorkIcon />,
        path: "/projects",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.projects.items.assigned",
        icon: <NotificationsIcon />,
        path: "/projects/assigned",
        color: "#f39c12",
        bgColor: "#fff8e1",
      },
      {
        labelKey: "dashboard.modules.projects.items.discussion",
        icon: <ChatIcon />,
        path: "/projects/discussion",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
    ],
  },
  {
    key: "manufactory",
    titleKey: "dashboard.modules.manufactory.title",
    icon: <FactoryIcon sx={{ fontSize: 48 }} />,
    color: "#00bcd4",
    moduleCount: 3,
    items: [
      {
        labelKey: "dashboard.modules.manufactory.items.printing",
        icon: <PrintIcon />,
        path: "/manufactory/printing",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
      {
        labelKey: "dashboard.modules.manufactory.items.fabrication",
        icon: <ContentCutIcon />,
        path: "/manufactory/fabrication",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.manufactory.items.quotation",
        icon: <LocalOfferIcon />,
        path: "/manufactory/quotation",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
    ],
  },
  {
    key: "accounting",
    titleKey: "dashboard.modules.accounting.title",
    icon: <AttachMoneyIcon sx={{ fontSize: 48 }} />,
    color: "#27ae60",
    moduleCount: 5,
    items: [
      {
        labelKey: "dashboard.modules.accounting.items.expenseRequest",
        icon: <DescriptionIcon />,
        path: "/accounting/expense-request",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.accounting.items.approveExpense",
        icon: <CheckCircleIcon />,
        path: "/accounting/approve-expense",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
      {
        labelKey: "dashboard.modules.accounting.items.expenseHistory",
        icon: <HistoryIcon />,
        path: "/accounting/expense-history",
        color: "#f39c12",
        bgColor: "#fff8e1",
      },
      {
        labelKey: "dashboard.modules.accounting.items.accountManagement",
        icon: <AccountBalanceIcon />,
        path: "/accounting/accounts",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
      {
        labelKey: "dashboard.modules.accounting.items.collections",
        icon: <AccountBalanceWalletIcon />,
        path: "/accounting/collections",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
    ],
  },
  {
    key: "crm",
    titleKey: "dashboard.modules.crm.title",
    icon: <HandshakeIcon sx={{ fontSize: 48 }} />,
    color: "#f39c12",
    moduleCount: 3,
    items: [
      {
        labelKey: "dashboard.modules.crm.items.management",
        icon: <BusinessIcon />,
        path: "/crm",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
      {
        labelKey: "dashboard.modules.crm.items.orders",
        icon: <ShoppingCartIcon />,
        path: "/crm/orders",
        color: "#f39c12",
        bgColor: "#fff8e1",
      },
      {
        labelKey: "dashboard.modules.crm.items.orderDetails",
        icon: <DescriptionIcon />,
        path: "/crm/order-details",
        color: "#6c757d",
        bgColor: "#f8f9fa",
      },
    ],
  },
  {
    key: "reports",
    titleKey: "dashboard.modules.reports.title",
    icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
    color: "#607D8B",
    moduleCount: 5,
    items: [
      {
        labelKey: "dashboard.modules.reports.items.daily",
        icon: <CalendarTodayIcon />,
        path: "/reports/daily",
        color: "#1a73e8",
        bgColor: "#e6f0ff",
      },
      {
        labelKey: "dashboard.modules.reports.items.financial",
        icon: <BarChartIcon />,
        path: "/reports/financial",
        color: "#27ae60",
        bgColor: "#e6fff0",
      },
      {
        labelKey: "dashboard.modules.reports.items.production",
        icon: <FactoryIcon />,
        path: "/reports/production",
        color: "#17a2b8",
        bgColor: "#e0f7fa",
      },
      {
        labelKey: "dashboard.modules.reports.items.sales",
        icon: <TrendingUpIcon />,
        path: "/reports/sales",
        color: "#f39c12",
        bgColor: "#fff8e1",
      },
      {
        labelKey: "dashboard.modules.reports.items.general",
        icon: <AssessmentIcon />,
        path: "/reports/general",
        color: "#6c757d",
        bgColor: "#f8f9fa",
      },
    ],
  },
  {
    key: "settings",
    titleKey: "dashboard.modules.settings.title",
    icon: <SettingsIcon sx={{ fontSize: 48 }} />,
    color: "#dc3545",
    moduleCount: 2,
    items: [
      {
        labelKey: "dashboard.modules.settings.items.security",
        icon: <SecurityIcon />,
        path: "/settings/security",
        color: "#dc3545",
        bgColor: "#f8d7da",
      },
      {
        labelKey: "dashboard.modules.settings.items.database",
        icon: <StorageIcon />,
        path: "/settings/database",
        color: "#6c757d",
        bgColor: "#f8f9fa",
      },
    ],
  },
];

function DashboardComponent() {
  const { t } = useTranslation();
  const { openTab } = useWorkspaceTabs();
  const [openModal, setOpenModal] = useState<string | null>(null);

  const handleModuleClick = (groupKey: string) => {
    setOpenModal(groupKey);
  };

  const handleItemClick = (item: ModuleItem) => {
    openTab(item.path, t(item.labelKey));
    setOpenModal(null);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  return (
    <Box
      sx={{
        py: 3,
        pb: 6,
      }}
    >
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        {/* Welcome Text */}
        <Typography
          variant="h4"
          component="h2"
          align="center"
          sx={{
            fontWeight: 500,
            color: "#2c3e50",
            mb: 1.5,
          }}
        >
          {t("dashboard.welcome")}
        </Typography>

        {/* Main Header */}
        <Typography
          variant="h3"
          component="h1"
          align="center"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: "#1a73e8",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {t("dashboard.header")}
        </Typography>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
            mb: 4,
          }}
        >
          {stats.map((stat, index) => (
            <Grow key={index} in timeout={500 + index * 100}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "0.95rem", fontWeight: 500 }}
                  >
                    {t(stat.labelKey)}
                  </Typography>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: 600,
                      color: stat.color || "#2c3e50",
                    }}
                  >
                    {stat.value} {stat.suffix || ""}
                  </Typography>
                </CardContent>
              </Card>
            </Grow>
          ))}
        </Box>

        {/* Section Title */}
        <Typography
          variant="h5"
          align="center"
          sx={{
            mb: 3,
            mt: 4,
            fontWeight: 600,
            color: "#6c757d",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {t("dashboard.modulesTitle")}
        </Typography>

        {/* Module Groups - iPhone Style */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mx: "auto",
            justifyContent: "center",
            maxWidth: {
              xs: "100%",
              md: "100%",
            },
          }}
        >
          {moduleGroups.map((group, index) => (
            <Grow key={group.key} in timeout={600 + index * 100}>
              <Paper
                elevation={0}
                onClick={() => handleModuleClick(group.key)}
                sx={{
                  borderRadius: 4,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  width: {
                    xs: "calc(50% - 12px)",
                    sm: "calc(33.333% - 16px)",
                    md: "calc(16.666% - 20px)",
                  },
                  minHeight: {
                    xs: "auto",
                    sm: "180px",
                  },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  "&:hover": {
                    transform: "scale(1.05) translateY(-5px)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
              >
                <Box
                  sx={{
                    color: group.color,
                    mb: 1.5,
                    display: "flex",
                    justifyContent: "center",
                    "& > svg": {
                      fontSize: "56px",
                    },
                  }}
                >
                  {group.icon}
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: "1rem",
                    color: "#2c3e50",
                    lineHeight: 1.3,
                  }}
                >
                  {t(group.titleKey)}
                </Typography>
                <Chip
                  label={`${group.moduleCount} Module`}
                  size="small"
                  sx={{
                    bgcolor: group.color,
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    px: 1.5,
                    height: 28,
                  }}
                />
              </Paper>
            </Grow>
          ))}
        </Box>

        {/* Modals */}
        {moduleGroups.map((group) => (
          <Dialog
            key={group.key}
            open={openModal === group.key}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
            slots={{
              transition: Fade
            }}
            slotProps={{
              transition: { timeout: 400 },

              paper: {
                sx: {
                  borderRadius: 4,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  mt: 4,
                },
              }
            }}>
            <DialogTitle
              sx={{
                bgcolor: group.color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {group.icon}
                <Typography
                  variant="h6"
                  component="span"
                  sx={{ fontWeight: 600 }}
                >
                  {t(group.titleKey)}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{ pt: "24px !important", px: 3, pb: 3, bgcolor: "#fafafa" }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 2.5,
                }}
              >
                {group.items.map((item, idx) => (
                  <Grow key={idx} in timeout={300 + idx * 100}>
                    <Paper
                      elevation={0}
                      onClick={() => handleItemClick(item)}
                      sx={{
                        p: 2.5,
                        minHeight: 160,
                        width: {
                          xs: "100%",
                          sm: "calc(50% - 10px)",
                          md: "calc(33.333% - 14px)",
                        },
                        maxWidth: 280,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        cursor: "pointer",
                        borderRadius: 3,
                        bgcolor: item.bgColor,
                        border: `1px solid ${item.color}20`,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          color: item.color,
                          fontSize: "3rem",
                          mb: 1.5,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          "& > svg": {
                            fontSize: "3rem",
                          },
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 500,
                          color: "#2c3e50",
                          fontSize: "0.95rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {t(item.labelKey)}
                      </Typography>
                    </Paper>
                  </Grow>
                ))}
              </Box>
            </DialogContent>
          </Dialog>
        ))}
      </Container>
    </Box>
  );
}
