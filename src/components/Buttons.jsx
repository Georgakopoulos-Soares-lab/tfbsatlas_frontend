import React from 'react';
import '../styles/Button.css';  // Make sure to create a separate CSS file for styling

// Reusable Button component
const Button = ({ label, onClick, disabled }) => {
  return (
    <button
      className={`btn ${disabled ? 'btn-disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
