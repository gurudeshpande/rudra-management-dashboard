// components/manufacturing/RawMaterialsTable.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react";

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface RawMaterialsTableProps {
  materials: RawMaterial[];
  onAddMaterial: () => void;
  onEditMaterial: (material: RawMaterial) => void;
  onDeleteMaterial: (id: number) => void;
}

export function RawMaterialsTable({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
}: RawMaterialsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { status: "Out of Stock", variant: "destructive" as const };
    if (quantity < 10)
      return { status: "Low", variant: "destructive" as const };
    if (quantity < 50)
      return { status: "Medium", variant: "secondary" as const };
    return { status: "In Stock", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Raw Materials Inventory</CardTitle>
            <CardDescription>
              Manage your raw materials and track stock levels
            </CardDescription>
          </div>
          <Button onClick={onAddMaterial} className="bg-amber-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.map((material) => {
              const stockStatus = getStockStatus(material.quantity);
              return (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {material.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {material.quantity}
                      {material.quantity < 10 && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(material.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem
                          onClick={() => onEditMaterial(material)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteMaterial(material.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No raw materials found</p>
            <Button variant="outline" className="mt-4" onClick={onAddMaterial}>
              Add Your First Material
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
