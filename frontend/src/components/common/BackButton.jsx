import { useNavigate } from 'react-router-dom';

const BackButton = ({ fallbackPath = '/', className = '', compact = false }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#2E7D32] hover:text-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 ${className}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19 12H5m0 0 7 7m-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={compact ? 'hidden sm:inline' : ''}>Back</span>
    </button>
  );
};

export default BackButton;
