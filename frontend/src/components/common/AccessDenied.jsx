const AccessDenied = ({ reason = 'Your account does not have permission to view this page.' }) => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <section className="max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
      <p className="mt-3 text-gray-600">{reason}</p>
      <a href="/" className="mt-6 inline-block font-medium text-primary hover:underline">Return to home</a>
    </section>
  </main>
);

export default AccessDenied;
