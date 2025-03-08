"use client";

import { useEffect, useState } from 'react';
import { useServerStore } from '@/store';
import { ServerTable } from '@/components/servers/ServerTable';
import { ServerStatsDialog } from '@/components/servers/ServerStatsDialog';
import { ServerUsersDialog } from '@/components/servers/ServerUsersDialog';
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

export default function ServersPage() {
  const { servers, total, page, limit, isLoading, error, getServers } = useServerStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [dialogType, setDialogType] = useState<'stats' | 'users' | null>(null);

  useEffect(() => {
    loadServers();
  }, [page, limit, search, status]);

  const loadServers = () => {
    getServers({
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

  const handleViewStats = (serverId: number) => {
    setSelectedServerId(serverId);
    setDialogType('stats');
  };

  const handleViewUsers = (serverId: number) => {
    setSelectedServerId(serverId);
    setDialogType('users');
  };

  const handleBackup = async (serverId: number) => {
    // TODO: Implement backup functionality
    console.log('Backup server:', serverId);
  };

  const handleRestore = async (serverId: number) => {
    // TODO: Implement restore functionality
    console.log('Restore server:', serverId);
  };

  const handleCloseDialog = () => {
    setSelectedServerId(null);
    setDialogType(null);
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
        <h1 className="text-2xl font-bold">Servers</h1>
        <Button>Add Server</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search servers..."
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
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ServerTable
          servers={servers}
          onViewStats={handleViewStats}
          onViewUsers={handleViewUsers}
          onBackup={handleBackup}
          onRestore={handleRestore}
        />
      )}

      {dialogType === 'stats' && (
        <ServerStatsDialog serverId={selectedServerId} onClose={handleCloseDialog} />
      )}

      {dialogType === 'users' && (
        <ServerUsersDialog serverId={selectedServerId} onClose={handleCloseDialog} />
      )}
    </div>
  );
} 