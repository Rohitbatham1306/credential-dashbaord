export default function AdminStats({ stats }) {
  const items = [
    { label: 'TOTAL USERS', value: stats.total || 0, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'ONBOARDED', value: stats.onboarded || 0, color: 'bg-green-50 text-green-700' },
    { label: 'PENDING', value: stats.pending || 0, color: 'bg-amber-50 text-amber-700' },
    { label: 'OFFBOARDING', value: stats.offboarding || 0, color: 'bg-rose-50 text-rose-700' },
    { label: 'ISSUES', value: stats.issues || 0, color: 'bg-red-50 text-red-700' },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((s) => (
        <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
          <div className="text-3xl font-extrabold">{s.value}</div>
          <div className="text-xs font-semibold tracking-wide">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

