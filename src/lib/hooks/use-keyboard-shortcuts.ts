"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/lib/stores/modal-store";
import { useViewStore } from "@/lib/stores/view-store";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { openQuickAdd } = useModalStore();
  const { view, setView } = useViewStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K: Quick add
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openQuickAdd();
        return;
      }

      // / : Focus search
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"]'
        );
        searchInput?.focus();
        return;
      }

      // g then shortcuts (vim-like navigation)
      // 1: All bookmarks
      if (e.key === "1") {
        router.push("/bookmarks");
        return;
      }
      // 2: Starred
      if (e.key === "2") {
        router.push("/bookmarks/starred");
        return;
      }
      // 3: Recent
      if (e.key === "3") {
        router.push("/bookmarks/recent");
        return;
      }
      // 4: Archive
      if (e.key === "4") {
        router.push("/bookmarks/archive");
        return;
      }

      // v: Toggle view
      if (e.key === "v") {
        setView(view === "grid" ? "list" : "grid");
        return;
      }

      // n: New bookmark
      if (e.key === "n") {
        openQuickAdd();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, openQuickAdd, view, setView]);
}
