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
import { MoreHorizontal, Ban, UserCheck, CreditCard } from 'lucide-react';
import { User, Status } from '@/types/api';
import { useUserStore } from '@/store';
import { formatDate } from '@/lib/utils';

interface UserTableProps {
  users: User[];
  onAddCredit: (userId: number) => void;
}

export function UserTable({ users, onAddCredit }: UserTableProps) {
  const { blockUser, unblockUser } = useUserStore();
  const [loading, setLoading] = useState<number | null>(null);

  const handleBlock = async (userId: number) => {
    try {
      setLoading(userId);
      await blockUser(userId);
    } finally {
      setLoading(null);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      setLoading(userId);
      await unblockUser(userId);
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'blocked':
        return 'text-red-600';
      case 'inactive':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telegram ID</TableHead>
          <TableHead>Credit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.telegramId}</TableCell>
            <TableCell>${user.credit.toFixed(2)}</TableCell>
            <TableCell>
              <span className={getStatusColor(user.status)}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
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
                  <DropdownMenuItem onClick={() => onAddCredit(user.id)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Credit
                  </DropdownMenuItem>
                  {user.status === 'blocked' ? (
                    <DropdownMenuItem
                      onClick={() => handleUnblock(user.id)}
                      disabled={loading === user.id}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Unblock User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleBlock(user.id)}
                      disabled={loading === user.id}
                      className="text-red-600"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
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