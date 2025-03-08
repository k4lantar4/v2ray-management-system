"use client";

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store';
import { UserTable } from '@/components/users/UserTable';
import { AddCreditDialog } from '@/components/users/AddCreditDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Status } from '@/types/api';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { users, total, page, limit, isLoading, error, getUsers } = useUserStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, limit, search, status]);

  const loadUsers = () => {
    getUsers({
      page,
      limit,
      search: search || undefined,
      status: (status as Status) || undefined,
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as Status | '');
  };

  const handleAddCredit = (userId: number) => {
    setSelectedUserId(userId);
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button>Add User</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <UserTable users={users} onAddCredit={handleAddCredit} />
      )}

      <AddCreditDialog
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
} 