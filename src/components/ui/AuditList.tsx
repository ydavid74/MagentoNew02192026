import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, AlertCircle, Package, Truck } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  status: "success" | "warning" | "info" | "error";
}

interface AuditListProps {
  entityType: string;
  entityId: string;
  className?: string;
}

// Mock audit data
const mockAuditEntries: AuditEntry[] = [
  {
    id: "1",
    action: "Order Updated",
    description: "Order status changed from 'pending' to 'processing'",
    user: "Sarah Johnson",
    timestamp: "2024-01-15T14:20:00Z",
    status: "success"
  },
  {
    id: "2",
    action: "Payment Processed", 
    description: "Payment of $1,250.00 successfully processed via Stripe",
    user: "System",
    timestamp: "2024-01-15T11:45:00Z",
    status: "success"
  },
  {
    id: "3",
    action: "Order Created",
    description: "Order created by customer Alice Johnson",
    user: "Alice Johnson",
    timestamp: "2024-01-15T10:30:00Z",
    status: "info"
  },
  {
    id: "4",
    action: "Inventory Check",
    description: "Inventory availability verified for all items",
    user: "System",
    timestamp: "2024-01-15T10:31:00Z",
    status: "success"
  }
];

const statusConfig = {
  success: {
    icon: CheckCircle,
    className: "text-success",
    bgClassName: "bg-success/10"
  },
  warning: {
    icon: AlertCircle,
    className: "text-warning",
    bgClassName: "bg-warning/10"
  },
  info: {
    icon: Package,
    className: "text-primary",
    bgClassName: "bg-primary/10"
  },
  error: {
    icon: AlertCircle,
    className: "text-destructive",
    bgClassName: "bg-destructive/10"
  }
};

export function AuditList({ entityType, entityId, className }: AuditListProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {mockAuditEntries.map((entry, index) => {
        const config = statusConfig[entry.status];
        const StatusIcon = config.icon;
        const { date, time } = formatTimestamp(entry.timestamp);

        return (
          <div key={entry.id} className="flex gap-4 relative">
            {/* Timeline line */}
            {index < mockAuditEntries.length - 1 && (
              <div className="absolute left-6 top-12 w-px h-16 bg-border" />
            )}
            
            {/* Status icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgClassName} flex items-center justify-center`}>
              <StatusIcon className={`h-6 w-6 ${config.className}`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm">{entry.action}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{time}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{entry.user}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}