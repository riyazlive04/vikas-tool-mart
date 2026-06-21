// Temporary stand-in for routes that later build phases will implement.
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="vtm-card text-center">
      <h2 className="text-lg font-extrabold text-gold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </div>
  );
}
