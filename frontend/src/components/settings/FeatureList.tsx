import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FeatureFlag, UserRole } from '@/types/api';
import { Save, Undo, Users } from 'lucide-react';

interface FeatureListProps {
  features: FeatureFlag[];
  onUpdate: (features: FeatureFlag[]) => Promise<void>;
}

export function FeatureList({ features, onUpdate }: FeatureListProps) {
  const [editedFeatures, setEditedFeatures] = useState<{ [key: string]: Partial<FeatureFlag> }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = (feature: FeatureFlag, changes: Partial<FeatureFlag>) => {
    setEditedFeatures((prev) => ({
      ...prev,
      [feature.id]: {
        ...(prev[feature.id] || {}),
        ...changes,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      const updatedFeatures = features.map((feature) => ({
        ...feature,
        ...(editedFeatures[feature.id] || {}),
      }));
      await onUpdate(updatedFeatures);
      setEditedFeatures({});
    } catch (error) {
      console.error('Failed to update features:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setEditedFeatures({});
  };

  const hasChanges = Object.keys(editedFeatures).length > 0;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Feature</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[200px]">Roles</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => {
            const edited = editedFeatures[feature.id] || {};
            const roles = edited.roles || feature.roles;
            const isEnabled = edited.isEnabled ?? feature.isEnabled;

            return (
              <TableRow key={feature.id}>
                <TableCell>
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-muted-foreground">{feature.key}</div>
                </TableCell>
                <TableCell>
                  <Input
                    value={edited.description ?? feature.description}
                    onChange={(e) =>
                      handleChange(feature, { description: e.target.value })
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={roles.join(',')}
                    onValueChange={(value) =>
                      handleChange(feature, {
                        roles: value ? (value.split(',') as UserRole[]) : [],
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin,seller,customer">All Roles</SelectItem>
                      <SelectItem value="admin">Admin Only</SelectItem>
                      <SelectItem value="admin,seller">Admin & Seller</SelectItem>
                      <SelectItem value="customer">Customer Only</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleChange(feature, { isEnabled: checked })
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {hasChanges && (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
            <Undo className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
} 