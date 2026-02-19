import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X, Settings } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface OrderSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  emailSearch: string;
  setEmailSearch: (email: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  hasActiveFilters: boolean;
  filteredOrdersCount: number;
  totalOrdersCount: number;
  onClearFilters: () => void;
  onApplySearch: () => void;
}

export function OrderSearchBar({
  searchQuery,
  setSearchQuery,
  emailSearch,
  setEmailSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  hasActiveFilters,
  filteredOrdersCount,
  totalOrdersCount,
  onClearFilters,
  onApplySearch
}: OrderSearchBarProps) {
  const [showSearchPopup, setShowSearchPopup] = React.useState(false);

  return (
    <>
      {/* Advanced Search Popup Dialog */}
      <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Search Orders</DialogTitle>
            <DialogDescription>
              Search orders by ID, customer info, email, or date range
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* General Search */}
            <div className="grid gap-2">
              <Label htmlFor="search-input">General Search</Label>
              <Input
                id="search-input"
                placeholder="Search by order ID, customer name, purchase source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Email Search */}
            <div className="grid gap-2">
              <Label htmlFor="email-search">Customer Email</Label>
              <Input
                id="email-search"
                type="email"
                placeholder="Search by customer email..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
              />
            </div>
            
            {/* Date Range Search */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setEmailSearch("");
                  setDateFrom("");
                  setDateTo("");
                  onClearFilters();
                }}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button 
                onClick={() => {
                  console.log('Apply Search button clicked!');
                  console.log('onApplySearch function:', onApplySearch);
                  onApplySearch();
                  setShowSearchPopup(false);
                }}
                className="flex-1"
              >
                Apply Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
