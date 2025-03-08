import { FeatureFlag, UserRole } from '@/types/api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FeatureListProps {
  features: FeatureFlag[];
  onUpdate: (featureId: string, data: any) => Promise<void>;
  disabled?: boolean;
}

export function FeatureList({ features, onUpdate, disabled = false }: FeatureListProps) {
  const handleToggle = async (feature: FeatureFlag) => {
    try {
      await onUpdate(feature.id, { isEnabled: !feature.isEnabled });
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const handleNameChange = async (feature: FeatureFlag, name: string) => {
    try {
      await onUpdate(feature.id, { name });
    } catch (error) {
      console.error('Failed to update feature name:', error);
    }
  };

  const handleDescriptionChange = async (feature: FeatureFlag, description: string) => {
    try {
      await onUpdate(feature.id, { description });
    } catch (error) {
      console.error('Failed to update feature description:', error);
    }
  };

  const handleAddRole = async (feature: FeatureFlag, role: UserRole) => {
    if (feature.roles.includes(role)) return;

    try {
      await onUpdate(feature.id, { roles: [...feature.roles, role] });
    } catch (error) {
      console.error('Failed to add role:', error);
    }
  };

  const handleRemoveRole = async (feature: FeatureFlag, role: UserRole) => {
    try {
      await onUpdate(feature.id, {
        roles: feature.roles.filter((r) => r !== role),
      });
    } catch (error) {
      console.error('Failed to remove role:', error);
    }
  };

  return (
    <div className="space-y-6">
      {features.map((feature) => (
        <div key={feature.key} className="space-y-4 rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Input
                  value={feature.name}
                  onChange={(e) => handleNameChange(feature, e.target.value)}
                  disabled={disabled || !feature.isEnabled}
                  className="h-7 text-lg font-semibold"
                />
                <Badge variant={feature.isEnabled ? 'default' : 'secondary'}>
                  {feature.key}
                </Badge>
              </div>
              <Input
                value={feature.description}
                onChange={(e) => handleDescriptionChange(feature, e.target.value)}
                disabled={disabled || !feature.isEnabled}
                className="text-sm text-muted-foreground"
              />
            </div>
            <Switch
              checked={feature.isEnabled}
              onCheckedChange={() => handleToggle(feature)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Allowed Roles</Label>
            <div className="flex flex-wrap gap-2">
              {feature.roles.map((role) => (
                <Badge key={role} variant="secondary" className="space-x-1">
                  <span>{role}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveRole(feature, role)}
                    disabled={disabled || !feature.isEnabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Select
                value=""
                onValueChange={(value) => handleAddRole(feature, value as UserRole)}
                disabled={disabled || !feature.isEnabled}
              >
                <SelectTrigger className="h-7 w-[150px]">
                  <SelectValue placeholder="Add role..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(['admin', 'seller', 'customer'])
                    .filter((role) => !feature.roles.includes(role as UserRole))
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 