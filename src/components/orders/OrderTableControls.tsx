import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Settings } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface OrderTableControlsProps {
  showSearchPopup: boolean;
  setShowSearchPopup: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  emailSearch: string;
  setEmailSearch: (email: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  hasActiveFilters: boolean;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  onClearFilters: () => void;
  onApplySearch: () => void;
}

export function OrderTableControls({
  showSearchPopup,
  setShowSearchPopup,
  searchQuery,
  setSearchQuery,
  emailSearch,
  setEmailSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  hasActiveFilters,
  itemsPerPage,
  setItemsPerPage,
  onClearFilters,
  onApplySearch
}: OrderTableControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search Popup Dialog */}
      <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </DialogTrigger>
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
                }}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button 
                onClick={() => {
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

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      )}

      {/* Rows Per Page Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows:</span>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="1000">1000</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
