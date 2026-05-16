import { supabase } from '@/db/supabase';
import type { Project, Dataset, TrainingSession, TestResult, SampleDataset, UserTries } from '@/types/types';

export const projectService = {
  async create(project: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async list(userId?: string, sessionId?: string) {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }
};

export const datasetService = {
  async create(dataset: Partial<Dataset>) {
    const { data, error } = await supabase
      .from('datasets')
      .insert(dataset)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Dataset>) {
    const { data, error } = await supabase
      .from('datasets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const sampleDatasetService = {
  async list(modelType?: string) {
    let query = supabase.from('sample_datasets').select('*').order('name');
    
    if (modelType) {
      query = query.eq('model_type', modelType);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }
};

export const trainingService = {
  async create(session: Partial<TrainingSession>) {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<TrainingSession>) {
    const { data, error } = await supabase
      .from('training_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};

export const testResultService = {
  async create(result: Partial<TestResult>) {
    const { data, error } = await supabase
      .from('test_results')
      .insert(result)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('training_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};

export const userTriesService = {
  async getBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('user_tries')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create(sessionId: string, userId?: string) {
    const { data, error } = await supabase
      .from('user_tries')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        tries_count: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async incrementTries(sessionId: string) {
    const existing = await this.getBySessionId(sessionId);
    
    if (existing) {
      const { data, error } = await supabase
        .from('user_tries')
        .update({ tries_count: existing.tries_count + 1 })
        .eq('session_id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    return await this.create(sessionId);
  }
};

export const storageService = {
  async uploadImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('model-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('model-images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  },

  async deleteImage(url: string) {
    const path = url.split('/model-images/')[1];
    if (!path) return;
    
    const { error } = await supabase.storage
      .from('model-images')
      .remove([path]);
    
    if (error) throw error;
  }
};
