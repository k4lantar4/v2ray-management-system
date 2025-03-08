import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SystemSetting, SettingValueType } from '@/types/api';
import { Save, Undo } from 'lucide-react';

interface SettingsListProps {
  settings: SystemSetting[];
  onUpdate: (settings: SystemSetting[]) => Promise<void>;
}

export function SettingsList({ settings, onUpdate }: SettingsListProps) {
  const [editedSettings, setEditedSettings] = useState<{ [key: string]: any }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleValueChange = (setting: SystemSetting, value: any) => {
    setEditedSettings((prev) => ({
      ...prev,
      [setting.id]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      const updatedSettings = settings.map((setting) => ({
        ...setting,
        value:
          setting.id in editedSettings
            ? editedSettings[setting.id]
            : setting.value,
      }));
      await onUpdate(updatedSettings);
      setEditedSettings({});
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setEditedSettings({});
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = setting.id in editedSettings ? editedSettings[setting.id] : setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleValueChange(setting, checked)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting, Number(e.target.value))}
            className="w-[200px]"
          />
        );

      case 'json':
      case 'array':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(setting, parsed);
              } catch {
                handleValueChange(setting, e.target.value);
              }
            }}
            className="h-[100px] w-[300px] font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(setting, e.target.value)}
            className="w-[300px]"
          />
        );
    }
  };

  const hasChanges = Object.keys(editedSettings).length > 0;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Setting</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[150px]">Type</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((setting) => (
            <TableRow key={setting.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{setting.key}</div>
                  <div className="text-sm text-muted-foreground">
                    {setting.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>{renderSettingInput(setting)}</TableCell>
              <TableCell>
                <Badge variant="outline">{setting.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={setting.isEnabled ? 'default' : 'secondary'}
                >
                  {setting.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasChanges && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isUpdating}
          >
            <Undo className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
} 