"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
}

interface UserInventory {
  id: number;
  userId: string;
  rawMaterialId: number;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  rawMaterial: RawMaterial;
}

interface UserInventoryProps {
  themeColor?: string;
  themeLight?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserInventory({
  themeColor = "#954C2E",
  themeLight = "#F5E9E4",
}: UserInventoryProps) {
  const [inventory, setInventory] = useState<UserInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Get user from localStorage and parse it
  useEffect(() => {
    const getUserFromStorage = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const user: User = JSON.parse(userData);
            setUserId(user.id);
            setUserRole(user.role);
            // For super admin, set selected user to current user by default
            if (user.role === "SUPER_ADMIN") {
              setSelectedUserId(user.id);
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
            setError("Invalid user data");
          }
        } else {
          setError("User not found in localStorage");
        }
      }
    };

    getUserFromStorage();
  }, []);

  // Fetch all users for super admin dropdown
  const fetchUsers = async () => {
    if (userRole !== "SUPER_ADMIN") return;

    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view users");
        return;
      }

      const response = await fetch("/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      console.log(data, "Users");

      // Filter users to only include those with role "USER"
      const userRoleUsers =
        data?.users?.filter((user: UserOption) => user.role === "USER") || [];
      setUsers(userRoleUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInventory = async (targetUserId?: string) => {
    const inventoryUserId = targetUserId || selectedUserId || userId;
    if (!inventoryUserId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view inventory");
        return;
      }

      const response = await fetch(
        `/api/user-inventory?userId=${inventoryUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "SUPER_ADMIN") {
      fetchUsers();
    }
  }, [userRole]);

  useEffect(() => {
    if (userId || selectedUserId) {
      fetchInventory();
    }
  }, [userId, selectedUserId]);

  const handleUserChange = (value: string) => {
    setSelectedUserId(value);
    // Inventory will be fetched automatically via useEffect
  };

  const getQuantityColor = (quantity: number) => {
    if (quantity === 0) return "text-red-600";
    if (quantity < 10) return "text-amber-600";
    return "text-green-600";
  };

  const getQuantityBadge = (quantity: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800";
    if (quantity < 10) return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };

  const getCurrentUserName = () => {
    if (userRole !== "SUPER_ADMIN" || !selectedUserId) {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user: User = JSON.parse(userData);
        return user.name;
      }
      return "User";
    }

    const selectedUser = users.find((user) => user.id === selectedUserId);
    return selectedUser ? selectedUser.name : "Selected User";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {userRole === "SUPER_ADMIN" ? "User Inventory" : "My Inventory"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#954C2E] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading inventory...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {userRole === "SUPER_ADMIN" ? "User Inventory" : "My Inventory"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={() => fetchInventory()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader
          style={{ backgroundColor: themeLight }}
          className="rounded-t-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle
              className="flex items-center gap-2"
              style={{ color: themeColor }}
            >
              <Warehouse className="h-5 w-5" />
              {userRole === "SUPER_ADMIN"
                ? "User Inventory"
                : "My Raw Material Inventory"}
              <Badge variant="secondary" className="ml-2">
                {inventory.length} items
              </Badge>
            </CardTitle>

            {userRole === "SUPER_ADMIN" && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedUserId || ""}
                  onValueChange={handleUserChange}
                  disabled={loadingUsers}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue
                      placeholder={
                        loadingUsers ? "Loading users..." : "Select user"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>
                        No users found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {userRole === "SUPER_ADMIN" && selectedUserId && (
            <p className="text-sm text-gray-600 mt-2">
              Viewing inventory for: <strong>{getCurrentUserName()}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {inventory.length > 0 ? (
            <div className="space-y-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: themeLight }}
                    >
                      <Package
                        className="h-4 w-4"
                        style={{ color: themeColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.rawMaterial.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Last updated:{" "}
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className={getQuantityBadge(item.quantity)}
                    >
                      <span className={getQuantityColor(item.quantity)}>
                        {item.quantity.toLocaleString()} {item.unit}
                      </span>
                    </Badge>
                    {item.quantity === 0 && (
                      <p className="text-xs text-red-600 mt-1">Out of stock</p>
                    )}
                    {item.quantity > 0 && item.quantity < 10 && (
                      <p className="text-xs text-amber-600 mt-1">Low stock</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Warehouse className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Inventory Items
              </h3>
              <p className="text-gray-600">
                {userRole === "SUPER_ADMIN"
                  ? "The selected user has no inventory items."
                  : "Your inventory is empty. Approved raw materials will appear here."}
              </p>
            </div>
          )}

          {/* Inventory Summary */}
          {inventory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">
                Inventory Summary for {getCurrentUserName()}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {inventory.length}
                  </p>
                  <p className="text-blue-800">Total Items</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {inventory.filter((item) => item.quantity > 0).length}
                  </p>
                  <p className="text-green-800">In Stock</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {inventory.filter((item) => item.quantity === 0).length}
                  </p>
                  <p className="text-red-800">Out of Stock</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
