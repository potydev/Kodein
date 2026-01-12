import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn } from './logger';

/**
 * Calculate level from XP
 * Level formula: level = floor(sqrt(xp / 100)) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(level: number): number {
  return level * 100;
}

/**
 * Add XP to user profile and update level automatically using database function
 */
export async function addXP(userId: string, xpAmount: number): Promise<{ success: boolean; newXP: number; newLevel: number; error?: string }> {
  try {
    devLog('Adding XP:', { xpAmount });
    
    // Use database function for atomic XP update
    const { data, error } = await supabase.rpc('add_user_xp', {
      user_id: userId,
      xp_amount: xpAmount,
    });

    if (error) {
      devError('Error calling add_user_xp function:', error);
      // Fallback to direct update if function doesn't exist
      return await addXPFallback(userId, xpAmount);
    }

    if (data && typeof data === 'object') {
      const result = data as any;
      if (result.success) {
        devLog('XP added successfully:', { newXP: result.newXP, newLevel: result.newLevel });
        return {
          success: true,
          newXP: result.newXP,
          newLevel: result.newLevel,
        };
      } else {
        devError('XP add failed:', { error: result.error });
        return {
          success: false,
          newXP: result.newXP || 0,
          newLevel: result.newLevel || 1,
          error: result.error || 'Failed to add XP',
        };
      }
    }

    // If function doesn't return expected format, use fallback
    return await addXPFallback(userId, xpAmount);
  } catch (error) {
    devError('Exception adding XP:', error);
    // Try fallback
    return await addXPFallback(userId, xpAmount);
  }
}

/**
 * Fallback method to add XP directly (if database function is not available)
 */
async function addXPFallback(userId: string, xpAmount: number): Promise<{ success: boolean; newXP: number; newLevel: number; error?: string }> {
  try {
    devLog('Using fallback method to add XP', { xpAmount });
    
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('xp_points, level')
      .eq('id', userId)
      .single();

    if (fetchError) {
      devError('Error fetching profile:', fetchError);
      return { 
        success: false, 
        newXP: 0, 
        newLevel: 1, 
        error: `Failed to fetch profile: ${fetchError.message} (Code: ${fetchError.code || 'N/A'})` 
      };
    }

    if (!profile) {
      devError('Profile not found');
      return { success: false, newXP: 0, newLevel: 1, error: 'Profile not found' };
    }

    const currentXP = profile.xp_points || 0;
    const currentLevel = profile.level || 1;
    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevel(newXP);

    devLog('Calculated XP update:', { 
      currentXP, 
      xpAmount, 
      newXP, 
      currentLevel, 
      newLevel
    });

    // Update XP and level - try with select to get updated data
    devLog('Attempting to update profiles table...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        xp_points: newXP,
        level: newLevel,
      })
      .eq('id', userId)
      .select('xp_points, level')
      .single();
    
    devLog('Update response:', { hasData: !!updateData, hasError: !!updateError });

    if (updateError) {
      devError('Error updating XP:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      return { 
        success: false, 
        newXP: currentXP, 
        newLevel: currentLevel, 
        error: `Failed to update XP: ${updateError.message} (Code: ${updateError.code || 'N/A'})` 
      };
    }

    // Verify the update actually happened
    if (updateData) {
      const verifiedXP = updateData.xp_points || 0;
      const verifiedLevel = updateData.level || 1;
      
      if (verifiedXP === newXP && verifiedLevel === newLevel) {
        devLog('XP updated successfully and verified:', { verifiedXP, verifiedLevel });
        return { success: true, newXP: verifiedXP, newLevel: verifiedLevel };
      } else {
        devWarn('XP update mismatch:', {
          expected: { newXP, newLevel },
          actual: { verifiedXP, verifiedLevel }
        });
        return { 
          success: false, 
          newXP: verifiedXP, 
          newLevel: verifiedLevel, 
          error: 'XP update verification failed' 
        };
      }
    }

    // If no data returned, verify by fetching again
    devLog('No data returned from update, verifying...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('xp_points, level')
      .eq('id', userId)
      .single();

    if (verifyError) {
      devError('Error verifying XP update:', verifyError);
      return { 
        success: false, 
        newXP: currentXP, 
        newLevel: currentLevel, 
        error: `Update may have succeeded but verification failed: ${verifyError.message}` 
      };
    }

    if (verifyData) {
      const verifiedXP = verifyData.xp_points || 0;
      const verifiedLevel = verifyData.level || 1;
      
      if (verifiedXP === newXP && verifiedLevel === newLevel) {
        devLog('XP update verified after fetch:', { verifiedXP, verifiedLevel });
        return { success: true, newXP: verifiedXP, newLevel: verifiedLevel };
      } else {
        devWarn('XP update not reflected in database:', {
          expected: { newXP, newLevel },
          actual: { verifiedXP, verifiedLevel }
        });
        return { 
          success: false, 
          newXP: verifiedXP, 
          newLevel: verifiedLevel, 
          error: 'XP update was not saved to database' 
        };
      }
    }

    devWarn('Could not verify XP update');
    return { 
      success: false, 
      newXP: currentXP, 
      newLevel: currentLevel, 
      error: 'Could not verify XP update' 
    };
  } catch (error) {
    devError('Exception in fallback method:', error);
    return { success: false, newXP: 0, newLevel: 1, error: `Exception: ${error}` };
  }
}

/**
 * Check if user has already completed a lesson (to prevent duplicate XP)
 * Uses database function if available, otherwise falls back to direct query
 */
export async function hasCompletedLesson(userId: string, lessonId: string): Promise<boolean> {
  try {
    // Try using database function first
    const { data: functionResult, error: functionError } = await supabase.rpc('is_lesson_completed', {
      user_id: userId,
      lesson_id: lessonId,
    });

    if (!functionError && typeof functionResult === 'boolean') {
      devLog('Lesson completion check via function:', functionResult);
      return functionResult;
    }

    // Fallback to direct query
    const { data, error } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      devWarn('Error checking lesson completion:', error);
      return false;
    }

    const isCompleted = data?.completed === true;
    devLog('Lesson completion check via query:', { isCompleted });
    return isCompleted;
  } catch (error) {
    devError('Exception checking lesson completion:', error);
    return false;
  }
}

