import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwNotice, setPwNotice] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setProfile(response.data);
        setFormData({
          full_name: response.data.full_name || '',
          phone: response.data.phone || '',
          farm_name: response.data.farm_name || '',
          location: response.data.location || '',
        });
      } catch (err) {
        setError(
          err.response?.data?.detail
            || 'Your profile could not be loaded. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.patch('/auth/me', formData);
      setProfile(response.data);
      updateUser(response.data);
      setEditing(false);
      setNotice('Profile updated successfully.');
    } catch (requestError) {
      setError('Your profile could not be updated. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPwError('');
    setPwNotice('');

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPwNotice('Password updated successfully.');
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Password could not be changed.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading profile...</div>;
  if (!profile) return <div role="alert" className="p-8 text-center text-error">{error || 'Failed to load profile.'}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Profile & Settings</h1>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
      {notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-primary">{notice}</p>}

      {/* Profile info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.charAt(0) || 'F'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-maintext">{profile.full_name}</h2>
            <p className="text-subtext">{profile.role}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            {[
              ['full_name', 'Full name'],
              ['phone', 'Phone'],
              ['farm_name', 'Farm name'],
              ['location', 'Location'],
            ].map(([field, label]) => (
              <div key={field}>
                <label htmlFor={`profile-${field}`} className="mb-1 block text-sm text-subtext">{label}</label>
                <input
                  id={`profile-${field}`}
                  name={field}
                  value={formData[field]}
                  required={field === 'full_name'}
                  onChange={(event) => setFormData((current) => ({ ...current, [field]: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div><p className="text-sm text-subtext">Email</p><p className="font-medium text-maintext">{profile.email}</p></div>
            <div><p className="text-sm text-subtext">Phone</p><p className="font-medium text-maintext">{profile.phone || 'N/A'}</p></div>
            <div><p className="text-sm text-subtext">Farm Name</p><p className="font-medium text-maintext">{profile.farm_name || 'N/A'}</p></div>
            <div><p className="text-sm text-subtext">Location</p><p className="font-medium text-maintext">{profile.location || 'N/A'}</p></div>
          </div>
        )}
      </div>

      {/* Password change card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-bold text-maintext">Change Password</h3>
        {pwError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{pwError}</p>}
        {pwNotice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-primary">{pwNotice}</p>}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm text-subtext mb-1">Current password</label>
            <input
              type="password"
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-subtext mb-1">New password</label>
            <input
              type="password"
              required
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary"
            />
            <p className="mt-1 text-xs text-subtext">Minimum 8 characters, with uppercase, lowercase, number and special character.</p>
          </div>
          <div>
            <label className="block text-sm text-subtext mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary"
            />
          </div>
          <button type="submit" disabled={pwSaving} className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60">
            {pwSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="w-full border-b border-gray-100 px-6 py-4 text-left font-medium text-maintext hover:bg-background">
            Edit Profile
          </button>
        )}
        <button type="button" onClick={handleLogout} className="w-full px-6 py-4 text-left font-medium text-error hover:bg-red-50">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;