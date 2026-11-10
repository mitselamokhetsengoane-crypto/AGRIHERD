import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const PrivacyPolicy = () => {
  const [version, setVersion] = useState('1.0');

  useEffect(() => {
    api.get('/auth/policy-version')
      .then((r) => setVersion(r.data.version))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-xl font-bold text-[#2E7D32]">AgriHerd</span>
          </Link>
          <Link to="/login" className="text-sm text-[#2E7D32] font-medium hover:underline">Sign in</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1B1B1B]">Privacy Policy</h1>
            <p className="text-sm text-[#6B7280] mt-2">Policy version {version} · Effective 1 November 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">1. Introduction</h2>
            <p className="text-[#6B7280] leading-relaxed">
              AgriHerd ("we", "us") is committed to protecting your personal information. This policy
              explains what we collect, why we collect it, how we store it, and the rights you have
              over your data. It complies with the General Data Protection Regulation (GDPR) and
              Lesotho's Data Protection Act.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">2. Data we collect</h2>
            <ul className="list-disc pl-6 text-[#6B7280] leading-relaxed space-y-1">
              <li><strong className="text-[#1B1B1B]">Account data:</strong> full name, email address, phone number, account role.</li>
              <li><strong className="text-[#1B1B1B]">Farm data (farmers only):</strong> farm name, location, livestock records, crop records, inventory, financial records.</li>
              <li><strong className="text-[#1B1B1B]">Marketplace data:</strong> product listings, orders, purchase history.</li>
              <li><strong className="text-[#1B1B1B]">AI scan data:</strong> crop images you upload for disease detection, prediction results.</li>
              <li><strong className="text-[#1B1B1B]">Technical data:</strong> IP address and user agent recorded at registration.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">3. Why we collect it</h2>
            <p className="text-[#6B7280] leading-relaxed">
              We process your data to create and manage your account, deliver the services you use
              (farm management, marketplace, disease detection), provide accurate order records, and
              meet our legal obligations. We do not sell your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">4. How we store and protect it</h2>
            <ul className="list-disc pl-6 text-[#6B7280] leading-relaxed space-y-1">
              <li>Encrypted in transit (HTTPS) and at rest (Supabase infrastructure).</li>
              <li>Passwords are never stored in plain text — they are hashed by our authentication provider.</li>
              <li>Role-based access control ensures each user can only see their own data.</li>
              <li>Sensitive actions are recorded in an audit log.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">5. Who we share it with</h2>
            <p className="text-[#6B7280] leading-relaxed">
              We share data only with our infrastructure providers (Supabase, Render) as required to
              run the service, and only as permitted by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">6. Your rights</h2>
            <ul className="list-disc pl-6 text-[#6B7280] leading-relaxed space-y-1">
              <li><strong className="text-[#1B1B1B]">Access:</strong> you can view all data we hold about you from your profile page.</li>
              <li><strong className="text-[#1B1B1B]">Correction:</strong> you can edit your profile information at any time.</li>
              <li><strong className="text-[#1B1B1B]">Erasure:</strong> you can request deletion of your account.</li>
              <li><strong className="text-[#1B1B1B]">Portability:</strong> you can export your data.</li>
              <li><strong className="text-[#1B1B1B]">Consent history:</strong> you can view when you accepted this policy.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">7. Data retention</h2>
            <p className="text-[#6B7280] leading-relaxed">
              Active account data is kept until you delete your account. Financial records, orders,
              and blockchain hashes are retained as required by operational and legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1B1B1B]">8. Contact</h2>
            <p className="text-[#6B7280] leading-relaxed">
              Questions about this policy can be directed to the platform administrator through the
              contact details provided within your account.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
            <Link to="/register" className="text-[#2E7D32] font-medium hover:underline">Back to Registration</Link>
            <Link to="/" className="text-[#2E7D32] font-medium hover:underline">Go to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;