// components/manufacturing/ProductStructureBuilder.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Package,
  Check,
  ChevronsUpDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}

interface ProductStructureItem {
  rawMaterialId: number;
  quantityRequired: number;
  materialName: string;
  materialUnit: string;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string; // Change from 'string' to 'string | null'
  quantity: number;
}

interface ProductStructure {
  productId: number;
  productName: string;
  productDetails: {
    name: string;
    size: string | null;
    category: string | null;
  };
  rawMaterials: Array<{
    structureId: number; // Add this
    rawMaterialId: number;
    materialName: string;
    quantityRequired: number;
    materialDetails: {
      name: string;
    };
  }>;
}

interface ProductStructureBuilderProps {
  products: Product[];
  rawMaterials: RawMaterial[];
}

export function ProductStructureBuilder({
  products,
  rawMaterials,
}: ProductStructureBuilderProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [structureItems, setStructureItems] = useState<ProductStructureItem[]>(
    []
  );
  const [currentItem, setCurrentItem] = useState<{
    rawMaterialId: string;
    quantityRequired: number;
  }>({ rawMaterialId: "", quantityRequired: 1 });

  // State for searchable dropdowns
  const [productOpen, setProductOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  // State for existing structures
  const [existingStructures, setExistingStructures] = useState<
    ProductStructure[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("build");

  // Load existing product structures
  useEffect(() => {
    fetchProductStructures();
  }, []);

  const fetchProductStructures = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/product-structures");
      if (response.ok) {
        const structures = await response.json();
        console.log("📦 API Response:", structures);
        setExistingStructures(structures);
      } else {
        console.error("Failed to fetch structures:", response.status);
      }
    } catch (error) {
      console.error("Error fetching product structures:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (currentItem.rawMaterialId === "" || currentItem.quantityRequired <= 0)
      return;

    const materialId = parseInt(currentItem.rawMaterialId);
    const selectedMaterial = rawMaterials.find((m) => m.id === materialId);

    if (!selectedMaterial) return;

    // Check if material already exists in structure
    const materialExists = structureItems.find(
      (item) => item.rawMaterialId === materialId
    );

    if (materialExists) {
      alert(
        "This material is already in the product structure. Please remove it first to change the quantity."
      );
      return;
    }

    // Add new item to structure
    const newItem: ProductStructureItem = {
      rawMaterialId: materialId,
      quantityRequired: currentItem.quantityRequired,
      materialName: selectedMaterial.name,
      materialUnit: selectedMaterial.unit,
    };

    setStructureItems((items) => [...items, newItem]);

    // Reset current item for next addition
    setCurrentItem({ rawMaterialId: "", quantityRequired: 1 });
    setMaterialSearch("");
  };

  const removeItem = (rawMaterialId: number) => {
    setStructureItems((items) =>
      items.filter((item) => item.rawMaterialId !== rawMaterialId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct === "" || structureItems.length === 0) return;

    try {
      const requestData = {
        productId: parseInt(selectedProduct),
        items: structureItems.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          quantityRequired: item.quantityRequired,
        })),
      };

      console.log(
        "🔄 Sending data to API:",
        JSON.stringify(requestData, null, 2)
      );

      const response = await fetch("/api/product-structures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save product structure");
      }

      const savedStructure = await response.json();
      console.log("✅ Successfully saved:", savedStructure);

      // Refresh the structures list
      await fetchProductStructures();

      // Show success message
      alert("Product structure saved successfully!");

      // Reset form
      setSelectedProduct("");
      setStructureItems([]);
      setProductSearch("");
      setActiveTab("view"); // Switch to view tab after successful creation
    } catch (error) {
      console.error("❌ Error saving product structure:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save product structure"
      );
    }
  };

  const deleteProductStructure = async (structureId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this material from the product structure?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/product-structures/${structureId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to delete product structure"
        );
      }

      // Refresh the structures list
      await fetchProductStructures();
      alert("Material removed from product structure successfully!");
    } catch (error) {
      console.error("Error deleting product structure:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete product structure"
      );
    }
  };

  const deleteEntireProductStructure = async (productId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete ALL materials from this product structure?"
      )
    ) {
      return;
    }

    try {
      // First, get all structure IDs for this product
      const productStructure = existingStructures.find(
        (s) => s.productId === productId
      );
      if (!productStructure) return;

      // Delete each structure item individually
      const deletePromises = productStructure.rawMaterials.map((material) =>
        fetch(`/api/product-structures/${material.structureId}`, {
          method: "DELETE",
        })
      );

      await Promise.all(deletePromises);

      // Refresh the structures list
      await fetchProductStructures();
      alert("Product structure deleted successfully!");
    } catch (error) {
      console.error("Error deleting product structure:", error);
      alert("Failed to delete product structure");
    }
  };

  const getSelectedProductName = () => {
    return (
      products.find((p) => p.id.toString() === selectedProduct)?.name ||
      "Select product"
    );
  };

  const getSelectedMaterialName = () => {
    return (
      rawMaterials.find((m) => m.id.toString() === currentItem.rawMaterialId)
        ?.name || "Select material"
    );
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter materials based on search and exclude already added materials
  const availableMaterials = rawMaterials.filter(
    (material) =>
      !structureItems.some((item) => item.rawMaterialId === material.id)
  );

  const filteredMaterials = availableMaterials.filter((material) =>
    material.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Calculate total materials required
  const totalUniqueMaterials = structureItems.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Structure Builder</CardTitle>
        <CardDescription>
          Define how products are made from multiple raw materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">
              <Plus className="h-4 w-4 mr-2" />
              Build Structure
            </TabsTrigger>
            <TabsTrigger value="view">
              <FileText className="h-4 w-4 mr-2" />
              View Structures ({existingStructures.length})
            </TabsTrigger>
          </TabsList>

          {/* Build Structure Tab */}
          <TabsContent value="build" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Searchable Product Selector */}
              <div className="space-y-2">
                <Label htmlFor="product">Select Product</Label>
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="w-full justify-between"
                    >
                      {getSelectedProductName()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white">
                    <Command>
                      <CommandInput
                        placeholder="Search products..."
                        value={productSearch}
                        onValueChange={setProductSearch}
                        className="border-0 focus:ring-0"
                      />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                const newValue = product.id.toString();
                                setSelectedProduct(
                                  newValue === selectedProduct ? "" : newValue
                                );
                                setProductOpen(false);
                                setProductSearch("");
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProduct === product.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {product.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProduct && (
                <>
                  <div className="space-y-4">
                    <Label>Add Raw Materials to Product Structure</Label>
                    <div className="flex gap-4 items-end">
                      {/* Searchable Material Selector */}
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="material">Select Material</Label>
                        <Popover
                          open={materialOpen}
                          onOpenChange={setMaterialOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={materialOpen}
                              className="w-full justify-between"
                            >
                              {getSelectedMaterialName()}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-white">
                            <Command>
                              <CommandInput
                                placeholder="Search raw materials..."
                                value={materialSearch}
                                onValueChange={setMaterialSearch}
                                className="border-0 focus:ring-0"
                              />
                              <CommandList>
                                <CommandEmpty>No material found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredMaterials.map((material) => (
                                    <CommandItem
                                      key={material.id}
                                      value={`${material.name} ${material.unit}`}
                                      onSelect={() => {
                                        const newValue = material.id.toString();
                                        setCurrentItem({
                                          ...currentItem,
                                          rawMaterialId: newValue,
                                        });
                                        setMaterialOpen(false);
                                        setMaterialSearch("");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          currentItem.rawMaterialId ===
                                            material.id.toString()
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{material.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Stock: {material.quantity}{" "}
                                          {material.unit}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Required</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Qty"
                          value={currentItem.quantityRequired}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              quantityRequired: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={addItem}
                        disabled={
                          !currentItem.rawMaterialId ||
                          currentItem.quantityRequired <= 0
                        }
                        className="bg-[#954C2E] hover:bg-[#7a3d25] mb-1 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Add all the raw materials needed to produce one unit of
                      this product
                    </p>
                  </div>

                  {structureItems.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Product Structure Components</Label>
                        <Badge variant="outline" className="ml-2">
                          {totalUniqueMaterials} material
                          {totalUniqueMaterials !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50%]">
                                Raw Material
                              </TableHead>
                              <TableHead className="w-[30%]">
                                Quantity Required
                              </TableHead>
                              <TableHead className="w-[10%]">Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {structureItems.map((item) => (
                              <TableRow key={item.rawMaterialId}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {item.materialName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {item.quantityRequired}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="font-normal"
                                  >
                                    {item.materialUnit}
                                  </Badge>
                                </TableCell>
                                {/* <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeItem(item.rawMaterialId)
                                    }
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell> */}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Summary */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Product requires {totalUniqueMaterials} different
                          material
                          {totalUniqueMaterials !== 1 ? "s" : ""}
                        </div>
                        <Button
                          type="submit"
                          className="bg-[#954C2E] hover:bg-[#7a3d25] text-white"
                        >
                          Save Product Structure
                        </Button>
                      </div>
                    </div>
                  )}

                  {structureItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">
                        No materials added yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add materials above to build your product structure
                      </p>
                    </div>
                  )}
                </>
              )}

              {!selectedProduct && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Select a product to start building its structure
                  </p>
                </div>
              )}
            </form>
          </TabsContent>

          {/* View Structures Tab */}
          <TabsContent value="view" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#954C2E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading product structures...</p>
              </div>
            ) : existingStructures.length > 0 ? (
              <div className="space-y-6">
                {existingStructures.map((structure) => (
                  <Card
                    key={structure.productId}
                    className="border-l-4 border-l-[#954C2E]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#954C2E]" />
                            {structure.productName}
                          </CardTitle>
                          <CardDescription>
                            {structure.productDetails.size && (
                              <span>
                                Size: {structure.productDetails.size} •{" "}
                              </span>
                            )}
                            {structure.productDetails.category && (
                              <span>
                                Category: {structure.productDetails.category}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="ml-2">
                            {structure.rawMaterials.length} material
                            {structure.rawMaterials.length !== 1 ? "s" : ""}
                          </Badge>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              deleteProductStructure(structure.productId)
                            }
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Raw Material</TableHead>
                              <TableHead>Quantity Required</TableHead>
                              <TableHead>Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {structure.rawMaterials.map((material, index) => (
                              <TableRow key={material.structureId || index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {material.materialName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {material.quantityRequired}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="font-normal"
                                  >
                                    {rawMaterials.find(
                                      (rm) => rm.id === material.rawMaterialId
                                    )?.unit || "pcs"}
                                  </Badge>
                                </TableCell>
                                {/* <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      deleteProductStructure(
                                        material.structureId
                                      )
                                    }
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell> */}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Product Structures
                </h3>
                <p className="text-gray-600 mb-4">
                  No product structures have been created yet.
                </p>
                <Button onClick={() => setActiveTab("build")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Structure
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
