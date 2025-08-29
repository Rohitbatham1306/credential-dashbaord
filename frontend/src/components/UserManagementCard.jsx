export default function UserManagementCard({ user }) {
  const badge = user.status==='Onboarded' ? 'bg-green-100 text-green-700' : user.status?.startsWith('Offboard') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">{user.name?.[0] || '?'}</div>
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Manage</button>
            <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm">View</button>
          </div>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge}`}>{user.status}</span>
    </div>
  );
}

