"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="pr-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center border-b pb-4 pr-6">
            <Link href="/" className="flex items-center space-x-2">
              <Icons.logo className="h-6 w-6" />
              <span className="font-bold">V2Ray Management</span>
            </Link>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-2 pr-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
                    route.active ? "bg-accent" : "transparent"
                  )}
                >
                  <route.icon className="ml-2 h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
} 