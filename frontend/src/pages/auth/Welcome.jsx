import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-[#F5F9F5] font-sans text-[#1B1B1B]">
      
      {/* ============ NAVBAR ============ */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-xl font-bold text-[#2E7D32]">AgriHerd</span>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
        <span className="inline-block bg-[#E8F5E9] text-[#2E7D32] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Smart Farming for the Digital Age
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-[#1B1B1B] leading-tight mb-6">
          Manage Your Farm <br />
          <span className="text-[#2E7D32]">Smarter, Not Harder</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
          AgriHerd is an integrated agricultural management system that helps farmers
          track livestock, manage crops, monitor finances, scan for diseases with AI,
          and record data securely on the blockchain — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-md"
          >
            Access Services
          </Link>
          <Link
            to="/register"
            className="bg-white border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9] px-8 py-4 rounded-xl font-semibold text-lg transition"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B1B1B] mb-6">About AgriHerd</h2>
          <p className="text-lg text-[#6B7280] leading-relaxed max-w-3xl mx-auto">
            AgriHerd was built to solve the real challenges farmers face every day: losing track of
            livestock records, forgetting when crops were planted, struggling to calculate farm
            profits, and having no reliable way to detect crop diseases early. We bring all of
            this together into a single, easy-to-use digital platform that works on your computer or phone.
          </p>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-20 bg-[#F5F9F5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B1B1B] mb-4">Everything Your Farm Needs</h2>
            <p className="text-[#6B7280] text-lg">Six powerful modules to run your farm end-to-end</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Livestock Management',
                desc: 'Register animals, track health records, vaccinations, feeding schedules, breeding history, and get reminders for vet visits.',
              },
              {
                title: 'Crop Management',
                desc: 'Manage fields, record planting dates, monitor crop health, log harvests, and compare expected vs. actual yield for every season.',
              },
              {
                title: 'Financial Management',
                desc: 'Track income and expenses, calculate your net balance, view monthly financial reports, and understand where your money goes.',
              },
              {
                title: 'Agricultural Marketplace',
                desc: 'List and sell your produce, buy seeds, fertilizer, and equipment from other farmers, and manage all your orders in one place.',
              },
              {
                title: 'AI Disease Detection',
                desc: 'Upload a photo of a crop leaf and let our YOLOv8 AI model detect over 30 different diseases with confidence scores in seconds.',
              },
              {
                title: 'Blockchain Records',
                desc: 'Every critical transaction — sales, harvests, and scans — is hashed and stored on the blockchain for tamper-proof verification.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center mb-5">
                  <span className="text-[#2E7D32] font-bold text-lg">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-[#1B1B1B] mb-3">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENEFITS ============ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B1B1B] text-center mb-12">Why Farmers Choose AgriHerd</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'All farm records in one secure place',
              'Real-time financial tracking and reports',
              'AI-powered disease detection saves crops',
              'Blockchain-proof transaction records',
              'Works on desktop and mobile browsers',
              'Role-based access — farmers, workers, and admins',
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[#F5F9F5] rounded-xl">
                <p className="text-[#1B1B1B] font-medium">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Welcome;