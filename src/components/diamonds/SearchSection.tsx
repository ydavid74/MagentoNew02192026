import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { shapes, caratRanges, colors, clarities, sortOptions, priceRanges } from "./utils";

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

interface SearchSectionProps {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  onSearch: () => void;
  onReset: () => void;
  isSearching?: boolean;
  isResetting?: boolean;
}

export function SearchSection({ searchParams, setSearchParams, onSearch, onReset, isSearching = false, isResetting = false }: SearchSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative flex items-center gap-3">
      {/* Primary Search Fields */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Parcel ID"
          value={searchParams.parcel_id}
          onChange={(e) => setSearchParams({ ...searchParams, parcel_id: e.target.value })}
          className="w-32"
        />
        <Input
          placeholder="Subparcel ID"
          value={searchParams.stone_id}
          onChange={(e) => setSearchParams({ ...searchParams, stone_id: e.target.value })}
          className="w-32"
        />
        <Input
          placeholder="Parcel Name"
          value={searchParams.parcel_name}
          onChange={(e) => setSearchParams({ ...searchParams, parcel_name: e.target.value })}
          className="w-40"
        />
        <Button onClick={onSearch} size="sm" disabled={isSearching || isResetting}>
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching...
            </>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" onClick={onReset} size="sm" disabled={isSearching || isResetting}>
          {isResetting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Resetting...
            </>
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        More Filters
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Shape</Label>
                <Select value={searchParams.shape} onValueChange={(value) => setSearchParams({ ...searchParams, shape: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((shape) => (
                      <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Carat Range</Label>
                <Select value={searchParams.carat_weight} onValueChange={(value) => setSearchParams({ ...searchParams, carat_weight: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any carat" />
                  </SelectTrigger>
                  <SelectContent>
                    {caratRanges.map((range) => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Color</Label>
                <Select value={searchParams.color} onValueChange={(value) => setSearchParams({ ...searchParams, color: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Clarity</Label>
                <Select value={searchParams.clarity} onValueChange={(value) => setSearchParams({ ...searchParams, clarity: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any clarity" />
                  </SelectTrigger>
                  <SelectContent>
                    {clarities.map((clarity) => (
                      <SelectItem key={clarity} value={clarity}>{clarity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Price Range</Label>
                <Select value={searchParams.price_range} onValueChange={(value) => setSearchParams({ ...searchParams, price_range: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Sort By</Label>
                <Select value={searchParams.sort_by} onValueChange={(value) => setSearchParams({ ...searchParams, sort_by: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Default sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 col-span-2 md:col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minimum_level"
                    checked={searchParams.minimum_level}
                    onCheckedChange={(checked) => setSearchParams({ ...searchParams, minimum_level: !!checked })}
                  />
                  <Label htmlFor="minimum_level" className="text-xs">Minimum Level</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_check"
                    checked={searchParams.edit_check}
                    onCheckedChange={(checked) => setSearchParams({ ...searchParams, edit_check: !!checked })}
                  />
                  <Label htmlFor="edit_check" className="text-xs">Edit Check</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}