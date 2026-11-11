import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import {
  Beef,
  Sprout,
  Wallet,
  Store,
  ScanSearch,
  Blocks,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-maintext flex flex-col justify-between">
      {/* ============ NAVBAR ============ */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="AgriHerd" className="h-9 w-9 rounded-xl object-cover ring-1 ring-primary/10 shadow-sm" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-primary">AgriHerd</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-subtext">&bull; Agricultural Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-maintext hover:text-primary transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-light border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Integrated Agricultural Technology Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-navy tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
            Precision Farm Management <br />
            <span className="text-primary">&amp; Direct Produce Trading</span>
          </h1>

          <p className="text-base sm:text-lg text-subtext max-w-2xl mx-auto mb-10 leading-relaxed">
            AgriHerd unites livestock tracking, crop scheduling, real-time farm accounting,
            AI disease scanning, and blockchain verification into one modern SaaS platform for farmers and buyers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-md hover:bg-primary-hover transition"
            >
              <span>Access Farm Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 font-bold text-maintext shadow-sm hover:bg-gray-50 transition"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Modules</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">End-to-End Operational Control</h2>
              <p className="text-subtext text-sm mt-1 max-w-xl mx-auto">
                Purpose-built modules tailored specifically for commercial and smallholder agriculture.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Beef className="h-6 w-6 text-primary" />,
                  title: 'Livestock Management',
                  desc: 'Register animals, monitor health, track vaccinations, feeding routines, breeding cycles, and veterinary alerts.',
                },
                {
                  icon: <Sprout className="h-6 w-6 text-secondary" />,
                  title: 'Crop Scheduling & Yields',
                  desc: 'Track planting dates, plot allocations, growing stages, harvest yields, and historical field performance.',
                },
                {
                  icon: <Wallet className="h-6 w-6 text-navy" />,
                  title: 'Financial Accounting',
                  desc: 'Log sales, track recurring operating expenses, calculate real-time net balances, and export financial reports.',
                },
                {
                  icon: <Store className="h-6 w-6 text-secondary" />,
                  title: 'Direct Marketplace',
                  desc: 'Sell agricultural harvests directly to registered buyers, manage product inventory, and fulfill digital orders.',
                },
                {
                  icon: <ScanSearch className="h-6 w-6 text-primary" />,
                  title: 'AI Crop Disease Scanner',
                  desc: 'Diagnose leaf conditions with state-of-the-art YOLOv8 computer vision model detecting agricultural pathogens.',
                },
                {
                  icon: <Blocks className="h-6 w-6 text-navy" />,
                  title: 'Blockchain Verification',
                  desc: 'Cryptographically timestamp harvests, diagnoses, and orders on the blockchain for immutable proof-of-provenance.',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-background p-6 shadow-sm transition hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-maintext mb-2">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-subtext leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUST & COMPLIANCE ============ */}
        <section className="py-16 bg-background">
          <div className="max-w-5xl mx-auto px-6">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-navy">Built for Real Enterprise Agricultural Operations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left max-w-3xl mx-auto pt-4">
                {[
                  'Role-based security (Farmer, Buyer, Admin)',
                  'Immutable on-chain verification',
                  'Fast offline-ready mobile responsive UI',
                  'Real-time inventory and livestock telemetry',
                  'Instant AI leaf condition analysis',
                  'Transparent direct market order checkout',
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-emerald-100/60 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-maintext">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Welcome;
