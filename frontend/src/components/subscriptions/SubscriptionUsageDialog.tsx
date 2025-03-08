import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscriptionStore } from '@/store';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SubscriptionUsageDialogProps {
  subscriptionId: number | null;
  onClose: () => void;
}

interface UsageStats {
  bandwidth: {
    used: number;
    total: number;
  };
  connections: {
    current: number;
    max: number;
  };
  uptime: number;
}

export function SubscriptionUsageDialog({
  subscriptionId,
  onClose,
}: SubscriptionUsageDialogProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { getSubscriptionUsage } = useSubscriptionStore();

  useEffect(() => {
    if (subscriptionId) {
      loadUsage();
    }
  }, [subscriptionId]);

  const loadUsage = async () => {
    if (!subscriptionId) return;

    try {
      setLoading(true);
      const data = await getSubscriptionUsage(subscriptionId);
      setUsage(data);
    } catch (error) {
      console.error('Failed to load subscription usage:', error);
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

  const formatUptime = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <Dialog open={!!subscriptionId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription Usage</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : usage ? (
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bandwidth Usage</span>
                <span>
                  {formatBytes(usage.bandwidth.used)} / {formatBytes(usage.bandwidth.total)}
                </span>
              </div>
              <Progress
                value={(usage.bandwidth.used / usage.bandwidth.total) * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active Connections</span>
                <span>
                  {usage.connections.current} / {usage.connections.max}
                </span>
              </div>
              <Progress
                value={(usage.connections.current / usage.connections.max) * 100}
                className="h-2"
              />
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-gray-500">Total Uptime</div>
              <div className="mt-2 text-2xl font-bold">{formatUptime(usage.uptime)}</div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500">Failed to load subscription usage</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 