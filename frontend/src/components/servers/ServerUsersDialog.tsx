import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useServerStore } from '@/store';
import { Loader2 } from 'lucide-react';
import { User } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface ServerUsersDialogProps {
  serverId: number | null;
  onClose: () => void;
}

export function ServerUsersDialog({ serverId, onClose }: ServerUsersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { getServerUsers } = useServerStore();

  useEffect(() => {
    if (serverId) {
      loadUsers();
    }
  }, [serverId]);

  const loadUsers = async () => {
    if (!serverId) return;

    try {
      setLoading(true);
      const data = await getServerUsers(serverId);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load server users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!serverId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Server Users</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.telegramId}</TableCell>
                  <TableCell>
                    <span
                      className={
                        user.status === 'active'
                          ? 'text-green-600'
                          : user.status === 'blocked'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500">No users found on this server</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 