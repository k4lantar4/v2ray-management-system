import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  SystemSetting,
  FeatureFlag,
  ModuleConfig,
  UpdateSettingDto,
  UpdateFeatureDto,
  UpdateModuleDto,
} from '@/types/api';

interface SettingsState {
  modules: ModuleConfig[];
  settings: SystemSetting[];
  features: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  
  // Fetch functions
  getModules: () => Promise<void>;
  getSettings: () => Promise<void>;
  getFeatures: () => Promise<void>;
  
  // Update functions
  updateModule: (moduleId: string, data: UpdateModuleDto) => Promise<void>;
  updateSetting: (settingId: string, data: UpdateSettingDto) => Promise<void>;
  updateFeature: (featureId: string, data: UpdateFeatureDto) => Promise<void>;
  
  // Bulk update functions
  updateModuleSettings: (moduleId: string, settings: UpdateSettingDto[]) => Promise<void>;
  updateModuleFeatures: (moduleId: string, features: UpdateFeatureDto[]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  modules: [],
  settings: [],
  features: [],
  isLoading: false,
  error: null,

  getModules: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/settings/modules');
      set({ modules: response.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load modules',
      });
    }
  },

  getSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/settings/system');
      set({ settings: response.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      });
    }
  },

  getFeatures: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/settings/features');
      set({ features: response.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load features',
      });
    }
  },

  updateModule: async (moduleId: string, data: UpdateModuleDto) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/settings/modules/${moduleId}`, data);
      
      // Update local state
      const modules = get().modules.map((module) =>
        module.id === moduleId ? { ...module, ...data } : module
      );
      set({ modules, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update module',
      });
      throw error;
    }
  },

  updateSetting: async (settingId: string, data: UpdateSettingDto) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/settings/system/${settingId}`, data);
      
      // Update local state
      const settings = get().settings.map((setting) =>
        setting.id === settingId ? { ...setting, ...data } : setting
      );
      
      // Update module settings if applicable
      const modules = get().modules.map((module) => ({
        ...module,
        settings: module.settings.map((setting) =>
          setting.id === settingId ? { ...setting, ...data } : setting
        ),
      }));
      
      set({ settings, modules, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update setting',
      });
      throw error;
    }
  },

  updateFeature: async (featureId: string, data: UpdateFeatureDto) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/settings/features/${featureId}`, data);
      
      // Update local state
      const features = get().features.map((feature) =>
        feature.id === featureId ? { ...feature, ...data } : feature
      );
      
      // Update module features if applicable
      const modules = get().modules.map((module) => ({
        ...module,
        features: module.features.map((feature) =>
          feature.id === featureId ? { ...feature, ...data } : feature
        ),
      }));
      
      set({ features, modules, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update feature',
      });
      throw error;
    }
  },

  updateModuleSettings: async (moduleId: string, settings: UpdateSettingDto[]) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/settings/modules/${moduleId}/settings`, { settings });
      
      // Update local state
      const modules = get().modules.map((module) => {
        if (module.id !== moduleId) return module;
        
        return {
          ...module,
          settings: module.settings.map((setting) => {
            const update = settings.find((s) => s.id === setting.id);
            return update ? { ...setting, ...update } : setting;
          }),
        };
      });
      
      set({ modules, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update module settings',
      });
      throw error;
    }
  },

  updateModuleFeatures: async (moduleId: string, features: UpdateFeatureDto[]) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/settings/modules/${moduleId}/features`, { features });
      
      // Update local state
      const modules = get().modules.map((module) => {
        if (module.id !== moduleId) return module;
        
        return {
          ...module,
          features: module.features.map((feature) => {
            const update = features.find((f) => f.id === feature.id);
            return update ? { ...feature, ...update } : feature;
          }),
        };
      });
      
      set({ modules, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update module features',
      });
      throw error;
    }
  },
})); 