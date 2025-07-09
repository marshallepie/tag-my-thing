import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200 p-6';
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' }}
        className={`${baseClasses} cursor-pointer transition-all duration-200 ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};