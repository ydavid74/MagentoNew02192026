import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDateToEST } from "@/utils/timezone";
import { orderService } from "@/services/orders";

// Define all available columns - now 7 columns including customer email
export const allColumns = [
  {
    id: "order_id",
    header: "Order ID",
    accessorKey: "id",
    cell: ({ row }: any) => {
      const orderId = row.original.order_id;
      const shopifyOrderNumber = row.original.shopify_order_number;
      const displayId = orderId || shopifyOrderNumber || `#${row.getValue("id").slice(-8).toUpperCase()}`;
      const orderDetailId = row.original.id;

      const PrefetchingLink = () => {
        const queryClient = useQueryClient();
        
        const handleMouseEnter = () => {
          // Prefetch order details when user hovers over the link
          queryClient.prefetchQuery({
            queryKey: ['orders', orderDetailId],
            queryFn: async () => {
              try {
                return await orderService.getOrder(orderDetailId);
              } catch (error) {
                // Silently fail prefetch - don't show errors
                return null;
              }
            },
            staleTime: 1000 * 60 * 15, // 15 minutes
          });
        };

        return (
          <Link
            to={`/orders/${orderDetailId}`}
            className="font-medium text-primary hover:underline"
            onMouseEnter={handleMouseEnter}
          >
            {displayId}
          </Link>
        );
      };

      return <PrefetchingLink />;
    },
    sortable: true,
    width: 120,
    hidden: false,
  },
  {
    id: "customer_email",
    header: "Customer Email",
    accessorKey: "customers.email",
    cell: ({ row }: any) => {
      const customerEmail = row.original.customers?.email;
      return customerEmail ? (
        <div className="font-medium text-primary">{customerEmail}</div>
      ) : (
        <div className="text-muted-foreground">No email</div>
      );
    },
    sortable: true,
    width: 180,
    hidden: false,
  },
  {
    id: "purchased_from",
    header: "Purchased From",
    accessorKey: "purchase_from",
    cell: ({ row }: any) => {
      const purchaseFrom = row.getValue("purchase_from");
      return purchaseFrom ? (
        <div className="font-medium text-primary">{purchaseFrom}</div>
      ) : (
        <div className="text-muted-foreground">Not specified</div>
      );
    },
    sortable: true,
    width: 150,
    hidden: false,
  },
  {
    id: "purchased_on",
    header: "Purchased On",
    accessorKey: "order_date",
    cell: ({ row }: any) => {
      const date = row.getValue("order_date");
      return date ? (
        <div className="text-sm">{formatDateToEST(date)}</div>
      ) : (
        <div className="text-sm text-muted-foreground">No date</div>
      );
    },
    sortable: true,
    width: 120,
    hidden: false,
  },
  {
    id: "bill_to_name",
    header: "Bill To Name",
    accessorKey: "bill_to_name",
    cell: ({ row }: any) => {
      const billToName = row.getValue("bill_to_name");
      const customerName = row.original.customers?.name;

      // Use bill_to_name if available, otherwise fall back to customer name
      const displayName = billToName || customerName;

      return displayName ? (
        <div className="font-medium">{displayName}</div>
      ) : (
        <div className="text-muted-foreground">Not specified</div>
      );
    },
    sortable: true,
    width: 150,
    hidden: false,
  },
  {
    id: "ship_to_name",
    header: "Ship To Name",
    accessorKey: "ship_to_name",
    cell: ({ row }: any) => {
      const shipToName = row.getValue("ship_to_name");
      const customerName = row.original.customers?.name;

      // Use ship_to_name if available, otherwise fall back to customer name
      const displayName = shipToName || customerName;

      return displayName ? (
        <div className="font-medium">{displayName}</div>
      ) : (
        <div className="text-muted-foreground">Not specified</div>
      );
    },
    sortable: true,
    width: 150,
    hidden: false,
  },
  {
    id: "delivery_method",
    header: "Delivery Method",
    accessorKey: "delivery_method",
    cell: ({ row }: any) => {
      const deliveryMethod = row.getValue("delivery_method");
      return deliveryMethod ? (
        <div className="font-medium text-blue-600">{deliveryMethod}</div>
      ) : (
        <div className="text-muted-foreground">Standard Shipping</div>
      );
    },
    sortable: true,
    width: 150,
    hidden: false,
  },
  {
    id: "total_price",
    header: "Total Price",
    accessorKey: "total_amount",
    cell: ({ row }: any) => (
      <div className="font-medium">
        ${Number(row.getValue("total_amount") || 0).toFixed(2)}
      </div>
    ),
    sortable: true,
    width: 120,
    hidden: false,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "latest_customer_note_status",
    cell: ({ row }: any) => (
      <StatusBadge
        status={row.getValue("latest_customer_note_status") || "pending"}
      />
    ),
    sortable: true,
    width: 120,
    hidden: false,
  },
  {
    id: "actions",
    header: "Actions",
    accessorKey: "actions",
    cell: ({ row }: any) => (
      <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
    sortable: false,
    width: 80,
    hidden: false,
  },
];
