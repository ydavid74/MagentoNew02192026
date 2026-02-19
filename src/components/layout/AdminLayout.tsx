import { Outlet } from "react-router-dom";
import { AdminNavbar } from "./AdminNavbar";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <AdminNavbar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
      <ScrollToTopButton />
    </div>
  );
}