import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container">
        {/* Navbar brand aligned to the left */}
        <Link className="navbar-brand fw-bold" to="/">
          TFBS Atlas
        </Link>

        {/* Navbar toggler for mobile view */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar links aligned to the right */}
        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarNav"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/species-explore">
                Species Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/motif-explore">
                Motif Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/visualizations">
                Visualizations
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/downloads">
                Downloads
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/help">
                Help
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link
                className="nav-link"
                to="/about"
              >
                About
              </Link>
            </li> */}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
