import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  RefreshCcw,
  XCircle,
  FileText,
  Download,
  BarChart2,
} from 'lucide-react';
import { Subscription, Status } from '@/types/api';
import { useSubscriptionStore } from '@/store';
import { formatDate } from '@/lib/utils';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onViewConfig: (subscriptionId: number) => void;
  onViewUsage: (subscriptionId: number) => void;
  onViewInvoices: (subscriptionId: number) => void;
  onRenew: (subscriptionId: number) => void;
}

export function SubscriptionTable({
  subscriptions,
  onViewConfig,
  onViewUsage,
  onViewInvoices,
  onRenew,
}: SubscriptionTableProps) {
  const { cancelSubscription } = useSubscriptionStore();
  const [loading, setLoading] = useState<number | null>(null);

  const handleCancel = async (subscriptionId: number) => {
    try {
      setLoading(subscriptionId);
      await cancelSubscription(subscriptionId);
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'expired':
        return 'text-red-600';
      case 'cancelled':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Server</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription) => (
          <TableRow key={subscription.id}>
            <TableCell>{subscription.user?.username}</TableCell>
            <TableCell>{subscription.plan?.name}</TableCell>
            <TableCell>{subscription.server?.name}</TableCell>
            <TableCell>{formatDate(subscription.startDate)}</TableCell>
            <TableCell>{formatDate(subscription.endDate)}</TableCell>
            <TableCell>${subscription.price.toFixed(2)}</TableCell>
            <TableCell>
              <span className={getStatusColor(subscription.status)}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewConfig(subscription.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    View Config
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewUsage(subscription.id)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View Usage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewInvoices(subscription.id)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Invoices
                  </DropdownMenuItem>
                  {subscription.status === 'active' && (
                    <>
                      <DropdownMenuItem onClick={() => onRenew(subscription.id)}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Renew
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancel(subscription.id)}
                        disabled={loading === subscription.id}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 