import { useState } from 'react';
import { SystemSetting } from '@/types/api';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface SettingsListProps {
  settings: SystemSetting[];
  onUpdate: (settingId: string, data: any) => Promise<void>;
  disabled?: boolean;
}

export function SettingsList({ settings, onUpdate, disabled = false }: SettingsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleValueChange = async (setting: SystemSetting, value: any) => {
    try {
      await onUpdate(setting.id, { value });
    } catch (error) {
      console.error('Failed to update setting value:', error);
    }
  };

  const handleToggle = async (setting: SystemSetting) => {
    try {
      await onUpdate(setting.id, { isEnabled: !setting.isEnabled });
    } catch (error) {
      console.error('Failed to toggle setting:', error);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const isEditing = editingId === setting.id;

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value}
            onCheckedChange={(value) => handleValueChange(setting, value)}
            disabled={disabled || !setting.isEnabled}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleValueChange(setting, parseFloat(e.target.value))}
            disabled={disabled || !setting.isEnabled}
            className="w-[200px]"
          />
        );

      case 'json':
        return (
          <Textarea
            value={isEditing ? setting.value : JSON.stringify(setting.value, null, 2)}
            onChange={(e) => {
              try {
                const value = JSON.parse(e.target.value);
                handleValueChange(setting, value);
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            disabled={disabled || !setting.isEnabled}
            className="font-mono h-[100px] w-full"
            onFocus={() => setEditingId(setting.id)}
            onBlur={() => setEditingId(null)}
          />
        );

      case 'array':
        return (
          <Textarea
            value={isEditing ? setting.value : setting.value.join('\n')}
            onChange={(e) => handleValueChange(setting, e.target.value.split('\n'))}
            disabled={disabled || !setting.isEnabled}
            className="h-[100px] w-full"
            onFocus={() => setEditingId(setting.id)}
            onBlur={() => setEditingId(null)}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={setting.value}
            onChange={(e) => handleValueChange(setting, e.target.value)}
            disabled={disabled || !setting.isEnabled}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {settings.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Label>{setting.key}</Label>
                {setting.requiresRestart && (
                  <Badge variant="outline" className="text-yellow-600">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Requires Restart
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </div>
            <Switch
              checked={setting.isEnabled}
              onCheckedChange={() => handleToggle(setting)}
              disabled={disabled}
            />
          </div>
          <div className="pt-2">{renderSettingInput(setting)}</div>
        </div>
      ))}
    </div>
  );
} 