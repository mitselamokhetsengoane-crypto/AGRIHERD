const LoadingIndicator = ({ label = 'Loading...' }) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 p-8 text-gray-500">
    <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
    <span>{label}</span>
  </div>
);

export default LoadingIndicator;
