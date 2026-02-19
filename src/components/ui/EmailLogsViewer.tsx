import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailLogsAPI, EmailLog } from "@/api/emailLogs";
import {
  RefreshCw,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDateTimeToEST, formatRelativeTimeToEST } from "@/utils/timezone";

interface EmailLogsViewerProps {
  className?: string;
}

export function EmailLogsViewer({ className = "" }: EmailLogsViewerProps) {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await EmailLogsAPI.getLogs();
      setLogs(response.data.logs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load email logs"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getProviderBadgeVariant = (provider: string) => {
    switch (provider) {
      case "gmail":
        return "outline";
      case "sendgrid":
        return "secondary";
      case "shopify":
        return "default";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeToEST(dateString);
  };

  const formatTimeAgo = (dateString: string) => {
    return formatRelativeTimeToEST(dateString);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-1 px-2 pt-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <Mail className="h-3 w-3" />
          Email Logs
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            className="ml-auto h-5 text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {error ? (
          <div className="text-center py-4 text-red-500">
            <p className="text-sm">Error: {error}</p>
            <Button
              variant="outline"
              onClick={loadLogs}
              className="mt-2 h-6 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading email logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Mail className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No email logs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>{logs.length} email logs found</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium text-sm">
                          {log.subject}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        To: {log.recipient_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={getStatusBadgeVariant(log.status)}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(log.sent_at)}</span>
                    </div>
                    <span className="text-xs">
                      ({formatTimeAgo(log.sent_at)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
