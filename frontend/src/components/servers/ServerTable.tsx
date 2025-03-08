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
  Power,
  PowerOff,
  Download,
  Upload,
  HardDrive,
  Users,
} from 'lucide-react';
import { Server, Status } from '@/types/api';
import { useServerStore } from '@/store';
import { formatDate } from '@/lib/utils';

interface ServerTableProps {
  servers: Server[];
  onViewStats: (serverId: number) => void;
  onViewUsers: (serverId: number) => void;
  onBackup: (serverId: number) => void;
  onRestore: (serverId: number) => void;
}

export function ServerTable({
  servers,
  onViewStats,
  onViewUsers,
  onBackup,
  onRestore,
}: ServerTableProps) {
  const { toggleMaintenanceMode } = useServerStore();
  const [loading, setLoading] = useState<number | null>(null);

  const handleMaintenanceToggle = async (serverId: number) => {
    try {
      setLoading(serverId);
      await toggleMaintenanceMode(serverId);
    } finally {
      setLoading(null);
    }
  };

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Port Range</TableHead>
          <TableHead>Active Users</TableHead>
          <TableHead>Load</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servers.map((server) => (
          <TableRow key={server.id}>
            <TableCell>{server.name}</TableCell>
            <TableCell>{server.location}</TableCell>
            <TableCell>{server.ip}</TableCell>
            <TableCell>{`${server.portRangeStart}-${server.portRangeEnd}`}</TableCell>
            <TableCell>{server.activeUsers}</TableCell>
            <TableCell>{`${server.load.toFixed(2)}%`}</TableCell>
            <TableCell>
              <span className={getStatusColor(server.status)}>
                {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
              </span>
            </TableCell>
            <TableCell>{formatDate(server.createdAt)}</TableCell>
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
                  <DropdownMenuItem onClick={() => onViewStats(server.id)}>
                    <HardDrive className="mr-2 h-4 w-4" />
                    View Stats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewUsers(server.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    View Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBackup(server.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Backup
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRestore(server.id)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMaintenanceToggle(server.id)}
                    disabled={loading === server.id}
                  >
                    {server.status === 'inactive' ? (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Enable Server
                      </>
                    ) : (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Disable Server
                      </>
                    )}
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