import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CastingModuleService,
  CastingOrder,
  CastingMemo,
} from "@/services/castingModule";

interface CastingOrderWithMemos extends CastingOrder {
  memos: CastingMemo[];
}

export function CastingOrderList() {
  const { toast } = useToast();
  const [castingOrders, setCastingOrders] = useState<CastingOrderWithMemos[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCastingOrders();
  }, []);

  const loadCastingOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await CastingModuleService.getAllCastingOrders();

      // Load memos for each order
      const ordersWithMemos = await Promise.all(
        orders.map(async (order) => {
          const memos =
            await CastingModuleService.getCastingMemosByCastingOrderId(
              order.id
            );
          return { ...order, memos };
        })
      );

      setCastingOrders(ordersWithMemos);
    } catch (error) {
      console.error("Error loading casting orders:", error);
      toast({
        title: "Error",
        description: "Failed to load casting orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get all memos from all orders and group by date, then by instance
  const allMemos = castingOrders.flatMap((order) =>
    order.memos.map((memo) => ({
      ...memo,
      order_status: order.status,
      order_created_at: order.created_at,
    }))
  );

  // Group memos by date first
  const memosByDate = allMemos.reduce((groups, memo) => {
    const date = new Date(memo.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(memo);
    return groups;
  }, {} as Record<string, typeof allMemos>);

  // Within each date, group by instance (casting_order_id)
  const memosByDateAndInstance = Object.keys(memosByDate).reduce(
    (dateGroups, date) => {
      const dateMemos = memosByDate[date];
      const instanceGroups = dateMemos.reduce((instances, memo) => {
        const instanceKey = memo.casting_order_id || `manual-${memo.order_id}`;
        if (!instances[instanceKey]) {
          instances[instanceKey] = [];
        }
        instances[instanceKey].push(memo);
        return instances;
      }, {} as Record<string, typeof dateMemos>);

      dateGroups[date] = instanceGroups;
      return dateGroups;
    },
    {} as Record<string, Record<string, typeof allMemos>>
  );

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(memosByDateAndInstance).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const filteredMemos = allMemos.filter(
    (memo) =>
      memo.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Casting Order List
          </h1>
          <p className="text-muted-foreground">
            Manage all casting orders and memos
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by order number, product name, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Memos List - Grouped by Date */}
      <div className="space-y-6">
        {filteredMemos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No casting memos found</p>
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dateInstanceGroups = memosByDateAndInstance[date];
            const allDateMemos = Object.values(dateInstanceGroups).flat();
            const filteredDateMemos = allDateMemos.filter(
              (memo) =>
                searchTerm === "" ||
                memo.order_number
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                memo.product_name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                memo.product_id.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredDateMemos.length === 0) return null;

            const isExpanded = expandedDates.has(date);

            return (
              <div key={date} className="space-y-2">
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleDateExpansion(date)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <h2 className="text-xl font-semibold text-foreground">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h2>
                        <Badge variant="outline" className="text-sm">
                          {filteredDateMemos.length} item
                          {filteredDateMemos.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Click to {isExpanded ? "collapse" : "expand"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isExpanded && (
                  <div className="ml-6 space-y-4">
                    {Object.entries(dateInstanceGroups).map(
                      ([instanceKey, instanceMemos]) => {
                        const filteredInstanceMemos = instanceMemos.filter(
                          (memo) =>
                            searchTerm === "" ||
                            memo.order_number
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            memo.product_name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            memo.product_id
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        );

                        if (filteredInstanceMemos.length === 0) return null;

                        return (
                          <div key={instanceKey} className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-medium text-foreground">
                                Instance Group
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {filteredInstanceMemos.length} item
                                {filteredInstanceMemos.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {filteredInstanceMemos.map((memo) => (
                                <Card
                                  key={memo.id}
                                  className="hover:shadow-md transition-shadow"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-48 h-48 bg-muted rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {memo.product_image ? (
                                          <img
                                            src={memo.product_image}
                                            alt={memo.product_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (
                                                e.currentTarget as HTMLImageElement
                                              ).style.display = "none";
                                              const nextElement = e
                                                .currentTarget
                                                .nextElementSibling as HTMLElement;
                                              if (nextElement) {
                                                nextElement.style.display =
                                                  "flex";
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className="text-muted-foreground text-sm flex items-center justify-center"
                                          style={{
                                            display: memo.product_image
                                              ? "none"
                                              : "flex",
                                          }}
                                        >
                                          No Image
                                        </div>
                                      </div>

                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div>
                                          <Label className="text-xs text-muted-foreground">
                                            Order Number
                                          </Label>
                                          <div className="text-sm font-medium">
                                            #{memo.order_number}
                                          </div>
                                        </div>

                                        <div>
                                          <Label className="text-xs text-muted-foreground">
                                            Size & Metal
                                          </Label>
                                          <div className="text-sm">
                                            {memo.size} • {memo.metal_type}
                                          </div>
                                        </div>
                                      </div>

                                      {memo.comments && (
                                        <div className="col-span-full mt-2">
                                          <Label className="text-xs text-muted-foreground">
                                            Comments
                                          </Label>
                                          <div className="text-sm text-muted-foreground mt-1">
                                            {memo.comments}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
