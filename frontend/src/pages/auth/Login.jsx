import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      login(data.user, data.access_token);
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-maintext text-center mb-1">Welcome Back</h2>
        <p className="text-subtext text-center text-sm">Login to your account</p>
      </div>
      {error && <div className="bg-red-50 text-error p-3 rounded-md text-sm text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-subtext mb-1">Email</label>
          <input type="email" required className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Password</label>
          <input type="password" required className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition font-medium">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
};

export default Login;