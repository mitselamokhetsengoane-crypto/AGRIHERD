import { useContext, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { AuthContext } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  DEACTIVATED: 'bg-gray-100 text-gray-800',
};

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await securityService.getUsers());
    } catch (err) {
      setError(err.response?.data?.detail || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (userId, newStatus) => {
    setError(''); setNotice(''); setUpdatingId(userId);
    try {
      await securityService.updateUserStatus(userId, newStatus);
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, account_status: newStatus } : u)));
      setNotice('Status updated.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const approve = async (userId) => {
    setError(''); setNotice(''); setUpdatingId(userId);
    try {
      await securityService.approveFarmer(userId);
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, account_status: 'ACTIVE' } : u)));
      setNotice('Farmer approved.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not approve farmer.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Email</th>
              <th className="p-4 font-medium text-gray-600">Role</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Joined</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No users registered yet.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 text-gray-800">{u.full_name}</td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4 capitalize">{u.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[u.account_status] || STATUS_COLORS.ACTIVE}`}>
                      {STATUS_LABELS[u.account_status] || u.account_status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="p-4 text-right space-x-2">
                    {u.account_status === 'PENDING' && u.role === 'farmer' && (
                      <button
                        onClick={() => approve(u.id)}
                        disabled={updatingId === u.id}
                        className="text-primary text-sm hover:underline disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {currentUser?.id !== u.id && (
                      <select
                        value={u.account_status}
                        onChange={(e) => changeStatus(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        className="border border-gray-300 rounded px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="ACTIVE">Activate</option>
                        <option value="SUSPENDED">Suspend</option>
                        <option value="DEACTIVATED">Deactivate</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;