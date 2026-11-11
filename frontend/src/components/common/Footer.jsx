import { Link } from 'react-router-dom';

const Footer = () => {
  const showLegalLinks = import.meta.env.VITE_APP_MODE !== 'admin';

  return (
    <footer className="footer-fixed flex justify-center items-center text-xs text-gray-500 text-center">
      <div className="w-full">
        &copy; {new Date().getFullYear()} AgriHerd. All rights reserved.
        {showLegalLinks && (
          <nav className="legal-footer-links" aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
        )}
      </div>
    </footer>
  );
};

export default Footer;