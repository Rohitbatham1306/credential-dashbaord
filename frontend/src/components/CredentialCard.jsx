export default function CredentialCard({ item, onConfirm, onReport }) {
  const state = item.inactive ? 'Revoked' : item.confirmed ? 'Confirmed' : item.problematic ? 'Issue' : 'Pending';
  const badge = item.inactive ? 'bg-red-100 text-red-700' : item.confirmed ? 'bg-green-100 text-green-700' : item.problematic ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-gray-500 text-sm">{item.description}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge}`}>{state}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 rounded-lg bg-indigo-600 text-white py-2" onClick={onConfirm} disabled={item.confirmed || item.inactive}>Confirm</button>
        <button className="flex-1 rounded-lg bg-gray-100 py-2" onClick={onReport} disabled={item.inactive}>Report Issue</button>
      </div>
    </div>
  );
}

