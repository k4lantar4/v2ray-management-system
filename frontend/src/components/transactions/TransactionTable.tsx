import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transaction, TransactionStatus, TransactionType } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">{transaction.id}</TableCell>
            <TableCell>{transaction.user.email}</TableCell>
            <TableCell className={getTypeColor(transaction.type)}>
              {formatAmount(transaction.amount)}
            </TableCell>
            <TableCell className={getTypeColor(transaction.type)}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </TableCell>
            <TableCell>
              <span className={getStatusColor(transaction.status)}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </TableCell>
            <TableCell className="max-w-[300px] truncate" title={transaction.description}>
              {transaction.description}
            </TableCell>
            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 