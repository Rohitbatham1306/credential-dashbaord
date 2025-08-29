import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOverview } from '../features/adminSlice';
import io from 'socket.io-client';
import api from '../services/api';
import AdminStats from '../components/AdminStats';
import UserManagementCard from '../components/UserManagementCard';
import { Link } from 'react-router-dom';
import NotificationPanel from '../components/NotificationPanel';
import Alert from '../components/Alert';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { users, status } = useSelector(s => s.admin);
  const [credName, setCredName] = useState('');
  const [credDesc, setCredDesc] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignCredName, setAssignCredName] = useState('');
  const [allCreds, setAllCreds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [stats, setStats] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [downloading, setDownloading] = useState({ csv: false, pdf: false });

  useEffect(() => {
    dispatch(fetchOverview());
    api.get('/admin/stats').then(r => setStats(r.data));
    api.get('/admin/credentials').then(r => setAllCreds(r.data));
    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000', { withCredentials: true });
    s.on('issueReported', (p) => setWarnings(w => [
      `${p.userEmail} reported an issue (${p.assignmentId})`,
      ...w
    ].slice(0,5)));
    s.on('offboardingComplete', (p) => setWarnings(w => [
      `Offboarding complete for ${p.email}`,
      ...w
    ].slice(0,5)));
    return () => s.close();
  }, [dispatch]);

  const createCredential = async () => {
    if (!credName.trim()) {
      setAlert({ show: true, message: 'Credential name is required', type: 'error' });
      return;
    }
    
    try {
      const response = await api.post('/admin/credentials', { name: credName, description: credDesc });
      setCredName(''); 
      setCredDesc('');
      const r = await api.get('/admin/credentials');
      setAllCreds(r.data);
      
      // Show success alert
      if (response.data.message) {
        setAlert({ show: true, message: response.data.message, type: 'success' });
      }
    } catch (error) {
      setAlert({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to create credential', 
        type: 'error' 
      });
    }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditName(c.name); setEditDesc(c.description || ''); };
  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditDesc(''); };
  const saveEdit = async () => {
    try {
      await api.put(`/admin/credentials/${editingId}`, { name: editName, description: editDesc });
      const r = await api.get('/admin/credentials');
      setAllCreds(r.data);
      cancelEdit();
      setAlert({ show: true, message: `Credential "${editName}" updated successfully!`, type: 'success' });
    } catch (error) {
      setAlert({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to update credential', 
        type: 'error' 
      });
    }
  };
  const delCred = async (id) => {
    if (!confirm('Delete this credential?')) return;
    try {
      const credentialToDelete = allCreds.find(c => c.id === id);
      await api.delete(`/admin/credentials/${id}`);
      setAllCreds(allCreds.filter(c => c.id !== id));
      setAlert({ 
        show: true, 
        message: `Credential "${credentialToDelete?.name}" deleted successfully!`, 
        type: 'success' 
      });
    } catch (error) {
      setAlert({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to delete credential', 
        type: 'error' 
      });
    }
  };

  const assign = async () => {
    if (!assignEmail.trim() || !assignCredName.trim()) {
      setAlert({ show: true, message: 'Both email and credential name are required', type: 'error' });
      return;
    }
    
    // Check if user exists and can receive credentials
    const targetUser = users.find(u => u.email === assignEmail.trim());
    if (targetUser && (targetUser.status === 'Offboarding-In-Progress' || targetUser.status === 'Offboarded')) {
      setAlert({ 
        show: true, 
        message: `Cannot assign credentials to ${targetUser.email}. User status is "${targetUser.status}". Only users with "Pending" or "Onboarded" status can receive credentials.`, 
        type: 'error' 
      });
      return;
    }
    
    try {
      const response = await api.post('/admin/assign', { email: assignEmail, credentialName: assignCredName });
      setAssignEmail(''); 
      setAssignCredName('');
      
      // Show success alert
      if (response.data.message) {
        setAlert({ show: true, message: response.data.message, type: 'success' });
      }
    } catch (error) {
      setAlert({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to assign credential', 
        type: 'error' 
      });
    }
  };

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: 'success' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        <h2 className="text-2xl font-bold mb-4">Administrator Panel</h2>
        <div className="mb-4"><AdminStats stats={stats} /></div>
                 <div className="flex gap-2 mb-4">
           <button 
             className={`px-3 py-2 rounded-lg ${downloading.csv ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
             disabled={downloading.csv}
             onClick={async () => {
               setDownloading(prev => ({ ...prev, csv: true }));
               try {
                 const response = await api.get('/admin/export/csv', { responseType: 'blob' });
                 const url = window.URL.createObjectURL(new Blob([response.data]));
                 const link = document.createElement('a');
                 link.href = url;
                 link.setAttribute('download', 'credentials-report.csv');
                 document.body.appendChild(link);
                 link.click();
                 link.remove();
                 window.URL.revokeObjectURL(url);
                 setAlert({ show: true, message: 'CSV report downloaded successfully!', type: 'success' });
               } catch (error) {
                 setAlert({ show: true, message: 'Failed to download CSV report', type: 'error' });
               } finally {
                 setDownloading(prev => ({ ...prev, csv: false }));
               }
             }}
           >
             {downloading.csv ? 'Downloading...' : 'Download CSV'}
           </button>
           <button 
             className={`px-3 py-2 rounded-lg ${downloading.pdf ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
             disabled={downloading.pdf}
             onClick={async () => {
               setDownloading(prev => ({ ...prev, pdf: true }));
               try {
                 const response = await api.get('/admin/export/pdf', { responseType: 'blob' });
                 const url = window.URL.createObjectURL(new Blob([response.data]));
                 const link = document.createElement('a');
                 link.href = url;
                 link.setAttribute('download', 'credentials-report.pdf');
                 document.body.appendChild(link);
                 link.click();
                 link.remove();
                 window.URL.revokeObjectURL(url);
                 setAlert({ show: true, message: 'PDF report downloaded successfully!', type: 'success' });
               } catch (error) {
                 setAlert({ show: true, message: 'Failed to download PDF report', type: 'error' });
               } finally {
                 setDownloading(prev => ({ ...prev, pdf: false }));
               }
             }}
           >
             {downloading.pdf ? 'Downloading...' : 'Download PDF'}
           </button>
           <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white" onClick={async()=>{ await api.post('/admin/test-email'); alert('Test email triggered'); }}>Test Email</button>
         </div>
        <NotificationPanel warnings={warnings} />
        {status==='loading' && <p>Loading...</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="font-medium mb-2">Create Credential</div>
            <input className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" placeholder="Name" value={credName} onChange={e=>setCredName(e.target.value)} />
            <input className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" placeholder="Description" value={credDesc} onChange={e=>setCredDesc(e.target.value)} />
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 shadow hover:shadow-md transform hover:-translate-y-0.5 transition" onClick={createCredential}>Create</button>
          </div>
                     <div className="border border-gray-200 rounded-xl p-4">
             <div className="font-medium mb-2">Assign Credential</div>
             <input className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" placeholder="User Email" value={assignEmail} onChange={e=>setAssignEmail(e.target.value)} />
             <input className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" placeholder="Credential Name" value={assignCredName} onChange={e=>setAssignCredName(e.target.value)} />
             <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 shadow hover:shadow-md transform hover:-translate-y-0.5 transition" onClick={assign}>Assign</button>
             <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
               <p className="text-xs text-blue-700">
                 <strong>Note:</strong> Users with "Offboarding-In-Progress" or "Offboarded" status cannot receive new credentials.
               </p>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">User Management</h3>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">{users.length} users</span>
        </div>
                 <div className="grid gap-3 sm:grid-cols-2">
           {users.map(u => {
             const canReceiveCredentials = u.status === 'Pending' || u.status === 'Onboarded';
             return (
               <div key={u.id} className={`border rounded-xl p-4 hover:shadow transition ${canReceiveCredentials ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                 <div className="flex items-start justify-between">
                   <div>
                     <div className="font-semibold"><Link to={`/admin/user/${u.id}`} className="text-indigo-700 hover:underline">{u.name}</Link></div>
                     <div className="text-gray-500 text-sm">{u.email}</div>
                     {!canReceiveCredentials && (
                       <div className="text-red-600 text-xs mt-1 font-medium">
                         Cannot assign new credentials
                       </div>
                     )}
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status==='Onboarded' ? 'bg-green-100 text-green-700' : u.status?.startsWith('Offboard') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span>
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">{u.role}</span>
                   </div>
                 </div>
               </div>
             );
           })}
         </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">All Credentials</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {allCreds.map(c => (
              <div key={c.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:shadow transition">
                {editingId === c.id ? (
                  <div className="w-full flex flex-col gap-2">
                    <input className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <input className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" value={editDesc} onChange={e=>setEditDesc(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white" onClick={saveEdit}>Save</button>
                      <button className="px-3 py-2 rounded-lg bg-gray-100" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-gray-500 text-sm">{c.description}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={()=>startEdit(c)}>Edit</button>
                      <button className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={()=>delCred(c.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

