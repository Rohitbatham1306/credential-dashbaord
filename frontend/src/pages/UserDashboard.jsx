import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyCredentials, confirmAssignment, reportAssignment } from '../features/credentialSlice';
import Alert from '../components/Alert';

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { items, status } = useSelector(s => s.credentials);
  const user = useSelector(s => s.auth.user);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { dispatch(fetchMyCredentials()); }, [dispatch]);

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: 'success' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Alert Component */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
          autoClose={true}
          duration={4000}
        />
      )}
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Personal Dashboard</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.status==='Onboarded' ? 'bg-green-100 text-green-700' : user?.status?.startsWith('Offboard') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{user?.status || 'Pending'}</span>
        </div>
        <div className="text-gray-500">Your credential status</div>
      </div>

      {status === 'loading' && <p className="bg-white rounded-xl border border-gray-200 p-4">Loading...</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => {
          const state = item.inactive ? 'Inactive' : item.confirmed ? 'Confirmed' : item.problematic ? 'Issue' : 'Pending';
          const badgeClass = item.inactive ? 'bg-red-100 text-red-700' : item.confirmed ? 'bg-green-100 text-green-700' : item.problematic ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
          return (
            <div key={item.assignmentId} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-gray-500 text-sm">{item.description}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{state}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  className="flex-1 rounded-lg bg-indigo-600 text-white py-2 shadow hover:shadow-md transform hover:-translate-y-0.5 transition disabled:opacity-60" 
                  onClick={async () => {
                    const result = await dispatch(confirmAssignment(item.assignmentId));
                    if (confirmAssignment.fulfilled.match(result)) {
                      setAlert({ show: true, message: result.payload.message, type: 'success' });
                    } else {
                      setAlert({ show: true, message: 'Failed to confirm credential', type: 'error' });
                    }
                  }} 
                  disabled={item.confirmed || item.inactive}
                >
                  Confirm
                </button>
                <button 
                  className="flex-1 rounded-lg bg-gray-100 py-2 hover:bg-gray-200 transition" 
                  onClick={async () => {
                    const result = await dispatch(reportAssignment({ assignmentId: item.assignmentId, note: 'Issue' }));
                    if (reportAssignment.fulfilled.match(result)) {
                      setAlert({ show: true, message: result.payload.message, type: 'success' });
                    } else {
                      setAlert({ show: true, message: 'Failed to report issue', type: 'error' });
                    }
                  }} 
                  disabled={item.inactive}
                >
                  Report Issue
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

