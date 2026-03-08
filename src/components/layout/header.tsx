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
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useViewStore } from "@/lib/stores/view-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { toggle } = useSidebarStore();
  const { view, setView } = useViewStore();
  const { theme, setTheme } = useTheme();

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

      {/* Right: view toggle + user menu */}
      <div className="flex items-center gap-1">
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

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex size-8 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              U
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
