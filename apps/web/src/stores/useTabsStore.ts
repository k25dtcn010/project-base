import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TabItem {
  id: string; // Internal unique ID (không hiện trên URL)
  path: string; // URL path (hiện trên browser)
  label: string;
  closable?: boolean;
  pinned?: boolean;
  key?: string; // Deprecated: giữ để backward compatibility
  scrollPosition?: number; // Scroll position for this tab
}

interface TabsState {
  tabs: TabItem[];
  activeId: string; // Active tab ID (internal)

  // Actions
  setActiveId: (id: string) => void;
  setActiveByPath: (path: string) => void;
  addTab: (tab: Omit<TabItem, "id"> & { id?: string }) => void;
  removeTab: (id: string) => void;
  openTab: (path: string, label: string) => void;
  clearAll: () => void;
  pinTab: (id: string) => void;
  unpinTab: (id: string) => void;
  duplicateTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  updateScrollPosition: (id: string, scrollPosition: number) => void;
  getActiveTab: () => TabItem | undefined;
  getTabByPath: (path: string) => TabItem | undefined;
}

// Helper function to generate unique ID
const generateId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      // Initial state
      tabs: [],
      activeId: "",

      // Get active tab
      getActiveTab: () => {
        const { tabs, activeId } = get();
        return tabs.find((t) => t.id === activeId);
      },

      // Get tab by path
      getTabByPath: (path: string) => {
        const { tabs } = get();
        return tabs.find((t) => t.path === path);
      },

      // Set active tab by ID
      setActiveId: (id: string) => {
        set({ activeId: id });
      },

      // Set active tab by path
      setActiveByPath: (path: string) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.path === path);
        if (tab) {
          set({ activeId: tab.id });
        }
      },

      // Add a new tab
      addTab: (tab) => {
        const { tabs } = get();
        const id = tab.id || generateId();
        const newTab: TabItem = { ...tab, id };

        const exists = tabs.find((t) => t.id === id);

        if (!exists) {
          set({
            tabs: [...tabs, newTab],
            activeId: id,
          });
        } else {
          // Tab already exists, just switch to it
          set({ activeId: id });
        }
      },

      // Remove a tab
      removeTab: (id: string) => {
        const { tabs, activeId } = get();

        // Don't allow removing the last tab
        if (tabs.length <= 1) {
          console.warn("Cannot remove the last tab");
          return;
        }

        // Don't allow removing non-closable tabs
        const tab = tabs.find((t) => t.id === id);
        if (tab && tab.closable === false) {
          console.warn("Cannot remove non-closable tab");
          return;
        }

        const newTabs = tabs.filter((t) => t.id !== id);

        // If we're removing the active tab, switch to another one
        let newActiveId = activeId;
        if (id === activeId) {
          const currentIndex = tabs.findIndex((t) => t.id === id);
          const newIndex = Math.max(0, currentIndex - 1);
          newActiveId = newTabs[newIndex].id;
        }

        set({
          tabs: newTabs,
          activeId: newActiveId,
        });
      },

      // Open a tab (add if not exists, or switch to it)
      openTab: (path: string, label: string) => {
        const { tabs, activeId } = get();
        const exists = tabs.find((t) => t.path === path);

        if (exists) {
          // Tab already exists, just switch to it if not already active
          if (exists.id !== activeId) {
            set({ activeId: exists.id });
          }
        } else {
          // Add new tab
          const newTab: TabItem = {
            id: generateId(),
            path,
            label,
            closable: true,
            pinned: false,
            scrollPosition: 0,
          };

          set({
            tabs: [...tabs, newTab],
            activeId: newTab.id,
          });
        }
      },

      // Clear all tabs
      clearAll: () => {
        set({
          tabs: [],
          activeId: "",
        });
      },

      // Pin a tab
      pinTab: (id: string) => {
        const { tabs } = get();
        const updatedTabs = tabs.map((tab) =>
          tab.id === id ? { ...tab, pinned: true, closable: false } : tab,
        );

        // Sort tabs: pinned tabs first
        const pinnedTabs = updatedTabs.filter((t) => t.pinned);
        const unpinnedTabs = updatedTabs.filter((t) => !t.pinned);

        set({ tabs: [...pinnedTabs, ...unpinnedTabs] });
      },

      // Unpin a tab
      unpinTab: (id: string) => {
        const { tabs } = get();
        const updatedTabs = tabs.map((tab) =>
          tab.id === id ? { ...tab, pinned: false, closable: true } : tab,
        );

        set({ tabs: updatedTabs });
      },

      // Duplicate a tab
      duplicateTab: (id: string) => {
        const { tabs } = get();
        const tabToDuplicate = tabs.find((t) => t.id === id);

        if (!tabToDuplicate) return;

        // Find all tabs with similar labels to determine the next number
        // Extract base label (remove existing number suffix like " (1)", " (2)")
        const baseLabel = tabToDuplicate.label
          .replace(/\s*\(\d+\)$/, "")
          .replace(/\s*\(Copy\)$/, "");

        // Find all tabs with the same base label
        const similarTabs = tabs.filter((tab) => {
          const tabBaseLabel = tab.label.replace(/\s*\(\d+\)$/, "").replace(/\s*\(Copy\)$/, "");
          return tabBaseLabel === baseLabel;
        });

        // Calculate next number
        const existingNumbers = similarTabs
          .map((tab) => {
            const match = tab.label.match(/\((\d+)\)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((num) => num > 0);

        const nextNumber =
          existingNumbers.length > 0
            ? Math.max(...existingNumbers) + 1
            : similarTabs.length > 1
              ? 2
              : 1;

        // Create a new tab with same path but unique ID
        const newTab: TabItem = {
          ...tabToDuplicate,
          id: generateId(), // New unique ID
          label: `${baseLabel} (${nextNumber})`,
          pinned: false,
          closable: true,
          scrollPosition: 0, // Reset scroll for new tab
        };

        // Insert after the original tab
        const index = tabs.findIndex((t) => t.id === id);
        const newTabs = [...tabs];
        newTabs.splice(index + 1, 0, newTab);

        set({
          tabs: newTabs,
          activeId: newTab.id,
        });
      },

      // Close all tabs except the specified one
      closeOtherTabs: (id: string) => {
        const { tabs } = get();

        // Keep only tabs that are either the specified tab or non-closable
        const newTabs = tabs.filter((tab) => tab.id === id || tab.closable === false);

        // If we removed all tabs except one, keep at least one tab
        if (newTabs.length === 0) {
          console.warn("Cannot close all tabs");
          return;
        }

        set({
          tabs: newTabs,
          activeId: id,
        });
      },

      // Update scroll position for a tab (throttled via component)
      updateScrollPosition: (id: string, scrollPosition: number) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        // Only update if changed significantly to avoid unnecessary renders
        if (tab && Math.abs((tab.scrollPosition || 0) - scrollPosition) > 5) {
          const updatedTabs = tabs.map((t) => (t.id === id ? { ...t, scrollPosition } : t));
          set({ tabs: updatedTabs });
        }
      },
    }),
    {
      name: "tabs-storage", // localStorage key
      // Only persist tabs and activeId
      partialize: (state) => ({
        tabs: state.tabs,
        activeId: state.activeId,
      }),
    },
  ),
);
