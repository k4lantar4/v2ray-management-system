'use client';

import { useEffect, useState } from 'react';
import { usePlanStore } from '@/store';
import { PlanTable } from '@/components/plans/PlanTable';
import { PlanFormDialog } from '@/components/plans/PlanFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Status } from '@/types/api';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PlansPage() {
  const { plans, total, page, limit, isLoading, error, getPlans } = usePlanStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [page, limit, search, status]);

  const loadPlans = () => {
    getPlans({
      page,
      limit,
      search: search || undefined,
      status: (status as Status) || undefined,
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as Status | '');
  };

  const handleAdd = () => {
    setSelectedPlanId(null);
    setShowForm(true);
  };

  const handleEdit = (planId: number) => {
    setSelectedPlanId(planId);
    setShowForm(true);
  };

  const handleDelete = (planId: number) => {
    setSelectedPlanId(planId);
    setShowDeleteAlert(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedPlanId) {
        await usePlanStore.getState().updatePlan(selectedPlanId, data);
      } else {
        await usePlanStore.getState().createPlan(data);
      }
      loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlanId) return;

    try {
      await usePlanStore.getState().deletePlan(selectedPlanId);
      loadPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
    } finally {
      setShowDeleteAlert(false);
      setSelectedPlanId(null);
    }
  };

  const handleToggleStatus = async (planId: number) => {
    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      if (plan.status === 'active') {
        await usePlanStore.getState().deactivatePlan(planId);
      } else {
        await usePlanStore.getState().activatePlan(planId);
      }
      loadPlans();
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    }
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
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button onClick={handleAdd}>Add Plan</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search plans..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <PlanTable
          plans={plans}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {showForm && (
        <PlanFormDialog
          plan={selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : undefined}
          onClose={() => {
            setShowForm(false);
            setSelectedPlanId(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan and remove it
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 