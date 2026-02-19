import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Diamond, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { StarAnimation } from "@/components/ui/StarAnimation";
import { supabase } from "@/integrations/supabase/client";
import { diamondDeductionsService, DiamondDeduction, DiamondDeductionWithProfile, CreateDiamondDeductionData } from "@/services/diamondDeductions";
import { diamondInventoryService } from "@/services/diamondInventory";
import { orderService } from "@/services/orders";
import { DiamondDeductionsTable } from "./diamonds/DiamondDeductionsTable";
import { DiamondActionButtons } from "./diamonds/DiamondActionButtons";
import { CenterDeductionDialog } from "./diamonds/CenterDeductionDialog";
import { SideDeductionDialog } from "./diamonds/SideDeductionDialog";
import { ManualDeductionDialog } from "./diamonds/ManualDeductionDialog";
import { DeleteDeductionDialog } from "./diamonds/DeleteDeductionDialog";
import { EditDeductionDialog } from "./diamonds/EditDeductionDialog";
import { AddToStockDialog } from "./diamonds/AddToStockDialog";



const diamondTypes = [
  "Natural Diamond",
  "Lab-Grown Diamond",
  "Moissanite",
  "Cubic Zirconia",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Other"
];

export function DiamondsTab() {
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const [deductions, setDeductions] = useState<DiamondDeductionWithProfile[]>([]);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [diamondToDelete, setDiamondToDelete] = useState<DiamondDeductionWithProfile | null>(null);
  const [currentDeduction, setCurrentDeduction] = useState<DiamondDeduction>({
    order_id: '',
    type: 'center',
    product_sku: "",
    parcel_id: "",
    ct_weight: 0,
    stones: "",
    price_per_ct: 0,
    total_price: 0,
    mm: "",
    comments: ""
  });
  const [deductionType, setDeductionType] = useState<'center' | 'side' | 'manual'>('center');
  const [order, setOrder] = useState<any>(null);
  const [skuOptions, setSkuOptions] = useState<string[]>([]);
  const [parcelValidation, setParcelValidation] = useState<{ exists: boolean; loading: boolean; data?: any }>({ exists: false, loading: false });
  const [showSideDeductionDialog, setShowSideDeductionDialog] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [diamondToEdit, setDiamondToEdit] = useState<DiamondDeductionWithProfile | null>(null);
  const [showAddToStockDialog, setShowAddToStockDialog] = useState(false);
  const [diamondToAddToStock, setDiamondToAddToStock] = useState<DiamondDeductionWithProfile | null>(null);
  const [isAddingToStock, setIsAddingToStock] = useState(false);
  const [isSubmittingDeduction, setIsSubmittingDeduction] = useState(false);
  const [isTogglingIncludeInCost, setIsTogglingIncludeInCost] = useState(false);
  const [isDeletingDeduction, setIsDeletingDeduction] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [selectedDeductions, setSelectedDeductions] = useState<string[]>([]);
  const [manualDeduction, setManualDeduction] = useState<DiamondDeduction>({
    order_id: '',
    type: 'manual',
    product_sku: "",
    parcel_id: "",
    ct_weight: 0,
    stones: "",
    price_per_ct: 0,
    total_price: 0,
    mm: "",
    comments: ""
  });
  const [sideDeductionItems, setSideDeductionItems] = useState<DiamondDeduction[]>([]);

  // Load deductions and order when component mounts
  useEffect(() => {
    if (orderId) {
      loadDeductions();
      loadOrder();
      loadSkuOptions();
    }
  }, [orderId]);



  const loadOrder = async () => {
    if (!orderId) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error loading order:', error);
        return;
      }

      setOrder(data);
      setOrderNumber((data as any).order_id || orderId); // Use order_id field if available, fallback to UUID
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const loadSkuOptions = async () => {
    if (!orderId) return;
    
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('sku')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error loading SKU options:', error);
        return;
      }

      // Extract unique SKUs and filter out empty/null values
      const skus = [...new Set(data?.map(item => item.sku).filter(sku => sku && sku.trim()))];
      setSkuOptions(skus);
    } catch (error) {
      console.error('Error loading SKU options:', error);
    }
  };

  const checkParcelId = async (parcelId: string) => {
    if (!parcelId.trim()) {
      setParcelValidation({ exists: false, loading: false });
      return;
    }

    setParcelValidation(prev => ({ ...prev, loading: true }));
    console.log('Checking parcel ID:', parcelId.trim());
    
    try {
      const { data, error } = await supabase
        .from('diamond_inventory' as any)
        .select('parcel_id, parcel_name, total_carat, shape, color, clarity')
        .eq('parcel_id', parcelId.trim())
        .single();

      console.log('Query result:', { data, error });

      if (error) {
        console.log('Error details:', error);
        if (error.code === 'PGRST116') {
          // No rows found
          console.log('No rows found for parcel ID:', parcelId.trim());
          setParcelValidation({ exists: false, loading: false });
        } else {
          console.error('Error checking parcel ID:', error);
          setParcelValidation({ exists: false, loading: false });
        }
      } else {
        // Parcel found
        console.log('Parcel found:', data);
        setParcelValidation({ exists: true, loading: false, data });
      }
    } catch (error) {
      console.error('Exception in checkParcelId:', error);
      setParcelValidation({ exists: false, loading: false });
    }
  };

  // Debounced parcel ID validation
  useEffect(() => {
    console.log('useEffect triggered, currentDeduction:', currentDeduction);
    const timeoutId = setTimeout(() => {
      console.log('Timeout triggered, parcel_id:', currentDeduction.parcel_id);
      if (currentDeduction.parcel_id) {
        checkParcelId(currentDeduction.parcel_id);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [currentDeduction.parcel_id]);

  // Load existing deductions from database
  const loadDeductions = async () => {
    if (orderId) {
      try {
        const fetchedDeductions = await diamondDeductionsService.getByOrderId(orderId);
        setDeductions(fetchedDeductions);
      } catch (error) {
        console.error('Error loading deductions:', error);
        toast({
          title: "Error",
          description: "Failed to load existing deductions",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    loadDeductions();
  }, [orderId]);

  // Debug function to check diamond_inventory table
  const debugDiamondInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('diamond_inventory' as any)
        .select('parcel_id, parcel_name, total_carat')
        .limit(10);
      
      console.log('Diamond inventory sample data:', { data, error });
      
      if (data && data.length > 0) {
        console.log('Available parcel IDs:', data.map((item: any) => item.parcel_id));
      }
    } catch (error) {
      console.error('Error fetching diamond inventory:', error);
    }
  };

  // Call debug function on component mount
  useEffect(() => {
    debugDiamondInventory();
  }, []);

  const handleCenterDeduction = () => {
    setDeductionType('center');
    setCurrentDeduction({
      order_id: orderId || '',
      type: 'center',
      product_sku: "",
      parcel_id: "",
      ct_weight: 0,
      stones: "",
      price_per_ct: 0, // Will be fetched from inventory
      total_price: 0, // Will be calculated automatically
      mm: "",
      comments: ""
    });
    setParcelValidation({ exists: false, loading: false });
    setShowDeductionDialog(true);
  };

  const handleSideDeduction = () => {
    setDeductionType('side');
    // Reset side deduction items with current order ID - start with just one item
    // Use orderId (UUID) for database operations, not order.order_id (string like "ORD-001019")
    const actualOrderId = orderId || '';
    console.log('🔍 Side deduction initialization:', {
      order: order,
      orderId: orderId,
      actualOrderId: actualOrderId,
      orderData: order?.order_id,
      note: 'Using orderId (UUID) for database operations'
    });
    
    setSideDeductionItems([
      {
        id: '1',
        order_id: actualOrderId,
        type: 'side',
        product_sku: "",
        parcel_id: "",
        ct_weight: 0,
        stones: "",
        price_per_ct: 0,
        total_price: 0,
        mm: "",
        comments: "",
        added_to_stock: false
      }
    ]);
    setShowSideDeductionDialog(true);
  };

  const handleSaveDeduction = async () => {
    if (isSubmittingDeduction) {
      return; // Prevent multiple submissions
    }

    try {
      setIsSubmittingDeduction(true);
      // Validate required fields
      const ctWeight = parseFloat(currentDeduction.ct_weight?.toString() || '0');
      if (!currentDeduction.parcel_id || !ctWeight) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Parcel ID, CT Weight)",
          variant: "destructive",
        });
        return;
      }
      
      // For center deductions, also validate that Parcel ID is provided
      if (deductionType === 'center' && !currentDeduction.parcel_id) {
        toast({
          title: "Error",
          description: "Please provide a Parcel ID for center deduction",
          variant: "destructive",
        });
        return;
      }

      let savedDeduction: DiamondDeduction;

      if (currentDeduction.id) {
        // For center deductions, fetch price per ct from diamond inventory
        let pricePerCt = currentDeduction.price_per_ct;
        let totalPrice = currentDeduction.total_price;
        
        if (deductionType === 'center' && currentDeduction.parcel_id) {
          try {
            console.log('Fetching price for Parcel ID (update):', currentDeduction.parcel_id);
            const { data: inventoryData, error: inventoryError } = await supabase
              .from('diamond_inventory' as any)
              .select('price_per_ct')
              .eq('parcel_id', currentDeduction.parcel_id)
              .single();
            
            console.log('Inventory query result (update):', { inventoryData, inventoryError });
            
            if (!inventoryError && inventoryData) {
              pricePerCt = (inventoryData as any).price_per_ct;
              const ctWeight = parseFloat(currentDeduction.ct_weight?.toString() || '0');
              totalPrice = ctWeight * pricePerCt;
              console.log('Price fetched (update):', { pricePerCt, totalPrice });
            } else {
              console.warn('Could not fetch price from inventory (update), using default values');
              pricePerCt = 0;
              totalPrice = 0;
            }
          } catch (error) {
            console.error('Error fetching price from inventory (update):', error);
            pricePerCt = 0;
            totalPrice = 0;
          }
        }
        
        // Update existing deduction
        const updateData = {
          type: deductionType,
          product_sku: currentDeduction.product_sku || undefined,
          parcel_id: currentDeduction.parcel_id,
          ct_weight: parseFloat(currentDeduction.ct_weight?.toString() || '0'),
          stones: currentDeduction.stones || undefined,
          price_per_ct: pricePerCt,
          total_price: totalPrice,
          mm: currentDeduction.mm || undefined,
          comments: currentDeduction.comments
        };
        savedDeduction = await diamondDeductionsService.update(currentDeduction.id, updateData, orderNumber);
        
        // Update local state
        setDeductions(prev => prev.map(d => d.id === currentDeduction.id ? savedDeduction : d));
        
        toast({
          title: "Success",
          description: "Deduction updated successfully",
        });
      } else {
        // For center deductions, fetch price per ct from diamond inventory
        let pricePerCt = currentDeduction.price_per_ct;
        let totalPrice = currentDeduction.total_price;
        
        if (deductionType === 'center' && currentDeduction.parcel_id) {
          try {
            console.log('Fetching price for Parcel ID:', currentDeduction.parcel_id);
            
            // First, let's test if the table exists by trying to list some data
            const { data: testData, error: testError } = await supabase
              .from('diamond_inventory' as any)
              .select('parcel_id, price_per_ct')
              .limit(5);
            
            console.log('Test query result:', { testData, testError });
            
            if (!testError) {
                          const { data: inventoryData, error: inventoryError } = await supabase
              .from('diamond_inventory' as any)
              .select('price_per_ct')
              .eq('parcel_id', currentDeduction.parcel_id)
              .single();
              
              console.log('Inventory query result:', { inventoryData, inventoryError });
              
              if (!inventoryError && inventoryData) {
                pricePerCt = (inventoryData as any).price_per_ct;
                const ctWeight = parseFloat(currentDeduction.ct_weight?.toString() || '0');
                totalPrice = ctWeight * pricePerCt;
                console.log('Price fetched:', { pricePerCt, totalPrice });
              } else {
                console.warn('Could not fetch price from inventory, using default values');
                pricePerCt = 0;
                totalPrice = 0;
              }
            } else {
              console.warn('Diamond inventory table not accessible, using default values');
              pricePerCt = 0;
              totalPrice = 0;
            }
          } catch (error) {
            console.error('Error fetching price from inventory:', error);
            pricePerCt = 0;
            totalPrice = 0;
          }
        }
        
        // Create new deduction
        const deductionData: CreateDiamondDeductionData = {
          order_id: orderId || '',
          type: deductionType,
          product_sku: currentDeduction.product_sku || undefined,
          parcel_id: currentDeduction.parcel_id,
          ct_weight: parseFloat(currentDeduction.ct_weight?.toString() || '0'),
          stones: currentDeduction.stones || undefined,
          price_per_ct: pricePerCt,
          total_price: totalPrice,
          mm: currentDeduction.mm || undefined,
          comments: currentDeduction.comments,
          include_in_item_cost: true,
          added_to_stock: false,
          deduction_type: deductionType
        };
        
        console.log('Creating deduction with data:', deductionData);
        
        // Deduct from inventory FIRST if this is a center or side deduction with parcel_id
        if (deductionType === 'center' && currentDeduction.parcel_id && currentDeduction.ct_weight && currentDeduction.stones) {
          try {
            await diamondInventoryService.deductInventory({
              parcel_id: currentDeduction.parcel_id,
              ct_weight: parseFloat(currentDeduction.ct_weight?.toString() || '0'),
              stones: parseInt(currentDeduction.stones) || 0,
              order_id: orderId || '',
              deduction_type: deductionType
            });
            console.log('Successfully deducted from inventory');
          } catch (inventoryError) {
            console.error('Error deducting from inventory:', inventoryError);
            throw new Error(`Failed to deduct from inventory: ${inventoryError.message}`);
          }
        }
        
        // Create the deduction AFTER inventory deduction (so history gets correct total weight)
        savedDeduction = await diamondDeductionsService.create(deductionData, orderNumber);
        console.log('Saved deduction returned from service:', savedDeduction);
        
        // Fetch profile data for the newly created deduction
        let deductionWithProfile = savedDeduction;
        if (savedDeduction.created_by) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', savedDeduction.created_by)
              .single();
            
            deductionWithProfile = {
              ...savedDeduction,
              profile: profileData || { first_name: 'Unknown', last_name: 'Employee' }
            } as DiamondDeductionWithProfile;
          } catch (profileError) {
            console.warn('Could not fetch profile for new deduction:', profileError);
            deductionWithProfile = {
              ...savedDeduction,
              profile: { first_name: 'Unknown', last_name: 'Employee' }
            } as DiamondDeductionWithProfile;
          }
        } else {
          deductionWithProfile = {
            ...savedDeduction,
            profile: { first_name: 'Unknown', last_name: 'Employee' }
          } as DiamondDeductionWithProfile;
        }
        
        // Add to local state for immediate display
        setDeductions(prev => {
          const newDeductions = [deductionWithProfile, ...prev];
          console.log('Updated deductions state:', newDeductions);
          return newDeductions;
        });
        
        toast({
          title: "Success",
          description: `${deductionType === 'center' ? 'Center' : 'Side'} deduction added successfully`,
        });
      }

      setShowDeductionDialog(false);
      setCurrentDeduction({
        order_id: '',
        type: 'center',
        product_sku: "",
        parcel_id: "",
        ct_weight: 0,
        stones: "",
        price_per_ct: 0,
        total_price: 0,
        mm: "",
        comments: ""
      });
    } catch (error) {
      console.error('Error saving deduction:', error);
      toast({
        title: "Error",
        description: "Failed to save deduction to database",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDeduction(false);
    }
  };

  const handleCancelDeduction = () => {
    setShowDeductionDialog(false);
    setCurrentDeduction({
      order_id: '',
      type: 'center',
      product_sku: "",
      parcel_id: "",
      ct_weight: 0,
      stones: "",
      price_per_ct: 0, // Will be fetched from inventory
      total_price: 0, // Will be calculated automatically
      mm: "",
      comments: ""
    });
    setParcelValidation({ exists: false, loading: false });
  };

  const addSideDeductionItem = () => {
    const newId = (sideDeductionItems.length + 1).toString();
    // Use orderId (UUID) for database operations, not order.order_id (string like "ORD-001019")
    const actualOrderId = orderId || '';
    console.log('🔍 Adding side deduction item:', {
      newId,
      actualOrderId,
      order: order,
      orderId: orderId,
      note: 'Using orderId (UUID) for database operations'
    });
    
    setSideDeductionItems(prev => [
      ...prev,
      {
        id: newId,
        order_id: actualOrderId,
        type: 'side',
        product_sku: "",
        parcel_id: "",
        ct_weight: 0,
        stones: "",
        price_per_ct: 0,
        total_price: 0,
        mm: "",
        comments: "",
        added_to_stock: false
      }
    ]);
  };

  const updateSideDeductionItem = (id: string, field: keyof DiamondDeduction, value: string) => {
    setSideDeductionItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          // For numeric fields, store as string during typing, convert to number on blur
          if (field === 'ct_weight' || field === 'price_per_ct' || field === 'total_price') {
            return { ...item, [field]: value };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const removeSideDeductionItem = (id: string) => {
    if (sideDeductionItems.length > 1) {
      setSideDeductionItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmitSideDeductions = async () => {
    if (isSubmittingDeduction) {
      return; // Prevent multiple submissions
    }

    try {
      setIsSubmittingDeduction(true);
      // Validate required fields for each side deduction item
      for (const item of sideDeductionItems) {
        const ctWeight = parseFloat(item.ct_weight?.toString() || '0');
        if (!item.order_id || !item.parcel_id || !ctWeight) {
          toast({
            title: "Error",
            description: "Please fill in all required fields (Order ID, Parcel ID, CT Weight) for all side deductions",
            variant: "destructive",
          });
          return;
        }
      }

      // Process each side deduction item with price calculation
      const processedSideDeductions = await Promise.all(
        sideDeductionItems.map(async (item) => {
          let pricePerCt = 0;
          let totalPrice = 0;

          // Fetch price per ct from diamond inventory for side deductions
          if (item.parcel_id) {
            try {
              console.log('Fetching price for Side Deduction Parcel ID:', item.parcel_id);
              const { data: inventoryData, error: inventoryError } = await supabase
                .from('diamond_inventory' as any)
                .select('price_per_ct')
                .eq('parcel_id', item.parcel_id)
                .single();
              
              console.log('Side deduction inventory query result:', { inventoryData, inventoryError });
              
              if (!inventoryError && inventoryData) {
                pricePerCt = (inventoryData as any).price_per_ct;
                const ctWeight = parseFloat(item.ct_weight?.toString() || '0');
                totalPrice = ctWeight * pricePerCt;
                console.log('Side deduction price fetched:', { pricePerCt, totalPrice });
              } else {
                console.warn('Could not fetch price from inventory for side deduction, using default values');
                pricePerCt = 0;
                totalPrice = 0;
              }
            } catch (error) {
              console.error('Error fetching price from inventory for side deduction:', error);
              pricePerCt = 0;
              totalPrice = 0;
            }
          }

          // Validate required fields
          if (!item.order_id) {
            throw new Error('Order ID is required for side deductions');
          }
          if (!item.parcel_id) {
            throw new Error('Parcel ID is required for side deductions');
          }
          if (!item.ct_weight || item.ct_weight <= 0) {
            throw new Error('Valid CT weight is required for side deductions');
          }

          // Create deduction data for database
          const deductionData: CreateDiamondDeductionData = {
            order_id: item.order_id,
            type: 'side',
            product_sku: item.product_sku || undefined,
            parcel_id: item.parcel_id,
            ct_weight: parseFloat(item.ct_weight?.toString() || '0'),
            stones: item.stones || undefined,
            price_per_ct: pricePerCt,
            total_price: totalPrice,
            mm: undefined, // MM not needed for side deductions
            comments: item.comments,
            include_in_item_cost: true,
            added_to_stock: false,
            deduction_type: 'side'
          };

          console.log('🔍 Side deduction data being created:', deductionData);

          // Deduct from inventory FIRST for side deductions
          if (item.parcel_id && item.ct_weight && item.stones) {
            try {
              await diamondInventoryService.deductInventory({
                parcel_id: item.parcel_id,
                ct_weight: item.ct_weight,
                stones: parseInt(item.stones) || 0,
                order_id: item.order_id,
                deduction_type: 'side'
              });
              console.log('Successfully deducted from inventory for side deduction');
            } catch (inventoryError) {
              console.error('Error deducting from inventory for side deduction:', inventoryError);
              throw new Error(`Failed to deduct from inventory: ${inventoryError.message}`);
            }
          }
          
          // Create the deduction AFTER inventory deduction (so history gets correct total weight)
          console.log('Creating side deduction with data:', deductionData);
          const savedDeduction = await diamondDeductionsService.create(deductionData, order?.order_id);
          console.log('Saved side deduction returned from service:', savedDeduction);
          
          return savedDeduction;
        })
      );
      
      // Fetch profile data for all newly created side deductions
      const sideDeductionsWithProfiles = await Promise.all(
        processedSideDeductions.map(async (deduction) => {
          if (deduction.created_by) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', deduction.created_by)
                .single();
              
              return {
                ...deduction,
                profile: profileData || { first_name: 'Unknown', last_name: 'Employee' }
              } as DiamondDeductionWithProfile;
            } catch (profileError) {
              console.warn('Could not fetch profile for side deduction:', profileError);
              return {
                ...deduction,
                profile: { first_name: 'Unknown', last_name: 'Employee' }
              } as DiamondDeductionWithProfile;
            }
          }
          return {
            ...deduction,
            profile: { first_name: 'Unknown', last_name: 'Employee' }
          } as DiamondDeductionWithProfile;
        })
      );
      
      // Add to local state for immediate display
      setDeductions(prev => [...sideDeductionsWithProfiles, ...prev]);
      
      toast({
        title: "Success",
        description: `${sideDeductionItems.length} side deductions added successfully`,
      });

      setShowSideDeductionDialog(false);
    } catch (error) {
      console.error('Error saving side deductions:', error);
      toast({
        title: "Error",
        description: "Failed to save side deductions",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDeduction(false);
    }
  };

  const handleCancelSideDeduction = () => {
    setShowSideDeductionDialog(false);
  };

  const handleManualAdd = () => {
    setManualDeduction({
      order_id: '', // Manual deductions don't belong to any order
      type: 'center', // Default to center, user can change to side
      product_sku: "",
      parcel_id: "", // Manual deductions don't have parcel IDs
      ct_weight: 0,
      stones: "",
      price_per_ct: 0,
      total_price: 0,
      mm: "",
      comments: ""
    });
    setShowManualAddDialog(true);
  };

  const handleSubmitManualDeduction = async () => {
    // Validate required fields for manual deduction
    const ctWeight = parseFloat(manualDeduction.ct_weight?.toString() || '0');
    if (!ctWeight || !manualDeduction.product_sku) {
      toast({
        title: "Error",
        description: "Please fill in the required fields (CT Weight, SKU)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate total price for manual deduction
      const pricePerCt = parseFloat(manualDeduction.price_per_ct?.toString() || '0');
      const totalPrice = ctWeight * pricePerCt;

      // For manual deductions, we need to associate them with the current order
      // since the database requires a valid order_id
      if (!orderId) {
        toast({
          title: "Error",
          description: "Manual deductions must be created from within an order context",
          variant: "destructive",
        });
        return;
      }

      // Create deduction data for database
      const deductionData: CreateDiamondDeductionData = {
        order_id: orderId, // Use current order ID for manual deductions
        type: manualDeduction.type || 'center', // Use the selected reduce type (center or side)
        product_sku: manualDeduction.product_sku || undefined,
        parcel_id: '', // Manual deductions don't have parcel IDs
        ct_weight: ctWeight,
        stones: manualDeduction.stones || undefined,
        price_per_ct: pricePerCt,
        total_price: totalPrice,
        mm: manualDeduction.mm || undefined,
        comments: manualDeduction.comments,
        include_in_item_cost: true,
        added_to_stock: false,
        deduction_type: manualDeduction.type || 'center'
      };

      console.log('Creating manual deduction with data:', deductionData);
      const savedDeduction = await diamondDeductionsService.create(deductionData);
      console.log('Saved manual deduction returned from service:', savedDeduction);
      
      // Fetch profile data for the newly created manual deduction
      let manualDeductionWithProfile = savedDeduction;
      if (savedDeduction.created_by) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', savedDeduction.created_by)
            .single();
          
          manualDeductionWithProfile = {
            ...savedDeduction,
            profile: profileData || { first_name: 'Unknown', last_name: 'Employee' }
          } as DiamondDeductionWithProfile;
        } catch (profileError) {
          console.warn('Could not fetch profile for manual deduction:', profileError);
          manualDeductionWithProfile = {
            ...savedDeduction,
            profile: { first_name: 'Unknown', last_name: 'Employee' }
          } as DiamondDeductionWithProfile;
        }
      } else {
        manualDeductionWithProfile = {
          ...savedDeduction,
          profile: { first_name: 'Unknown', last_name: 'Employee' }
        } as DiamondDeductionWithProfile;
      }
      
      // Add to local state for immediate display
      setDeductions(prev => [manualDeductionWithProfile, ...prev]);
      
      toast({
        title: "Success",
        description: "Manual deduction added successfully",
      });

      setShowManualAddDialog(false);
    } catch (error) {
      console.error('Error saving manual deduction:', error);
      toast({
        title: "Error",
        description: "Failed to save manual deduction",
        variant: "destructive",
      });
    }
  };

  const handleCancelManualAdd = () => {
    setShowManualAddDialog(false);
  };

  const handleDeleteDeduction = (deduction: DiamondDeductionWithProfile) => {
    setDiamondToDelete(deduction);
  };

  const handleBatchDelete = async (deductionIds: string[]) => {
    if (deductionIds.length === 0 || isBatchDeleting) return;

    setIsBatchDeleting(true);
    try {
      // Delete all selected deductions
      await Promise.all(
        deductionIds.map(id => diamondDeductionsService.delete(id))
      );

      toast({
        title: "Success",
        description: `${deductionIds.length} deduction${deductionIds.length > 1 ? 's' : ''} deleted successfully`,
      });

      // Clear selection and reload deductions
      setSelectedDeductions([]);
      await loadDeductions();
    } catch (error) {
      console.error('Error deleting deductions:', error);
      toast({
        title: "Error",
        description: "Failed to delete some deductions",
        variant: "destructive",
      });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleEditDeduction = (deduction: DiamondDeductionWithProfile) => {
    setDiamondToEdit(deduction);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async (id: string, ctWeight: number, stones: string) => {
    if (!diamondToEdit || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      // Calculate new total price if price_per_ct exists
      const newTotalPrice = ctWeight * (diamondToEdit.price_per_ct || 0);

      // Update the deduction in the database
      const updatedDeduction = await diamondDeductionsService.update(id, {
        ct_weight: ctWeight,
        stones: stones,
        total_price: newTotalPrice
      }, orderNumber);

      // Update local state
      setDeductions(prev => 
        prev.map(d => d.id === id ? { ...d, ct_weight: ctWeight, stones: stones, total_price: newTotalPrice } : d)
      );

      toast({
        title: "Success",
        description: "Deduction updated successfully",
      });

      setShowEditDialog(false);
      setDiamondToEdit(null);
    } catch (error) {
      console.error('Error updating deduction:', error);
      toast({
        title: "Error",
        description: "Failed to update deduction",
        variant: "destructive",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setDiamondToEdit(null);
  };

  const handleAddToStock = (deduction: DiamondDeductionWithProfile) => {
    setDiamondToAddToStock(deduction);
    setShowAddToStockDialog(true);
  };

  const handleConfirmAddToStock = async (deduction: DiamondDeduction) => {
    if (isAddingToStock) return; // Prevent multiple submissions
    
    setIsAddingToStock(true);
    try {
      console.log('Adding to stock:', {
        orderId,
        parcelId: deduction.parcel_id,
        stones: deduction.stones,
        caratWeight: deduction.ct_weight
      });

      // Restore inventory if this deduction has parcel_id and quantities
      if (deduction.parcel_id && deduction.ct_weight && deduction.stones) {
        try {
          await diamondInventoryService.restoreInventory({
            parcel_id: deduction.parcel_id,
            ct_weight: deduction.ct_weight,
            stones: parseInt(deduction.stones) || 0,
            order_id: orderId || ''
          });
          console.log('Successfully restored to inventory');
        } catch (inventoryError) {
          console.error('Error restoring to inventory:', inventoryError);
          throw new Error(`Failed to restore to inventory: ${inventoryError.message}`);
        }
      }

      // Update the deduction to mark it as added to stock (this will log to history)
      const updatedDeduction = await diamondDeductionsService.markAsAddedToStock(deduction.id!, orderNumber);

      // Update local state
      setDeductions(prev => 
        prev.map(d => d.id === deduction.id ? { ...d, added_to_stock: true } : d)
      );

      toast({
        title: "Success",
        description: `Added to stock: ${deduction.ct_weight}ct, ${deduction.stones} stones`,
      });

      setShowAddToStockDialog(false);
      setDiamondToAddToStock(null);
    } catch (error) {
      console.error('Error adding to stock:', error);
      toast({
        title: "Error",
        description: "Failed to add to stock",
        variant: "destructive",
      });
    } finally {
      setIsAddingToStock(false);
    }
  };

  const handleCancelAddToStock = () => {
    setShowAddToStockDialog(false);
    setDiamondToAddToStock(null);
  };

  const handleToggleIncludeInCost = async (deduction: DiamondDeductionWithProfile) => {
    if (!deduction.id || isTogglingIncludeInCost) return;

    setIsTogglingIncludeInCost(true);
    try {
      // Update the deduction in the database (this will log to history)
      const updatedDeduction = await diamondDeductionsService.toggleIncludeInCost(
        deduction.id, 
        deduction.include_in_item_cost || false,
        orderNumber
      );

      // Update local state
      setDeductions(prev => 
        prev.map(d => d.id === deduction.id ? { ...d, include_in_item_cost: updatedDeduction.include_in_item_cost } : d)
      );

      toast({
        title: "Success",
        description: `Include in item cost updated to ${deduction.include_in_item_cost ? 'Yes' : 'No'}`,
      });
    } catch (error) {
      console.error('Error updating include in item cost:', error);
      toast({
        title: "Error",
        description: "Failed to update include in item cost",
        variant: "destructive",
      });
    } finally {
      setIsTogglingIncludeInCost(false);
    }
  };

  const confirmDeleteDeduction = async () => {
    if (!diamondToDelete?.id || isDeletingDeduction) return;
    
    setIsDeletingDeduction(true);
    try {
      await diamondDeductionsService.delete(diamondToDelete.id, orderNumber);
      setDeductions(prev => prev.filter(d => d.id !== diamondToDelete.id));
      setDiamondToDelete(null);
      toast({
        title: "Success",
        description: "Deduction deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast({
        title: "Error",
        description: "Failed to delete deduction",
        variant: "destructive",
      });
    } finally {
      setIsDeletingDeduction(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diamonds</h1>
          <p className="text-muted-foreground">Diamond inventory and specifications</p>
        </div>
      </div>

      {/* Star Animation with Customization Notes */}
      {order?.customization_notes ? (
        <StarAnimation text={order.customization_notes} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No customization notes available</p>
        </div>
      )}

      {/* Diamond Deduction Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5" />
            Diamond Deduction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DiamondActionButtons
              onCenterDeduction={handleCenterDeduction}
              onSideDeduction={handleSideDeduction}
              onManualAdd={handleManualAdd}
            />

                        {/* Deductions Table */}
            <DiamondDeductionsTable
              deductions={deductions}
              onEdit={handleEditDeduction}
              onDelete={handleDeleteDeduction}
              onBatchDelete={handleBatchDelete}
              onAddToStock={handleAddToStock}
              onToggleIncludeInCost={handleToggleIncludeInCost}
              isTogglingIncludeInCost={isTogglingIncludeInCost}
              isDeleting={isDeletingDeduction}
              isBatchDeleting={isBatchDeleting}
              selectedItems={selectedDeductions}
              onSelectionChange={setSelectedDeductions}
            />

            {/* Summary Section */}
            {deductions.length > 0 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Diamond Deduction Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {deductions
                        .filter(deduction => !deduction.added_to_stock && deduction.include_in_item_cost === true)
                        .reduce((total, deduction) => total + (deduction.ct_weight || 0), 0)
                        .toFixed(2)}
                  </div>
                    <div className="text-sm text-muted-foreground">Total CT Weight</div>
                    </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {deductions
                        .filter(deduction => !deduction.added_to_stock && deduction.include_in_item_cost === true)
                        .reduce((total, deduction) => total + (parseInt(deduction.stones || '0') || 0), 0)}
                      </div>
                    <div className="text-sm text-muted-foreground">Total Stones</div>
                      </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(deductions
                        .filter(deduction => !deduction.added_to_stock && deduction.include_in_item_cost === true)
                        .reduce((total, deduction) => total + (deduction.total_price || 0), 0)
                        .toString())}
                      </div>
                    <div className="text-sm text-muted-foreground">Total Price</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Center Deduction Dialog */}
      <CenterDeductionDialog
        open={showDeductionDialog}
        onOpenChange={setShowDeductionDialog}
        currentDeduction={currentDeduction}
        setCurrentDeduction={setCurrentDeduction}
        skuOptions={skuOptions}
        parcelValidation={parcelValidation}
        onSave={handleSaveDeduction}
        onCancel={handleCancelDeduction}
        orderId={orderId}
        isSubmitting={isSubmittingDeduction}
      />

      {/* Side Deduction Dialog */}
      <SideDeductionDialog
        open={showSideDeductionDialog}
        onOpenChange={setShowSideDeductionDialog}
        sideDeductionItems={sideDeductionItems}
        skuOptions={skuOptions}
        onAddItem={addSideDeductionItem}
        onUpdateItem={updateSideDeductionItem}
        onRemoveItem={removeSideDeductionItem}
        onSubmit={handleSubmitSideDeductions}
        onCancel={handleCancelSideDeduction}
        orderId={orderId}
        orderData={order}
        isSubmitting={isSubmittingDeduction}
      />

      {/* Manual Add Dialog */}
      <ManualDeductionDialog
        open={showManualAddDialog}
        onOpenChange={setShowManualAddDialog}
        manualDeduction={manualDeduction}
        setManualDeduction={setManualDeduction}
        skuOptions={skuOptions}
        onSubmit={handleSubmitManualDeduction}
        onCancel={handleCancelManualAdd}
        orderId={orderId}
      />

      {/* Edit Deduction Dialog */}
      <EditDeductionDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        deduction={diamondToEdit}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        isLoading={isSavingEdit}
      />

      {/* Add to Stock Dialog */}
      <AddToStockDialog
        open={showAddToStockDialog}
        onOpenChange={setShowAddToStockDialog}
        deduction={diamondToAddToStock}
        orderId={orderId || ''}
        onConfirm={handleConfirmAddToStock}
        onCancel={handleCancelAddToStock}
        isLoading={isAddingToStock}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDeductionDialog
        deduction={diamondToDelete}
        onConfirm={confirmDeleteDeduction}
        onCancel={() => setDiamondToDelete(null)}
      />
    </div>
  );
}
