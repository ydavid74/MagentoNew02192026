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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ShoppingCart,
  Diamond,
  Cog,
  Package,
  Search,
} from "lucide-react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { FastSearch } from "@/components/ui/FastSearch";

const navigationItems = [
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    adminOnly: false,
  },
  {
    title: "Casting Module",
    url: "/casting-module",
    icon: Package,
    adminOnly: false,
  },
  {
    title: "Diamonds",
    url: "/diamonds",
    icon: Diamond,
    adminOnly: true,
  },
  {
    title: "System Settings",
    url: "/system-settings",
    icon: Cog,
    adminOnly: true,
  },
];

export function AdminNavbar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === "admin";
  // Debug logging
  console.log("AdminNavbar: Profile:", profile);
  console.log("AdminNavbar: Profile role:", profile?.role);
  console.log("AdminNavbar: Is admin:", isAdmin);

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  console.log(
    "AdminNavbar: Visible items:",
    visibleItems.map((item) => item.title)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <header className="h-14 px-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#171717]/80 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-6">
          <img
            src="/logo.png"
            alt="Magento Admin Logo"
            className="h-16 w-32 object-contain"
          />
          {/* <h1 className="text-base font-semibold text-gray-900 dark:text-white font-sans antialiased">Magento Admin</h1> */}
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-0.5 [&_a]:!no-underline [&_a:hover]:!no-underline [&_a:focus]:!no-underline [&_a:visited]:!no-underline [&_a:active]:!no-underline">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.url ||
              (item.url === "/orders" &&
                location.pathname.startsWith("/orders"));

            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 font-sans antialiased !no-underline ${
                    isActive
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "text-foreground hover:text-foreground hover:bg-accent"
                  }`
                }
                style={{
                  textDecoration: "none",
                  textDecorationLine: "none",
                  textDecorationThickness: "0",
                  textUnderlineOffset: "0",
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Fast Order Search */}
        <FastSearch 
          placeholder="Search orders..."
          className="w-48 md:w-64"
            />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 avatar-button"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt={user?.email || "User"} />
                <AvatarFallback className="text-xs font-medium bg-green-600 text-white font-sans antialiased">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717] shadow-lg"
          >
            <DropdownMenuLabel className="font-normal px-2.5 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none text-foreground font-sans antialiased">
                  {(profile as any)?.first_name && (profile as any)?.last_name
                    ? `${(profile as any).first_name} ${
                        (profile as any).last_name
                      }`
                    : user?.email || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground font-sans antialiased">
                  {profile?.role || "User"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="px-2.5 py-1.5 text-sm text-foreground hover:bg-accent font-sans antialiased cursor-pointer dropdown-menu-item"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="px-2.5 py-1.5 text-sm text-foreground hover:bg-accent font-sans antialiased cursor-pointer dropdown-menu-item"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-sans antialiased cursor-pointer dropdown-menu-item"
            >
              <div className="flex items-center mr-2">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
              Toggle theme
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="px-2.5 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-sans antialiased cursor-pointer dropdown-menu-item"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
