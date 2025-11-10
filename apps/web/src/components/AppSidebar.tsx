import {
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarMonthIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  EventBusy as EventBusyIcon,
  ExpandLess,
  ExpandMore,
  Fingerprint as FingerprintIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  selectClasses,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorkspaceTabs } from "./tab/useWorkspaceTabs";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface MenuItem {
  key: string;
  path: string;
  labelKey: string; // i18n key instead of hardcoded label
  icon: React.ReactNode;
  children?: MenuItem[];
}

interface MenuGroup {
  subheaderKey?: string; // i18n key for subheader
  items: MenuItem[];
}

const getMenuGroups = (): MenuGroup[] => [
  {
    items: [
      {
        key: "dashboard",
        path: "/dashboard",
        labelKey: "sidebar.dashboard",
        icon: <DashboardIcon />,
      },
    ],
  },
  {
    subheaderKey: "sidebar.subheaders.hrm",
    items: [
      {
        key: "hr",
        path: "/employees",
        labelKey: "sidebar.hr",
        icon: <PeopleIcon />,
        children: [
          {
            key: "hr-employees",
            path: "/employees",
            labelKey: "sidebar.hr_employees",
            icon: <PeopleIcon />,
          },
          {
            key: "hr-contracts",
            path: "/contracts",
            labelKey: "sidebar.hr_contracts",
            icon: <DescriptionIcon />,
          },
          {
            key: "hr-decisions",
            path: "/decisions",
            labelKey: "sidebar.hr_decisions",
            icon: <GavelIcon />,
          },
          {
            key: "hr-reports",
            path: "/reports",
            labelKey: "sidebar.hr_reports",
            icon: <AssessmentIcon />,
          },
        ],
      },
      {
        key: "attendance",
        path: "/timekeeping",
        labelKey: "sidebar.attendance",
        icon: <AccessTimeIcon />,
        children: [
          {
            key: "attendance-timekeeping",
            path: "/timekeeping",
            labelKey: "sidebar.attendance_timekeeping",
            icon: <FingerprintIcon />,
          },
          {
            key: "attendance-shifts",
            path: "/shifts",
            labelKey: "sidebar.attendance_shifts",
            icon: <CalendarMonthIcon />,
          },
          {
            key: "attendance-leave",
            path: "/leaves",
            labelKey: "sidebar.attendance_leave",
            icon: <EventBusyIcon />,
          },
          {
            key: "attendance-reports",
            path: "/attendance-reports",
            labelKey: "sidebar.attendance_reports",
            icon: <AssessmentIcon />,
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        key: "settings",
        path: "/settings",
        labelKey: "sidebar.settings",
        icon: <SettingsIcon />,
      },
    ],
  },
];

/**
 * Sidebar Menu Component
 *
 * Integrates with workspace tabs - clicking menu items opens tabs
 * Supports collapsed mode to show only icons
 *
 * Usage:
 * ```tsx
 * <Box sx={{ display: 'flex' }}>
 *   <AppSidebar open={sidebarOpen} />
 *   <WorkspaceLayout />
 * </Box>
 * ```
 */
interface AppSidebarProps {
  open: boolean;
}

export function AppSidebar({ open }: AppSidebarProps) {
  const { t } = useTranslation();
  const { tabs, activeId, openTab } = useWorkspaceTabs();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [company, setCompany] = useState("tiendu-hn");

  const menuGroups = getMenuGroups();

  const handleCompanyChange = (event: any) => {
    setCompany(event.target.value);
  };

  const getCompanyLabel = (value: string) => {
    switch (value) {
      case "tiendu-hn":
        return "Tiến Dư - Hà Nội";
      case "tiendu-hcm":
        return "Tiến Dư - Hồ Chí Minh";
      case "bemous":
        return "Bemous";
      case "ibright":
        return "IBright";
      case "titc":
        return "TITC";
      case "add-company":
        return "Add Company";
      default:
        return "Select Company";
    }
  };

  const handleMenuClick = (item: MenuItem) => {
    // If item has children, toggle expand/collapse
    if (item.children && item.children.length > 0) {
      setExpandedItems((prev) =>
        prev.includes(item.key) ? prev.filter((k) => k !== item.key) : [...prev, item.key],
      );
    } else {
      // Open tab or switch to existing tab
      openTab(item.path, t(item.labelKey));
    }
  };

  const isExpanded = (key: string) => {
    return expandedItems.includes(key);
  };

  const isActive = (path: string) => {
    // Check if ANY tab with this path is currently active (handles duplicate tabs)
    return tabs.some((tab) => tab.path === path && tab.id === activeId);
  };

  return (
    <Box
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        transition: (theme) =>
          theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          // Custom scrollbar styling
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          // Firefox scrollbar styling
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
        }}
      >
        <List sx={{ width: "100%" }}>
          {menuGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {/* Subheader - only show when sidebar is open */}
              {group.subheaderKey && open && (
                <ListSubheader
                  sx={{
                    bgcolor: "transparent",
                    lineHeight: "40px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    position: "static",
                  }}
                >
                  {t(group.subheaderKey)}
                </ListSubheader>
              )}

              {/* Divider for collapsed mode when there's a subheader */}
              {group.subheaderKey && !open && groupIndex > 0 && <Divider sx={{ mb: 1 }} />}

              {/* Menu items */}
              {group.items.map((item) => (
                <React.Fragment key={item.key}>
                  <ListItem disablePadding sx={{ display: "block" }}>
                    <Tooltip title={!open ? t(item.labelKey) : ""} placement="right">
                      <ListItemButton
                        selected={isActive(item.path)}
                        onClick={() => handleMenuClick(item)}
                        sx={{
                          minHeight: 48,
                          height: 48,
                          justifyContent: open ? "initial" : "center",
                          px: 2.5,
                          borderRight: 3,
                          borderColor: "transparent",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                            borderColor: "rgba(25, 118, 210, 0.3)",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "rgba(25, 118, 210, 0.08)",
                            borderColor: "primary.main",
                            "&:hover": {
                              backgroundColor: "rgba(25, 118, 210, 0.12)",
                            },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 3 : "auto",
                            justifyContent: "center",
                            color: isActive(item.path) ? "primary.main" : "inherit",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={t(item.labelKey)}
                          sx={{ opacity: open ? 1 : 0 }}
                          slotProps={{
                            primary: {
                              fontWeight: isActive(item.path) ? 600 : 400,
                            },
                          }}
                        />
                        {/* Show expand/collapse icon for items with children */}
                        {open && item.children && item.children.length > 0 && (
                          <Box
                            sx={{
                              ml: "auto",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {isExpanded(item.key) ? <ExpandLess /> : <ExpandMore />}
                          </Box>
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>

                  {/* Render children if exists and expanded */}
                  {item.children && item.children.length > 0 && (
                    <Collapse in={isExpanded(item.key)} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => (
                          <ListItem key={child.key} disablePadding sx={{ display: "block" }}>
                            <Tooltip title={!open ? t(child.labelKey) : ""} placement="right">
                              <ListItemButton
                                selected={isActive(child.path)}
                                onClick={() => openTab(child.path, t(child.labelKey))}
                                sx={{
                                  minHeight: 48,
                                  height: 48,
                                  justifyContent: open ? "initial" : "center",
                                  px: 2.5,
                                  pl: open ? 6 : 2.5,
                                  borderRight: 3,
                                  borderColor: "transparent",
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    borderColor: "rgba(25, 118, 210, 0.3)",
                                  },
                                  "&.Mui-selected": {
                                    backgroundColor: "rgba(25, 118, 210, 0.12)",
                                    borderColor: "primary.main",
                                    "&:hover": {
                                      backgroundColor: "rgba(25, 118, 210, 0.16)",
                                    },
                                  },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : "auto",
                                    justifyContent: "center",
                                    color: isActive(child.path) ? "primary.main" : "inherit",
                                  }}
                                >
                                  {child.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={t(child.labelKey)}
                                  sx={{ opacity: open ? 1 : 0 }}
                                  slotProps={{
                                    primary: {
                                      fontWeight: isActive(child.path) ? 600 : 400,
                                      fontSize: "0.875rem",
                                    },
                                  }}
                                />
                              </ListItemButton>
                            </Tooltip>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </List>
      </Box>
      {/* Company Selector at Bottom */}
      <Box
        sx={{
          p: open ? 2 : 1,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {open ? (
          <Select
            labelId="company-select"
            id="company-simple-select"
            value={company}
            onChange={handleCompanyChange}
            displayEmpty
            inputProps={{ "aria-label": "Select company" }}
            fullWidth
            size="small"
            sx={{
              [`& .${selectClasses.select}`]: {
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 1,
              },
            }}
          >
            <MenuItem value="tiendu-hn">
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  <BusinessIcon sx={{ fontSize: "1rem" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Tiến Dư"
                secondary="Hà Nội"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                  secondary: { fontSize: "0.75rem" },
                }}
              />
            </MenuItem>
            <MenuItem value="tiendu-hcm">
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  <BusinessIcon sx={{ fontSize: "1rem" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Tiến Dư"
                secondary="Hồ Chí Minh"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                  secondary: { fontSize: "0.75rem" },
                }}
              />
            </MenuItem>
            <MenuItem value="bemous">
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "success.main" }}>
                  <BusinessIcon sx={{ fontSize: "1rem" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Bemous"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              />
            </MenuItem>
            <MenuItem value="ibright">
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "warning.main" }}>
                  <BusinessIcon sx={{ fontSize: "1rem" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="IBright"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              />
            </MenuItem>
            <MenuItem value="titc">
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "info.main" }}>
                  <BusinessIcon sx={{ fontSize: "1rem" }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="TITC"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              />
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem value="add-company">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AddIcon />
              </ListItemIcon>
              <ListItemText
                primary="Add Company"
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              />
            </MenuItem>
          </Select>
        ) : (
          <Tooltip title={getCompanyLabel(company)} placement="right">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                cursor: "pointer",
                mx: "auto",
              }}
            >
              <BusinessIcon sx={{ fontSize: "1.25rem" }} />
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

/**
 * Example: Opening employee detail from employees list
 *
 * Usage in your employees list component:
 */
export function EmployeeListExample() {
  const { openTab } = useWorkspaceTabs();

  const handleEmployeeClick = (employee: { id: string; name: string }) => {
    // Open employee detail tab with custom label
    openTab(`/hr/employees/${employee.id}`, employee.name);
  };

  return (
    <div>
      {/* Your employee list rendering */}
      <div onClick={() => handleEmployeeClick({ id: "123", name: "John Doe" })}>
        Click to open employee detail
      </div>
    </div>
  );
}

export default AppSidebar;
