import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SearchSection } from "@/components/diamonds/SearchSection";
import { DiamondTable } from "@/components/diamonds/DiamondTable";
import { AddDiamondDialog } from "@/components/diamonds/AddDiamondDialog";
import {
  getStatusColor,
  getHoverColor,
  formatNumber,
  formatCurrency,
} from "@/components/diamonds/utils";
import {
  diamondService,
  DiamondInventory,
  DiamondWithSubParcels,
} from "@/services/diamonds";
import {
  parcelUsageAnalyticsService,
  HighlightingConfig,
  ParcelUsageHighlight,
} from "@/services/parcelUsageAnalytics";
import { highlightingSettingsService } from "@/services/highlightingSettings";
import { ParcelHighlightingControls } from "@/components/diamonds/ParcelHighlightingControls";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SearchParams {
  parcel_id: string;
  stone_id: string;
  parcel_name: string;
  products_id: string;
  shape: string;
  carat_weight: string;
  color: string;
  clarity: string;
  price_range: string;
  sort_by: string;
  minimum_level: boolean;
  edit_check: boolean;
}

export function DiamondsPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  // Get current user name for history logging
  const getCurrentUserName = async () => {
    console.log("🔍 getCurrentUserName: Current User ID:", user?.id);
    console.log("🔍 getCurrentUserName: Current User Email:", user?.email);

    if (!user?.id) {
      console.log("❌ getCurrentUserName: No user ID found");
      return "Unknown User";
    }

    // Try to fetch from profiles table first
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();

      console.log("📊 getCurrentUserName: Profile query result:", {
        profileData,
        error,
      });

      if (!error && profileData) {
        const profile = profileData as any; // Type assertion to handle missing columns
        console.log("👤 getCurrentUserName: First Name:", profile.first_name);
        console.log("👤 getCurrentUserName: Last Name:", profile.last_name);

        if (profile.first_name && profile.last_name) {
          const fullName = `${profile.first_name} ${profile.last_name}`;
          console.log("✅ getCurrentUserName: Using full name:", fullName);
          return fullName;
        } else if (profile.first_name) {
          console.log(
            "✅ getCurrentUserName: Using first name only:",
            profile.first_name
          );
          return profile.first_name;
        }
      } else {
        console.log(
          "❌ getCurrentUserName: Could not fetch profile data:",
          error
        );
      }
    } catch (profileError) {
      console.log(
        "❌ getCurrentUserName: Error fetching profile:",
        profileError
      );
    }

    // Fallback to email-based name
    if (user.email) {
      const emailName = user.email.split("@")[0]; // Get part before @
      // Capitalize first letter and replace dots/underscores with spaces
      const displayName = emailName
        .replace(/[._]/g, " ")
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      console.log(
        "⚠️ getCurrentUserName: Using email-based name:",
        displayName
      );
      return displayName;
    }

    console.log("❌ getCurrentUserName: No user email found");
    return "Unknown User";
  };

  // Highlighting state
  const [highlightingConfig, setHighlightingConfig] =
    useState<HighlightingConfig>({
      mode: "frequency",
      dateRange: 30,
      frequencyThresholds: {
        low: { min: 1, max: 2, color: "#fef3c7" },
        medium: { min: 3, max: 4, color: "#fde68a" },
        high: { min: 5, max: 999, color: "#f59e0b" },
      },
    });
  const [parcelHighlights, setParcelHighlights] = useState<
    ParcelUsageHighlight[]
  >([]);
  const [isApplyingHighlighting, setIsApplyingHighlighting] = useState(false);

  // Apply highlighting function
  const handleApplyHighlighting = async () => {
    try {
      setIsApplyingHighlighting(true);
      console.log(
        "🎨 Applying parcel highlighting with config:",
        highlightingConfig
      );

      const highlights =
        await parcelUsageAnalyticsService.generateCompleteHighlightingData(
          highlightingConfig
        );
      setParcelHighlights(highlights);

      // Save the current settings
      await highlightingSettingsService.saveSettings(highlightingConfig);

      toast({
        title: "Highlighting Applied",
        description: `Applied ${highlightingConfig.mode} highlighting to ${highlights.length} parcels`,
      });
    } catch (error) {
      console.error("Error applying highlighting:", error);
      toast({
        title: "Error",
        description: "Failed to apply highlighting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingHighlighting(false);
    }
  };

  // Search parameters state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    parcel_id: "",
    stone_id: "",
    parcel_name: "",
    products_id: "",
    shape: "",
    carat_weight: "",
    color: "",
    clarity: "",
    price_range: "",
    sort_by: "",
    minimum_level: false,
    edit_check: false,
  });

  // Data state
  const [diamonds, setDiamonds] = useState<DiamondInventory[]>([]);
  const [hierarchicalDiamonds, setHierarchicalDiamonds] = useState<
    DiamondWithSubParcels[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [expandedParcels, setExpandedParcels] = useState<Set<string>>(
    new Set()
  );
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(
    new Set()
  );
  const [isSavingDiamond, setIsSavingDiamond] = useState(false);
  const [isAddingReducingDiamond, setIsAddingReducingDiamond] = useState(false);
  const [isDeletingDiamond, setIsDeletingDiamond] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showAddDiamondDialog, setShowAddDiamondDialog] = useState(false);
  const stats = {
    totalDiamonds: diamonds.length,
    totalValue: diamonds.reduce(
      (sum, d) => sum + d.price_per_ct * d.total_carat,
      0
    ),
    totalWeight: diamonds.reduce((sum, d) => sum + d.total_carat, 0),
  };

  // Load diamonds and highlighting settings when component mounts
  useEffect(() => {
    loadDiamonds();
    loadHighlightingSettings();
  }, []);

  // Load highlighting settings and apply them automatically
  const loadHighlightingSettings = async () => {
    try {
      const savedSettings = await highlightingSettingsService.getSettings();
      if (savedSettings) {
        setHighlightingConfig(savedSettings);
        // Automatically apply highlighting with saved settings
        await applyHighlightingWithSettings(savedSettings);
      }
    } catch (error) {
      console.error("Error loading highlighting settings:", error);
    }
  };

  // Apply highlighting with specific settings
  const applyHighlightingWithSettings = async (
    settings: HighlightingConfig
  ) => {
    try {
      setIsApplyingHighlighting(true);
      console.log(
        "🎨 Auto-applying highlighting with saved settings:",
        settings
      );

      const highlights =
        await parcelUsageAnalyticsService.generateCompleteHighlightingData(
          settings
        );
      setParcelHighlights(highlights);

      console.log(
        "✅ Auto-applied highlighting to",
        highlights.length,
        "parcels"
      );
    } catch (error) {
      console.error("Error auto-applying highlighting:", error);
    } finally {
      setIsApplyingHighlighting(false);
    }
  };

  const loadDiamonds = async () => {
    setLoading(true);
    try {
      // Load diamonds from Supabase
      const [allDiamonds, hierarchicalData, diamondStats] = await Promise.all([
        diamondService.getDiamonds(),
        diamondService.getDiamondsHierarchical(),
        diamondService.getDiamondStats(),
      ]);

      setDiamonds(allDiamonds);
      setHierarchicalDiamonds(hierarchicalData);
      // setStats(diamondStats); // This line is removed as per the new_code

      toast({
        title: "Success",
        description: `Loaded ${allDiamonds.length} diamonds successfully`,
      });
    } catch (error) {
      console.error("Error loading diamonds:", error);
      toast({
        title: "Error",
        description:
          "Failed to load diamonds. Please check your database connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (isSearching) return;

    setIsSearching(true);
    try {
      setLoading(true);
      const searchResults = await diamondService.searchDiamonds(searchParams);
      console.log("🔍 Search results:", searchResults);
      setDiamonds(searchResults);

      // For hierarchical display, we need to include parent parcels if we found subparcels
      let displayResults = searchResults;

      // If we found subparcels, also fetch their parent parcels for proper hierarchical display
      const subParcels = searchResults.filter((d) => d.is_parent === false);
      if (subParcels.length > 0) {
        const parentParcelIds = [
          ...new Set(
            subParcels.map((sub) => sub.parent_parcel_id).filter(Boolean)
          ),
        ];
        if (parentParcelIds.length > 0) {
          // Fetch parent parcels
          const parentParcels = await Promise.all(
            parentParcelIds.map((id) => diamondService.getDiamondById(id))
          );
          const validParentParcels = parentParcels.filter((p) => p !== null);

          // Combine search results with parent parcels
          displayResults = [...searchResults, ...validParentParcels];
        }
      }

      // Create hierarchical data
      const parentParcels = displayResults.filter((d) => d.is_parent === true);
      const allSubParcels = displayResults.filter((d) => d.is_parent === false);

      const hierarchicalData = parentParcels.map((parent) => ({
        ...parent,
        sub_parcels: allSubParcels.filter(
          (sub) => sub.parent_parcel_id === parent.parcel_id
        ),
      }));

      console.log("🔍 Hierarchical data:", hierarchicalData);
      console.log("🔍 Parent parcels:", parentParcels);
      console.log("🔍 All subparcels:", allSubParcels);
      setHierarchicalDiamonds(hierarchicalData);

      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} diamonds`,
      });
    } catch (error) {
      console.error("Error searching diamonds:", error);
      toast({
        title: "Error",
        description: "Failed to search diamonds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleReset = async () => {
    if (isResetting) return;

    setIsResetting(true);
    try {
      setSearchParams({
        parcel_id: "",
        stone_id: "",
        parcel_name: "",
        products_id: "",
        shape: "",
        carat_weight: "",
        color: "",
        clarity: "",
        price_range: "",
        sort_by: "",
        minimum_level: false,
        edit_check: false,
      });
      // Reload all diamonds
      await loadDiamonds();
    } finally {
      setIsResetting(false);
    }
  };

  const toggleParcelExpansion = (parcelId: string) => {
    const newExpanded = new Set(expandedParcels);
    if (newExpanded.has(parcelId)) {
      newExpanded.delete(parcelId);
    } else {
      newExpanded.add(parcelId);
    }
    setExpandedParcels(newExpanded);
  };

  const toggleDetailsExpansion = (diamondId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(diamondId)) {
      newExpanded.delete(diamondId);
    } else {
      newExpanded.add(diamondId);
    }
    setExpandedDetails(newExpanded);
  };

  const handleSaveDiamond = async (
    updatedDiamond: Partial<DiamondInventory>
  ) => {
    if (isSavingDiamond) return;

    setIsSavingDiamond(true);
    try {
      // For edit operations, allow updating all fields but show 0 variation in history
      const editUpdates = {
        ...updatedDiamond,
      };

      await diamondService.updateDiamond(
        updatedDiamond.parcel_id!,
        editUpdates,
        "Edit",
        undefined, // No system-generated comments
        await getCurrentUserName(),
        0, // No CT weight variation for edit (0 means no change)
        updatedDiamond.total_carat, // Current total weight after edit
        0 // No stones variation for edit operations (0 means no change)
      );
      await loadDiamonds(); // Reload data to reflect changes
    } catch (error) {
      console.error("Error updating diamond:", error);
      throw error;
    } finally {
      setIsSavingDiamond(false);
    }
  };

  const handleAddReduceDiamond = async (
    diamondId: string,
    mode: "add" | "reduce",
    data: { stones: number; ctWeight: number; comment: string }
  ) => {
    if (isAddingReducingDiamond) return;

    setIsAddingReducingDiamond(true);
    try {
      console.log(
        `🔄 ${mode.toUpperCase()} operation for diamond ${diamondId}:`,
        data
      );

      // Get the current diamond data
      const currentDiamond = diamonds.find((d) => d.parcel_id === diamondId);
      if (!currentDiamond) {
        throw new Error("Diamond not found");
      }

      console.log("📊 Current diamond data:", {
        parcel_id: currentDiamond.parcel_id,
        current_stones: currentDiamond.number_of_stones,
        current_carat: currentDiamond.total_carat,
      });

      // Calculate new values
      const newStones =
        mode === "add"
          ? currentDiamond.number_of_stones + data.stones
          : Math.max(0, currentDiamond.number_of_stones - data.stones);

      // For CT weight: 'add' adds to current, 'reduce' subtracts from current
      const newCarat =
        mode === "add"
          ? currentDiamond.total_carat + data.ctWeight
          : Math.max(0, currentDiamond.total_carat - data.ctWeight);

      console.log("📈 New values:", {
        new_stones: newStones,
        new_carat: newCarat,
      });

      // Update the diamond with new values
      const actionType = mode === "add" ? "Add" : "Reduce";

      // Only save user-written comments, not system-generated ones
      const userComment = data.comment ? data.comment.trim() : "";

      await diamondService.updateDiamond(
        diamondId,
        {
          number_of_stones: newStones,
          total_carat: newCarat,
          price_per_ct: currentDiamond.price_per_ct, // Include current price per ct for history
          comments: userComment
            ? `${currentDiamond.comments || ""}\n${userComment}`.trim()
            : currentDiamond.comments,
        },
        actionType,
        userComment,
        await getCurrentUserName(),
        mode === "add" ? data.ctWeight : -data.ctWeight,
        newCarat,
        mode === "add" ? data.stones : -data.stones
      );

      console.log("✅ Diamond updated successfully");

      toast({
        title: "Success",
        description: `Diamond ${
          mode === "add" ? "increased" : "decreased"
        } successfully`,
      });

      // Reload data to reflect changes
      await loadDiamonds();
    } catch (error) {
      console.error(`❌ Error ${mode}ing diamond:`, error);
      throw error;
    } finally {
      setIsAddingReducingDiamond(false);
    }
  };

  const handleAddSubcategory = async (
    parentDiamond: DiamondInventory,
    subcategoryData: Partial<DiamondInventory>
  ) => {
    try {
      // Create the subcategory using the diamond service
      // Cast to the required type since the dialog ensures all required fields are filled
      await diamondService.createDiamond(
        subcategoryData as Omit<
          DiamondInventory,
          "id" | "created_at" | "updated_at"
        >,
        await getCurrentUserName()
      );

      toast({
        title: "Success",
        description: "Subcategory created successfully",
      });

      // Reload data to reflect changes
      await loadDiamonds();
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  };

  const handleDeleteDiamond = async (diamondId: string) => {
    if (isDeletingDiamond) return;

    setIsDeletingDiamond(true);
    try {
      // Delete the diamond using the diamond service
      await diamondService.deleteDiamond(diamondId, await getCurrentUserName());

      toast({
        title: "Success",
        description: "Diamond deleted successfully",
      });

      // Reload data to reflect changes
      await loadDiamonds();
    } catch (error) {
      console.error("Error deleting diamond:", error);
      throw error;
    } finally {
      setIsDeletingDiamond(false);
    }
  };

  const handleAddDiamond = async (
    newDiamond: Omit<DiamondInventory, "id" | "created_at" | "updated_at">
  ) => {
    try {
      console.log("💎 Adding new diamond:", newDiamond);

      // Create the diamond using the diamond service
      await diamondService.createDiamond(
        newDiamond,
        await getCurrentUserName()
      );

      // Reload diamonds to show the new one
      await loadDiamonds();

      toast({
        title: "Success",
        description: "Diamond added successfully to inventory",
      });
    } catch (error) {
      console.error("Error adding diamond:", error);
      throw error;
    }
  };

  // Check if user has access to diamonds page
  const hasAccess = profile?.role === "admin";

  if (!hasAccess) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-4">
                Access Denied
              </h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access the Diamonds page. Admin
                access required.
              </p>
              <p className="text-sm text-muted-foreground">
                Current role: {profile?.role || "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Stats - Fixed Top */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Diamond Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your diamond inventory
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{stats.totalDiamonds}</div>
              <div className="text-muted-foreground">Total Diamonds</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {formatNumber(stats.totalWeight)}
              </div>
              <div className="text-muted-foreground">Total Carats</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-muted-foreground">Total Value</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchSection
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onSearch={handleSearch}
              onReset={handleReset}
              isSearching={isSearching}
              isResetting={isResetting}
            />
          </div>
          <div className="flex-shrink-0 flex items-center gap-3">
            <Button
              onClick={() => setShowAddDiamondDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Diamond
            </Button>
            <ParcelHighlightingControls
              config={highlightingConfig}
              onConfigChange={setHighlightingConfig}
              onApplyHighlighting={handleApplyHighlighting}
              isLoading={isApplyingHighlighting}
            />
          </div>
        </div>
      </div>

      {/* Diamond Table - Scrollable Main Content */}
      <div className="flex-1 overflow-hidden">
        <DiamondTable
          diamonds={diamonds}
          hierarchicalDiamonds={hierarchicalDiamonds}
          loading={loading}
          stats={stats}
          expandedParcels={expandedParcels}
          expandedDetails={expandedDetails}
          onToggleExpansion={toggleParcelExpansion}
          onToggleDetails={toggleDetailsExpansion}
          onSaveDiamond={handleSaveDiamond}
          onAddReduceDiamond={handleAddReduceDiamond}
          onAddSubcategory={handleAddSubcategory}
          onDeleteDiamond={handleDeleteDiamond}
          parcelHighlights={parcelHighlights}
        />
      </div>

      {/* Add Diamond Dialog */}
      <AddDiamondDialog
        isOpen={showAddDiamondDialog}
        onOpenChange={setShowAddDiamondDialog}
        onSave={handleAddDiamond}
        parentParcels={diamonds.filter((d) => d.is_parent === true)}
      />
    </div>
  );
}
