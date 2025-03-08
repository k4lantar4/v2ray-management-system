'use client';

import { useEffect, useState } from 'react';
import { useTransactionStore } from '@/store';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionStatus, TransactionType } from '@/types/api';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, total, page, limit, isLoading, error, getTransactions } = useTransactionStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [type, setType] = useState<TransactionType | ''>('');

  useEffect(() => {
    loadTransactions();
  }, [page, limit, search, status, type]);

  const loadTransactions = () => {
    getTransactions({
      page,
      limit,
      search: search || undefined,
      status: (status as TransactionStatus) || undefined,
      type: (type as TransactionType) || undefined,
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as TransactionStatus | '');
  };

  const handleTypeChange = (value: string) => {
    setType(value as TransactionType | '');
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
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search transactions..."
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <TransactionTable transactions={transactions} />
      )}
    </div>
  );
} 