import { useState, useEffect } from "react";

interface CountdownTimerProps {
  timeUntilNext?: number;
  isRunning?: boolean;
  className?: string;
}

export function CountdownTimer({
  timeUntilNext,
  isRunning = false,
  className = "",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(timeUntilNext || 0);

  useEffect(() => {
    if (!timeUntilNext || timeUntilNext <= 0) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(timeUntilNext);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilNext]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "00:00:00";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (): string => {
    if (isRunning) return "text-blue-500";
    if (timeLeft <= 0) return "text-gray-500";
    if (timeLeft <= 60000) return "text-red-500"; // Less than 1 minute
    if (timeLeft <= 300000) return "text-yellow-500"; // Less than 5 minutes
    return "text-green-500";
  };

  const getStatusText = (): string => {
    if (isRunning) return "Running now";
    if (timeLeft <= 0) return "Not scheduled";
    return "Next run in";
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-1">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isRunning
              ? "bg-blue-500 animate-pulse"
              : timeLeft > 0
              ? "bg-green-500"
              : "bg-gray-400"
          }`}
        />
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      </div>
      {!isRunning && timeLeft > 0 && (
        <span className={`font-mono text-xs font-medium ${getStatusColor()}`}>
          {formatTime(timeLeft)}
        </span>
      )}
    </div>
  );
}
