"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { formatDate } from "@/lib/utils";

// Temporary mock data
const users = [
  {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    telegramId: "12345678",
    credit: 100,
    status: "active",
    registeredAt: "2024-03-01T10:00:00Z",
  },
  {
    id: 2,
    username: "user2",
    email: "user2@example.com",
    telegramId: "87654321",
    credit: 50,
    status: "inactive",
    registeredAt: "2024-02-15T14:30:00Z",
  },
  {
    id: 3,
    username: "user3",
    email: "user3@example.com",
    telegramId: "11223344",
    credit: 0,
    status: "blocked",
    registeredAt: "2024-01-20T08:15:00Z",
  },
];

interface UsersListProps {
  search: string;
  statusFilter: string;
}

export function UsersList({ search, statusFilter }: UsersListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.telegramId.includes(search);

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            فعال
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="default" className="bg-yellow-500">
            غیرفعال
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="default" className="bg-red-500">
            مسدود شده
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete user:", id);
  };

  const handleToggleBlock = async (id: number) => {
    // TODO: Implement block/unblock functionality
    console.log("Toggle block user:", id);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نام کاربری</TableHead>
            <TableHead>شناسه تلگرام</TableHead>
            <TableHead>اعتبار</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead>تاریخ ثبت‌نام</TableHead>
            <TableHead>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </TableCell>
              <TableCell dir="ltr" className="text-left">
                {user.telegramId}
              </TableCell>
              <TableCell dir="ltr" className="text-left">
                ${user.credit.toFixed(2)}
              </TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell dir="ltr" className="text-left">
                {formatDate(new Date(user.registeredAt))}
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
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    >
                      <Icons.edit className="ml-2 h-4 w-4" />
                      ویرایش
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleBlock(user.id)}>
                      <Icons.ban className="ml-2 h-4 w-4" />
                      {user.status === "blocked"
                        ? "رفع مسدودیت"
                        : "مسدود کردن"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Icons.trash className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                هیچ کاربری یافت نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 