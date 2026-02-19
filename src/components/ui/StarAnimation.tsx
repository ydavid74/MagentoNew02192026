import React from "react";

interface StarAnimationProps {
  text: string;
  className?: string;
}

export function StarAnimation({ text, className = "" }: StarAnimationProps) {
  return (
    <div className={`p-4 bg-transparent rounded-lg ${className}`}>
      <div className="flex items-center justify-center gap-4">
        {/* Left side stars */}
        <div className="flex gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={`left-${i}`}
              className="text-red-500 text-3xl animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            >
              ★
            </div>
          ))}
        </div>
        
        {/* Text content */}
        <div className="text-center">
          <p className="text-red-500 font-bold text-xl whitespace-pre-wrap">
            {text}
          </p>
        </div>
        
        {/* Right side stars */}
        <div className="flex gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="text-red-500 text-3xl animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            >
              ★
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
