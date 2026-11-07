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
      className={`inline-flex items-center rounded-lg border border-gray-200 bg-white ${compact ? 'px-2' : 'px-3'} py-2 text-sm font-medium text-gray-700 transition hover:border-[#2E7D32] hover:text-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 ${className}`}
    >
      Back
    </button>
  );
};

export default BackButton;
