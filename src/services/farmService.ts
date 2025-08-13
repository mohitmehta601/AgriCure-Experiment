import { supabase, Farm } from './supabaseClient';

export interface CreateFarmData {
  user_id: string;
  name: string;
  size: number;
  unit: 'hectares' | 'acres' | 'bigha';
  crop_type: string;
  soil_type: string;
  location?: string;
}

export interface UpdateFarmData {
  name?: string;
  size?: number;
  unit?: 'hectares' | 'acres' | 'bigha';
  crop_type?: string;
  soil_type?: string;
  location?: string;
}

export const farmService = {
  // Create new farm
  async createFarm(data: CreateFarmData) {
    try {
      // Validate required fields
      if (!data.user_id || !data.name.trim() || data.size <= 0 || !data.crop_type || !data.soil_type) {
        throw new Error('Missing required fields or invalid values');
      }

      // Prepare clean data
      const cleanData = {
        ...data,
        name: data.name.trim(),
        location: data.location?.trim() || null
      };

      const { data: farm, error } = await supabase
        .from('farms')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating farm:', error);
        throw new Error(error.message || 'Failed to create farm in database');
      }

      return { data: farm, error };
    } catch (error) {
      console.error('Farm creation error:', error);
      return { data: null, error };
    }
  },

  // Get farms by user
  async getFarmsByUser(userId: string): Promise<{ data: Farm[] | null; error: any }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching farms:', error);
        throw new Error(error.message || 'Failed to fetch farms from database');
      }

      return { data, error };
    } catch (error) {
      console.error('Farm fetch error:', error);
      return { data: null, error };
    }
  },

  // Get a single farm by id
  async getFarmById(id: string): Promise<{ data: Farm | null; error: any }> {
    try {
      if (!id) {
        throw new Error('Farm ID is required');
      }

      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching farm:', error);
        throw new Error(error.message || 'Failed to fetch farm from database');
      }

      return { data, error };
    } catch (error) {
      console.error('Farm fetch by ID error:', error);
      return { data: null, error };
    }
  },

  // Update farm
  async updateFarm(farmId: string, updateData: UpdateFarmData) {
    try {
      if (!farmId) {
        throw new Error('Farm ID is required');
      }

      // Clean the update data
      const cleanData = { ...updateData };
      if (cleanData.name) {
        cleanData.name = cleanData.name.trim();
      }
      if (cleanData.location) {
        cleanData.location = cleanData.location.trim() || undefined;
      }
      if (cleanData.size && cleanData.size <= 0) {
        throw new Error('Farm size must be greater than 0');
      }

      const { data, error } = await supabase
        .from('farms')
        .update(cleanData)
        .eq('id', farmId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating farm:', error);
        throw new Error(error.message || 'Failed to update farm in database');
      }

      return { data, error };
    } catch (error) {
      console.error('Farm update error:', error);
      return { data: null, error };
    }
  },

  // Delete farm
  async deleteFarm(farmId: string) {
    try {
      if (!farmId) {
        throw new Error('Farm ID is required');
      }

      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) {
        console.error('Supabase error deleting farm:', error);
        throw new Error(error.message || 'Failed to delete farm from database');
      }

      return { error };
    } catch (error) {
      console.error('Farm deletion error:', error);
      return { error };
    }
  },

  // Get farm statistics for a user
  async getFarmStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('size, unit')
        .eq('user_id', userId);

      if (error) throw error;

      // Calculate total farm size in hectares
      let totalSize = 0;
      data?.forEach(farm => {
        if (farm.unit === 'hectares') {
          totalSize += farm.size;
        } else if (farm.unit === 'acres') {
          totalSize += farm.size * 0.404686; // Convert acres to hectares
        } else if (farm.unit === 'bigha') {
          totalSize += farm.size * 0.1338; // Convert bigha to hectares (approximate)
        }
      });

      return { 
        data: { 
          totalFarms: data?.length || 0, 
          totalSize: Math.round(totalSize * 100) / 100 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }
};

export type { Farm, CreateFarmData, UpdateFarmData };
