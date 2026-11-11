import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ isAdmin = false }) => {
  const isActuallyAdmin = isAdmin || import.meta.env.VITE_APP_MODE === 'admin';

  return (
    <footer className="footer-fixed flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-3.5 bg-white border-t border-gray-100 text-xs text-subtext shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-primary">AgriHerd</span>
        <span>&copy; {new Date().getFullYear()}</span>
        <span>&bull;</span>
        <span>Agricultural Technology Platform</span>
      </div>

      {!isActuallyAdmin ? (
        <nav className="flex items-center gap-4 text-xs font-medium" aria-label="Footer Legal Links">
          <Link to="/privacy" className="text-subtext hover:text-primary transition">
            Privacy Policy
          </Link>
          <span className="text-gray-300">&bull;</span>
          <Link to="/terms" className="text-subtext hover:text-primary transition">
            Terms of Service
          </Link>
        </nav>
      ) : (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-light">
          Enterprise Administration
        </span>
      )}
    </footer>
  );
};

export default Footer;
