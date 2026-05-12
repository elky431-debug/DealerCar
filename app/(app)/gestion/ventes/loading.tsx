export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-muted" />
      <div className="h-12 w-full max-w-lg rounded-lg bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
    </div>
  );
}
