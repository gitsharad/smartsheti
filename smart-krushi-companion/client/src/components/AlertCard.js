import React from 'react';

const AlertCard = ({ moisture, threshold }) => {
  if (moisture >= threshold) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center">
      <span className="mr-2">⚠️</span>
      <span>जमिनीतील ओलावा कमी आहे! पाणी द्या.</span>
    </div>
  );
};

export default AlertCard; 