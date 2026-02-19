import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useOrdersQuery, useDeleteOrderMutation, useCreateOrderMutation } from "@/hooks/useOrdersQuery";
import { OrderFilter } from "@/services/orders";
import { OrderSearchBar } from "@/components/orders/OrderSearchBar";
import { OrderSearchSummary } from "@/components/orders/OrderSearchSummary";
import { OrderTableHeader } from "@/components/orders/OrderTableHeader";
import { OrderPagination } from "@/components/orders/OrderPagination";
import { OrderTableControls } from "@/components/orders/OrderTableControls";
import { allColumns } from "@/components/orders/OrderTableColumns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get URL parameters with defaults
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('limit') || '100', 10);
  
  // Local state for input values (not applied until Apply Search is clicked)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [emailSearch, setEmailSearch] = useState(searchParams.get('email') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [columns, setColumns] = useState(allColumns);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    order_id: '',
    customer_email: '',
    bill_to_name: '',
    ship_to_name: '',
    total_amount: '',
    customization_notes: ''
  });
  // Async customer search state
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Available page sizes for better performance with large datasets
  const pageSizeOptions = [50, 100, 200, 500, 1000];
  
  // Build filters from URL parameters (not from local input state)
  const appliedFilters: OrderFilter = useMemo(() => {
    const filters: OrderFilter = {};
    
    const urlSearchQuery = searchParams.get('search') || '';
    const urlEmailSearch = searchParams.get('email') || '';
    const urlDateFrom = searchParams.get('dateFrom') || '';
    const urlDateTo = searchParams.get('dateTo') || '';
    
    if (urlSearchQuery.trim()) {
      filters.bill_to_name = urlSearchQuery.trim();
    }
    
    if (urlEmailSearch.trim()) {
      filters.customer = urlEmailSearch.trim();
    }
    
    if (urlDateFrom) {
      filters.dateFrom = urlDateFrom;
    }
    
    if (urlDateTo) {
      filters.dateTo = urlDateTo;
    }
    
    return filters;
  }, [searchParams]);
  
  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('limit', newPageSize.toString());
    newSearchParams.set('page', '1'); // Reset to first page when changing page size
    setSearchParams(newSearchParams);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    setSearchParams(newSearchParams);
  };
  
  // Handle search
  const handleApplySearch = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (searchQuery.trim()) {
      newSearchParams.set('search', searchQuery.trim());
    } else {
      newSearchParams.delete('search');
    }
    
    if (emailSearch.trim()) {
      newSearchParams.set('email', emailSearch.trim());
    } else {
      newSearchParams.delete('email');
    }
    
    if (dateFrom) {
      newSearchParams.set('dateFrom', dateFrom);
    } else {
      newSearchParams.delete('dateFrom');
    }
    
    if (dateTo) {
      newSearchParams.set('dateTo', dateTo);
    } else {
      newSearchParams.delete('dateTo');
    }
    
    newSearchParams.set('page', '1'); // Reset to first page when searching
    setSearchParams(newSearchParams);
  };
  
  // Handle clear filters
  const clearFilters = () => {
    // Clear URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    newSearchParams.delete('email');
    newSearchParams.delete('dateFrom');
    newSearchParams.delete('dateTo');
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
    
    // Clear local input state
    setSearchQuery('');
    setEmailSearch('');
    setDateFrom('');
    setDateTo('');
  };
  
  const { data: ordersResponse, isLoading, isFetching, error, refetch } = useOrdersQuery(appliedFilters, { page: currentPage, limit: itemsPerPage });
  const orders = ordersResponse?.data || [];
  const totalRecords = ordersResponse?.total || 0;
  
  // Show loading state when fetching (including pagination) or initial loading
  // isFetching is true when ANY query is running, even with cached data
  const isSearching = isLoading || isFetching;
  const deleteOrderMutation = useDeleteOrderMutation(() => {
    setShowDeleteDialog(false);
    setOrderToDelete(null);
  });
  const createOrderMutation = useCreateOrderMutation();

  // Server-side pagination - no client-side filtering needed
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  
  // Ensure current page is within bounds
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  
  // Only redirect if the page is truly invalid (negative or zero)
  useEffect(() => {
    if (currentPage < 1) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
    }
  }, [currentPage, searchParams, setSearchParams]);
  
  // Sync local input state with URL parameters when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setEmailSearch(searchParams.get('email') || '');
    setDateFrom(searchParams.get('dateFrom') || '');
    setDateTo(searchParams.get('dateTo') || '');
  }, [searchParams]);

  // Check if there are active filters (based on URL parameters, not local input state)
  const hasActiveFilters = Boolean(
    searchParams.get('search') || 
    searchParams.get('email') || 
    searchParams.get('dateFrom') || 
    searchParams.get('dateTo')
  );

  // Handle input changes (these only update local state, not URL)
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleEmailSearchChange = (value: string) => {
    setEmailSearch(value);
  };
  
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
  };
  
  const handleDateToChange = (value: string) => {
    setDateTo(value);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    if (orderToDelete && !deleteOrderMutation.isPending) {
      await deleteOrderMutation.mutateAsync(orderToDelete);
    }
  };

  const handleCreateOrder = () => {
    setShowCreateOrderModal(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setNewOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debounced customer search
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const term = customerQuery.trim();
      if (!term || term.length < 2) {
        if (active) setCustomerOptions([]);
        return;
      }

      try {
        setIsSearchingCustomers(true);
        // Search by email or name
        const { data, error } = await supabase
          .from('customers')
          .select('id, email, name')
          .or(`email.ilike.%${term}%,name.ilike.%${term}%`)
          .limit(10);
        if (error) throw error;
        if (active) setCustomerOptions((data || []).map((c: any) => ({ id: c.id, email: c.email || '', name: c.name || '' })));
      } catch (e) {
        setCustomerOptions([]);
      } finally {
        if (active) setIsSearchingCustomers(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery]);

  const handleSelectCustomer = (option: { id: string; email: string; name: string }) => {
    setNewOrderData(prev => ({
      ...prev,
      customer_email: option.email || prev.customer_email,
      bill_to_name: prev.bill_to_name || option.name || '',
    }));
    setSelectedCustomerId(option.id);
    setShowCustomerDropdown(false);
  };

  const handleCreateNewCustomerOpt = () => {
    // Keep typed email, user can fill name
    setNewOrderData(prev => ({ ...prev, customer_email: customerQuery }));
    setSelectedCustomerId(null);
    setShowCustomerDropdown(false);
  };

  const handleCreateOrderSubmit = async () => {
    const email = (newOrderData.customer_email || '').trim();
    const basicEmailOk = /.+@.+\..+/.test(email);

    if (!newOrderData.order_id || !email || !newOrderData.bill_to_name) {
      alert('Please fill in required fields: Order ID, Customer Email, and Bill To Name');
      return;
    }
    if (!basicEmailOk) {
      alert('Please enter a valid customer email');
      return;
    }

    try {
      // First, find or create the customer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine customer id: prefer selected option if chosen
      let customerId: string | null = selectedCustomerId;

      if (!customerId) {
        // Try to find existing customer by email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingCustomer?.id) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer if not found
          const { data: newCustomer, error: createCustomerError } = await supabase
            .from('customers')
            .insert({
              email: email,
              name: newOrderData.bill_to_name,
              first_name: newOrderData.bill_to_name.split(' ')[0] || '',
              last_name: newOrderData.bill_to_name.split(' ').slice(1).join(' ') || '',
            })
            .select('id')
            .single();

          if (createCustomerError) {
            console.error('Error creating customer:', createCustomerError);
            alert('Failed to create customer. Please try again.');
            return;
          }

          customerId = newCustomer.id;
        }
      }

      // Now create the order with the customer ID
      const orderData = {
        customer_id: customerId,
        purchase_from: 'Manual Entry',
        order_date: new Date().toISOString(),
        total_amount: parseFloat(newOrderData.total_amount) || 0,
        order_id: newOrderData.order_id.trim(),
        bill_to_name: newOrderData.bill_to_name.trim(),
        ship_to_name: (newOrderData.ship_to_name || '').trim(),
      } as any;

      await createOrderMutation.mutateAsync(orderData);
      setShowCreateOrderModal(false);
      setNewOrderData({
        order_id: '',
        customer_email: '',
        bill_to_name: '',
        ship_to_name: '',
        total_amount: '',
        customization_notes: ''
      });
      setCustomerQuery('');
      setCustomerOptions([]);
      setSelectedCustomerId(null);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };


  // Column reordering functionality
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    e.dataTransfer.setData("text/plain", columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const draggedColumnId = e.dataTransfer.getData("text/plain");
    
    if (draggedColumnId === targetColumnId) return;

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(col => col.id === draggedColumnId);
    const targetIndex = newColumns.findIndex(col => col.id === targetColumnId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedColumn] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);
      setColumns(newColumns);
    }
  };

  const resetColumnOrder = () => {
    setColumns([...allColumns]);
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => {
      const column = prev.find(col => col.id === columnId);
      if (column) {
        return prev.map(col => 
          col.id === columnId ? { ...col, hidden: !col.hidden } : col
        );
      }
      return prev;
    });
  };

  // Filter out hidden columns and modify actions column
  const visibleColumns = columns.map(col => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }: any) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteOrder(row.original.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      };
    }
    return col;
  }).filter(col => !col.hidden);

  // Show loading or error state
  if (isLoading || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage and track customer orders</p>
          </div>
        </div>
        
        <LoadingState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          title="Loading Orders"
          description="Please wait while we fetch your orders..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
      </div>

      <OrderTableHeader
        hasActiveFilters={hasActiveFilters}
        filteredOrdersCount={totalRecords}
        totalOrdersCount={orders.length}
        columns={columns}
        onResetColumnOrder={resetColumnOrder}
        onToggleColumnVisibility={toggleColumnVisibility}
        onCreateOrder={handleCreateOrder}
      />

      <div className="relative">
        <OrderSearchBar
          searchQuery={searchQuery}
          setSearchQuery={handleSearchQueryChange}
          emailSearch={emailSearch}
          setEmailSearch={handleEmailSearchChange}
          dateFrom={dateFrom}
          setDateFrom={handleDateFromChange}
          dateTo={dateTo}
          setDateTo={handleDateToChange}
          hasActiveFilters={hasActiveFilters}
          filteredOrdersCount={totalRecords}
          totalOrdersCount={orders.length}
          onClearFilters={clearFilters}
          onApplySearch={handleApplySearch}
        />
        {isSearching && (
          <div className="absolute top-2 right-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      <OrderSearchSummary
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchQuery}
        emailSearch={emailSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        filteredOrdersCount={totalRecords}
        onClearFilters={clearFilters}
      />

              {/* Pagination Controls and Table Controls in One Row */}
          {totalRecords > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
              {/* Left: Results Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} results
                  </span>
                  <span>•</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
                
              {/* Middle: Pagination Controls */}
              <OrderPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
                isLoading={isFetching}
              />
              
              {/* Right: Table Controls */}
              <OrderTableControls
                showSearchPopup={showSearchPopup}
                setShowSearchPopup={setShowSearchPopup}
                searchQuery={searchQuery}
                setSearchQuery={handleSearchQueryChange}
                emailSearch={emailSearch}
                setEmailSearch={handleEmailSearchChange}
                dateFrom={dateFrom}
                setDateFrom={handleDateFromChange}
                dateTo={dateTo}
                setDateTo={handleDateToChange}
                hasActiveFilters={hasActiveFilters}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={handlePageSizeChange}
                onClearFilters={clearFilters}
                onApplySearch={handleApplySearch}
              />
            </div>
            </div>
          )}
          
          {/* Table with loading overlay */}
          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading orders...</span>
                </div>
              </div>
            )}
            <DataTable columns={visibleColumns} data={orders} />
          </div>
          
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

          {/* Create Order Modal */}
          <Dialog open={showCreateOrderModal} onOpenChange={setShowCreateOrderModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Fill in the order details to create a new order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="order-id">Order ID *</Label>
                    <Input
                      id="order-id"
                      placeholder="Enter order ID"
                      value={newOrderData.order_id}
                      onChange={(e) => handleInputChange('order_id', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-email">Customer Email *</Label>
                    <div className="relative">
                      <Input
                        id="customer-email"
                        type="email"
                        placeholder="Search email or name..."
                        value={newOrderData.customer_email || customerQuery}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerQuery(val);
                          // Keep newOrderData.customer_email in sync when it looks like an email
                          setNewOrderData(prev => ({ ...prev, customer_email: val }));
                          setShowCustomerDropdown(true);
                        }}
                        autoComplete="off"
                      />
                      {showCustomerDropdown && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow focus:outline-none">
                          <div className="max-h-64 overflow-auto py-1">
                            {isSearchingCustomers && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                            )}
                            {!isSearchingCustomers && (
                              <>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={handleCreateNewCustomerOpt}
                                >
                                  Create new "{customerQuery}"
                                </button>
                                {customerOptions.map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => handleSelectCustomer(opt)}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{opt.email}</span>
                                      <span className="text-xs text-muted-foreground">{opt.name}</span>
                                    </div>
                                  </button>
                                ))}
                                {customerOptions.length === 0 && customerQuery.trim().length >= 2 && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bill-to-name">Bill To Name *</Label>
                    <Input
                      id="bill-to-name"
                      placeholder="Enter billing name"
                      value={newOrderData.bill_to_name}
                      onChange={(e) => handleInputChange('bill_to_name', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ship-to-name">Ship To Name</Label>
                    <Input
                      id="ship-to-name"
                      placeholder="Enter shipping name"
                      value={newOrderData.ship_to_name}
                      onChange={(e) => handleInputChange('ship_to_name', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total-amount">Total Amount</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    placeholder="Enter total amount"
                    value={newOrderData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customization-notes">Customization Notes</Label>
                  <Textarea
                    id="customization-notes"
                    placeholder="Enter any customization notes"
                    value={newOrderData.customization_notes}
                    onChange={(e) => handleInputChange('customization_notes', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateOrderModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrderSubmit}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
}