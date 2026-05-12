export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-12 w-3/4 max-w-xl rounded-lg bg-muted" />
      <div className="aspect-video max-w-4xl rounded-2xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-80 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
