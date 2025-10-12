// components/manufacturing/RawMaterialTransfer.tsx
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
import {
  Plus,
  Trash2,
  User,
  Package,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface TransferItem {
  rawMaterialId: number;
  quantityIssued: number;
  materialName: string;
  materialUnit: string;
  currentStock: number;
}

interface RawMaterialTransferProps {
  users: User[];
  rawMaterials: RawMaterial[];
  onSubmit: (
    userId: string,
    items: TransferItem[],
    notes: string
  ) => Promise<void>;
}

export function RawMaterialTransfer({
  users,
  rawMaterials,
  onSubmit,
}: RawMaterialTransferProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [currentItem, setCurrentItem] = useState<{
    rawMaterialId: string;
    quantityIssued: number;
  }>({ rawMaterialId: "", quantityIssued: 1 });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for searchable dropdowns
  const [userOpen, setUserOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  // Filter users to only show those with role "USER"
  const filteredUsers = users
    .filter((user) => user.role === "USER")
    .filter(
      (user) =>
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

  const addItem = () => {
    if (currentItem.rawMaterialId === "" || currentItem.quantityIssued <= 0)
      return;

    const materialId = parseInt(currentItem.rawMaterialId);
    const selectedMaterial = rawMaterials.find((m) => m.id === materialId);

    if (!selectedMaterial) return;

    // Check if material already exists in transfer items
    const materialExists = transferItems.find(
      (item) => item.rawMaterialId === materialId
    );

    if (materialExists) {
      alert(
        "This material is already in the transfer list. Please remove it first to change the quantity."
      );
      return;
    }

    // Check if sufficient stock is available
    if (selectedMaterial.quantity < currentItem.quantityIssued) {
      alert(
        `Insufficient stock! Available: ${selectedMaterial.quantity} ${selectedMaterial.unit}`
      );
      return;
    }

    // Add new item to transfer
    const newItem: TransferItem = {
      rawMaterialId: materialId,
      quantityIssued: currentItem.quantityIssued,
      materialName: selectedMaterial.name,
      materialUnit: selectedMaterial.unit,
      currentStock: selectedMaterial.quantity,
    };

    setTransferItems((items) => [...items, newItem]);

    // Reset current item for next addition
    setCurrentItem({ rawMaterialId: "", quantityIssued: 1 });
    setMaterialSearch("");
  };

  const removeItem = (rawMaterialId: number) => {
    setTransferItems((items) =>
      items.filter((item) => item.rawMaterialId !== rawMaterialId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser === "" || transferItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedUser, transferItems, notes);
      // Reset form on success
      setSelectedUser("");
      setTransferItems([]);
      setNotes("");
      setUserSearch("");
    } catch (error) {
      console.error("Failed to submit transfer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedUserName = () => {
    return users.find((u) => u.id === selectedUser)?.name || "Select user";
  };

  const getSelectedMaterialName = () => {
    return (
      rawMaterials.find((m) => m.id.toString() === currentItem.rawMaterialId)
        ?.name || "Select material"
    );
  };

  // Filter materials based on search and exclude already added materials
  const availableMaterials = rawMaterials.filter(
    (material) =>
      !transferItems.some((item) => item.rawMaterialId === material.id)
  );

  const filteredMaterials = availableMaterials.filter((material) =>
    material.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Calculate totals
  const totalItems = transferItems.length;
  const totalQuantity = transferItems.reduce(
    (sum, item) => sum + item.quantityIssued,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Material Transfer</CardTitle>
        <CardDescription>
          Issue raw materials to users for production
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Searchable User Selector */}
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userOpen}
                  className="w-full justify-between"
                >
                  {getSelectedUserName()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white">
                <Command>
                  <CommandInput
                    placeholder="Search users..."
                    value={userSearch}
                    onValueChange={setUserSearch}
                    className="border-0 focus:ring-0"
                  />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name} ${user.email}`}
                          onSelect={() => {
                            setSelectedUser(
                              user.id === selectedUser ? "" : user.id
                            );
                            setUserOpen(false);
                            setUserSearch("");
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser === user.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
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

          {selectedUser && (
            <>
              <div className="space-y-4">
                <Label>Add Raw Materials to Transfer</Label>
                <div className="flex gap-4 items-end">
                  {/* Searchable Material Selector */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="material">Select Material</Label>
                    <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
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
                                      Stock: {material.quantity} {material.unit}
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
                    <Label htmlFor="quantity">Quantity to Issue</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      value={currentItem.quantityIssued}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantityIssued: parseFloat(e.target.value) || 0,
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
                      currentItem.quantityIssued <= 0
                    }
                    className="bg-blue-600 hover:bg-blue-700 mb-1 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Add raw materials to be issued to the selected user
                </p>
              </div>

              {transferItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Transfer Items</Label>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary">
                        Total Qty: {totalQuantity}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">
                            Raw Material
                          </TableHead>
                          <TableHead className="w-[20%]">
                            Current Stock
                          </TableHead>
                          <TableHead className="w-[20%]">
                            Quantity to Issue
                          </TableHead>
                          <TableHead className="w-[10%]">Unit</TableHead>
                          <TableHead className="w-[10%] text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferItems.map((item) => (
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
                              <div className="text-sm text-muted-foreground">
                                {item.currentStock} {item.materialUnit}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {item.quantityIssued}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {item.materialUnit}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.rawMaterialId)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Notes and Submit */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Input
                        id="notes"
                        placeholder="Add any notes about this transfer..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Transferring {totalItems} material
                        {totalItems !== 1 ? "s" : ""} to user
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting || transferItems.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? "Processing..." : "Issue Materials"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {transferItems.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No materials added for transfer
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add materials above to create a transfer
                  </p>
                </div>
              )}
            </>
          )}

          {!selectedUser && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50/50">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Select a user to start creating a material transfer
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
