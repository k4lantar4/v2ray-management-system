"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

// Temporary mock data
const servers = [
  {
    id: 1,
    name: "سرور آلمان ۱",
    location: "آلمان",
    ip: "192.168.1.1",
    portRange: "10000-20000",
    activeUsers: 150,
    load: 75,
    status: "online",
  },
  {
    id: 2,
    name: "سرور هلند ۱",
    location: "هلند",
    ip: "192.168.1.2",
    portRange: "20000-30000",
    activeUsers: 98,
    load: 45,
    status: "online",
  },
  {
    id: 3,
    name: "سرور فرانسه ۱",
    location: "فرانسه",
    ip: "192.168.1.3",
    portRange: "30000-40000",
    activeUsers: 0,
    load: 0,
    status: "maintenance",
  },
];

interface ServersListProps {
  search: string;
  statusFilter: string;
}

export function ServersList({ search, statusFilter }: ServersListProps) {
  const [isLoading, setIsLoading] = useState(false);

  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      search === "" ||
      server.name.toLowerCase().includes(search.toLowerCase()) ||
      server.location.toLowerCase().includes(search.toLowerCase()) ||
      server.ip.includes(search);

    const matchesStatus =
      statusFilter === "all" || server.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500">
            آنلاین
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="default" className="bg-red-500">
            آفلاین
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="default" className="bg-yellow-500">
            در حال تعمیر
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete server:", id);
  };

  const handleMaintenanceMode = async (id: number) => {
    // TODO: Implement maintenance mode toggle
    console.log("Toggle maintenance mode:", id);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>وضعیت</TableHead>
            <TableHead>نام/مکان</TableHead>
            <TableHead>آدرس IP</TableHead>
            <TableHead>محدوده پورت</TableHead>
            <TableHead>کاربران فعال</TableHead>
            <TableHead>میزان استفاده</TableHead>
            <TableHead>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServers.map((server) => (
            <TableRow key={server.id}>
              <TableCell>{getStatusBadge(server.status)}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{server.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {server.location}
                  </div>
                </div>
              </TableCell>
              <TableCell>{server.ip}</TableCell>
              <TableCell>{server.portRange}</TableCell>
              <TableCell>{server.activeUsers}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-24 rounded-full bg-secondary"
                    style={{
                      background: `linear-gradient(90deg, ${
                        server.load > 80
                          ? "rgb(239 68 68)"
                          : server.load > 60
                          ? "rgb(234 179 8)"
                          : "rgb(34 197 94)"
                      } ${server.load}%, transparent ${server.load}%)`,
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {server.load}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <Icons.more className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => console.log("Edit server:", server.id)}
                    >
                      <Icons.edit className="ml-2 h-4 w-4" />
                      ویرایش
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMaintenanceMode(server.id)}
                    >
                      <Icons.tools className="ml-2 h-4 w-4" />
                      {server.status === "maintenance"
                        ? "خروج از حالت تعمیر"
                        : "ورود به حالت تعمیر"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(server.id)}
                    >
                      <Icons.trash className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filteredServers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                هیچ سروری یافت نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 