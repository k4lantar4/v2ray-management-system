import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useServerStore } from '@/store';
import { Loader2 } from 'lucide-react';

interface ServerStatsDialogProps {
  serverId: number | null;
  onClose: () => void;
}

interface ServerStats {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

export function ServerStatsDialog({ serverId, onClose }: ServerStatsDialogProps) {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { getServerStats } = useServerStore();

  useEffect(() => {
    if (serverId) {
      loadStats();
    }
  }, [serverId]);

  const loadStats = async () => {
    if (!serverId) return;

    try {
      setLoading(true);
      const data = await getServerStats(serverId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Dialog open={!!serverId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Server Statistics</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-gray-500">CPU Usage</div>
                <div className="mt-2 text-2xl font-bold">{stats.cpu.toFixed(1)}%</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-gray-500">Memory Usage</div>
                <div className="mt-2 text-2xl font-bold">{stats.memory.toFixed(1)}%</div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-gray-500">Disk Usage</div>
              <div className="mt-2 text-2xl font-bold">{stats.disk.toFixed(1)}%</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-gray-500">Network In</div>
                <div className="mt-2 text-2xl font-bold">{formatBytes(stats.network.in)}/s</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-gray-500">Network Out</div>
                <div className="mt-2 text-2xl font-bold">{formatBytes(stats.network.out)}/s</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500">Failed to load server statistics</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 