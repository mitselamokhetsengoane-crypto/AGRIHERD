import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', farm_name: '', password: '', confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-maintext text-center mb-1">Create Your Account</h2>
        <p className="text-subtext text-center text-sm">Join AgriHerd and manage your farm smarter</p>
      </div>

      {error && <div className="bg-red-50 text-error p-3 rounded-md text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-subtext mb-1">Full Name</label>
          <input type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Email</label>
          <input type="email" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Phone Number</label>
          <input type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Farm Name</label>
          <input type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, farm_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Password</label>
          <input type="password" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Confirm Password</label>
          <input type="password" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition font-medium disabled:opacity-50">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-subtext">
        Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log In</Link>
      </p>
    </div>
  );
};

export default Register;