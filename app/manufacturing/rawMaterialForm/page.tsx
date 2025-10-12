// components/manufacturing/RawMaterialForm.tsx
"use client";

import { useState } from "react";
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

interface RawMaterial {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
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
    unit: material?.unit || "pcs",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseFloat(e.target.value) || 0,
                  })
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-800 text-white">
              {isEditing ? "Update Material" : "Add Material"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
