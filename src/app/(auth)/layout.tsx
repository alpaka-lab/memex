import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Brain className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Memex</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personal bookmark manager
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
