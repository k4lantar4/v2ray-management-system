'use client';

import { useEffect, useState } from 'react';
import { useTelegramStore } from '@/store';
import { ChannelTable } from '@/components/telegram/ChannelTable';
import { ContentGeneratorDialog } from '@/components/telegram/ContentGeneratorDialog';
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
import { Loader2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ChannelsPage() {
  const { channels, total, page, limit, isLoading, error, getChannels } = useTelegramStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    loadChannels();
  }, [page, limit, search, status]);

  const loadChannels = () => {
    getChannels({
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

  const handleAddChannel = () => {
    // Open Telegram bot to add channel
    window.open(process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL, '_blank');
  };

  const handleViewStats = (channelId: string) => {
    // Navigate to channel stats page
    window.location.href = `/dashboard/channels/${channelId}/stats`;
  };

  const handleGenerateContent = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowContentGenerator(true);
  };

  const handleSchedulePosts = (channelId: string) => {
    // Navigate to post scheduler page
    window.location.href = `/dashboard/channels/${channelId}/schedule`;
  };

  const handleRemove = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedChannelId) return;

    try {
      await useTelegramStore.getState().removeChannel(selectedChannelId);
      loadChannels();
    } catch (error) {
      console.error('Failed to remove channel:', error);
    } finally {
      setShowDeleteAlert(false);
      setSelectedChannelId(null);
    }
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
        <h1 className="text-2xl font-bold">Telegram Channels</h1>
        <Button onClick={handleAddChannel}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search channels..."
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
        <ChannelTable
          channels={channels}
          onViewStats={handleViewStats}
          onGenerateContent={handleGenerateContent}
          onSchedulePosts={handleSchedulePosts}
          onRemove={handleRemove}
        />
      )}

      {showContentGenerator && selectedChannelId && (
        <ContentGeneratorDialog
          channelId={selectedChannelId}
          onClose={() => {
            setShowContentGenerator(false);
            setSelectedChannelId(null);
          }}
        />
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the channel from your management system. You can add it back
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 