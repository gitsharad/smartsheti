import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = ({ to = "/", text = "डॅशबोर्डकडे परत जा", className = "" }) => {
  return (
    <Link
      to={to}
      className={`flex items-center text-blue-600 hover:text-blue-800 transition-colors ${className}`}
    >
      <FiArrowLeft className="mr-2" />
      {text}
    </Link>
  );
};

export default BackButton; 