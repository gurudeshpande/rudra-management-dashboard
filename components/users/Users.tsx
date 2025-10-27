// components/users/UserManagement.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Shield,
  Calendar,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string; // Make password optional
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
}
interface UserManagementProps {
  themeColor?: string;
  themeLight?: string;
}

export default function UserManagement({
  themeColor = "#954C2E",
  themeLight = "#F5E9E4",
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Dialog states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Reset form when opening/closing dialog
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowUserForm(true);
  };

  const openEditDialog = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password for security
      role: user.role,
    });
    setEditingUser(user);
    setShowUserForm(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const closeDialogs = () => {
    setShowUserForm(false);
    setShowDeleteDialog(false);
    setDeletingUser(null);
    resetForm();
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password required only for new users
    if (!editingUser && !formData.password) {
      errors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // if (!formData.role) {
    //   errors.role = "Role is required";
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const url = editingUser
        ? `/api/auth/users/${editingUser.id}`
        : "/api/auth/users";
      const method = editingUser ? "PUT" : "POST";

      // Prepare data - don't send password if empty (for updates)
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password; // Now this works because password is optional
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save user");
      }

      alert(
        editingUser
          ? "User updated successfully!"
          : "User created successfully!"
      );
      closeDialogs();
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error instanceof Error ? error.message : "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`/api/auth/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete user");
      }

      alert("User deleted successfully!");
      closeDialogs();
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  // Get role badge variant
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { variant: "destructive" as const, label: "Super Admin" };
      case "ADMIN":
        return { variant: "default" as const, label: "Admin" };
      case "USER":
        return { variant: "secondary" as const, label: "User" };
      default:
        return { variant: "outline" as const, label: role };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#954C2E] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" style={{ color: themeColor }} />
                  User Management
                </CardTitle>
                <CardDescription>
                  Create, edit, and manage system users
                </CardDescription>
              </div>
              <Button
                onClick={openCreateDialog}
                style={{ backgroundColor: themeColor }}
                className="text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {filteredUsers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const roleBadge = getRoleBadge(user.role);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-full"
                                style={{ backgroundColor: themeLight }}
                              >
                                <User
                                  className="h-4 w-4"
                                  style={{ color: themeColor }}
                                />
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadge.variant}>
                              {roleBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                className="h-8 px-3"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={user.role === "SUPER_ADMIN"} // Prevent deleting super admins
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No users found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first user"}
                </p>
                <Button
                  onClick={openCreateDialog}
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit User Dialog */}
        <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user information below."
                  : "Add a new user to the system."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={cn(formErrors.name && "border-red-500")}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={cn(formErrors.email && "border-red-500")}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password {editingUser && ""}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    editingUser ? "Enter new password" : "Enter password"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={cn(formErrors.password && "border-red-500")}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "SUPER_ADMIN" | "ADMIN" | "USER") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger
                    className={cn(formErrors.role && "border-red-500")}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialogs}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: themeColor }}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingUser?.name}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {deletingUser && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <User className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">
                      {deletingUser.name}
                    </p>
                    <p className="text-sm text-red-700">{deletingUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
