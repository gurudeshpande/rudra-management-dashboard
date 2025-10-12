// components/dashboard/DashboardLayout.tsx
"use client";
import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart,
  ChevronDown,
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
  List,
  BarChart2Icon,
  Factory,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  href: string;
  icon: any;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // ✅ Fetch user data from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setUserData(parsed);
      setRole(parsed.role);
    } else {
      router.push("/login");
    }
  }, [router]);

  // Toggle submenu
  const toggleSubmenu = (menuName: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // ✅ Role-based menu items with submenus
  const menuItems: Record<string, MenuItem[]> = {
    SUPER_ADMIN: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "User Management",
        href: "/super-admin/users",
        icon: Package,
      },
      {
        name: "Inventory",
        href: "/super-admin/inventory/inventory-management",
        icon: Package,
      },
      {
        name: "Billing & Invoices",
        href: "#",
        icon: FileText,
        subItems: [
          {
            name: "Create Invoice",
            href: "/super-admin/invoices",
            icon: PlusCircle,
          },
          {
            name: "All Invoices",
            href: "/super-admin/invoicemanagement",
            icon: List,
          },
        ],
      },
      {
        name: "Manifacturing",
        href: "/super-admin/manufacturing",
        icon: Factory,
      },
      {
        name: "Analytics",
        href: "/super-admin/analysis",
        icon: BarChart2Icon,
      },
    ],
    ADMIN: [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Inventory",
        href: "/admin/inventory",
        icon: Package,
      },
      { name: "Invoices", href: "/admin/invoices", icon: FileText },
    ],
    USER: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Invoices", href: "/invoices", icon: FileText },
      { name: "Products", href: "/products", icon: ShoppingCart },
    ],
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Check if a menu item is active (including submenu items)
  const isMenuItemActive = (item: MenuItem) => {
    if (item.href !== "#" && pathname === item.href) return true;

    if (item.subItems) {
      return item.subItems.some((subItem) => pathname === subItem.href);
    }

    return false;
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed position, not scrollable */}
      <motion.aside
        initial={isMobile ? { x: -280 } : { x: 0 }}
        animate={isMobile ? { x: sidebarOpen ? 0 : -280 } : { x: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-72 bg-gray-800 shadow-xl flex flex-col z-50 lg:z-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-800 to-amber-600 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Dashboard</span>
          </motion.div>
          {isMobile && (
            <button className="p-2" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-white" />
            </button>
          )}
        </div>

        {/* User profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 py-5 border-b border-gray-800"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow">
              <AvatarImage src={userData?.avatar} alt={userData?.name} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                {userData?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {userData?.name || "User"}
              </p>
              <p className="text-sm text-gray-300 truncate">
                {userData?.email || "user@example.com"}
              </p>
            </div>
          </div>
          <Badge className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
            {role?.replace("_", " ") || "User"}
          </Badge>
        </motion.div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 py-6 space-y-1">
          {role &&
            menuItems[role]?.map((item, index) => {
              const isActive = isMenuItemActive(item);
              const hasSubmenu = item.subItems && item.subItems.length > 0;
              const isSubmenuOpen = openSubmenus[item.name] || false;

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  {hasSubmenu ? (
                    <div>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-amber-900 border-r-2 border-amber-600"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                        onClick={() => toggleSubmenu(item.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon
                            className={cn(
                              "h-5 w-5",
                              isActive ? "text-amber-800" : "text-gray-400"
                            )}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isSubmenuOpen && "rotate-90"
                          )}
                        />
                      </Button>

                      <AnimatePresence>
                        {isSubmenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-6 mt-1 space-y-1 overflow-hidden"
                          >
                            {item.subItems?.map((subItem) => {
                              const isSubItemActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className="block"
                                >
                                  <Button
                                    variant={
                                      isSubItemActive ? "secondary" : "ghost"
                                    }
                                    className={cn(
                                      "w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200",
                                      isSubItemActive
                                        ? "bg-blue-50 text-amber-900 border-r-2 border-amber-600"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    )}
                                  >
                                    <subItem.icon
                                      className={cn(
                                        "h-4 w-4",
                                        isSubItemActive
                                          ? "text-amber-800"
                                          : "text-gray-400"
                                      )}
                                    />
                                    <span>{subItem.name}</span>
                                  </Button>
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full flex items-center justify-start space-x-3 px-4 py-3 transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-amber-900 border-r-2 border-amber-600"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-amber-800" : "text-gray-400"
                          )}
                        />
                        <span className="font-medium">{item.name}</span>
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
        </nav>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-gray-800 p-4"
        >
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-white hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </motion.div>
      </motion.aside>

      {/* Main content - Scrollable area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        {" "}
        {/* Added left margin for sidebar */}
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-9 bg-gray-100 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={userData?.avatar}
                        alt={userData?.name}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        {userData?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">
                        {userData?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {role?.toLowerCase().replace("_", " ") || "User"}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        {/* Page Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
