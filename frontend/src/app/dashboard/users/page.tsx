"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersList } from "@/components/users/users-list";
import { Icons } from "@/components/icons";

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
        <Button onClick={() => router.push("/dashboard/users/new")}>
          <Icons.plus className="ml-2 h-4 w-4" />
          افزودن کاربر جدید
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="w-full max-w-[300px]">
            <Input
              placeholder="جستجو در کاربران..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
              <SelectItem value="blocked">مسدود شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <UsersList search={search} statusFilter={statusFilter} />
    </div>
  );
} 