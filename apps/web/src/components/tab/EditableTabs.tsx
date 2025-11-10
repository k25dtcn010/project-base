import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Tab,
  Tabs,
  type TabsProps,
} from "@mui/material";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface TabItem {
  id: string;
  path: string;
  label: string;
  closable?: boolean;
  pinned?: boolean;
  content?: React.ReactNode;
  [key: string]: any; // Allow additional custom properties
}

interface EditableTabsProps extends Omit<TabsProps, "onChange"> {
  items: TabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
  onTabAdd?: () => void;
  onTabRemove?: (id: string) => void;
  onTabPin?: (id: string) => void;
  onTabUnpin?: (id: string) => void;
  onTabDuplicate?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  type?: "card" | "default";
  addable?: boolean;
  maxTabs?: number;
}

const StyledTabs = styled(Tabs, {
  shouldForwardProp: (prop) => prop !== "tabType",
})<{ tabType?: "card" | "default" }>(({ theme, tabType }) => ({
  minHeight: tabType === "card" ? 48 : 48,
  borderBottom: tabType === "card" ? "none" : `1px solid ${theme.palette.divider}`,
  "& .MuiTabs-indicator": {
    display: tabType === "card" ? "none" : "block",
  },
  "& .MuiTabs-flexContainer": {
    gap: tabType === "card" ? theme.spacing(0.5) : 0,
  },
}));

const StyledTab = styled(Tab, {
  shouldForwardProp: (prop) => prop !== "tabType" && prop !== "hasCloseButton",
})<{ tabType?: "card" | "default"; hasCloseButton?: boolean }>(
  ({ theme, tabType, hasCloseButton }) => ({
    minHeight: tabType === "card" ? 48 : 48,
    padding: theme.spacing(1, 2),
    paddingRight: hasCloseButton ? theme.spacing(1) : theme.spacing(2),
    textTransform: "none",
    fontWeight: 500,
    fontSize: "0.875rem",
    marginRight: 0,
    transition: "all 0.2s ease",
    ...(tabType === "card"
      ? {
          border: `1px solid transparent`,
          borderBottom: "none",
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderColor: theme.palette.divider,
          },
          "&.Mui-selected": {
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            borderBottomColor: theme.palette.background.paper,
            color: theme.palette.primary.main,
            boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.08)",
          },
          "&.Mui-selected:hover": {
            backgroundColor: theme.palette.background.paper,
          },
        }
      : {}),
  }),
);

const AddButton = styled(Tab)(({ theme }) => ({
  minWidth: "auto",
  minHeight: 48,
  padding: theme.spacing(1),
  border: `1px solid transparent`,
  borderBottom: "none",
  backgroundColor: "transparent",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderColor: theme.palette.divider,
  },
}));

// Memoized tab label component for performance
const TabLabel = memo<{
  item: TabItem;
  showCloseButton: boolean;
  onClose: (e: React.MouseEvent, id: string) => void;
}>(({ item, showCloseButton, onClose }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    {item.pinned && <PushPinIcon sx={{ fontSize: 14, opacity: 0.7 }} />}
    <span>{item.label}</span>
    {showCloseButton && (
      <Box
        component="span"
        onClick={(e) => onClose(e, item.id)}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          ml: 1,
          mr: -0.5,
          cursor: "pointer",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
        aria-label={`close ${item.label}`}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </Box>
    )}
  </Box>
));

TabLabel.displayName = "TabLabel";

export const EditableTabs: React.FC<EditableTabsProps> = memo(
  ({
    items,
    activeId,
    onTabChange,
    onTabAdd,
    onTabRemove,
    onTabPin,
    onTabUnpin,
    onTabDuplicate,
    onCloseOthers,
    type = "default",
    addable = false,
    maxTabs,
    ...tabsProps
  }) => {
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState<{
      mouseX: number;
      mouseY: number;
      tabId: string;
    } | null>(null);

    const handleTabChange = useCallback(
      (_event: React.SyntheticEvent, newValue: string) => {
        if (newValue !== "__add__") {
          onTabChange(newValue);
        }
      },
      [onTabChange],
    );

    const handleClose = useCallback(
      (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        onTabRemove?.(id);
      },
      [onTabRemove],
    );

    const handleAdd = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        onTabAdd?.();
      },
      [onTabAdd],
    );

    const handleContextMenu = useCallback((event: React.MouseEvent, tabId: string) => {
      event.preventDefault();
      setContextMenu({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
        tabId,
      });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
      setContextMenu(null);
    }, []);

    const handlePinTab = useCallback(() => {
      if (contextMenu?.tabId && onTabPin) {
        onTabPin(contextMenu.tabId);
      }
      handleCloseContextMenu();
    }, [contextMenu, onTabPin, handleCloseContextMenu]);

    const handleUnpinTab = useCallback(() => {
      if (contextMenu?.tabId && onTabUnpin) {
        onTabUnpin(contextMenu.tabId);
      }
      handleCloseContextMenu();
    }, [contextMenu, onTabUnpin, handleCloseContextMenu]);

    const handleDuplicateTab = useCallback(() => {
      if (contextMenu?.tabId && onTabDuplicate) {
        onTabDuplicate(contextMenu.tabId);
      }
      handleCloseContextMenu();
    }, [contextMenu, onTabDuplicate, handleCloseContextMenu]);

    const handleCloseOthers = useCallback(() => {
      if (contextMenu?.tabId && onCloseOthers) {
        onCloseOthers(contextMenu.tabId);
      }
      handleCloseContextMenu();
    }, [contextMenu, onCloseOthers, handleCloseContextMenu]);

    const canAddMore = useMemo(() => !maxTabs || items.length < maxTabs, [maxTabs, items.length]);

    // Ensure activeId exists in items, fallback to first item
    const safeActiveId = useMemo(
      () => items.find((item) => item.id === activeId)?.id || items[0]?.id || activeId,
      [items, activeId],
    );

    const currentTab = useMemo(() => {
      if (!contextMenu) return null;
      return items.find((item) => item.id === contextMenu.tabId);
    }, [contextMenu, items]);

    // Don't render if no items
    if (items.length === 0) {
      return null;
    }

    return (
      <Box sx={{ width: "100%" }}>
        <StyledTabs
          value={safeActiveId}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          tabType={type}
          {...tabsProps}
        >
          {items.map((item) => {
            const showCloseButton = type === "card" && item.closable !== false && !!onTabRemove;

            return (
              <StyledTab
                key={item.id}
                value={item.id}
                tabType={type}
                hasCloseButton={showCloseButton}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
                label={
                  <TabLabel item={item} showCloseButton={showCloseButton} onClose={handleClose} />
                }
              />
            );
          })}

          {type === "card" && addable && onTabAdd && canAddMore && (
            <AddButton
              value="__add__"
              icon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={handleAdd}
              aria-label="add new tab"
            />
          )}
        </StyledTabs>

        <Menu
          open={contextMenu !== null}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
          }
        >
          {currentTab?.pinned ? (
            <MenuItem onClick={handleUnpinTab}>
              <ListItemIcon>
                <PushPinOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("tabs.contextMenu.unpinTab")}</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem onClick={handlePinTab}>
              <ListItemIcon>
                <PushPinIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("tabs.contextMenu.pinTab")}</ListItemText>
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleDuplicateTab}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("tabs.contextMenu.duplicateTab")}</ListItemText>
          </MenuItem>

          {currentTab?.closable !== false && <Divider />}

          {currentTab?.closable !== false && (
            <MenuItem
              onClick={() => {
                if (contextMenu?.tabId) {
                  onTabRemove?.(contextMenu.tabId);
                }
                handleCloseContextMenu();
              }}
            >
              <ListItemIcon>
                <CloseIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("tabs.contextMenu.closeTab")}</ListItemText>
            </MenuItem>
          )}

          {currentTab?.closable !== false && items.length > 1 && (
            <MenuItem onClick={handleCloseOthers}>
              <ListItemIcon>
                <CloseIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("tabs.contextMenu.closeOtherTabs")}</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Box>
    );
  },
);

EditableTabs.displayName = "EditableTabs";

export default EditableTabs;
