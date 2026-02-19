import { useState, useEffect, Suspense, lazy } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Truck,
  MessageSquare,
  Package,
  Diamond,
  Video,
  Receipt,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateToEST } from "@/utils/timezone";
import {
  useOrderQuery,
  useUpdateOrderMutation,
  useOrderCostsMutation,
  useDeleteOrderMutation,
} from "@/hooks/useOrdersQuery";
import { VideoRecorder } from "@/components/ui/VideoRecorder";
import { orderEmployeeCommentService } from "@/services/orderEmployeeComments";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load tab components for better performance
const InformationTab = lazy(() => import("@/components/orders/InformationTab").then(module => ({ default: module.InformationTab })));
const ShippingListTab = lazy(() => import("@/components/orders/ShippingListTab").then(module => ({ default: module.ShippingListTab })));
const EmployeeCommentsTab = lazy(() => import("@/components/orders/EmployeeCommentsTab").then(module => ({ default: module.EmployeeCommentsTab })));
const CastingTab = lazy(() => import("@/components/orders/CastingTab").then(module => ({ default: module.CastingTab })));
const DiamondsTab = lazy(() => import("@/components/orders/DiamondsTab").then(module => ({ default: module.DiamondsTab })));
const ThreeDRelatedTab = lazy(() => import("@/components/orders/ThreeDRelatedTab").then(module => ({ default: module.ThreeDRelatedTab })));

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "information",
      title: "Information",
      icon: FileText,
      description: "Order details and customer info",
    },
    {
      id: "shipping-list",
      title: "Shipping List",
      icon: Truck,
      description: "Shipping and delivery details",
    },
    {
      id: "employee-comments",
      title: "Employee Comments",
      icon: MessageSquare,
      description: "Internal notes and comments",
    },
    {
      id: "casting",
      title: "Casting",
      icon: Package,
      description: "Casting and manufacturing info",
    },
    {
      id: "diamonds",
      title: "Diamonds",
      icon: Diamond,
      description: "Diamond specifications and details",
    },
    {
      id: "3d-related",
      title: "3D Related",
      icon: Video,
      description: "3D models and design files",
    },
  ];

  // Get active tab from URL search params, default to "information"
  const activeTab = searchParams.get("tab") || "information";

  // Valid tab IDs
  const validTabIds = sidebarItems.map((item) => item.id);

  // Function to handle tab changes and update URL
  const handleTabChange = (tabId: string) => {
    if (validTabIds.includes(tabId)) {
      setSearchParams({ tab: tabId });
    }
  };

  // Validate and set default tab if invalid
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && !validTabIds.includes(currentTab)) {
      setSearchParams({ tab: "information" });
    }
  }, [searchParams, setSearchParams, validTabIds]);

  // Get auth loading state to handle new tab scenario
  const { loading: authLoading, user } = useAuth();
  const { data: order, isLoading, isFetching, error, refetch, isFetched } = useOrderQuery(id!);
  
  // Determine if query should be enabled (same logic as in useOrderQuery)
  const isQueryEnabled = !!id && !!user && !authLoading;
  
  // Debug logging to understand the issue
  useEffect(() => {
    console.log('OrderDetailPage Debug:', {
      id,
      authLoading,
      user: !!user,
      isQueryEnabled,
      isLoading,
      isFetching,
      isFetched,
      hasOrder: !!order,
      error: error?.message,
    });
  }, [id, authLoading, user, isQueryEnabled, isLoading, isFetching, isFetched, order, error]);
  
  const updateOrderMutation = useUpdateOrderMutation();
  const updateCostsMutation = useOrderCostsMutation();
  const deleteOrderMutation = useDeleteOrderMutation(() => {
    setShowDeleteDialog(false);
    navigate("/orders");
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    if (id && !deleteOrderMutation.isPending) {
      await deleteOrderMutation.mutateAsync(id);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSaveVideoComment = async (content: string, videoBlob: Blob) => {
    try {
      // Upload video to Supabase Storage
      const videoUrl = await orderEmployeeCommentService.uploadVideo(
        id!,
        videoBlob
      );

      // Create comment in database
      await orderEmployeeCommentService.createComment({
        order_id: id!,
        content,
        video_url: videoUrl,
      });

      // Close video recorder
      setIsVideoRecorderOpen(false);

      toast({
        title: "Success",
        description: "Video comment saved successfully!",
      });
    } catch (error) {
      console.error("Error saving video comment:", error);
      toast({
        title: "Error",
        description: "Failed to save video comment",
        variant: "destructive",
      });
    }
  };

  // Show error state only for actual errors (not loading)
  if (error && !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Order #{id?.slice(-8).toUpperCase()}
            </h1>
          </div>
        </div>

        <LoadingState
          isLoading={false}
          error={error}
          onRetry={refetch}
          title="Error Loading Order"
          description="Failed to load order details. Please try again."
        />
      </div>
    );
  }

  // Show loading state if:
  // 1. Auth is still loading, OR
  // 2. Query should be enabled but hasn't fetched yet (query just became enabled), OR
  // 3. Query is actively loading/fetching
  // This prevents showing "not found" before auth finishes initializing or while query is starting
  const isQueryPending = (isQueryEnabled && !isFetched) || isLoading || (isFetching && !order);
  if (authLoading || isQueryPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Order #{id?.slice(-8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>

        <LoadingState
          isLoading={true}
          error={null}
          onRetry={refetch}
          title="Loading Order Details"
          description="Please wait while we fetch the order information..."
        />
      </div>
    );
  }

  // Show not found only if auth has finished loading, query has finished fetching, and there's no order
  // This ensures we don't show "not found" while auth is still initializing or query is starting
  if (!authLoading && isFetched && !order && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Order not found
          </h2>
          <p className="text-muted-foreground">
            The order you're looking for doesn't exist.
          </p>
          <Link to="/orders">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 overflow-x-hidden"
      style={{
        marginLeft: isSidebarCollapsed ? "4rem" : "20rem",
        marginTop: "1.5rem",
      }}
    >
      {/* Header with Title and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Order #
              {order.order_id || order.shopify_order_number || `#${order.id.slice(-8).toUpperCase()}`} |{" "}
              {order.order_date ? formatDateToEST(order.order_date) : "No Date"}
            </h1>
            {isFetching && (
              <div className="flex items-center gap-2 mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">Updating...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVideoRecorderOpen(true)}
          >
            <Video className="h-4 w-4 mr-2" />
            Record
          </Button>
          <Button variant="outline" size="sm">
            <Receipt className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteOrderMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden">
        <div className="flex space-x-1 p-1 bg-muted rounded-lg">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar - Fixed Position */}
      <div className="hidden lg:block">
        <div
          className="fixed top-16 left-0 bg-background border-r border-border shadow-sm"
          style={{
            position: "fixed",
            top: "4rem",
            width: isSidebarCollapsed ? "4rem" : "20rem",
            zIndex: 10,
          }}
        >
          <div
            className={`h-[calc(100vh-4rem)] flex flex-col ${
              isSidebarCollapsed ? "w-16" : ""
            }`}
          >
            {/* Sidebar Navigation */}
            <nav className="space-y-1 p-2 flex-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 rounded-md ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  } ${isSidebarCollapsed ? "justify-center p-2" : ""}`}
                  title={isSidebarCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </nav>

            {/* Collapse/Expand Button at Bottom */}
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="w-full p-1 h-8"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Right Column */}
      <div className="space-y-6 min-w-0">
        {/* Tab Content with Lazy Loading */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading tab content...</span>
            </div>
          </div>
        }>
        {activeTab === "information" && (
          <InformationTab
            order={order}
            onUpdateOrder={async (data) => {
              try {
                await updateOrderMutation.mutateAsync({
                  id: order.id,
                  data,
                });

                toast({
                  title: "Success",
                  description: "Order updated successfully",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to update order",
                  variant: "destructive",
                });
                throw error;
              }
            }}
            onUpdateCosts={(costs) => {
              updateCostsMutation.mutate({ orderId: order.id, costs });
            }}
            onRefreshOrder={refetch}
          />
        )}

        {activeTab === "shipping-list" && <ShippingListTab />}

        {activeTab === "employee-comments" && <EmployeeCommentsTab />}

        {activeTab === "casting" && <CastingTab />}

        {activeTab === "diamonds" && <DiamondsTab />}

        {activeTab === "3d-related" && <ThreeDRelatedTab />}
        </Suspense>
      </div>

      {/* Video Recorder Dialog */}
      <Dialog open={isVideoRecorderOpen} onOpenChange={setIsVideoRecorderOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Record Video Comment</DialogTitle>
          </DialogHeader>
          <VideoRecorder orderId={id!} onSave={handleSaveVideoComment} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteOrder}
        isLoading={deleteOrderMutation.isPending}
      />
    </div>
  );
}
