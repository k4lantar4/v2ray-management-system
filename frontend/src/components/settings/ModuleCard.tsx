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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleConfig, SystemSetting, FeatureFlag } from '@/types/api';
import { Settings2, Flag, Power } from 'lucide-react';
import { SettingsList } from './SettingsList';
import { FeatureList } from './FeatureList';

interface ModuleCardProps {
  module: ModuleConfig;
  onUpdateModule: (data: { isEnabled: boolean }) => Promise<void>;
  onUpdateSettings: (settings: SystemSetting[]) => Promise<void>;
  onUpdateFeatures: (features: FeatureFlag[]) => Promise<void>;
}

export function ModuleCard({
  module,
  onUpdateModule,
  onUpdateSettings,
  onUpdateFeatures,
}: ModuleCardProps) {
  const [activeTab, setActiveTab] = useState('settings');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleModuleToggle = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      await onUpdateModule({ isEnabled: enabled });
    } catch (error) {
      console.error('Failed to toggle module:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CardTitle>{module.name}</CardTitle>
              <Badge variant={module.isEnabled ? 'default' : 'secondary'}>
                {module.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <CardDescription>{module.description}</CardDescription>
          </div>
          <Switch
            checked={module.isEnabled}
            onCheckedChange={handleModuleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="features">
              <Flag className="mr-2 h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Module Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure the settings for this module
                    </p>
                  </div>
                  {module.settings.some((s) => s.requiresRestart) && (
                    <Badge variant="outline">
                      <Power className="mr-2 h-3 w-3" />
                      Requires Restart
                    </Badge>
                  )}
                </div>
                <SettingsList
                  settings={module.settings}
                  onUpdate={onUpdateSettings}
                />
              </div>
            </TabsContent>
            <TabsContent value="features">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Module Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable features for this module
                  </p>
                </div>
                <FeatureList
                  features={module.features}
                  onUpdate={onUpdateFeatures}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 