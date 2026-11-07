import { useContext, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { AuthContext } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await securityService.getUsers();
        setUsers(data);
      } catch (requestError) {
        console.error('Failed to load users', requestError);
        setError('Users could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const previousRole = users.find((user) => user.id === userId)?.role;
    setError('');
    setNotice('');
    setUpdatingUserId(userId);
    try {
      await securityService.updateUserRole(userId, newRole);
      setUsers((currentUsers) => currentUsers.map((user) => user.id === userId ? { ...user, role: newRole } : user));
      setNotice('User role updated.');
    } catch (requestError) {
      console.error('Failed to update user role', requestError);
      setError('The role could not be updated. Please try again.');
      if (previousRole) {
        setUsers((currentUsers) => currentUsers.map((user) => user.id === userId ? { ...user, role: previousRole } : user));
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Email</th>
              <th className="p-4 font-medium text-gray-600">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="p-4 text-center">Loading users...</td></tr>
            ) : error && users.length === 0 ? (
              <tr><td colSpan="3" className="p-4 text-center text-gray-500">No user records are available.</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="3" className="p-4 text-center text-gray-500">No users have been registered yet.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="p-4 text-gray-800">{user.full_name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingUserId === user.id || currentUser?.id === user.id}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      aria-label={`Role for ${user.full_name}`}
                    >
                      <option value="farmer">Farmer</option>
                      <option value="worker">Worker</option>
                      <option value="admin">Admin</option>
                    </select>
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