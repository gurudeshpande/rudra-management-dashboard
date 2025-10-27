"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CreditCard,
  BarChart,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  UserCheck,
  User,
  List,
  PlaySquareIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
  name?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
};

type ServiceCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  role: string[];
  badge?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const allServiceCards: ServiceCard[] = [
    {
      title: "Billing & Invoices",
      description: "Create, view and manage invoices",
      icon: <FileText className="h-8 w-8" />,
      href: "/super-admin/invoices",
      role: ["SUPER_ADMIN", "ADMIN"],
      badge: "All Access",
    },
    {
      title: "User Management",
      description: "Create, view and manage Users",
      icon: <User className="h-8 w-8" />,
      href: "/super-admin/users",
      role: ["SUPER_ADMIN"],
      badge: "All Access",
    },
    {
      title: "Analysis",
      description: "Generate and view detailed reports",
      icon: <TrendingUp className="h-8 w-8" />,
      href: "/super-admin/analysis",
      role: ["SUPER_ADMIN", "ADMIN"],
      badge: "Analysis",
    },
    {
      title: "Inventory",
      description: "Track and manage product inventory",
      icon: <List className="h-8 w-8" />,
      href: "/super-admin/inventory/inventory-management",
      role: ["SUPER_ADMIN"],
      badge: "Management",
    },
    {
      title: "Manifacturing",
      description: "Track and manage Raw Material product inventory",
      icon: <Package className="h-8 w-8" />,
      href: "/super-admin/manufacturing",
      role: ["SUPER_ADMIN", "ADMIN"],
      badge: "Management",
    },
    // {
    //   title: "User Management",
    //   description: "Manage system users, roles and permissions",
    //   icon: <Users className="h-8 w-8" />,
    //   href: "/super-admin/users",
    //   role: ["SUPER_ADMIN"],
    //   badge: "Admin Only",
    // },
    // {
    //   title: "Expense Tracking",
    //   description: "Monitor and categorize expenses",
    //   icon: <CreditCard className="h-8 w-8" />,
    //   href: "/super-admin/expenses",
    //   role: ["SUPER_ADMIN"],
    //   badge: "Financial",
    // },
    // {
    //   title: "Reseller Analytics",
    //   description: "Analyze reseller performance and metrics",
    //   icon: <BarChart className="h-8 w-8" />,
    //   href: "/super-admin/resellers",
    //   role: ["SUPER_ADMIN"],
    //   badge: "Analytics",
    // },
    {
      title: "Manifacturing",
      description: "Browse and manage available products",
      icon: <ShoppingCart className="h-8 w-8" />,
      href: "/user/manifacturing",
      role: ["USER"],
      badge: "Management",
    },
    {
      title: "User Inventory",
      description: "Browse and manage available products",
      icon: <List className="h-8 w-8" />,
      href: "/user/UserInventory",
      role: ["USER", "SUPER_ADMIN"],
      badge: "Inventory",
    },
    {
      title: "Payment Receipt",
      description: "Browse and manage available products",
      icon: <PlaySquareIcon className="h-8 w-8" />,
      href: "/super-admin/payment",
      role: ["SUPER_ADMIN"],
      badge: "Receipt",
    },

    // {
    //   title: "Profile Management",
    //   description: "Update your personal information and preferences",
    //   icon: <UserCheck className="h-8 w-8" />,
    //   href: "/profile",
    //   role: ["SUPER_ADMIN", "ADMIN"],
    //   badge: "Personal",
    // },
  ];

  const filteredCards = user
    ? allServiceCards.filter((card) => card.role.includes(user.role))
    : [];

  const handleCardClick = (href: string, isDisabled: boolean) => {
    if (!isDisabled) {
      router.push(href);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome {user.name ? user.name : user.role.replace("_", " ")}
          </h2>
          <p className="mt-2 text-gray-600">
            {user.role === "SUPER_ADMIN" &&
              "You have full access to all system modules and administrative functions."}
            {user.role === "ADMIN" &&
              "You can manage inventory, invoices, and generate reports."}
            {user.role === "USER" &&
              "You can track products, view invoices, and manage your profile."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => {
            const isDisabled =
              index !== 0 &&
              index !== 1 &&
              index !== 2 &&
              index !== 3 &&
              index !== 4 && // only first and second cards are enabled
              index !== 5 &&
              index !== 6;
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md hover:border-blue-300"
                }`}
                onClick={() => handleCardClick(card.href, isDisabled)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-2 rounded-md ${
                        isDisabled
                          ? "bg-gray-100 text-gray-400"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {card.icon}
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                  {card.badge && (
                    <Badge variant="outline" className="ml-2">
                      {card.badge}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4">
                    {card.description}
                  </CardDescription>
                  <Button
                    variant="ghost"
                    className={`p-0 h-auto ${
                      isDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                    disabled={isDisabled}
                  >
                    {isDisabled ? "Disabled" : "Access service"}{" "}
                    {!isDisabled && (
                      <ArrowRight className="ml-1 h-4 w-4 inline" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
              <LayoutDashboard className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No services available</h3>
            <p className="mt-2 text-gray-500">
              There are no services configured for your role at this time.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
