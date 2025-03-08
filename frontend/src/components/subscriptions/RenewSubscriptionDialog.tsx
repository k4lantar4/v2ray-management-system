import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscriptionStore } from '@/store';

interface RenewSubscriptionDialogProps {
  subscriptionId: number | null;
  onClose: () => void;
}

export function RenewSubscriptionDialog({
  subscriptionId,
  onClose,
}: RenewSubscriptionDialogProps) {
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const { renewSubscription } = useSubscriptionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionId || !duration) return;

    try {
      setLoading(true);
      await renewSubscription(subscriptionId, parseInt(duration));
      onClose();
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!subscriptionId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Subscription</DialogTitle>
          <DialogDescription>
            Enter the number of months you want to renew the subscription for.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (months)
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="12"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Renewing...' : 'Renew Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 