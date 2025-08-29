export default function NotificationPanel({ warnings = [] }) {
  if (!warnings.length) return null;
  return (
    <div className="rounded-xl p-4 bg-amber-50 text-amber-900 border border-amber-200">
      <div className="font-semibold mb-1">{warnings.length} credential issues require immediate attention</div>
      <ul className="list-disc pl-5 text-sm">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}

