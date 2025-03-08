'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store';
import { ModuleCard } from '@/components/settings/ModuleCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsList } from '@/components/settings/SettingsList';
import { FeatureList } from '@/components/settings/FeatureList';
import { Loader2, Settings2, Flag, Box } from 'lucide-react';

export default function SettingsPage() {
  const {
    modules,
    settings,
    features,
    isLoading,
    error,
    getModules,
    getSettings,
    getFeatures,
    updateModule,
    updateSetting,
    updateFeature,
    updateModuleSettings,
    updateModuleFeatures,
  } = useSettingsStore();

  useEffect(() => {
    // Load all settings data
    Promise.all([getModules(), getSettings(), getFeatures()]);
  }, [getModules, getSettings, getFeatures]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Manage your system settings, modules, and feature flags
        </p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">
            <Box className="mr-2 h-4 w-4" />
            Modules
          </TabsTrigger>
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
          <TabsContent value="modules" className="space-y-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onUpdateModule={(data) => updateModule(module.id, data)}
                onUpdateSettings={(settings) => updateModuleSettings(module.id, settings)}
                onUpdateFeatures={(features) => updateModuleFeatures(module.id, features)}
              />
            ))}
          </TabsContent>

          <TabsContent value="settings">
            <SettingsList
              settings={settings}
              onUpdate={(updatedSettings) =>
                Promise.all(
                  updatedSettings.map((setting) =>
                    updateSetting(setting.id, {
                      value: setting.value,
                      isEnabled: setting.isEnabled,
                    })
                  )
                )
              }
            />
          </TabsContent>

          <TabsContent value="features">
            <FeatureList
              features={features}
              onUpdate={(updatedFeatures) =>
                Promise.all(
                  updatedFeatures.map((feature) =>
                    updateFeature(feature.id, {
                      name: feature.name,
                      description: feature.description,
                      isEnabled: feature.isEnabled,
                      roles: feature.roles,
                    })
                  )
                )
              }
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 