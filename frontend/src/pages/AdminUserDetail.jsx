import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users/${id}/assignments`);
      setUser(data.user); setItems(data.items);
    } catch (e) { setError('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: 'success' });
  };

  const revoke = async (assignmentId) => { 
    try {
      await api.post(`/admin/assignments/${assignmentId}/revoke`); 
      load(); 
      setAlert({ show: true, message: 'Credential revoked successfully!', type: 'success' });
    } catch (error) {
      setAlert({ show: true, message: 'Failed to revoke credential', type: 'error' });
    }
  };
  
  const remove = async (assignmentId) => { 
    try {
      await api.delete(`/admin/assignments/${assignmentId}`); 
      load(); 
      setAlert({ show: true, message: 'Credential assignment removed successfully!', type: 'success' });
    } catch (error) {
      setAlert({ show: true, message: 'Failed to remove credential assignment', type: 'error' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
      
      <div className="mb-3"><Link to="/admin" className="text-sm text-indigo-600">← Back to Admin</Link></div>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <>
                     <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">{user?.name?.[0]}</div>
               <div>
                 <div className="font-semibold">{user?.name}</div>
                 <div className="text-gray-500 text-sm">{user?.email}</div>
                 {(user?.status === 'Offboarding-In-Progress' || user?.status === 'Offboarded') && (
                   <div className="text-red-600 text-sm mt-1 font-medium">
                     Cannot receive new credentials
                   </div>
                 )}
               </div>
               <div className="flex-1" />
               <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.status==='Onboarded' ? 'bg-green-100 text-green-700' : user?.status==='Offboarded' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{user?.status}</span>
             </div>
           </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(it => (
              <div key={it.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-gray-500 text-sm">{it.description}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${it.inactive ? 'bg-red-100 text-red-700' : it.confirmed ? 'bg-green-100 text-green-700' : it.problematic ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{it.inactive ? 'Inactive' : it.confirmed ? 'Confirmed' : it.problematic ? 'Issue' : 'Pending'}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={()=>revoke(it.id)}>Revoke</button>
                  <button className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={()=>remove(it.id)} disabled={user?.status==='Offboarding-In-Progress'}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


