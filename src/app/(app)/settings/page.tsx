"use client";

import { useState, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "json" | "html") => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "json" ? "memex-export.json" : "memex-bookmarks.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Bookmarks exported");
    } catch {
      toast.error("Failed to export bookmarks");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const isJson = file.name.endsWith(".json");

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": isJson ? "application/json" : "text/html",
        },
        body: text,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Import failed");
      }

      const result = await res.json();
      toast.success(
        `Imported ${result.imported} bookmarks${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ""}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import bookmarks");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Name</Label>
            {isPending ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <p className="text-sm font-medium">
                {session?.user?.name ?? "—"}
              </p>
            )}
          </div>
          <Separator />
          <div className="space-y-1">
            <Label className="text-muted-foreground">Email</Label>
            {isPending ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <p className="text-sm font-medium">
                {session?.user?.email ?? "—"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how Memex looks on your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">
                Select your preferred theme.
              </p>
            </div>
            <Select value={theme} onValueChange={(value) => { if (value) setTheme(value); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Import and export your bookmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export */}
          <div className="space-y-2">
            <Label>Export Bookmarks</Label>
            <p className="text-xs text-muted-foreground">
              Download all your bookmarks, collections, and tags.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("html")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Export HTML
              </Button>
            </div>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-2">
            <Label>Import Bookmarks</Label>
            <p className="text-xs text-muted-foreground">
              Import bookmarks from a browser export (HTML) or JSON file.
              Duplicate URLs will be skipped.
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 size-4" />
                )}
                {isImporting ? "Importing..." : "Choose File"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration Placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Coming in v0.3</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure AI-powered features like auto-tagging, smart summaries,
            and content recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
