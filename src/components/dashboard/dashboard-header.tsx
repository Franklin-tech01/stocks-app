export function DashboardHeader({ name }: { name: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
        Hi, {name} 👋
      </h1>
      <p className="mt-1 text-muted-foreground">Welcome back to Stocks.</p>
    </div>
  );
}
