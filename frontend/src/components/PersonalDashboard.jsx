export default function PersonalDashboard({ user, progressText }) {
  const badge = user?.status==='Onboarded' ? 'bg-green-100 text-green-700' : user?.status?.startsWith('Offboard') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">{user?.name?.[0] || '?'}</div>
        <div>
          <div className="font-semibold">{user?.name || 'User'}</div>
          <div className="text-gray-500 text-sm">{user?.email}</div>
        </div>
        <div className="flex-1" />
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge}`}>{user?.status || 'Pending'}</span>
      </div>
      {progressText && <div className="text-sm text-gray-600">Onboarding Progress: <span className="font-semibold">{progressText}</span></div>}
    </div>
  );
}

