"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  Sun,
  Moon,
  LogOut,
  Menu,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useViewStore, type SortOption } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "domain", label: "Domain" },
];

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { toggle } = useSidebarStore();
  const { view, setView, sort, setSort } = useViewStore();
  const { openQuickAdd } = useModalStore();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "U";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
      {/* Left: hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggle}
      >
        <Menu className="size-5" />
      </Button>

      {/* Center: search */}
      <form onSubmit={handleSearch} className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent py-2 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </form>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Quick Add */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden size-8 md:flex"
          onClick={openQuickAdd}
        >
          <Plus className="size-4" />
        </Button>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50">
            <ArrowUpDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSort(option.value)}
                className={cn(sort === option.value && "font-semibold")}
              >
                {option.label}
                {sort === option.value && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    &#10003;
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView("grid")}
          className={cn(
            "size-8",
            view === "grid" && "bg-accent text-accent-foreground"
          )}
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView("list")}
          className={cn(
            "size-8",
            view === "list" && "bg-accent text-accent-foreground"
          )}
        >
          <List className="size-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex size-8 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {userInitial}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 size-4" />
              ) : (
                <Moon className="mr-2 size-4" />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
