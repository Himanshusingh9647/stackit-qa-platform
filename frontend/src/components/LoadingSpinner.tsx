import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: { container: 'h-32', spinner: 'h-8 w-8', text: 'text-sm' },
    md: { container: 'h-64', spinner: 'h-12 w-12', text: 'text-base' },
    lg: { container: 'min-h-screen', spinner: 'h-16 w-16', text: 'text-lg' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center ${classes.container}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`${classes.spinner} rounded-full border-4 border-primary-200 border-t-accent-500 animate-spin`}></div>
        
        {/* Inner pulsing icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="h-6 w-6 text-accent-500 animate-pulse" />
        </div>
        
        {/* Sparkle animation */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-4 w-4 text-accent-400 animate-pulse-soft" />
        </div>
      </div>
      
      <div className={`mt-4 ${classes.text} font-medium text-primary-600`}>
        {text}
      </div>
    </div>
  );
};

export default LoadingSpinner;
