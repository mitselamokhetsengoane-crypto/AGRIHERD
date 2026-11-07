import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setMessage('If an account exists, reset instructions have been sent to your email.');
    } catch (err) {
      setMessage('If an account exists, reset instructions have been sent to your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-maintext text-center mb-1">Forgot Password?</h2>
        <p className="text-subtext text-center text-sm">Enter your email and we'll help you reset it.</p>
      </div>

      {message && <div className="bg-green-50 text-primary p-3 rounded-md text-sm text-center">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-subtext mb-1">Email or Phone Number</label>
          <input type="email" required className="w-full border border-gray-300 rounded-md px-4 py-2" 
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition font-medium disabled:opacity-50">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center text-sm text-subtext">
        <Link to="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;