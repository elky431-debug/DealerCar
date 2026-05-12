export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-12 w-full max-w-md rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
