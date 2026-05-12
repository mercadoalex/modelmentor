import { supabase } from '@/lib/supabase';

interface LocalProject {
  title: string;
  description: string;
  model_type: string;
  status: string;
  dataset?: {
    file_content: string; // base64
    file_name: string;
    labels: string[];
    sample_count: number;
  };
}

interface MigrateLocalDataResponse {
  migrated: number;
  failed: Array<{ title: string; reason: string }>;
}

const LOCAL_STORAGE_KEY = 'modelmentor_local_projects';

export const migrationService = {
  /**
   * Migrates local projects to the authenticated user's account
   * by calling the migrate-local-data edge function.
   */
  async migrateLocalData(
    projects: LocalProject[],
    userId: string
  ): Promise<MigrateLocalDataResponse> {
    const { data, error } = await supabase.functions.invoke('migrate-local-data', {
      body: { projects, user_id: userId },
    });

    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }

    return data as MigrateLocalDataResponse;
  },

  /**
   * Reads locally stored projects from localStorage.
   */
  getLocalProjects(): LocalProject[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as LocalProject[];
    } catch {
      return [];
    }
  },

  /**
   * Removes migrated project data from localStorage.
   */
  clearLocalData(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },
};
