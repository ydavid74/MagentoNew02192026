import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Search,
  Image as ImageIcon,
  FileDown,
  Printer,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { METAL_TYPES } from "@/constants/metalTypes";
import {
  appraisalService,
  Appraisal,
  CreateAppraisalData,
} from "@/services/appraisals";
import { showPDFPreview } from "@/utils/pdfGenerator";
import {
  useOrderDetailQuery,
  useOrderDocumentsQuery,
} from "@/hooks/useOrderDetail";
import { useDocuments } from "@/hooks/useDocuments";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  showInvoicePreview,
  saveInvoiceToDatabase,
  showSavedInvoicePreview,
} from "@/utils/invoicePreview";
import { ShopifyAPI } from "@/api/shopify";
import { transformShopifyOrderForInvoice } from "@/utils/shopifyOrderTransform";
import { invoiceService, InvoiceData } from "@/services/invoices";

// Extended invoice type to handle both generated and uploaded invoices
type ExtendedInvoiceData = InvoiceData & { 
  is_uploaded?: boolean; 
  file_url?: string; 
  size?: number; 
  filename?: string; 
};

const preciousMetalTemplates = {
  Silver: "Affordable sterling silver setting with beautiful diamond sparkle",
  "14KT White":
    "Classic 14KT white gold setting with brilliant diamond accents",
  "14KT Rose": "Modern 14KT rose gold setting with romantic diamond details",
  "14KT Yellow":
    "Traditional 14KT yellow gold setting with warm diamond highlights",
  "18KT White":
    "Premium 18KT white gold setting with exceptional diamond sparkle",
  "18KT Rose":
    "Elegant 18KT rose gold setting with sophisticated diamond accents",
  "18KT Yellow": "Luxury 18KT yellow gold setting with rich diamond brilliance",
  Platinum:
    "Ultimate platinum setting with maximum diamond brilliance and durability",
};

const jewelryTypes = [
  // Rings
  "Engagement Ring",
  "Three Stone Ring",
  "Solitaire Ring",
  "Bridal Set",
  "Wedding Ring",
  "Wedding Ring Set",
  "Men's Wedding Ring",
  "Eternity Ring",
  "Plain Wedding Band",
  // Bracelets
  "Tennis Bracelet",
  "Diamond Bracelet",
  // Pendants
  "Diamond Pendant",
  "Solitaire Pendant",
  // Earrings
  "Stud Earrings",
  "Hoop and Drop Earrings",
  "Diamond Earrings",
  // Loose Stones
  "Loose Diamond",
];

const jewelryTypeTemplates = {
  "Engagement Ring":
    "14KT WHITE GOLD DIAMOND ENGAGEMENT RING. CENTER STONE IS WEIGHING CT J IN COLOR AND VS2 IN CLARITY. SIDE DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Three Stone Ring":
    "14KT WHITE GOLD DIAMOND THREE STONE RING. CENTER STONE IS WEIGHING CT J IN COLOR AND VS2 IN CLARITY. SIDE DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Solitaire Ring":
    "14KT WHITE GOLD DIAMOND SOLITAIRE RING. DIAMOND IS WEIGHING CT J IN COLOR AND VS2 IN CLARITY.",
  "Bridal Set":
    "14KT WHITE GOLD DIAMOND BRIDAL SET. ENGAGEMENT RING CENTER STONE IS WEIGHING CT J IN COLOR AND VS2 IN CLARITY. ENGAGEMENT RING SIDE DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY. WEDDING RING DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Wedding Ring":
    "14KT WHITE GOLD DIAMOND WEDDING RING. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Wedding Ring Set":
    "14KT WHITE GOLD DIAMOND WEDDING RING SET. MENS RING DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY. WOMENS RING DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Men's Wedding Ring":
    "14KT WHITE GOLD DIAMOND MENS WEDDING RING. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Eternity Ring":
    "14KT WHITE GOLD DIAMOND ETERNITY RING. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Tennis Bracelet":
    "14KT WHITE GOLD DIAMOND TENNIS BRACELET. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Diamond Bracelet":
    "14KT WHITE GOLD DIAMOND BRACELET. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Diamond Pendant":
    "14KT WHITE GOLD DIAMOND PENDANT. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Solitaire Pendant":
    "14KT WHITE GOLD DIAMOND SOLITAIRE PENDANT. DIAMOND IS WEIGHING CT J IN COLOR AND VS2 IN CLARITY.",
  "Stud Earrings":
    "14KT WHITE GOLD DIAMOND STUD EARRINGS. SIDE DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Hoop and Drop Earrings":
    "14KT WHITE GOLD DIAMOND HOOP EARRINGS.DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Diamond Earrings":
    "14KT WHITE GOLD DIAMOND EARRINGS. DIAMONDS ARE WEIGHING CT TOTAL I-J IN COLOR AND VS2-SI1 IN CLARITY.",
  "Loose Diamond":
    "ROUND CUT LOOSE DIAMOND WEIGHING CT J IN COLOR AND VS2 IN CLARITY.",
  "Plain Wedding Band": "14KT WHITE GOLD PLAIN WEDDING BAND.",
};

export function ShippingListTab() {
  const { id: orderId } = useParams();
  const { data: order } = useOrderDetailQuery(orderId!);
  const { toast } = useToast();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const queryClient = useQueryClient();
  const { data: orderDocuments } = useOrderDocumentsQuery(orderId!);
  const { uploadDocument, getSignedUrl, uploading } = useDocuments();
  const [showGenerateLabelDialog, setShowGenerateLabelDialog] = useState(false);
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);
  const [invoices, setInvoices] = useState<ExtendedInvoiceData[]>([]);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const labelInputRef =
    typeof window !== "undefined"
      ? (document.createElement("input") as HTMLInputElement)
      : (undefined as any);

  // Appraisal states
  const [showAppraisalDialog, setShowAppraisalDialog] = useState(false);
  const [isAutoGenerate, setIsAutoGenerate] = useState(false);
  const [currentAppraisal, setCurrentAppraisal] = useState<Partial<Appraisal>>({
    stock_number: "",
    type: "",
    diamond_type: "",
    shape: "",
    measurement: "",
    color: "",
    clarity: "",
    polish_symmetry: "",
    precious_metal: "",
    description: "",
    image_url: "",
    diamond_weight: "",
    replacement_value: "",
  });
  const [searchStockNumber, setSearchStockNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appraisalToDelete, setAppraisalToDelete] = useState<string | null>(
    null
  );
  const [skuSearchPerformed, setSkuSearchPerformed] = useState(false);
  const [skuValid, setSkuValid] = useState(false);
  const [foundAppraisalImage, setFoundAppraisalImage] = useState<string | null>(
    null
  );
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Reset SKU search state
  const resetSkuSearchState = () => {
    setSkuSearchPerformed(false);
    setSkuValid(false);
    setFoundAppraisalImage(null);
    setShowImageUpload(false);
  };

  // Load existing appraisals when component mounts
  useEffect(() => {
    if (orderId) {
      loadAppraisals();
      loadInvoices();
    }
  }, [orderId]);

  // Reset SKU search state when stock number changes
  useEffect(() => {
    if (currentAppraisal.stock_number !== searchStockNumber) {
      resetSkuSearchState();
    }
  }, [currentAppraisal.stock_number, searchStockNumber]);

  const loadAppraisals = async () => {
    if (!orderId) return;

    try {
      console.log("🔄 Loading appraisals for order:", orderId);
      const appraisals = await appraisalService.getAppraisalsByOrderId(orderId);
      setAppraisals(appraisals);
      console.log("✅ Appraisals loaded:", appraisals);
    } catch (error) {
      console.error("❌ Error loading appraisals:", error);
      toast({
        title: "Error",
        description: "Failed to load appraisals",
        variant: "destructive",
      });
    }
  };

  const searchAppraisal = async (stockNumber: string) => {
    if (!stockNumber.trim() || !order) return;

    setIsSearching(true);
    setSkuSearchPerformed(true);
    try {
      console.log("🔍 Searching for order item with SKU:", stockNumber);

      // Search for order item within the current order by SKU
      const orderItem = order.order_items?.find(
        (item) => item.sku?.toLowerCase() === stockNumber.toLowerCase()
      );

      if (orderItem) {
        console.log("✅ Found order item:", orderItem);

        // Set SKU as valid and store the found image
        setSkuValid(true);
        setFoundAppraisalImage(orderItem.image || null);

        // Start with empty form but with the found image
        setCurrentAppraisal({
          order_id: orderId!,
          stock_number: stockNumber.trim(),
          type: "",
          shape: "",
          measurement: "",
          color: "",
          clarity: "",
          polish_symmetry: "",
          precious_metal: "",
          description: "",
          image_url: orderItem.image || "",
          diamond_weight: "",
          replacement_value: "",
        });

        toast({
          title: "Order Item Found",
          description:
            "Found matching order item with image. You can now fill in the appraisal details.",
        });
      } else {
        console.log("❌ No order item found with this SKU");

        // Set SKU as invalid and clear found image
        setSkuValid(false);
        setFoundAppraisalImage(null);

        // No order item found, start with empty form
        setCurrentAppraisal({
          order_id: orderId!,
          stock_number: stockNumber.trim(),
          type: "",
          shape: "",
          measurement: "",
          color: "",
          clarity: "",
          polish_symmetry: "",
          precious_metal: "",
          description: "",
          image_url: "",
          diamond_weight: "",
          replacement_value: "",
        });

        toast({
          title: "No Order Item Found",
          description:
            "No order item found with this SKU. Please check the SKU and try again, or upload an image manually.",
        });
      }
    } catch (error) {
      console.error("Error searching order item:", error);
      setSkuValid(false);
      setFoundAppraisalImage(null);
      toast({
        title: "Search Error",
        description: "Failed to search for appraisal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreciousMetalChange = (value: string) => {
    setCurrentAppraisal((prev) => ({
      ...prev,
      precious_metal: value,
    }));
  };

  const handleJewelryTypeChange = (value: string) => {
    setCurrentAppraisal((prev) => ({
      ...prev,
      type: value,
      description:
        jewelryTypeTemplates[value as keyof typeof jewelryTypeTemplates] || "",
    }));
  };

  const saveAppraisal = async () => {
    if (!orderId || !currentAppraisal.stock_number?.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the stock number",
        variant: "destructive",
      });
      return;
    }

    if (isSaving) {
      return; // Prevent duplicate clicks
    }

    setIsSaving(true);
    try {
      if (currentAppraisal.id && !isAutoGenerate) {
        // Update existing appraisal (only when not in auto-generate mode)
        console.log("🔄 Updating existing appraisal:", currentAppraisal.id);

        const updatedAppraisal = await appraisalService.updateAppraisal(
          currentAppraisal.id,
          {
            order_id: orderId,
            stock_number: currentAppraisal.stock_number,
            type: currentAppraisal.type,
            diamond_type: currentAppraisal.diamond_type,
            shape: currentAppraisal.shape,
            measurement: currentAppraisal.measurement,
            color: currentAppraisal.color,
            clarity: currentAppraisal.clarity,
            polish_symmetry: currentAppraisal.polish_symmetry,
            precious_metal: currentAppraisal.precious_metal,
            description: currentAppraisal.description,
            image_url: currentAppraisal.image_url,
            diamond_weight: currentAppraisal.diamond_weight,
            replacement_value: currentAppraisal.replacement_value,
          }
        );

        // Update local state
        setAppraisals((prev) =>
          prev.map((appraisal) =>
            appraisal.id === currentAppraisal.id ? updatedAppraisal : appraisal
          )
        );

        toast({
          title: "Success",
          description: "Appraisal updated successfully",
        });
      } else {
        // Create new appraisal
        console.log("➕ Creating new appraisal");

        // Clear the ID to ensure we create a new appraisal
        const appraisalData = {
          order_id: orderId,
          stock_number: currentAppraisal.stock_number,
          type: currentAppraisal.type,
          diamond_type: currentAppraisal.diamond_type,
          shape: currentAppraisal.shape,
          measurement: currentAppraisal.measurement,
          color: currentAppraisal.color,
          clarity: currentAppraisal.clarity,
          polish_symmetry: currentAppraisal.polish_symmetry,
          precious_metal: currentAppraisal.precious_metal,
          description: currentAppraisal.description,
          image_url: currentAppraisal.image_url,
          diamond_weight: currentAppraisal.diamond_weight,
          replacement_value: currentAppraisal.replacement_value,
        };

        const newAppraisal = await appraisalService.createAppraisal(
          appraisalData
        );

        // Add to local state
        setAppraisals((prev) => [newAppraisal, ...prev]);

        toast({
          title: "Success",
          description:
            isAutoGenerate && currentAppraisal.id
              ? "New appraisal created successfully"
              : "Appraisal created successfully",
        });
      }

      setShowAppraisalDialog(false);
      setCurrentAppraisal({
        stock_number: "",
        type: "",
        diamond_type: "",
        shape: "",
        measurement: "",
        color: "",
        clarity: "",
        polish_symmetry: "",
        precious_metal: "",
        description: "",
        image_url: "",
        diamond_weight: "",
        replacement_value: "",
      });
    } catch (error) {
      console.error("Error saving appraisal:", error);
      toast({
        title: "Error",
        description: "Failed to save appraisal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const printAppraisal = (pdfUrl: string) => {
    try {
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        toast({
          title: "Print failed",
          description: "Could not open appraisal for printing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Print failed",
        description: "Failed to open appraisal for printing",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = (appraisal: Appraisal) => {
    try {
      showPDFPreview(appraisal, order);

      toast({
        title: "PDF Preview",
        description: `Jewelry Report preview is now displayed. Click "Download PDF" to save the file.`,
      });
    } catch (error) {
      console.error("Error showing PDF preview:", error);
      toast({
        title: "Error",
        description: "Failed to show PDF preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppraisal = (appraisalId: string) => {
    setAppraisalToDelete(appraisalId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAppraisal = async () => {
    if (!appraisalToDelete) return;

    try {
      await appraisalService.deleteAppraisal(appraisalToDelete);
      toast({
        title: "Success",
        description: "Appraisal deleted successfully",
      });
      // Reload appraisals to update the list
      await loadAppraisals();
    } catch (error) {
      console.error("Error deleting appraisal:", error);
      toast({
        title: "Error",
        description: "Failed to delete appraisal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setAppraisalToDelete(null);
    }
  };

  // Invoice functions
  const loadInvoices = async () => {
    if (!orderId) return;

    try {
      setLoadingInvoices(true);
      
      // Load both generated invoices and manually uploaded invoices
      const [generatedInvoices, uploadedInvoices] = await Promise.all([
        invoiceService.getInvoicesByOrderId(orderId),
        // Get documents with type 'invoice' for this order
        supabase
          .from('documents')
          .select('*')
          .eq('order_id', orderId)
          .eq('type', 'invoice')
          .order('created_at', { ascending: false })
      ]);

      // Transform uploaded documents to match InvoiceData interface
      const transformedUploadedInvoices = uploadedInvoices.data?.map(doc => ({
        id: doc.id,
        order_id: doc.order_id,
        invoice_number: doc.filename || `Uploaded-${doc.id.substring(0, 8)}`,
        html_content: '', // Not applicable for uploaded files
        total_amount: null,
        status: 'uploaded',
        generated_at: doc.created_at,
        generated_by: doc.uploaded_by,
        notes: `Uploaded file: ${doc.filename}`,
        created_at: doc.created_at,
        updated_at: (doc as any).updated_at || null,
        // Add document-specific fields
        file_url: doc.file_url,
        size: doc.size,
        content_type: doc.content_type,
        is_uploaded: true
      })) || [];

      // Combine both types of invoices
      const allInvoices = [
        ...generatedInvoices.map(inv => ({ ...inv, is_uploaded: false })),
        ...transformedUploadedInvoices
      ].sort((a, b) => new Date(b.generated_at || b.created_at || 0).getTime() - new Date(a.generated_at || a.created_at || 0).getTime());

      setInvoices(allInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice history",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  };


  const handleGenerateInvoice = async () => {
    if (!order?.shopify_order_number) {
      toast({
        title: "Error",
        description: "No Shopify order number found. Cannot generate invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingInvoice(true);

      // Get the actual Shopify order ID from the order notes
      // The shopify_order_number is like "#120307" but we need the actual Shopify ID
      let shopifyOrderId = null;

      // Try to get Shopify order ID from order notes
      if (order.order_customer_notes) {
        const shopifyNote = order.order_customer_notes.find(
          (note) => note.content && note.content.includes("Shopify Order:")
        );
        if (shopifyNote) {
          // Extract ID from "Shopify Order: 6325975843000 (120307)"
          const match = shopifyNote.content.match(/Shopify Order: (\d+)/);
          if (match) {
            shopifyOrderId = match[1];
          }
        }
      }

      if (!shopifyOrderId) {
        throw new Error("Could not find Shopify order ID for this order");
      }

      console.log(`🔍 Using Shopify order ID: ${shopifyOrderId}`);

      // Fetch order data directly from Shopify
      const response = await ShopifyAPI.getOrder(shopifyOrderId);

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to fetch order from Shopify"
        );
      }

      console.log("🔄 Transforming Shopify order data...");

      // Transform Shopify order data for invoice
      let invoiceOrder;
      try {
        // Pass database order items for images
        invoiceOrder = transformShopifyOrderForInvoice(
          response.data,
          order.order_items
        );
        console.log("✅ Successfully transformed order data");
        console.log("📊 Transformed order data:", {
          id: invoiceOrder.id,
          shopify_order_number: invoiceOrder.shopify_order_number,
          items_count: invoiceOrder.items?.length || 0,
          total_amount: invoiceOrder.total_amount,
          discount_amount: invoiceOrder.discount_amount,
          shipping_cost: invoiceOrder.shipping_cost,
        });
        console.log(
          "🖼️ Items with images:",
          invoiceOrder.items?.map((item) => ({
            sku: item.sku,
            hasImage: !!item.image,
          }))
        );
      } catch (transformError) {
        console.error("❌ Error transforming order data:", transformError);
        throw new Error(
          `Failed to transform order data: ${
            transformError instanceof Error
              ? transformError.message
              : String(transformError)
          }`
        );
      }

      // Save invoice to database first
      console.log("💾 Saving invoice to database...");
      let invoiceId;
      try {
        // Use the database order ID, not the Shopify order ID
        const invoiceOrderWithDbId = {
          ...invoiceOrder,
          id: order.id, // This is the database UUID
          shopify_order_id: invoiceOrder.id, // This is the Shopify order ID
        };
        console.log("📝 Using database order ID:", order.id);
        console.log("📝 Shopify order ID:", invoiceOrder.id);

        invoiceId = await saveInvoiceToDatabase(invoiceOrderWithDbId);
        console.log("✅ Successfully saved invoice to database:", invoiceId);
      } catch (saveError) {
        console.error("❌ Error saving invoice to database:", saveError);
        throw new Error(
          `Failed to save invoice to database: ${
            saveError instanceof Error ? saveError.message : String(saveError)
          }`
        );
      }

      // Show preview
      showInvoicePreview(invoiceOrder);

      // Reload invoices to show the new one
      await loadInvoices();

      toast({
        title: "Success",
        description: "Invoice generated using live data from Shopify",
      });
    } catch (error) {
      console.error("❌ Error generating invoice from Shopify:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      toast({
        title: "Error",
        description: `Failed to generate invoice from Shopify: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleViewInvoice = async (invoice: ExtendedInvoiceData) => {
    try {
      if (invoice.is_uploaded) {
        // Handle uploaded invoice - get signed URL and open
        console.log("Viewing uploaded invoice:", {
          file_url: invoice.file_url,
          filename: invoice.filename,
          size: invoice.size
        });
        
        const signedUrl = await getSignedUrl(invoice.file_url!);
        console.log("Generated signed URL:", signedUrl);
        window.open(signedUrl, '_blank');
      } else {
        // Handle generated invoice - use existing preview logic
        console.log("Viewing generated invoice:", invoice.invoice_number);
        showSavedInvoicePreview(invoice);
      }
    } catch (error) {
      console.error("Error viewing invoice:", error);
      toast({
        title: "Error",
        description: "Failed to open invoice",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      // Find the invoice to determine if it's uploaded or generated
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (invoice?.is_uploaded) {
        // Delete uploaded document
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', invoiceId);
        
        if (error) throw error;
      } else {
        // Delete generated invoice
        await invoiceService.deleteInvoice(invoiceId);
      }
      
      // Reload invoices
      await loadInvoices();
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "generated":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shipping List</h1>
        <p className="text-muted-foreground">
          Manage appraisals, shipping documents, and more
        </p>
      </div>

      {/* Portion 1: Appraisal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Appraisal Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setIsAutoGenerate(true);
                  setCurrentAppraisal({
                    stock_number: "",
                    type: "",
                    shape: "",
                    measurement: "",
                    color: "",
                    clarity: "",
                    polish_symmetry: "",
                    precious_metal: "",
                    description: "",
                    image_url: "",
                    diamond_weight: "",
                    replacement_value: "",
                  });
                  setSearchStockNumber("");
                  resetSkuSearchState();
                  setShowAppraisalDialog(true);
                }}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Generate Automatically
              </Button>
              <Button
                onClick={() => {
                  setIsAutoGenerate(false);
                  setCurrentAppraisal({
                    stock_number: "",
                    type: "",
                    shape: "",
                    measurement: "",
                    color: "",
                    clarity: "",
                    polish_symmetry: "",
                    precious_metal: "",
                    description: "",
                    image_url: "",
                    diamond_weight: "",
                    replacement_value: "",
                  });
                  setSearchStockNumber("");
                  resetSkuSearchState();
                  setShowAppraisalDialog(true);
                }}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Manually
              </Button>
            </div>

            {/* Existing Appraisals */}
            {appraisals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Existing Appraisals</h4>
                <div className="grid gap-2">
                  {appraisals.map((appraisal) => (
                    <div
                      key={appraisal.id}
                      className="border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            Stock #{appraisal.stock_number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appraisal.type} • {appraisal.shape} •{" "}
                            {appraisal.diamond_weight}ct
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Created:{" "}
                              {appraisal.created_at
                                ? new Date(
                                    appraisal.created_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Unknown date"}
                            </span>
                          </div>
                          {appraisal.updated_at &&
                            appraisal.updated_at !== appraisal.created_at && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Updated:{" "}
                                  {new Date(
                                    appraisal.updated_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          {appraisal.pdf_url && (
                            <div className="text-xs text-green-600 mt-1">
                              Appraisal generated:{" "}
                              {new Date(
                                appraisal.pdf_generated_at || ""
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePDF(appraisal)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentAppraisal({
                                ...appraisal,
                                stock_number: appraisal.stock_number,
                                polish_symmetry: appraisal.polish_symmetry,
                                diamond_weight: appraisal.diamond_weight,
                                replacement_value: appraisal.replacement_value,
                              });
                              setIsAutoGenerate(false);
                              resetSkuSearchState();
                              setShowAppraisalDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppraisal(appraisal.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portion 2: Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Shipping
            {order?.delivery_method ? ` - ${order.delivery_method}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Labels actions */}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                onClick={async () => {
                  if (!orderId) return;
                  try {
                    setIsUploadingLabel(true);
                    const { supabase } = await import(
                      "@/integrations/supabase/client"
                    );
                    const { data, error } = await supabase.functions.invoke(
                      "create-shipping-label",
                      { body: { order_id: orderId } }
                    );
                    if (error) throw error;
                    toast({
                      title: "Label generated",
                      description: "Shipping label created and saved",
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["order-documents", orderId],
                    });
                  } catch (e: any) {
                    toast({
                      title: "Error",
                      description: e?.message || "Failed to generate label",
                      variant: "destructive",
                    });
                  } finally {
                    setIsUploadingLabel(false);
                  }
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isUploadingLabel ? "Generating…" : "Generate Label"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/pdf,image/*";
                  input.onchange = async () => {
                    if (!input.files || input.files.length === 0) return;
                    const file = input.files[0];
                    try {
                      setIsUploadingLabel(true);
                      await uploadDocument(file, orderId!, "label");
                      toast({
                        title: "Uploaded",
                        description: "Label uploaded successfully",
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["order-documents", orderId],
                      });
                    } catch (e) {
                      // handled in hook toast
                    } finally {
                      setIsUploadingLabel(false);
                    }
                  };
                  input.click();
                }}
                disabled={isUploadingLabel || uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploadingLabel || uploading ? "Uploading…" : "Upload Label"}
              </Button>
            </div>

            {/* Previous Labels list */}
            <div className="space-y-2">
              <h4 className="font-medium">Shipping Labels</h4>
              <div className="grid gap-2">
                {orderDocuments?.filter((d: any) => d.type === "label")
                  ?.length ? (
                  orderDocuments
                    .filter((d: any) => d.type === "label")
                    .map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50"
                      >
                        <div className="text-sm">
                          <div className="font-medium">
                            {doc.filename || "Label"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(doc.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const url = await getSignedUrl(doc.file_url);
                                const win = window.open(url, "_blank");
                                if (win) {
                                  win.focus();
                                }
                              } catch (e) {
                                // toast handled in hook if error
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No labels yet
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Where to Ship</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shipping Carrier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="usps">USPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                    <SelectItem value="2nd-day">2nd Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              {/* Kept for layout; actions moved above */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portion 3: Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={handleGenerateInvoice}
                disabled={isGeneratingInvoice || !order}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGeneratingInvoice
                  ? "Generating..."
                  : "Generate Automatically"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/pdf";
                  input.onchange = async () => {
                    if (!input.files || input.files.length === 0) return;
                    const file = input.files[0];
                    try {
                      await uploadDocument(
                        file as unknown as File,
                        orderId!,
                        "invoice"
                      );
                      toast({
                        title: "Uploaded",
                        description: "Invoice uploaded successfully",
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["order-documents", orderId],
                      });
                    } catch (e) {
                      /* toast handled in hook */
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Manually
              </Button>
            </div>

            {/* Invoice History */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Invoice History</h4>
              {loadingInvoices ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading invoices...
                  </p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No invoices generated yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-sm">
                            {invoice.invoice_number}
                          </h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.is_uploaded ? "Uploaded" : (invoice.status || "Generated")}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {invoice.generated_at || invoice.created_at
                                ? new Date(
                                    invoice.generated_at || invoice.created_at
                                  ).toLocaleDateString()
                                : "Unknown date"}
                            </span>
                          </div>

                          {invoice.total_amount && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${invoice.total_amount.toFixed(2)}</span>
                            </div>
                          )}

                          {(invoice.notes || invoice.is_uploaded) && (
                            <div className="col-span-2 md:col-span-1">
                              <span className="font-medium">
                                {invoice.is_uploaded ? "File: " : "Notes: "}
                              </span>
                              <span className="text-muted-foreground">
                                {invoice.is_uploaded 
                                  ? `${invoice.filename} (${Math.round(invoice.size / 1024)}KB)`
                                  : (invoice.notes && invoice.notes.length > 30
                                    ? `${invoice.notes.substring(0, 30)}...`
                                    : invoice.notes)
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisal Dialog */}
      <Dialog
        open={showAppraisalDialog}
        onOpenChange={(open) => !isSaving && setShowAppraisalDialog(open)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAutoGenerate
                ? "Generate Appraisal Automatically"
                : "Create Appraisal Manually"}
              {currentAppraisal.id && " (Edit Mode)"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stock Number Search */}
            {isAutoGenerate && (
              <div className="space-y-2">
                <Label>Stock Number</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter stock number to search..."
                    value={searchStockNumber}
                    onChange={(e) => setSearchStockNumber(e.target.value)}
                  />
                  <Button
                    onClick={() => searchAppraisal(searchStockNumber)}
                    disabled={!searchStockNumber.trim() || isSearching}
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Appraisal Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Number *</Label>
                <Input
                  placeholder="Enter stock number"
                  value={currentAppraisal.stock_number || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      stock_number: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Diamond Type</Label>
                <Select
                  value={currentAppraisal.diamond_type || ""}
                  onValueChange={(value) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      diamond_type: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select diamond type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Natural Diamonds">Natural Diamonds</SelectItem>
                    <SelectItem value="Lab Grown Diamonds">Lab Grown Diamonds</SelectItem>
                    <SelectItem value="See Specification">See Specification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shape</Label>
                <Input
                  placeholder="e.g., Round, Princess, Oval"
                  value={currentAppraisal.shape || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      shape: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Measurement</Label>
                <Input
                  placeholder="e.g., 6.5mm x 6.5mm"
                  value={currentAppraisal.measurement || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      measurement: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  placeholder="e.g., D, E, F, G, H"
                  value={currentAppraisal.color || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Clarity</Label>
                <Input
                  placeholder="e.g., VVS1, VVS2, VS1, VS2"
                  value={currentAppraisal.clarity || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      clarity: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Polish & Symmetry</Label>
                <Input
                  placeholder="e.g., Excellent, Very Good"
                  value={currentAppraisal.polish_symmetry || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      polish_symmetry: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Precious Metal</Label>
                <Select
                  value={currentAppraisal.precious_metal || ""}
                  onValueChange={handlePreciousMetalChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(preciousMetalTemplates).map((metal) => (
                      <SelectItem key={metal} value={metal}>
                        {metal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Diamond Weight (ct)</Label>
                <Input
                  placeholder="e.g., 1.25"
                  value={currentAppraisal.diamond_weight || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      diamond_weight: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Replacement Value ($)</Label>
                <Input
                  placeholder="e.g., 5000"
                  value={currentAppraisal.replacement_value || ""}
                  onChange={(e) =>
                    setCurrentAppraisal((prev) => ({
                      ...prev,
                      replacement_value: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Jewelry Type */}
            <div className="space-y-2">
              <Label>Jewelry Type</Label>
              <Select
                value={currentAppraisal.type}
                onValueChange={handleJewelryTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select jewelry type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {/* Rings */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Rings
                  </div>
                  <SelectItem
                    value="Engagement Ring"
                    className="text-sm pl-6"
                  >
                    Engagement Ring
                  </SelectItem>
                  <SelectItem
                    value="Three Stone Ring"
                    className="text-sm pl-6"
                  >
                    Three Stone Ring
                  </SelectItem>
                  <SelectItem value="Solitaire Ring" className="text-sm pl-6">
                    Solitaire Ring
                  </SelectItem>
                  <SelectItem value="Bridal Set" className="text-sm pl-6">
                    Bridal Set
                  </SelectItem>
                  <SelectItem value="Wedding Ring" className="text-sm pl-6">
                    Wedding Ring
                  </SelectItem>
                  <SelectItem
                    value="Wedding Ring Set"
                    className="text-sm pl-6"
                  >
                    Wedding Ring Set
                  </SelectItem>
                  <SelectItem
                    value="Men's Wedding Ring"
                    className="text-sm pl-6"
                  >
                    Men's Wedding Ring
                  </SelectItem>
                  <SelectItem value="Eternity Ring" className="text-sm pl-6">
                    Eternity Ring
                  </SelectItem>

                  {/* Bracelets */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Bracelets
                  </div>
                  <SelectItem
                    value="Tennis Bracelet"
                    className="text-sm pl-6"
                  >
                    Tennis Bracelet
                  </SelectItem>
                  <SelectItem value="Bracelet" className="text-sm pl-6">
                    Bracelet
                  </SelectItem>

                  {/* Pendants */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Pendants
                  </div>
                  <SelectItem value="Pendant" className="text-sm pl-6">
                    Pendant
                  </SelectItem>
                  <SelectItem
                    value="Solitaire Pendant"
                    className="text-sm pl-6"
                  >
                    Solitaire Pendant
                  </SelectItem>

                  {/* Earrings */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Earrings
                  </div>
                  <SelectItem
                    value="Stud Earrings"
                    className="text-sm pl-6"
                  >
                    Stud Earrings
                  </SelectItem>
                  <SelectItem
                    value="Hoop Earrings"
                    className="text-sm pl-6"
                  >
                    Hoop Earrings
                  </SelectItem>
                  <SelectItem value="Earrings" className="text-sm pl-6">
                    Earrings
                  </SelectItem>

                  {/* Loose Stones */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Loose Stones
                  </div>
                  <SelectItem value="Loose Diamond" className="text-sm pl-6">
                    Loose Diamond
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description will be auto-filled based on jewelry type selection"
                value={currentAppraisal.description || ""}
                onChange={(e) =>
                  setCurrentAppraisal((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Image Section */}
            <div className="space-y-2">
              <Label>Image</Label>

              {/* Show found image if SKU search was performed and SKU is valid */}
              {skuSearchPerformed &&
                skuValid &&
                foundAppraisalImage &&
                !showImageUpload && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Image found for SKU: {currentAppraisal.stock_number}
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img
                        src={foundAppraisalImage}
                        alt="Found appraisal image"
                        className="w-full h-32 object-contain rounded"
                        onError={(e) => {
                          console.log(
                            "Image failed to load, showing upload instead"
                          );
                          setSkuValid(false);
                          setFoundAppraisalImage(null);
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowImageUpload(true);
                          // Clear the current image URL so upload component starts fresh
                          setCurrentAppraisal((prev) => ({
                            ...prev,
                            image_url: "",
                          }));
                        }}
                      >
                        Replace Image
                      </Button>
                      <div className="text-xs text-gray-500 self-center">
                        This image was found from an existing appraisal.
                      </div>
                    </div>
                  </div>
                )}

              {/* Show upload component if SKU search was not performed, SKU is invalid, no image found, or user wants to replace */}
              {(!skuSearchPerformed ||
                !skuValid ||
                !foundAppraisalImage ||
                showImageUpload) && (
                <div className="space-y-2">
                  {skuSearchPerformed && !skuValid && (
                    <div className="text-sm text-orange-600 font-medium">
                      ⚠ No existing appraisal found for SKU:{" "}
                      {currentAppraisal.stock_number}
                    </div>
                  )}
                  {skuSearchPerformed &&
                    skuValid &&
                    foundAppraisalImage &&
                    showImageUpload && (
                      <div className="text-sm text-blue-600 font-medium">
                        📷 Upload a new image to replace the found one
                      </div>
                    )}
                  <ImageUpload
                    value={currentAppraisal.image_url || ""}
                    onChange={(imageUrl) =>
                      setCurrentAppraisal((prev) => ({
                        ...prev,
                        image_url: imageUrl,
                      }))
                    }
                    placeholder="Upload appraisal image"
                    className="w-full h-24"
                    orderId={orderId!}
                    sku={currentAppraisal.stock_number || ""}
                  />
                  {skuSearchPerformed &&
                    skuValid &&
                    foundAppraisalImage &&
                    showImageUpload && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowImageUpload(false);
                            setCurrentAppraisal((prev) => ({
                              ...prev,
                              image_url: foundAppraisalImage,
                            }));
                          }}
                        >
                          Use Found Image
                        </Button>
                        <div className="text-xs text-gray-500 self-center">
                          Or keep the uploaded image above
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAppraisalDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={saveAppraisal} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isAutoGenerate && currentAppraisal.id
                      ? "Adding..."
                      : currentAppraisal.id
                      ? "Updating..."
                      : "Saving..."}
                  </>
                ) : isAutoGenerate && currentAppraisal.id ? (
                  "Add New"
                ) : currentAppraisal.id ? (
                  "Update Appraisal"
                ) : (
                  "Save Appraisal"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Label Dialog */}
      <Dialog
        open={showGenerateLabelDialog}
        onOpenChange={(open) => setShowGenerateLabelDialog(open)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Generate Shipping Label{" "}
              {order?.delivery_method
                ? `(Based on ${order.delivery_method})`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Follow the steps to create a label in ShippingEasy or FedEx
              website based on the order's shipping service, then upload the
              downloaded label file below.
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open the order in Shopify and keep it open.</li>
              <li>Open ShippingEasy and use Add Order → Create Label.</li>
              <li>
                From the Magento order page, use Print Address → Cancel, then
                copy the address and phone.
              </li>
              <li>Paste address and phone into ShippingEasy.</li>
              <li>
                Set the reference using Magento order number and insurance value
                as instructed.
              </li>
              <li>
                Configure label: select carrier/service and declared
                value/signature as needed.
              </li>
              <li>Buy label, View, Print, then Download the document.</li>
              <li>
                Alternatively, create via FedEx Ship Manager following internal
                steps, then download.
              </li>
            </ol>
            <div className="pt-2">
              <Label>Upload downloaded label</Label>
              <div className="mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/pdf,image/*";
                    input.onchange = async () => {
                      if (!input.files || input.files.length === 0) return;
                      const file = input.files[0];
                      try {
                        setIsUploadingLabel(true);
                        await uploadDocument(file, orderId!, "label");
                        toast({
                          title: "Uploaded",
                          description: "Label uploaded successfully",
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["order-documents", orderId],
                        });
                        setShowGenerateLabelDialog(false);
                      } catch (e) {
                        // handled by hook
                      } finally {
                        setIsUploadingLabel(false);
                      }
                    };
                    input.click();
                  }}
                  disabled={isUploadingLabel || uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingLabel || uploading ? "Uploading…" : "Choose File"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Appraisal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this appraisal? This action cannot
              be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAppraisalToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAppraisal}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
