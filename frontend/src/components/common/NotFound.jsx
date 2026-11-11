import { Link } from 'react-router-dom';

const NotFound = () => (
  <main className="app-error">
    <section className="app-error__card">
      <h1>Page not found</h1>
      <p>The requested page is not part of this application build.</p>
      <Link to="/">Return to home</Link>
    </section>
  </main>
);

export default NotFound;
