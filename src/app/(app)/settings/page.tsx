"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import { Upload, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAiSettings } from "@/lib/hooks/use-ai-settings";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: aiSettings, isLoading: aiLoading, update: updateAiSettings, isUpdating: aiUpdating } = useAiSettings();
  const [aiProvider, setAiProvider] = useState<string>("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [autoTag, setAutoTag] = useState(false);
  const [autoSummary, setAutoSummary] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setAiProvider(aiSettings.provider ?? "");
      setAutoTag(aiSettings.autoTagEnabled);
      setAutoSummary(aiSettings.autoSummaryEnabled);
      setShowApiKeyInput(!aiSettings.hasApiKey);
    }
  }, [aiSettings]);

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

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Configure AI-powered auto-tagging and summaries. Bring your own API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {/* Provider */}
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={aiProvider || null}
                  onValueChange={(value) => {
                    if (value) {
                      setAiProvider(value);
                      updateAiSettings({ provider: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT-4o mini)</SelectItem>
                    <SelectItem value="gemini">Google (Gemini Flash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* API Key */}
              <div className="space-y-2">
                <Label>API Key</Label>
                {showApiKeyInput ? (
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                    />
                    <Button
                      size="sm"
                      disabled={!aiApiKey || aiUpdating}
                      onClick={async () => {
                        await updateAiSettings({ apiKey: aiApiKey });
                        setAiApiKey("");
                        setShowApiKeyInput(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Key saved</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKeyInput(true)}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Auto-tag toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-tag bookmarks</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically suggest tags when saving a bookmark.
                  </p>
                </div>
                <Switch
                  checked={autoTag}
                  onCheckedChange={(checked: boolean) => {
                    setAutoTag(checked);
                    updateAiSettings({ autoTagEnabled: checked });
                  }}
                />
              </div>

              {/* Auto-summary toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-generate summaries</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate a summary when saving a bookmark.
                  </p>
                </div>
                <Switch
                  checked={autoSummary}
                  onCheckedChange={(checked: boolean) => {
                    setAutoSummary(checked);
                    updateAiSettings({ autoSummaryEnabled: checked });
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
