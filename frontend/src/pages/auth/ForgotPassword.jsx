import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';
import Footer from '../../components/common/Footer';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setMessage('If an account exists for this address, password reset instructions have been sent to your inbox.');
    } catch (err) {
      setMessage('If an account exists for this address, password reset instructions have been sent to your inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="p-4 sm:p-6">
        <BackButton fallbackPath="/login" compact />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-md">
          <div className="text-center mb-6">
            <img
              src="/logo.jpeg"
              alt="AgriHerd"
              className="h-14 w-14 rounded-2xl object-cover mx-auto mb-3 ring-1 ring-primary/10 shadow-sm"
            />
            <h1 className="text-2xl font-bold tracking-tight text-maintext">Reset Password</h1>
            <p className="text-xs sm:text-sm text-subtext mt-1">Enter your email to receive recovery instructions</p>
          </div>

          {message && (
            <div role="status" className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold text-maintext mb-1">
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-maintext placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
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
                'Send Recovery Link'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
