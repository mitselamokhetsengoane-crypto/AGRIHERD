import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';
import { getErrorMessage } from '../../services/api';
import Footer from '../../components/common/Footer';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      if (data.user.role === 'admin') navigate('/admin/dashboard');
      else if (data.user.role === 'buyer') navigate('/buyer/dashboard');
      else navigate('/app/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email address or password.');
      } else if (err.response?.status === 403 || err.response?.status === 429) {
        setError(err.response.data?.detail || 'Sign in is temporarily unavailable.');
      } else if (err.response?.status >= 500) {
        setError('The service is temporarily unavailable. Please try again shortly.');
      } else {
        setError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="p-4 sm:p-6">
        <BackButton fallbackPath="/" compact />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-md">
          <div className="text-center mb-6">
            <img
              src="/logo.jpeg"
              alt="AgriHerd"
              className="h-14 w-14 rounded-2xl object-cover mx-auto mb-3 ring-1 ring-primary/10 shadow-sm"
            />
            <h1 className="text-2xl font-bold tracking-tight text-maintext">Welcome Back</h1>
            <p className="text-xs sm:text-sm text-subtext mt-1">Sign in to access your AgriHerd portal</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-maintext mb-1">
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-maintext placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-maintext">
                  Password <span className="text-error">*</span>
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-maintext placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-subtext">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
