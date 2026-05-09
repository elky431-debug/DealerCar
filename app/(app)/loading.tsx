export default function AppLoading() {
  return (
    <div className="min-h-[50vh] animate-in px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-md bg-muted shimmer" />
          <div className="h-9 max-w-md rounded-lg bg-muted/80 shimmer" />
          <div className="h-4 max-w-xl rounded-md bg-muted/60 shimmer" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-border/50 bg-card/50 p-4">
              <div className="h-3 w-20 rounded bg-muted shimmer" />
              <div className="mt-4 h-8 w-16 rounded-md bg-muted/80 shimmer" />
              <div className="mt-3 h-3 w-full rounded bg-muted/50 shimmer" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-border/50 bg-card/40 p-6">
          <div className="h-full w-full rounded-xl bg-muted/30 shimmer" />
        </div>
      </div>
    </div>
  );
}
