import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Diamond, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LogoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Mock logout process
    const timer = setTimeout(() => {
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account",
      });
      navigate("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LogOut className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Signing out...</CardTitle>
          <CardDescription>
            Please wait while we sign you out
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse flex justify-center">
              <div className="h-2 w-24 bg-muted rounded"></div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}