import { useState } from 'react';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';

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
    <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="AgriHerd" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1B1B1B]">Forgot Password?</h1>
          <p className="text-[#6B7280] mt-2">Enter your email and we'll help you reset it</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {message && (
            <div className="mb-5 bg-green-50 border border-green-100 text-[#2E7D32] text-sm rounded-lg px-4 py-3 text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <BackButton fallbackPath="/login" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;