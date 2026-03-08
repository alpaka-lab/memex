"use client";

import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
