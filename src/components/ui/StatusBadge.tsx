import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStatuses } from "@/hooks/useStatuses";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

// Default status configuration for fallback
const defaultStatusConfig = {
    label: "Pending",
    variant: "secondary" as const,
  className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50",
};

// Status variant mapping based on status patterns
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes("delay") || lowerStatus.includes("cancelled") || lowerStatus.includes("refund")) {
    return "destructive";
  }
  
  if (lowerStatus.includes("shipped") || lowerStatus.includes("delivered") || lowerStatus.includes("completed")) {
    return "default";
  }
  
  return "secondary";
};

// Status color mapping based on status patterns
const getStatusColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes("casting order")) {
    return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50";
  }
  
  if (lowerStatus.includes("casting received")) {
    return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50";
  }
  
  if (lowerStatus.includes("polishing") || lowerStatus.includes("finishing")) {
    return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50";
  }
  
  if (lowerStatus.includes("shipped")) {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50";
  }
  
  if (lowerStatus.includes("delivered") || lowerStatus.includes("completed")) {
    return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50";
  }
  
  if (lowerStatus.includes("delay") || lowerStatus.includes("cancelled") || lowerStatus.includes("refund")) {
    return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50";
  }
  
  if (lowerStatus.includes("replacement")) {
    return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50";
  }
  
  if (lowerStatus.includes("3d") || lowerStatus.includes("model")) {
    return "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50";
  }
  
  if (lowerStatus.includes("imported") || lowerStatus.includes("pending")) {
    return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:hover:bg-gray-900/50";
  }
  
  if (lowerStatus.includes("ready") || lowerStatus.includes("processing")) {
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50";
  }
  
  // Default color for unknown statuses
  return "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900/50";
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // OPTIMIZED: Fetch statuses once using React Query cache instead of individual fetches
  const { data: availableStatuses = [], isLoading } = useStatuses();

  // Create dynamic configuration based on the status
  const getStatusConfig = (status: string) => {
    // Check if this is a known status from the database
    const isKnownStatus = availableStatuses.includes(status);
    
    if (!isKnownStatus && !isLoading) {
      // If it's not a known status and we've finished loading, use default
      return defaultStatusConfig;
    }

    return {
      label: status,
      variant: getStatusVariant(status),
      className: getStatusColor(status),
    };
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
