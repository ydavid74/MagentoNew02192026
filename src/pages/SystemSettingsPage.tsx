import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { StatusModelViewer } from "@/components/ui/StatusModelViewer";
import { EmailLogsViewer } from "@/components/ui/EmailLogsViewer";
import { useToast } from "@/hooks/use-toast";
import { SyncAPI } from "@/api/sync";
import { AutomationAPI } from "@/api/automation";
import { EmailAPI } from "@/api/email";
import { ImportAPI } from "@/api/import";
import { API_CONFIG, createFetchOptions } from "@/config/api";
import {
  Play,
  Pause,
  Mail,
  RefreshCw,
  Settings,
  Upload,
  Clock,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface SystemSettings {
  cronJobInterval: number; // in minutes
  syncEnabled: boolean;
  automationEnabled: boolean;
  emailNotifications: boolean;
  googleSheetsUrl: string;
  shopifyImportTag: string;
  shopifyProcessedTag: string;
  lastSyncTime?: string;
  lastAutomationTime?: string;
}

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>({
    cronJobInterval: 60,
    syncEnabled: false,
    automationEnabled: false,
    emailNotifications: true,
    googleSheetsUrl: "",
    shopifyImportTag: "new order",
    shopifyProcessedTag: "imported-to-admin",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [automationStatus, setAutomationStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [emailTestStatus, setEmailTestStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [testEmailAddress, setTestEmailAddress] = useState("test@example.com");
  const [cronStatus, setCronStatus] = useState<any>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadCronStatus();

    // Update cron status every 5 seconds
    const interval = setInterval(loadCronStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from backend API
      const response = await fetch(
        `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/settings`,
        createFetchOptions({
          method: "GET",
        })
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSettings(result.data);
          return;
        }
      }

      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem("systemSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem("systemSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  };

  const loadCronStatus = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/cron/status`,
        createFetchOptions({
          method: "GET",
        })
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCronStatus(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading cron status:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);

      // Save to backend API
      const response = await fetch(
        `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/settings`,
        createFetchOptions({
          method: "POST",
          body: JSON.stringify(settings),
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Also save to localStorage as backup
        localStorage.setItem("systemSettings", JSON.stringify(settings));

        toast({
          title: "Settings Saved",
          description: "System settings have been updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncOnce = async () => {
    try {
      setSyncStatus("running");
      setIsLoading(true);

      const result = await SyncAPI.runOnce();

      if (result.success) {
        setSyncStatus("success");
        toast({
          title: "Sync Completed",
          description: result.message,
        });
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      setSyncStatus("error");
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to run synchronization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const handleAutomationOnce = async () => {
    try {
      setAutomationStatus("running");
      setIsLoading(true);

      const result = await AutomationAPI.runOnce();

      if (result.success) {
        setAutomationStatus("success");
        toast({
          title: "Automation Completed",
          description: result.message,
        });
      } else {
        throw new Error(result.error || "Automation failed");
      }
    } catch (error) {
      setAutomationStatus("error");
      toast({
        title: "Automation Failed",
        description:
          error instanceof Error ? error.message : "Failed to run automation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setAutomationStatus("idle"), 3000);
    }
  };

  const handleTestEmail = async () => {
    try {
      setEmailTestStatus("running");
      setIsLoading(true);

      // Validate email address
      if (!testEmailAddress || !testEmailAddress.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const result = await EmailAPI.testEmail(testEmailAddress);

      if (result.success) {
        setEmailTestStatus("success");
        toast({
          title: "Email Test Successful",
          description: `Test email sent to ${testEmailAddress}`,
        });
      } else {
        throw new Error(result.error || "Email test failed");
      }
    } catch (error) {
      setEmailTestStatus("error");
      toast({
        title: "Email Test Failed",
        description:
          error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setEmailTestStatus("idle"), 3000);
    }
  };

  const handleImportStatusModel = async () => {
    try {
      setIsLoading(true);

      if (!settings.googleSheetsUrl) {
        toast({
          title: "Error",
          description: "Please enter a Google Sheets URL",
          variant: "destructive",
        });
        return;
      }

      const result = await ImportAPI.importStatusModel({
        url: settings.googleSheetsUrl,
      });

      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
      } else {
        throw new Error(result.error || "Import failed");
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import status model from Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "Running...";
      case "success":
        return "Success";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <div className="container mx-auto p-2 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold">System Settings</h1>
          <p className="text-muted-foreground text-xs">
            Configure system settings, manage sync jobs, and import data
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isLoading}
          size="sm"
          className="h-7 text-xs"
        >
          <Settings className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        {/* General Settings */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-1 px-2 pt-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Settings className="h-3 w-3" />
              General Config
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label htmlFor="cronInterval" className="text-xs">
                  Interval (min)
                </Label>
                <Input
                  id="cronInterval"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.cronJobInterval}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cronJobInterval: parseInt(e.target.value) || 60,
                    })
                  }
                  className="h-6 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="emailNotifications" className="text-xs">
                  Email Notifications
                </Label>
                <div className="flex items-center space-x-1 mt-1">
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        emailNotifications: checked,
                      })
                    }
                    className="scale-50"
                  />
                  <Label htmlFor="emailNotifications" className="text-xs">
                    {settings.emailNotifications ? "On" : "Off"}
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label htmlFor="shopifyImportTag" className="text-xs">
                  Import Tag
                </Label>
                <Input
                  id="shopifyImportTag"
                  type="text"
                  value={settings.shopifyImportTag}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shopifyImportTag: e.target.value,
                    })
                  }
                  placeholder="new order"
                  className="h-6 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="shopifyProcessedTag" className="text-xs">
                  Processed Tag
                </Label>
                <Input
                  id="shopifyProcessedTag"
                  type="text"
                  value={settings.shopifyProcessedTag}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shopifyProcessedTag: e.target.value,
                    })
                  }
                  placeholder="imported-to-admin"
                  className="h-6 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Synchronization */}
        <Card>
          <CardHeader className="pb-1 px-2 pt-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Database className="h-3 w-3" />
              Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {getStatusIcon(syncStatus)}
                <span className="text-xs font-medium">
                  {getStatusText(syncStatus)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {cronStatus?.sync && (
                  <CountdownTimer
                    timeUntilNext={cronStatus.sync.timeUntilNext}
                    isRunning={cronStatus.sync.running}
                    className="text-xs"
                  />
                )}
              </div>
            </div>
            <Button
              onClick={handleSyncOnce}
              disabled={isLoading || syncStatus === "running"}
              className="w-full h-6 text-xs"
              size="sm"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Run Sync
            </Button>
          </CardContent>
        </Card>

        {/* Automation Workflow */}
        <Card>
          <CardHeader className="pb-1 px-2 pt-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {getStatusIcon(automationStatus)}
                <span className="text-xs font-medium">
                  {getStatusText(automationStatus)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {cronStatus?.automation && (
                  <CountdownTimer
                    timeUntilNext={cronStatus.automation.timeUntilNext}
                    isRunning={cronStatus.automation.running}
                    className="text-xs"
                  />
                )}
              </div>
            </div>
            <Button
              onClick={handleAutomationOnce}
              disabled={isLoading || automationStatus === "running"}
              className="w-full h-6 text-xs"
              size="sm"
            >
              <Zap className="h-3 w-3 mr-1" />
              Test Automation
            </Button>
          </CardContent>
        </Card>

        {/* Data Import */}
        <Card>
          <CardHeader className="pb-1 px-2 pt-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Data Import
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 space-y-1">
            <div>
              <Label htmlFor="googleSheetsUrl" className="text-xs">
                Google Sheets URL
              </Label>
              <Input
                id="googleSheetsUrl"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={settings.googleSheetsUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    googleSheetsUrl: e.target.value,
                  })
                }
                className="h-6 text-xs"
              />
            </div>
            <Button
              onClick={handleImportStatusModel}
              disabled={isLoading || !settings.googleSheetsUrl}
              className="w-full h-6 text-xs"
              size="sm"
            >
              <Upload className="h-3 w-3 mr-1" />
              Import Model
            </Button>
          </CardContent>
        </Card>

        {/* Email Testing */}
        <Card>
          <CardHeader className="pb-1 px-2 pt-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email Test
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 space-y-1">
            <div>
              <Label htmlFor="testEmail" className="text-xs">
                Test Email
              </Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="h-6 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTestEmail}
                disabled={isLoading || emailTestStatus === "running"}
                variant="outline"
                className="flex items-center gap-1 h-6 text-xs"
                size="sm"
              >
                {getStatusIcon(emailTestStatus)}
                <Mail className="h-3 w-3 mr-1" />
                Test
              </Button>
              <span className="text-xs text-muted-foreground">
                {getStatusText(emailTestStatus)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Data & Logs */}
      <div className="space-y-1">
        <div className="border-t pt-2">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Database className="h-3 w-3" />
            System Data & Logs
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <StatusModelViewer />
          <EmailLogsViewer />
        </div>
      </div>
    </div>
  );
}
