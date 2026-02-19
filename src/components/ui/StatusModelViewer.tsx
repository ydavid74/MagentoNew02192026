import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusModelAPI, StatusModelRecord } from "@/api/statusModel";
import { RefreshCw, Database, Mail, Clock, CheckCircle } from "lucide-react";
import { formatDateTimeToEST } from "@/utils/timezone";

interface StatusModelViewerProps {
  className?: string;
}

export function StatusModelViewer({ className = "" }: StatusModelViewerProps) {
  const [data, setData] = useState<StatusModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await StatusModelAPI.getCurrentData();
      setData(response.data.records);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load status model data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeToEST(dateString);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-1 px-2 pt-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <Database className="h-3 w-3" />
          Current Status Model
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
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
              onClick={loadData}
              className="mt-2 h-6 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading status model data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Database className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No status model data found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>{data.length} status rules loaded</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {data.map((record) => (
                <div
                  key={record.id}
                  className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {record.status}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-medium text-sm">
                          {record.new_status}
                        </span>
                      </div>
                      {record.description && (
                        <p className="text-xs text-muted-foreground">
                          {record.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(record.is_active)}
                      className="text-xs"
                    >
                      {record.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Wait: {record.wait_time_business_days} days</span>
                    </div>

                    {record.private_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{record.private_email}</span>
                      </div>
                    )}

                    {record.email_subject && (
                      <div className="col-span-full">
                        <span className="text-muted-foreground">Subject: </span>
                        <span className="font-medium">
                          {record.email_subject}
                        </span>
                      </div>
                    )}
                  </div>

                  {record.additional_recipients.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">
                        Additional recipients:{" "}
                      </span>
                      <span>{record.additional_recipients.join(", ")}</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(record.created_at)}
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
