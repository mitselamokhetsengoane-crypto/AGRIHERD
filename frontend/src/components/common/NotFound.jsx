const NotFound = () => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <section className="max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 text-gray-600">The requested page is not part of this application build.</p>
      <a href="/" className="mt-6 inline-block font-medium text-primary hover:underline">Return to home</a>
    </section>
  </main>
);

export default NotFound;
