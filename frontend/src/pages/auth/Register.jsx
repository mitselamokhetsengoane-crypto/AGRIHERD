import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import BackButton from '../../components/common/BackButton';

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

    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match.');
    }
    if (!passwordValid(formData.password)) {
      return setError('Password must be at least 8 characters and include an uppercase letter, lowercase letter, number and special character.');
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
      };
      if (formData.role === 'farmer') {
        payload.farm_name = formData.farm_name.trim();
        payload.location = formData.location.trim();
      }
      await authService.register(payload);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="AgriHerd" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1B1B1B]">Create Account</h1>
          <p className="text-[#6B7280] mt-2">Join AgriHerd today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-[#D32F2F] text-sm rounded-lg px-4 py-3 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 bg-green-50 border border-green-100 text-[#2E7D32] text-sm rounded-lg px-4 py-3 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">I am registering as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'farmer' })}
                  className={`py-3 rounded-xl border-2 font-medium transition ${
                    formData.role === 'farmer'
                      ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                  className={`py-3 rounded-xl border-2 font-medium transition ${
                    formData.role === 'buyer'
                      ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  Buyer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Full Name</label>
              <input type="text" required value={formData.full_name} onChange={updateField('full_name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Email</label>
              <input type="email" required value={formData.email} onChange={updateField('email')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={updateField('phone')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
            </div>

            {formData.role === 'farmer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Farm Name</label>
                  <input type="text" required value={formData.farm_name} onChange={updateField('farm_name')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Farm Location</label>
                  <input type="text" required value={formData.location} onChange={updateField('location')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={updateField('password')}
                  className="w-full px-4 py-3 pr-14 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#6B7280] hover:text-[#2E7D32] font-medium">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                At least 8 characters, with uppercase, lowercase, a number and a special character.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-1.5">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} required value={formData.confirm_password} onChange={updateField('confirm_password')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFCFA] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2E7D32] font-medium hover:underline">Log In</Link>
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  );
};

export default Register;