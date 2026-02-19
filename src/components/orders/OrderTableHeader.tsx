import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Settings } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderTableHeaderProps {
  hasActiveFilters: boolean;
  filteredOrdersCount: number;
  totalOrdersCount: number;
  columns: any[];
  onResetColumnOrder: () => void;
  onToggleColumnVisibility: (columnId: string) => void;
  onCreateOrder: () => void;
}

export function OrderTableHeader({
  hasActiveFilters,
  filteredOrdersCount,
  totalOrdersCount,
  columns,
  onResetColumnOrder,
  onToggleColumnVisibility,
  onCreateOrder
}: OrderTableHeaderProps) {
  return (
    <Button size="sm" onClick={onCreateOrder}>
        <Plus className="h-4 w-4 mr-2" />
        New Order
    </Button>
  );
}
