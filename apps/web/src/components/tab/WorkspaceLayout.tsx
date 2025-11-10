import { Box, Paper } from "@mui/material";
import { Outlet, useLocation } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { useTabsStore } from "@/stores/useTabsStore";

import { AppSidebar } from "../AppSidebar";
import { EditableTabs } from "./EditableTabs";
import TopAppBar from "./TopAppBar";
import { useWorkspaceTabs } from "./useWorkspaceTabs";

/**
 * Workspace Layout with Tab System
 *
 * This layout wraps your existing routes with a tab bar.
 *
 * File structure should be:
 * routes/
 * ├── _workspace.tsx              ← This layout
 * └── _workspace/
 *     ├── hr.tsx                  ← Your existing HR route
 *     ├── hr/
 *     │   ├── employees.tsx       ← Your existing employees route
 *     │   └── employees/
 *     │       └── $id.tsx         ← Your existing employee detail route
 *
 * Usage in route definition:
 * ```typescript
 * // routes/_workspace.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { WorkspaceLayout } from '@/components/WorkspaceLayout';
 *
 * export const Route = createFileRoute('/_workspace')({
 *   component: WorkspaceLayout,
 * });
 * ```
 */
export const WorkspaceLayout = memo(() => {
  const { tabs, activeId, changeTab, removeTab, pinTab, unpinTab, duplicateTab, closeOtherTabs } =
    useWorkspaceTabs();
  const updateScrollPosition = useTabsStore((state) => state.updateScrollPosition);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousActiveIdRef = useRef<string>(activeId);
  const isRestoringRef = useRef(false);
  const scrollSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  // Check if we're on the dashboard page
  const isDashboard = location.pathname === "/dashboard";

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Debounced scroll save
  const saveScrollPosition = useCallback(
    (id: string, scrollTop: number) => {
      if (isRestoringRef.current || scrollTop === 0 || tabs.length === 0) return;

      if (scrollSaveTimeoutRef.current) {
        clearTimeout(scrollSaveTimeoutRef.current);
      }

      scrollSaveTimeoutRef.current = setTimeout(() => {
        updateScrollPosition(id, scrollTop);
      }, 200);
    },
    [updateScrollPosition, tabs.length],
  );

  // Save scroll position when switching tabs or unmounting
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || tabs.length === 0) return;

    // Save on switch
    if (previousActiveIdRef.current !== activeId) {
      const previousScrollTop = scrollContainer.scrollTop;
      if (previousActiveIdRef.current && previousScrollTop > 0) {
        updateScrollPosition(previousActiveIdRef.current, previousScrollTop);
      }
      previousActiveIdRef.current = activeId;
    }

    // Restore scroll position for current tab
    const state = useTabsStore.getState();
    const currentTab = state.tabs.find((t) => t.id === activeId);
    const scrollPosition = currentTab?.scrollPosition ?? 0;

    // Use requestAnimationFrame to ensure DOM is ready
    isRestoringRef.current = true;
    const rafId = requestAnimationFrame(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPosition;
        // Allow saving after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      if (scrollSaveTimeoutRef.current) {
        clearTimeout(scrollSaveTimeoutRef.current);
      }
    };
  }, [activeId, updateScrollPosition]);

  // Save scroll position periodically while scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || tabs.length === 0) return;

    const handleScroll = () => {
      if (isRestoringRef.current) return;
      const scrollTop = scrollContainer.scrollTop;
      saveScrollPosition(activeId, scrollTop);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [activeId, saveScrollPosition]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top AppBar - Fixed at top */}
      <TopAppBar onMenuClick={handleMenuClick} />

      {/* Main container below AppBar */}
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden", mt: "64px" }}>
        {/* Sidebar - Hidden on dashboard */}
        {!isDashboard && <AppSidebar open={sidebarOpen} />}

        {/* Main Content Area */}
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
          {/* Tab Bar - Hidden on dashboard */}
          {!isDashboard && (
            <Paper
              elevation={1}
              sx={{
                zIndex: 1,
                flexShrink: 0,
                borderRadius: 0,
                pt: 1,
              }}
            >
              <EditableTabs
                items={tabs}
                activeId={activeId}
                onTabChange={changeTab}
                onTabRemove={removeTab}
                onTabPin={pinTab}
                onTabUnpin={unpinTab}
                onTabDuplicate={duplicateTab}
                onCloseOthers={closeOtherTabs}
                type="card"
                addable={false}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              />
            </Paper>
          )}

          {/* Route Content */}
          <Box
            ref={scrollContainerRef}
            sx={{
              flexGrow: 1,
              overflow: "auto",
              bgcolor: isDashboard ? "transparent" : "grey.50",
              background: isDashboard
                ? "linear-gradient(135deg, #ecf0f1 0%, #f5f7fa 100%)"
                : undefined,
              contain: "layout style paint",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

WorkspaceLayout.displayName = "WorkspaceLayout";

export default WorkspaceLayout;
