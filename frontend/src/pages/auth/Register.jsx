import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';
import Footer from '../../components/common/Footer';
import { LEGAL_DOCUMENT_VERSION } from '../legal/LegalPages';
import { Eye, EyeOff, Check, Sprout, ShoppingCart, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    farm_name: '',
    location: '',
    password: '',
    confirm_password: '',
    role: 'farmer',
  });
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordValid = (pw) =>
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!consent) {
      return setError('You must accept the Privacy Policy and Terms of Service to register.');
    }
    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match.');
    }
    if (!passwordValid(formData.password)) {
      return setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    }
    if (formData.role === 'farmer') {
      if (!formData.farm_name.trim()) return setError('Farm name is required for farmers.');
      if (!formData.location.trim()) return setError('Farm location is required for farmers.');
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role: formData.role,
        consent_given: true,
        consent_version: LEGAL_DOCUMENT_VERSION,
      };
      if (formData.role === 'farmer') {
        payload.farm_name = formData.farm_name.trim();
        payload.location = formData.location.trim();
      }
      await authService.register(payload);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="p-4 sm:p-6">
        <BackButton fallbackPath="/" compact />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-md">
          <div className="text-center mb-6">
            <img
              src="/logo.jpeg"
              alt="AgriHerd"
              className="h-14 w-14 rounded-2xl object-cover mx-auto mb-3 ring-1 ring-primary/10 shadow-sm"
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-maintext">Create Your Account</h1>
            <p className="text-xs sm:text-sm text-subtext mt-1">Join the AgriHerd agricultural network</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-error">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-maintext mb-2">
                Account Type <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'farmer' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-xs font-bold transition ${
                    formData.role === 'farmer'
                      ? 'border-primary bg-primary-light text-primary shadow-sm'
                      : 'border-gray-200 bg-white text-subtext hover:border-gray-300'
                  }`}
                >
                  <Sprout className="h-4 w-4" />
                  <span>Farmer / Producer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-xs font-bold transition ${
                    formData.role === 'buyer'
                      ? 'border-secondary bg-secondary-light text-secondary shadow-sm'
                      : 'border-gray-200 bg-white text-subtext hover:border-gray-300'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Buyer / Merchant</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-maintext mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={updateField('full_name')}
                  placeholder="Thabo Mokoena"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maintext mb-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={updateField('email')}
                  placeholder="thabo@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-maintext mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={updateField('phone')}
                placeholder="+266 5800 0000"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {formData.role === 'farmer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-emerald-50/50 p-3.5 border border-emerald-100">
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">
                    Farm Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.farm_name}
                    onChange={updateField('farm_name')}
                    placeholder="Sunrise Valley Farm"
                    className="w-full rounded-xl border border-emerald-200 bg-white py-2 px-3 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">
                    Farm Location <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={updateField('location')}
                    placeholder="Maseru, Lesotho"
                    className="w-full rounded-xl border border-emerald-200 bg-white py-2 px-3 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-maintext mb-1">
                  Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={updateField('password')}
                    placeholder="Password (8+ chars)"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 pr-10 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maintext mb-1">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirm_password}
                  onChange={updateField('confirm_password')}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-maintext transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <p className="text-[11px] text-subtext">
              Must include 8+ characters, uppercase, lowercase, a number, and a special symbol.
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-maintext leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                    Privacy Policy
                  </Link>.
                </span>
              </label>
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
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-subtext">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
