import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';
import { getErrorMessage } from '../../services/api';
import Footer from '../../components/common/Footer';

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
        setError('Invalid email or password.');
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
    <>
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.jpeg" alt="AgriHerd" className="auth-logo" />
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your farm</p>
        </div>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: error ? '16px' : '0' }}>
          <div className="form__field">
            <label htmlFor="login-email" className="form__label form__label--required">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form__input"
            />
          </div>

          <div className="form__field">
            <div className="row row--between">
              <label htmlFor="login-password" className="form__label form__label--required">Password</label>
              <Link to="/forgot-password" className="text-small">Forgot?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form__input"
                style={{ paddingRight: '64px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn--ghost btn--sm"
                style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn--primary btn--block">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer-link">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <BackButton />
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Login;