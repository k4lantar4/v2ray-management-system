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
const subscriptions = [
  {
    id: 1,
    username: "user1",
    planName: "پلن طلایی",
    server: "سرور آلمان ۱",
    startDate: "2024-03-01T10:00:00Z",
    endDate: "2024-04-01T10:00:00Z",
    price: 29.99,
    status: "active",
  },
  {
    id: 2,
    username: "user2",
    planName: "پلن نقره‌ای",
    server: "سرور هلند ۱",
    startDate: "2024-02-15T14:30:00Z",
    endDate: "2024-03-15T14:30:00Z",
    price: 19.99,
    status: "expired",
  },
  {
    id: 3,
    username: "user3",
    planName: "پلن برنزی",
    server: "سرور فرانسه ۱",
    startDate: "2024-01-20T08:15:00Z",
    endDate: "2024-02-20T08:15:00Z",
    price: 9.99,
    status: "cancelled",
  },
];

interface SubscriptionsListProps {
  search: string;
  statusFilter: string;
}

export function SubscriptionsList({
  search,
  statusFilter,
}: SubscriptionsListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      search === "" ||
      subscription.username.toLowerCase().includes(search.toLowerCase()) ||
      subscription.planName.toLowerCase().includes(search.toLowerCase()) ||
      subscription.server.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || subscription.status === statusFilter;

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
      case "expired":
        return (
          <Badge variant="default" className="bg-yellow-500">
            منقضی شده
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="default" className="bg-red-500">
            لغو شده
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete subscription:", id);
  };

  const handleRenew = async (id: number) => {
    // TODO: Implement renew functionality
    console.log("Renew subscription:", id);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>کاربر</TableHead>
            <TableHead>پلن</TableHead>
            <TableHead>سرور</TableHead>
            <TableHead>تاریخ شروع</TableHead>
            <TableHead>تاریخ پایان</TableHead>
            <TableHead>قیمت</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSubscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>{subscription.username}</TableCell>
              <TableCell>{subscription.planName}</TableCell>
              <TableCell>{subscription.server}</TableCell>
              <TableCell dir="ltr" className="text-left">
                {formatDate(new Date(subscription.startDate))}
              </TableCell>
              <TableCell dir="ltr" className="text-left">
                {formatDate(new Date(subscription.endDate))}
              </TableCell>
              <TableCell dir="ltr" className="text-left">
                ${subscription.price.toFixed(2)}
              </TableCell>
              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <Icons.more className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/dashboard/subscriptions/${subscription.id}`)
                      }
                    >
                      <Icons.edit className="ml-2 h-4 w-4" />
                      ویرایش
                    </DropdownMenuItem>
                    {subscription.status === "expired" && (
                      <DropdownMenuItem
                        onClick={() => handleRenew(subscription.id)}
                      >
                        <Icons.refresh className="ml-2 h-4 w-4" />
                        تمدید
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(subscription.id)}
                    >
                      <Icons.trash className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filteredSubscriptions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                هیچ اشتراکی یافت نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 