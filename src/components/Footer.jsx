import React from 'react';
import { Link } from "react-router-dom";
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer navbar-light bg-light">
      <div className="container text-center py-3">
        <p className="footer-text mb-2">
          &copy; 2024 - 2025 <span className="separator">|</span>
          <Link to="https://sites.psu.edu/georgakopoulossoares/" target="_blank" className="footer-link">
            The Georgakopoulos-Soares Lab
          </Link>
        </p>
        <p className="footer-text">
          <Link to="/" className="footer-link">
            Privacy Policy & License
          </Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
