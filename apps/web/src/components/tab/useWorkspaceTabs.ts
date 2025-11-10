import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useTabsStore } from "@/stores/useTabsStore";

/**
 * Hook for managing workspace tabs with Zustand + localStorage
 *
 * This hook integrates with your existing route structure and stores
 * tabs state in localStorage instead of URL for cleaner URLs.
 *
 * Tabs are now managed with internal IDs, so duplicate tabs can have
 * the same URL path but different IDs.
 *
 * Usage:
 * ```tsx
 * const { tabs, activeId, openTab, changeTab, removeTab } = useWorkspaceTabs();
 *
 * // In menu click handler:
 * openTab('/employees', 'Employees');
 * ```
 */
export function useWorkspaceTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatingRef = useRef(false);
  const previousPathRef = useRef<string>("");

  const tabs = useTabsStore((state) => state.tabs);
  const activeId = useTabsStore((state) => state.activeId);
  const pinTab = useTabsStore((state) => state.pinTab);
  const unpinTab = useTabsStore((state) => state.unpinTab);
  const duplicateTab = useTabsStore((state) => state.duplicateTab);
  const closeOtherTabs = useTabsStore((state) => state.closeOtherTabs);
  const updateScrollPosition = useTabsStore((state) => state.updateScrollPosition);
  const { t } = useTranslation();

  // Helper function to get entity label from route segment using i18n
  const getEntityLabel = (segment: string): string => {
    const key = `tabs.entities.${segment}`;
    const translated = t(key);

    // If translation exists (not returning the key), use it
    if (translated !== key) {
      return translated;
    }

    // Otherwise, capitalize the segment
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Sync store when route changes (from browser back/forward or direct navigation)
  useEffect(() => {
    const currentPath = location.pathname;

    // Don't update if we're currently navigating programmatically
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      previousPathRef.current = currentPath;
      return;
    }

    // Don't update if path hasn't changed
    if (currentPath === previousPathRef.current) {
      return;
    }

    // Don't update if on root or dashboard
    if (currentPath === "/" || currentPath === "/dashboard") {
      return;
    }

    previousPathRef.current = currentPath;

    // Check if tab already exists for current path
    const state = useTabsStore.getState();
    const existingTab = state.tabs.find((t) => t.path === currentPath);

    if (existingTab) {
      // Tab exists, just switch to it if not already active
      if (existingTab.id !== state.activeId) {
        state.setActiveId(existingTab.id);
      }
    } else {
      // No tab exists for this path, create one
      // Generate label from path
      const pathSegments = currentPath.split("/").filter(Boolean);

      // Smart label generation
      let label = "Dashboard";
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const secondLastSegment =
          pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : "";

        // Check if last segment is a number (like /employees/1)
        if (/^\d+$/.test(lastSegment) && secondLastSegment) {
          const entityLabel = getEntityLabel(secondLastSegment);
          label = `${entityLabel} ${lastSegment}`;
        } else if (lastSegment === "add" && secondLastSegment) {
          // For add routes like /employees/add
          const entityLabel = getEntityLabel(secondLastSegment);
          const addAction = t("tabs.actions.add");
          label = `${addAction} ${entityLabel}`;
        } else if (lastSegment === "edit" && pathSegments.length > 1) {
          // For edit routes like /employees/1/edit
          const thirdLastSegment =
            pathSegments.length > 2 ? pathSegments[pathSegments.length - 3] : "";
          const idSegment = pathSegments.length > 2 ? pathSegments[pathSegments.length - 2] : "";

          if (/^\d+$/.test(idSegment) && thirdLastSegment) {
            const entityLabel = getEntityLabel(thirdLastSegment);
            const editAction = t("tabs.actions.edit");
            label = `${editAction} ${entityLabel} ${idSegment}`;
          } else {
            label = lastSegment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          }
        } else {
          // Default: capitalize each word
          label = lastSegment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }

      state.openTab(currentPath, label);
    }
  }, [location.pathname, t]);

  // Wrapped openTab that navigates and updates store
  const handleOpenTab = (path: string, label: string) => {
    // Don't create tab for dashboard, just navigate
    if (path === "/dashboard" || path === "/") {
      isNavigatingRef.current = true;
      navigate({ to: path as any });
      return;
    }

    isNavigatingRef.current = true;
    useTabsStore.getState().openTab(path, label);
    navigate({ to: path as any });
  };

  // Change active tab (navigate to different route)
  const changeTab = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    isNavigatingRef.current = true;
    useTabsStore.getState().setActiveId(id);
    navigate({ to: tab.path as any });
  };

  // Wrapped removeTab that handles navigation
  const handleRemoveTab = (id: string) => {
    const state = useTabsStore.getState();
    const currentIndex = state.tabs.findIndex((t) => t.id === id);
    const isActive = id === state.activeId;

    state.removeTab(id);

    // If closing active tab, navigate to another one
    const updatedTabs = useTabsStore.getState().tabs;
    if (isActive && updatedTabs.length > 0) {
      const newIndex = Math.max(0, currentIndex - 1);
      const newTab = updatedTabs[newIndex];
      if (newTab) {
        isNavigatingRef.current = true;
        useTabsStore.getState().setActiveId(newTab.id);
        navigate({ to: newTab.path as any });
      }
    }
  };

  return {
    tabs,
    activeId,
    openTab: handleOpenTab,
    changeTab,
    removeTab: handleRemoveTab,
    pinTab,
    unpinTab,
    duplicateTab,
    closeOtherTabs,
    updateScrollPosition,
  };
}

export default useWorkspaceTabs;
