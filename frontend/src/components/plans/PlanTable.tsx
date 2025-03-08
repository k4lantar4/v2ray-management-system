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
  Pencil,
  Trash,
  Check,
  X,
} from 'lucide-react';
import { Plan, Status } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface PlanTableProps {
  plans: Plan[];
  onEdit: (planId: number) => void;
  onDelete: (planId: number) => void;
  onToggleStatus: (planId: number) => void;
}

export function PlanTable({
  plans,
  onEdit,
  onDelete,
  onToggleStatus,
}: PlanTableProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFeatures = (features: string[]) => {
    return features.join(', ');
  };

  const formatDuration = (months: number) => {
    if (months === 1) return '1 Month';
    if (months === 12) return '1 Year';
    return `${months} Months`;
  };

  const formatBandwidth = (gb: number) => {
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`;
    }
    return `${gb} GB`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Bandwidth</TableHead>
          <TableHead>Features</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.name}</TableCell>
            <TableCell>{plan.description}</TableCell>
            <TableCell>${plan.price.toFixed(2)}</TableCell>
            <TableCell>{formatDuration(plan.duration)}</TableCell>
            <TableCell>{formatBandwidth(plan.bandwidth)}</TableCell>
            <TableCell className="max-w-[200px] truncate" title={formatFeatures(plan.features)}>
              {formatFeatures(plan.features)}
            </TableCell>
            <TableCell>
              <span className={getStatusColor(plan.status)}>
                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              </span>
            </TableCell>
            <TableCell>{formatDate(plan.createdAt)}</TableCell>
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
                  <DropdownMenuItem onClick={() => onEdit(plan.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(plan.id)}>
                    {plan.status === 'active' ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(plan.id)}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 