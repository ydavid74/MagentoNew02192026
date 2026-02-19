import React from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface OrderSearchSummaryProps {
  hasActiveFilters: boolean;
  searchQuery: string;
  emailSearch: string;
  dateFrom: string;
  dateTo: string;
  filteredOrdersCount: number;
  onClearFilters: () => void;
}

export function OrderSearchSummary({
  hasActiveFilters,
  searchQuery,
  emailSearch,
  dateFrom,
  dateTo,
  filteredOrdersCount,
  onClearFilters,
}: OrderSearchSummaryProps) {
  if (!hasActiveFilters) return null;

  return (
    <div className="mb-4 p-3 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Search Results
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-6 px-2 text-blue-600 hover:text-blue-800"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">General:</span> "{searchQuery}"
            </span>
          )}
          {emailSearch && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">Email:</span> "{emailSearch}"
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">From:</span>{" "}
              {new Date(dateFrom).toLocaleDateString()}
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium">To:</span>{" "}
              {new Date(dateTo).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-1 text-blue-600 dark:text-blue-400">
          Found {filteredOrdersCount} orders matching your criteria
        </div>
      </div>
    </div>
  );
}
