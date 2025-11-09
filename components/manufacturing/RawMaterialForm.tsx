// components/manufacturing/RawMaterialForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface RawMaterial {
  id?: number;
  name: string;
  quantity: number;
  unit: string | null; // Change from 'string' to 'string | null'
}

interface RawMaterialFormProps {
  material?: RawMaterial;
  onSubmit: (data: Omit<RawMaterial, "id">) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function RawMaterialForm({
  material,
  onSubmit,
  onCancel,
  isEditing,
}: RawMaterialFormProps) {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    quantity: material?.quantity || 0,
    unit: material?.unit || "pcs", // Provide default value if null
  });

  const [quantityMode, setQuantityMode] = useState<"set" | "add" | "subtract">(
    "add"
  );
  const [quantityInput, setQuantityInput] = useState("");

  // Update formData.quantity when quantityInput or quantityMode changes
  useEffect(() => {
    if (isEditing) {
      const finalQuantity = calculateFinalQuantity();
      setFormData((prev) => ({ ...prev, quantity: finalQuantity }));
    }
  }, [quantityInput, quantityMode, isEditing]);

  const calculateFinalQuantity = () => {
    const inputValue = parseFloat(quantityInput) || 0;

    switch (quantityMode) {
      case "add":
        return (material?.quantity || 0) + inputValue;
      case "subtract":
        return Math.max(0, (material?.quantity || 0) - inputValue);
      case "set":
      default:
        return inputValue;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For new materials, ensure quantity is properly set
    if (!isEditing) {
      const quantity = parseFloat(quantityInput) || formData.quantity;
      if (quantity <= 0) {
        alert("Please enter a valid quantity");
        return;
      }
    }

    // For editing, we already updated formData.quantity via useEffect
    // For new materials, we need to ensure quantity is set
    const finalFormData = {
      ...formData,
      quantity: isEditing
        ? formData.quantity
        : parseFloat(quantityInput) || formData.quantity,
    };

    console.log("Submitting form data:", finalFormData); // Debug log

    onSubmit(finalFormData);
  };

  const getQuantityDescription = () => {
    const inputValue = parseFloat(quantityInput) || 0;
    const currentQuantity = material?.quantity || 0;

    switch (quantityMode) {
      case "add":
        return `Current: ${currentQuantity} → New: ${
          currentQuantity + inputValue
        } (+${inputValue})`;
      case "subtract":
        return `Current: ${currentQuantity} → New: ${Math.max(
          0,
          currentQuantity - inputValue
        )} (-${inputValue})`;
      case "set":
      default:
        return `Set quantity to: ${inputValue}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Raw Material" : "Add New Raw Material"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the raw material details"
            : "Add a new raw material to your inventory"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Material Name</Label>
            <Input
              id="name"
              placeholder="e.g., Small Jiretop, Kawdyachi Mala"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) =>
                setFormData({ ...formData, unit: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pcs">Pieces</SelectItem>
                <SelectItem value="kg">Kilograms</SelectItem>
                <SelectItem value="g">Grams</SelectItem>
                <SelectItem value="m">Meters</SelectItem>
                <SelectItem value="l">Liters</SelectItem>
                <SelectItem value="set">Set</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Quantity Management</Label>
              {isEditing && material && (
                <Badge variant="secondary" className="text-sm">
                  Current: {material.quantity} {formData.unit}
                </Badge>
              )}
            </div>

            {isEditing ? (
              <Tabs
                value={quantityMode}
                onValueChange={(value) =>
                  setQuantityMode(value as "set" | "add" | "subtract")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  {" "}
                  {/* Changed to 2 since you removed "set" */}
                  <TabsTrigger
                    value="add"
                    className={
                      quantityMode === "add"
                        ? "bg-green-50 text-green-700 border-green-200 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300"
                        : "data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
                    }
                  >
                    Add Stock
                  </TabsTrigger>
                  <TabsTrigger
                    value="subtract"
                    className={
                      quantityMode === "subtract"
                        ? "bg-red-50 text-red-700 border-red-200 data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:border-red-300"
                        : "data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
                    }
                  >
                    Remove Stock
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity to add"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This will add to the current quantity
                  </p>
                </TabsContent>

                <TabsContent value="subtract" className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max={material?.quantity || 0}
                    step="0.01"
                    placeholder="Enter quantity to remove"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This will subtract from the current quantity
                  </p>
                </TabsContent>
              </Tabs>
            ) : (
              // For new materials, use quantityInput directly
              <div className="space-y-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter initial quantity"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter the initial stock quantity
                </p>
              </div>
            )}

            {/* Quantity Preview */}
            {isEditing && quantityInput && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-800">Preview:</span>
                  <span className="text-blue-700">
                    {getQuantityDescription()}
                  </span>
                </div>
              </div>
            )}

            {/* Debug info - remove in production */}
            {/* {process.env.NODE_ENV === "development" && (
              <div className="p-2 bg-gray-100 rounded text-xs">
                <div>Debug: formData.quantity = {formData.quantity}</div>
                <div>Debug: quantityInput = {quantityInput}</div>
                <div>Debug: quantityMode = {quantityMode}</div>
              </div>
            )} */}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-800 text-white"
              disabled={isEditing ? !quantityInput : !quantityInput}
            >
              {isEditing ? "Update Material" : "Add Material"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
