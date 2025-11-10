// @ts-nocheck - Deprecated file, kept for reference only. Use useWorkspaceTabs instead.
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { type TabItem } from "./tab/EditableTabs";

interface UseTabsOptions {
  /**
   * Initial tabs to display
   */
  initialTabs: TabItem[];

  /**
   * Default tab key to activate if none specified
   */
  defaultActiveKey?: string;

  /**
   * Search param name for storing active tab in URL
   * @default 'tab'
   */
  searchParamName?: string;

  /**
   * Search param name for storing open tabs in URL
   * @default 'tabs'
   */
  openTabsParamName?: string;

  /**
   * Whether to sync tabs state with URL
   * @default true
   */
  syncWithUrl?: boolean;

  /**
   * Maximum number of tabs allowed
   */
  maxTabs?: number;

  /**
   * Callback when a new tab needs to be created
   */
  onTabCreate?: () => TabItem;

  /**
   * Callback when tab changes
   */
  onTabChange?: (key: string) => void;

  /**
   * Callback before tab is removed (can be used to show confirmation)
   * Return false to prevent removal
   */
  beforeTabRemove?: (key: string) => boolean | Promise<boolean>;
}

interface UseTabsReturn {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab?: TabItem) => void;
  removeTab: (key: string) => void;
  changeTab: (key: string) => void;
  updateTab: (key: string, updates: Partial<TabItem>) => void;
}

/**
 * @deprecated This hook is deprecated. Use useWorkspaceTabs + useTabsStore instead.
 * Kept for reference only.
 *
 * Hook for managing editable tabs with TanStack Router integration
 *
 * @example
 * ```tsx
 * // In your route file
 * export const Route = createFileRoute('/dashboard')({
 *   validateSearch: (search: Record<string, unknown>) => {
 *     return {
 *       tab: (search.tab as string) || undefined,
 *       tabs: (search.tabs as string) || undefined,
 *     };
 *   },
 * });
 *
 * // In your component
 * const { tabs, activeKey, addTab, removeTab, changeTab } = useTabs({
 *   initialTabs: [
 *     { key: 'overview', label: 'Overview', closable: false },
 *     { key: 'analytics', label: 'Analytics' },
 *   ],
 * });
 * ```
 */
export function useTabs(options: UseTabsOptions): UseTabsReturn {
  const {
    initialTabs,
    defaultActiveKey,
    searchParamName = "tab",
    openTabsParamName = "tabs",
    syncWithUrl = true,
    maxTabs,
    onTabCreate,
    onTabChange,
    beforeTabRemove,
  } = options;

  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;

  // Parse open tabs from URL or use initial tabs
  const tabs = useMemo(() => {
    if (!syncWithUrl || !searchParams[openTabsParamName]) {
      return initialTabs;
    }

    try {
      const tabKeys = searchParams[openTabsParamName].split(",");
      return tabKeys
        .map((key) => initialTabs.find((t) => t.key === key))
        .filter(Boolean) as TabItem[];
    } catch {
      return initialTabs;
    }
  }, [syncWithUrl, searchParams, openTabsParamName, initialTabs]);

  // Get active key from URL or default
  const activeKey = useMemo(() => {
    if (syncWithUrl && searchParams[searchParamName]) {
      return searchParams[searchParamName];
    }
    return defaultActiveKey || tabs[0]?.key || "";
  }, [syncWithUrl, searchParams, searchParamName, defaultActiveKey, tabs]);

  // Update URL with new tab state
  const updateUrl = useCallback(
    (newActiveKey: string, newTabs: TabItem[]) => {
      if (!syncWithUrl) return;

      // @ts-ignore - TanStack Router typing issue with search params
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          [searchParamName]: newActiveKey,
          [openTabsParamName]: newTabs.map((t) => t.key).join(","),
        }),
        replace: true,
      });
    },
    [syncWithUrl, navigate, searchParamName, openTabsParamName],
  );

  // Change active tab
  const changeTab = useCallback(
    (key: string) => {
      if (key === activeKey) return;

      onTabChange?.(key);

      if (syncWithUrl) {
        // @ts-ignore - TanStack Router typing issue with search params
        navigate({
          search: (prev: Record<string, unknown>) => ({
            ...prev,
            [searchParamName]: key,
          }),
          replace: true,
        });
      }
    },
    [activeKey, onTabChange, syncWithUrl, navigate, searchParamName],
  );

  // Add new tab
  const addTab = useCallback(
    (newTab?: TabItem) => {
      if (maxTabs && tabs.length >= maxTabs) {
        console.warn(`Maximum tabs limit (${maxTabs}) reached`);
        return;
      }

      const tabToAdd = newTab || onTabCreate?.();
      if (!tabToAdd) {
        console.error("No tab provided and onTabCreate is not defined");
        return;
      }

      // Check if tab already exists
      if (tabs.some((t) => t.key === tabToAdd.key)) {
        changeTab(tabToAdd.key);
        return;
      }

      const newTabs = [...tabs, tabToAdd];
      updateUrl(tabToAdd.key, newTabs);
      onTabChange?.(tabToAdd.key);
    },
    [tabs, maxTabs, onTabCreate, changeTab, updateUrl, onTabChange],
  );

  // Remove tab
  const removeTab = useCallback(
    async (key: string) => {
      // Check if removal is allowed
      if (beforeTabRemove) {
        const canRemove = await beforeTabRemove(key);
        if (!canRemove) return;
      }

      const tabIndex = tabs.findIndex((t) => t.key === key);
      if (tabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.key !== key);

      // If we removed all tabs, don't do anything
      if (newTabs.length === 0) {
        console.warn("Cannot remove last tab");
        return;
      }

      // If we removed the active tab, activate another one
      let newActiveKey = activeKey;
      if (key === activeKey) {
        // Activate previous tab, or next if this was the first
        const newIndex = Math.max(0, tabIndex - 1);
        newActiveKey = newTabs[newIndex].key;
      }

      updateUrl(newActiveKey, newTabs);

      if (newActiveKey !== activeKey) {
        onTabChange?.(newActiveKey);
      }
    },
    [tabs, activeKey, beforeTabRemove, updateUrl, onTabChange],
  );

  // Update tab properties
  const updateTab = useCallback(
    (key: string, updates: Partial<TabItem>) => {
      const tabIndex = tabs.findIndex((t) => t.key === key);
      if (tabIndex === -1) return;

      const newTabs = [...tabs];
      newTabs[tabIndex] = { ...newTabs[tabIndex], ...updates };

      updateUrl(activeKey, newTabs);
    },
    [tabs, activeKey, updateUrl],
  );

  return {
    tabs,
    activeKey,
    addTab,
    removeTab,
    changeTab,
    updateTab,
  };
}

export default useTabs;
