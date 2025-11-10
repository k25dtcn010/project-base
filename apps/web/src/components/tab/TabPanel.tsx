import { Box, type BoxProps } from "@mui/material";
import React, { memo } from "react";

interface TabPanelProps extends BoxProps {
  value: string;
  activeValue: string;
  keepMounted?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = memo(
  ({ value, activeValue, keepMounted = false, children, sx, ...other }) => {
    const isActive = value === activeValue;

    if (!isActive && !keepMounted) {
      return null;
    }

    return (
      <Box
        role="tabpanel"
        hidden={!isActive}
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        sx={{
          display: isActive ? "block" : "none",
          willChange: isActive ? "auto" : "transform",
          ...sx,
        }}
        {...other}
      >
        {children}
      </Box>
    );
  },
);

TabPanel.displayName = "TabPanel";

export default TabPanel;
