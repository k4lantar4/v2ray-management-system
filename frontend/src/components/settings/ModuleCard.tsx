import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { ModuleConfig } from '@/types/api';
import { SettingsList } from './SettingsList';
import { FeatureList } from './FeatureList';

interface ModuleCardProps {
  module: ModuleConfig;
  onUpdate: (moduleId: string, data: any) => Promise<void>;
  onUpdateSetting: (moduleId: string, settingId: string, data: any) => Promise<void>;
  onUpdateFeature: (moduleId: string, featureId: string, data: any) => Promise<void>;
}

export function ModuleCard({
  module,
  onUpdate,
  onUpdateSetting,
  onUpdateFeature,
}: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleModule = async () => {
    try {
      setIsLoading(true);
      await onUpdate(module.id, { isEnabled: !module.isEnabled });
    } catch (error) {
      console.error('Failed to toggle module:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (settingId: string, data: any) => {
    try {
      setIsLoading(true);
      await onUpdateSetting(module.id, settingId, data);
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFeature = async (featureId: string, data: any) => {
    try {
      setIsLoading(true);
      await onUpdateFeature(module.id, featureId, data);
    } catch (error) {
      console.error('Failed to update feature:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={module.isEnabled ? 'border-primary' : 'border-muted'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              <div className="flex items-center space-x-2">
                <Settings2 className="h-5 w-5" />
                <span>{module.name}</span>
                <Badge variant={module.isEnabled ? 'default' : 'secondary'}>
                  {module.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Switch
              checked={module.isEnabled}
              onCheckedChange={handleToggleModule}
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
          {module.settings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <SettingsList
                settings={module.settings}
                onUpdate={handleUpdateSetting}
                disabled={!module.isEnabled}
              />
            </div>
          )}
          {module.features.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Features</h3>
              <FeatureList
                features={module.features}
                onUpdate={handleUpdateFeature}
                disabled={!module.isEnabled}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 