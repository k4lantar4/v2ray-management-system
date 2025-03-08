"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface MainNavProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function MainNav({ isSidebarOpen, setIsSidebarOpen }: MainNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "داشبورد",
      icon: Icons.dashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/servers",
      label: "سرورها",
      icon: Icons.server,
      active: pathname.startsWith("/dashboard/servers"),
    },
    {
      href: "/dashboard/users",
      label: "کاربران",
      icon: Icons.users,
      active: pathname.startsWith("/dashboard/users"),
    },
    {
      href: "/dashboard/subscriptions",
      label: "اشتراک‌ها",
      icon: Icons.subscription,
      active: pathname.startsWith("/dashboard/subscriptions"),
    },
    {
      href: "/dashboard/transactions",
      label: "تراکنش‌ها",
      icon: Icons.transaction,
      active: pathname.startsWith("/dashboard/transactions"),
    },
  ];

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          V2Ray Management
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              route.active ? "text-foreground" : "text-foreground/60"
            )}
          >
            <div className="flex items-center space-x-2">
              <route.icon className="h-4 w-4" />
              <span>{route.label}</span>
            </div>
          </Link>
        ))}
      </nav>
      <Button
        variant="ghost"
        className="ml-2 px-2 md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Icons.menu className="h-6 w-6" />
      </Button>
    </div>
  );
} 