'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store';
import { ModuleCard } from '@/components/settings/ModuleCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ModuleConfig } from '@/types/api';

export default function SettingsPage() {
  const { modules, isLoading, error, getModules, updateModule, updateSetting, updateFeature } =
    useSettingsStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = () => {
    getModules();
  };

  const filteredModules = modules
    .filter((module) => {
      const matchesSearch = search
        ? module.name.toLowerCase().includes(search.toLowerCase()) ||
          module.description.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesCategory = category ? module.category === category : true;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.order - b.order);

  const categories = Array.from(new Set(modules.map((m) => m.category))).sort();

  const handleUpdateModule = async (moduleId: string, data: any) => {
    try {
      await updateModule(moduleId, data);
      loadModules();
    } catch (error) {
      console.error('Failed to update module:', error);
    }
  };

  const handleUpdateSetting = async (moduleId: string, settingId: string, data: any) => {
    try {
      await updateSetting(moduleId, settingId, data);
      loadModules();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleUpdateFeature = async (moduleId: string, featureId: string, data: any) => {
    try {
      await updateFeature(moduleId, featureId, data);
      loadModules();
    } catch (error) {
      console.error('Failed to update feature:', error);
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
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Manage system modules, features, and settings. Changes may require a system restart.
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onUpdate={handleUpdateModule}
              onUpdateSetting={handleUpdateSetting}
              onUpdateFeature={handleUpdateFeature}
            />
          ))}
        </div>
      )}
    </div>
  );
} 