import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#F5F9F5] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="AgriHerd" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-[#1B1B1B]">Privacy Policy</h1>
              <p className="text-sm text-[#6B7280]">Version 1.0 — November 2026</p>
            </div>
          </div>
          <BackButton fallbackPath="/register" />
        </div>

        <div className="prose prose-sm max-w-none text-[#1B1B1B] space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              AgriHerd (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy
              explains what information we collect when you use the AgriHerd farm management platform, how we use it,
              and the rights you have over your data. This policy aligns with the General Data Protection Regulation
              (GDPR) and Lesotho&apos;s Data Protection Act.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. What we collect</h2>
            <ul className="list-disc pl-5 text-sm text-[#6B7280] space-y-1">
              <li><strong className="text-[#1B1B1B]">Account information:</strong> name, email, phone number, role, farm name and location.</li>
              <li><strong className="text-[#1B1B1B]">Farm records:</strong> livestock, crops, tasks, inventory and financial data you enter.</li>
              <li><strong className="text-[#1B1B1B]">Marketplace data:</strong> listings, cart contents, orders and order status.</li>
              <li><strong className="text-[#1B1B1B]">AI scans:</strong> images you upload for disease detection, along with the prediction and confidence value.</li>
              <li><strong className="text-[#1B1B1B]">Technical data:</strong> IP address and user-agent at registration (for consent records), login timestamps, and audit log entries.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. How we use your data</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              We use your data only to operate the AgriHerd platform: to authenticate you, show your own farm records to
              you, process marketplace orders, run disease detection predictions on your behalf, and maintain a secure
              audit trail. We do not sell your data. We do not share it with third parties other than our infrastructure
              provider (Supabase, which acts as a data processor under a standard agreement).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Legal basis</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              We process your data on the basis of your consent (which you gave when you registered and which is recorded
              in our database), performance of the service contract, and our legitimate interest in keeping the platform
              secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Your rights</h2>
            <ul className="list-disc pl-5 text-sm text-[#6B7280] space-y-1">
              <li>Right of access — you can view all your personal data from your profile page.</li>
              <li>Right to rectification — you can edit your profile, farm details and records at any time.</li>
              <li>Right to erasure — you can request that your account be deleted; financial and audit records may be retained as required by law.</li>
              <li>Right to data portability — we provide a JSON export of your own data on request.</li>
              <li>Right to object — you can contact us to object to any specific use of your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Data retention</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Account data is retained while your account is active. Financial records are retained for seven years to
              comply with accounting obligations. Audit logs are retained for two years. Blockchain hashes we record are
              mathematical proofs with no personal data; they cannot be reversed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Security</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Data is encrypted in transit (HTTPS) and at rest (Supabase). Access is controlled by role-based permissions
              enforced on the server. We do not expose the service-role credentials to the browser. Sensitive actions are
              logged in an append-only audit trail.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Contact</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Questions about your data? Contact the platform administrator through the profile page or the email
              registered with your account.
            </p>
          </section>

          <section className="border-t pt-4">
            <p className="text-xs text-[#6B7280]">
              When you register, we record the version of this policy you accepted (currently &quot;1.0&quot;) along with
              the date and time. If we change the policy materially, we will ask you to accept the new version the next
              time you sign in.
            </p>
          </section>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/register" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl font-semibold transition">
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;