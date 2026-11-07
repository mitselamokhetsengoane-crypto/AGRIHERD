const Footer = () => {
  return (
    <footer className="footer-fixed flex justify-center items-center text-xs text-gray-500 text-center">
      <div className="w-full">
        &copy; {new Date().getFullYear()} AgriHerd. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;