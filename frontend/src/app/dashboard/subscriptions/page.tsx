"use client";

import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '@/store';
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { SubscriptionUsageDialog } from '@/components/subscriptions/SubscriptionUsageDialog';
import { RenewSubscriptionDialog } from '@/components/subscriptions/RenewSubscriptionDialog';
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

export default function SubscriptionsPage() {
  const { subscriptions, total, page, limit, isLoading, error, getSubscriptions } =
    useSubscriptionStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [dialogType, setDialogType] = useState<'usage' | 'renew' | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [page, limit, search, status]);

  const loadSubscriptions = () => {
    getSubscriptions({
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

  const handleViewConfig = async (subscriptionId: number) => {
    try {
      const config = await useSubscriptionStore
        .getState()
        .generateSubscriptionConfig(subscriptionId);
      // TODO: Implement config download
      console.log('Download config:', config);
    } catch (error) {
      console.error('Failed to generate config:', error);
    }
  };

  const handleViewUsage = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setDialogType('usage');
  };

  const handleViewInvoices = async (subscriptionId: number) => {
    try {
      const invoices = await useSubscriptionStore
        .getState()
        .getSubscriptionInvoices(subscriptionId);
      // TODO: Implement invoices view
      console.log('View invoices:', invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const handleRenew = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setDialogType('renew');
  };

  const handleCloseDialog = () => {
    setSelectedSubscriptionId(null);
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
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Button>Add Subscription</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search subscriptions..."
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
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          onViewConfig={handleViewConfig}
          onViewUsage={handleViewUsage}
          onViewInvoices={handleViewInvoices}
          onRenew={handleRenew}
        />
      )}

      {dialogType === 'usage' && (
        <SubscriptionUsageDialog
          subscriptionId={selectedSubscriptionId}
          onClose={handleCloseDialog}
        />
      )}

      {dialogType === 'renew' && (
        <RenewSubscriptionDialog
          subscriptionId={selectedSubscriptionId}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
} 