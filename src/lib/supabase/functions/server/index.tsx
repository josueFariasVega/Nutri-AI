import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Activity level multipliers for TDEE calculation
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryactive: 1.9
};

// Helper function to verify user authentication
async function verifyUser(c: any): Promise<any | null> {
  try {
    const authHeader = c.req.header('Authorization')
    const accessToken = authHeader?.split(' ')[1]
    if (!accessToken) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('User verificaction exception:', error)
    return null
  }
}

// Health check endpoint
app.get("/make-server-b9678739/health", (c) => {
  return c.json({ status: "ok" });
});

// User signup endpoint
app.post("/make-server-b9678739/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.status === 422 && error.code === 'email_exists') {
        return c.json({ 
          success: false, 
          error: 'USER_EXISTS',
          message: 'Este email ya está registrado. Intenta iniciar sesión en su lugar.' 
        }, 422);
      }
      
      // Handle other auth errors
      if (error.status === 422) {
        return c.json({ 
          success: false, 
          error: 'VALIDATION_ERROR',
          message: error.message || 'Error en los datos proporcionados' 
        }, 422);
      }
      
      // Generic error for other cases
      return c.json({ 
        success: false, 
        error: 'SIGNUP_FAILED',
        message: 'Error al crear la cuenta. Inténtalo de nuevo.' 
      }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user_profile_${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      created_at: new Date().toISOString(),
      has_completed_questionnaire: false
    });

    return c.json({ 
      success: true, 
      user: { 
        id: data.user.id, 
        email, 
        name 
      } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ 
      success: false, 
      error: 'SERVER_ERROR',
      message: 'Error interno del servidor' 
    }, 500);
  }
});

// Check if user is marked as deleted
app.get("/make-server-b9678739/deleted-user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    if (!userId) {
      return c.text('User ID required', 400);
    }

    const deletedMarker = await kv.get(`deleted_user_${userId}`);

    if (deletedMarker) {
      console.log('🚨 Deleted user check: User is marked as deleted');
      return c.json({
        isDeleted: true,
        deletedAt: deletedMarker.deleted_at,
        reason: deletedMarker.reason
      });
    }

    return c.json({ isDeleted: false });
  } catch (error) {
    console.error('Deleted user check error:', error);
    return c.json({ isDeleted: false });
  }
});

// Check user status (questionnaire completion)
app.get("/make-server-b9678739/user-status", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    // Check if user is marked as deleted first
    const deletedMarker = await kv.get(`deleted_user_${user.id}`);
    if (deletedMarker) {
      console.log('🚨 User status check: User is marked as deleted');
      return c.json({
        hasCompletedQuestionnaire: false,
        isDeleted: true,
        message: 'User account has been deleted'
      });
    }

    const profile = await kv.get(`user_profile_${user.id}`);
    return c.json({
      hasCompletedQuestionnaire: profile?.has_completed_questionnaire || false
    });
  } catch (error) {
    console.error('User status error:', error);
    return c.json({ hasCompletedQuestionnaire: false });
  }
});

// Submit questionnaire answers
app.post("/make-server-b9678739/questionnaire", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    const answers = await c.req.json();
    
    // Store questionnaire answers
    await kv.set(`questionnaire_${user.id}`, {
      user_id: user.id,
      answers,
      completed_at: new Date().toISOString()
    });

     // Update user profile to mark questionnaire as completed
     console.log('🔄 Starting questionnaire completion process for user:', user.id);

     // Get current profile with retry mechanism
     let profile = await kv.get(`user_profile_${user.id}`);
     console.log('📋 Current profile before update:', profile);

     if (profile) {
       console.log('📝 Updating existing profile...');
       profile.has_completed_questionnaire = true;
       profile.questionnaire_completed_at = new Date().toISOString();
       profile.updated_at = new Date().toISOString();

       // Save with retry mechanism
       let saveAttempts = 0;
       const maxAttempts = 3;

       while (saveAttempts < maxAttempts) {
         try {
           await kv.set(`user_profile_${user.id}`, profile);
           console.log('✅ Profile updated with has_completed_questionnaire: true');

           // Verify the save immediately
           const verificationProfile = await kv.get(`user_profile_${user.id}`);
           if (verificationProfile?.has_completed_questionnaire) {
             console.log('✅ Verification successful - Profile saved correctly');
             break;
           } else {
             throw new Error('Verification failed - profile not saved correctly');
           }
         } catch (error) {
           saveAttempts++;
           console.error(`❌ Save attempt ${saveAttempts} failed:`, error);
           if (saveAttempts >= maxAttempts) {
             throw new Error(`Failed to save profile after ${maxAttempts} attempts`);
           }
           // Wait before retry
           await new Promise(resolve => setTimeout(resolve, 1000));
         }
       }
     } else {
       console.log('⚠️ No existing profile found, creating new one');
       const newProfile = {
         id: user.id,
         email: user.email,
         has_completed_questionnaire: true,
         questionnaire_completed_at: new Date().toISOString(),
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };

       // Save new profile with verification
       await kv.set(`user_profile_${user.id}`, newProfile);
       console.log('✅ New profile created with has_completed_questionnaire: true');

       // Verify new profile was saved
       const verificationProfile = await kv.get(`user_profile_${user.id}`);
       if (!verificationProfile?.has_completed_questionnaire) {
         throw new Error('Failed to save new profile correctly');
       }
     }

    // Generate nutrition plan
    const nutritionPlan = await generateNutritionPlan(answers);
    
    // Store the nutrition plan
    await kv.set(`nutrition_plan_${user.id}`, {
      user_id: user.id,
      plan: nutritionPlan,
      created_at: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'Questionnaire submitted successfully',
      plan: nutritionPlan
    });
  } catch (error) {
    console.error('Questionnaire submission error:', error);
    return c.text(`Error processing questionnaire: ${error.message}`, 500);
  }
});

// Get user nutrition plan
app.get("/make-server-b9678739/nutrition-plan", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    // Check if user is marked as deleted
    const deletedMarker = await kv.get(`deleted_user_${user.id}`);
    if (deletedMarker) {
      console.log('🚨 Nutrition plan request: User is marked as deleted');
      return c.text('User account has been deleted', 410); // 410 Gone
    }

    const plan = await kv.get(`nutrition_plan_${user.id}`);
    if (!plan) {
      return c.text('No nutrition plan found', 404);
    }

    return c.json(plan);
  } catch (error) {
    console.error('Get nutrition plan error:', error);
    return c.text('Error retrieving nutrition plan', 500);
  }
});

// Save user settings
app.post("/make-server-b9678739/save-settings", async (c) => {
  try {
    console.log('=== SAVE SETTINGS REQUEST START ===');
    
    const user = await verifyUser(c);
    if (!user) {
      console.log('Save settings: User not authorized');
      return c.text('Unauthorized', 401);
    }

    console.log('Save settings: User verified:', user.id);

    const requestBody = await c.req.json();
    const { settings } = requestBody;
    
    if (!settings) {
      console.log('Save settings: No settings data provided');
      return c.text('Settings data is required', 400);
    }

    console.log('Save settings: Received settings data for user', user.id);

    // Save settings to KV store with timeout
    const savePromise = kv.set(`user_settings_${user.id}`, {
      user_id: user.id,
      settings,
      updated_at: new Date().toISOString()
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out')), 10000);
    });

    await Promise.race([savePromise, timeoutPromise]);

    console.log(`Settings saved successfully for user ${user.id}`);
    
    const response = { 
      success: true, 
      message: 'Settings saved successfully' 
    };

    console.log('=== SAVE SETTINGS REQUEST END ===');
    return c.json(response);
  } catch (error) {
    console.error('Save settings error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      message: `Error saving settings: ${error.message}` 
    }, 500);
  }
});

// Get user settings
app.get("/make-server-b9678739/user-settings", async (c) => {
  try {
    console.log('=== GET USER SETTINGS REQUEST START ===');
    
    const user = await verifyUser(c);
    if (!user) {
      console.log('Get settings: User not authorized');
      return c.text('Unauthorized', 401);
    }

    console.log('Get settings: User verified:', user.id);

    // Get settings with timeout
    const getPromise = kv.get(`user_settings_${user.id}`);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Get operation timed out')), 5000);
    });

    const userSettings = await Promise.race([getPromise, timeoutPromise]);
    
    if (!userSettings) {
      console.log('Get settings: No saved settings found, returning defaults');
      // Return default settings if none found
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          reminders: true,
          weeklyReport: true,
          achievements: true,
          mealReminders: true,
          waterReminders: true,
          exerciseReminders: false
        },
        privacy: {
          dataCollection: true,
          analytics: false,
          thirdParty: false,
          publicProfile: false,
          shareProgress: false,
          marketingEmails: false
        },
        preferences: {
          theme: 'light',
          language: 'es',
          timezone: 'Europe/Madrid',
          measurements: 'metric',
          startWeekOn: 'monday',
          defaultMealTime: {
            breakfast: '08:00',
            lunch: '14:00',
            dinner: '20:00',
            snacks: '16:00'
          },
          calorieDisplay: 'detailed',
          macroDisplay: 'percentage'
        },
        goals: {
          dailyWaterGoal: 8,
          weeklyWeightTarget: 0.5,
          activityLevel: 'moderate',
          priorityGoal: 'weight_loss'
        }
      };
      
      console.log('=== GET USER SETTINGS REQUEST END (defaults) ===');
      return c.json({ settings: defaultSettings });
    }

    console.log('Get settings: Found saved settings for user', user.id);
    console.log('=== GET USER SETTINGS REQUEST END ===');
    return c.json(userSettings);
  } catch (error) {
    console.error('Get user settings error:', error);
    
    // Return default settings on error to prevent blocking the UI
    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        reminders: true,
        weeklyReport: true,
        achievements: true,
        mealReminders: true,
        waterReminders: true,
        exerciseReminders: false
      },
      privacy: {
        dataCollection: true,
        analytics: false,
        thirdParty: false,
        publicProfile: false,
        shareProgress: false,
        marketingEmails: false
      },
      preferences: {
        theme: 'light',
        language: 'es',
        timezone: 'Europe/Madrid',
        measurements: 'metric',
        startWeekOn: 'monday',
        defaultMealTime: {
          breakfast: '08:00',
          lunch: '14:00',
          dinner: '20:00',
          snacks: '16:00'
        },
        calorieDisplay: 'detailed',
        macroDisplay: 'percentage'
      },
      goals: {
        dailyWaterGoal: 8,
        weeklyWeightTarget: 0.5,
        activityLevel: 'moderate',
        priorityGoal: 'weight_loss'
      }
    };
    
    return c.json({ settings: defaultSettings });
  }
}

// Delete user account and all associated data
app.delete("/make-server-b9678739/delete-account", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) return c.text('Unauthorized', 401);

    const userId = user.id;
    console.log('🗑️ Starting account deletion for user:', userId);

    // Get all user data keys and delete them
    const userKeys = await kv.getByPrefix(`user_`);
    const nutritionKeys = await kv.getByPrefix(`nutrition_plan_`);
    const questionnaireKeys = await kv.getByPrefix(`questionnaire_`);
    const metricKeys = await kv.getByPrefix(`metrics_${userId}_`);
    const settingsKeys = await kv.getByPrefix(`user_settings_`);
    const recipeCacheKeys = await kv.getByPrefix(`recipe_cache`);

    const keysToDelete = [
      ...userKeys.filter((key: string) => key.includes(userId)),
      ...nutritionKeys.filter((key: string) => key.includes(userId)),
      ...questionnaireKeys.filter((key: string) => key.includes(userId)),
      ...metricKeys,
      ...settingsKeys.filter((key: string) => key.includes(userId)),
      ...recipeCacheKeys // Also clean recipe cache to prevent conflicts
    ];

    console.log('🗑️ Keys to delete:', keysToDelete);

    if (keysToDelete.length > 0) {
      await kv.mdel(keysToDelete);
      console.log('✅ Deleted', keysToDelete.length, 'keys from KV store');
    }

    // Mark user as deleted in KV store instead of trying to delete from Auth
    // This is more reliable and avoids permission issues
    try {
      console.log('📝 Marking user as deleted in KV store:', userId);
      await kv.set(`deleted_user_${userId}`, {
        user_id: userId,
        deleted_at: new Date().toISOString(),
        reason: 'User requested account deletion'
      });
      console.log('✅ User marked as deleted in KV store');
    } catch (markError) {
      console.error('⚠️ Could not mark user as deleted:', markError);
    }

    // Try to delete from Supabase Auth as well, but don't fail if it doesn't work
    try {
      console.log('🔐 Attempting to delete user from Supabase Auth:', userId);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('⚠️ Could not delete from Supabase Auth:', deleteError);

        // Check if it's a "not found" error (user already deleted or doesn't exist)
        if (deleteError.message?.includes('not found') || deleteError.message?.includes('User not found')) {
          console.log('ℹ️ User not found in Auth - may have been already deleted or never existed');
        } else {
          console.error('❌ Auth deletion failed for a different reason:', deleteError);
          console.log('ℹ️ This is not critical - user data has been cleaned from KV store');
        }
      } else {
        console.log('✅ User successfully deleted from Supabase Auth');
      }
    } catch (authError) {
      console.error('⚠️ Auth deletion exception (continuing):', authError);
      console.log('ℹ️ This is not critical - user data has been cleaned from KV store');
    }

    console.log('✅ Account deletion completed for user:', userId);
    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update daily metrics
app.post("/make-server-b9678739/metrics", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    const metrics = await c.req.json();
    const today = new Date().toISOString().split('T')[0];
    
    await kv.set(`metrics_${user.id}_${today}`, {
      user_id: user.id,
      date: today,
      ...metrics,
      updated_at: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Metrics update error:', error);
    return c.text('Error updating metrics', 500);
  }
});

// Get user metrics history
app.get("/make-server-b9678739/metrics", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    const metrics = await kv.getByPrefix(`metrics_${user.id}_`);
    return c.json(metrics.sort((a, b) => b.date.localeCompare(a.date)));
  } catch (error) {
    console.error('Get metrics error:', error);
    return c.text('Error retrieving metrics', 500);
  }
});

// Get user profile
app.get("/make-server-b9678739/user-profile", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    // Check if user is marked as deleted
    const deletedMarker = await kv.get(`deleted_user_${user.id}`);
    if (deletedMarker) {
      console.log('🚨 User profile request: User is marked as deleted');
      return c.text('User account has been deleted', 410); // 410 Gone
    }

    const profile = await kv.get(`user_profile_${user.id}`);
    const questionnaire = await kv.get(`questionnaire_${user.id}`);
    const metrics = await kv.getByPrefix(`metrics_${user.id}_`);
    
    // Calculate user stats
    const joinDate = profile?.created_at || new Date().toISOString();
    const plansGenerated = questionnaire ? 1 : 0;
    const daysActive = metrics.filter(m => m.caloriesConsumed && parseFloat(m.caloriesConsumed) > 0).length;
    const totalDays = metrics.length || 1;
    const adherenceRate = Math.round((daysActive / totalDays) * 100);

    const responseData = {
      profile: {
        name: user.user_metadata?.name || profile?.name || '',
        email: user.email,
        age: questionnaire?.answers?.personal?.age || '',
        gender: questionnaire?.answers?.personal?.gender || '',
        height: questionnaire?.answers?.personal?.height || '',
        weight: questionnaire?.answers?.personal?.weight || '',
        targetWeight: questionnaire?.answers?.personal?.targetWeight || '',
        activityLevel: questionnaire?.answers?.personal?.activityLevel || '',
        goal: questionnaire?.answers?.personal?.goal || ''
      },
      stats: {
        plansGenerated,
        daysActive,
        adherenceRate,
        joinDate
      }
    };

    return c.json(responseData);
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.text('Error retrieving user profile', 500);
  }
});

// Update user profile
app.put("/make-server-b9678739/user-profile", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    const updatedData = await c.req.json();
    
    // Get current profile
    const currentProfile = await kv.get(`user_profile_${user.id}`) || {};
    
    // Update profile
    const updatedProfile = {
      ...currentProfile,
      ...updatedData,
      updated_at: new Date().toISOString()
    };

    await kv.set(`user_profile_${user.id}`, updatedProfile);

    // If personal health data changed, update questionnaire answers too
    const questionnaire = await kv.get(`questionnaire_${user.id}`);
    if (questionnaire && (updatedData.age || updatedData.gender || updatedData.height || updatedData.weight || updatedData.targetWeight || updatedData.activityLevel || updatedData.goal)) {
      questionnaire.answers.personal = {
        ...questionnaire.answers.personal,
        age: updatedData.age || questionnaire.answers.personal.age,
        gender: updatedData.gender || questionnaire.answers.personal.gender,
        height: updatedData.height || questionnaire.answers.personal.height,
        weight: updatedData.weight || questionnaire.answers.personal.weight,
        targetWeight: updatedData.targetWeight || questionnaire.answers.personal.targetWeight,
        activityLevel: updatedData.activityLevel || questionnaire.answers.personal.activityLevel,
        goal: updatedData.goal || questionnaire.answers.personal.goal
      };
      
      await kv.set(`questionnaire_${user.id}`, questionnaire);
      
      // Regenerate nutrition plan if significant changes
      if (updatedData.weight || updatedData.targetWeight || updatedData.activityLevel || updatedData.goal) {
        const newPlan = await generateNutritionPlan(questionnaire.answers);
        await kv.set(`nutrition_plan_${user.id}`, {
          user_id: user.id,
          plan: newPlan,
          created_at: new Date().toISOString(),
          updated_from_profile: true
        });
      }
    }

    return c.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user profile error:', error);
    return c.text('Error updating user profile', 500);
  }
});

// Helper function to generate nutrition plan based on questionnaire answers
async function generateNutritionPlan(answers: {
  personal: {
    age: number;
    gender: 'male'| 'female';
    height: number;
    weight: number;
    targetWeight?: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryactive';
    goal: 'lose_weight' | 'gain_weight' | 'maintain';
  };
  preferences?: any;
  restrictions?: string[];
}): Promise<{
  macros: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  meals: any;
  restrictions: string[];
  preferences: any;
  targetWeight?: number;
  currentWeight?: number;
}> {
  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
  const { age, gender, height, weight, activityLevel, goal } = answers.personal;
  
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Calculate TDEE (Total Daily Energy Expenditure)
  const multiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate;

  const tdee = bmr * multiplier;
  
  // Adjust calories based on goal
  let targetCalories;
  switch (goal) {
    case 'lose_weight':
      targetCalories = tdee - 500; // 500 calorie deficit for 1lb/week loss
      break;
    case 'gain_weight':
      targetCalories = tdee + 500; // 500 calorie surplus
      break;
    case 'maintain':
    default:
      targetCalories = tdee;
      break;
  }

  // Calculate macronutrient distribution
  const proteinRatio = 0.25; // 25% protein
  const fatRatio = 0.30; // 30% fat
  const carbRatio = 0.45; // 45% carbs

  const macros = {
    calories: Math.round(targetCalories),
    protein: Math.round((targetCalories * proteinRatio) / 4), // 4 cal/g protein
    fat: Math.round((targetCalories * fatRatio) / 9), // 9 cal/g fat
    carbs: Math.round((targetCalories * carbRatio) / 4), // 4 cal/g carbs
  };

  // Generate meal plan structure with real recipes
  const breakfastCalories = Math.round(targetCalories * 0.25);
  const lunchCalories = Math.round(targetCalories * 0.35);
  const dinnerCalories = Math.round(targetCalories * 0.30);
  const snackCalories = Math.round(targetCalories * 0.10);

  const mealPlan = {
    macros,
    meals: {
      breakfast: {
        targetCalories: breakfastCalories,
        foods: await generateMealSuggestions('breakfast', answers.preferences, breakfastCalories)
      },
      lunch: {
        targetCalories: lunchCalories,
        foods: await generateMealSuggestions('lunch', answers.preferences, lunchCalories)
      },
      dinner: {
        targetCalories: dinnerCalories,
        foods: await generateMealSuggestions('dinner', answers.preferences, dinnerCalories)
      },
      snacks: {
        targetCalories: snackCalories,
        foods: await generateMealSuggestions('snacks', answers.preferences, snackCalories)
      }
    },
    restrictions: answers.restrictions || [],
    preferences: answers.preferences || {},
    targetWeight: answers.personal.targetWeight,
    currentWeight: answers.personal.weight
  };

  return mealPlan;
}

// Helper function to generate meal suggestions using Spoonacular API
async function generateMealSuggestions(
  mealType: string, 
  preferences: any, 
  targetCalories: number
  ): Promise<Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image?: string;
    readyInMinutes?: number;
    servings?: number;
    sourceUrl?: string;
  }>> {
  const SPOONACULAR_API_KEY = Deno.env.get('SPOONACULAR_API_KEY');
  
  if (!SPOONACULAR_API_KEY) {
    console.log('Spoonacular API key not found, using fallback suggestions');
    return getFallbackMealSuggestions(mealType);
  }

  try {
    // Map dietary preferences to Spoonacular API format
    let diet = '';
    switch (preferences?.dietType) {
      case 'vegetarian':
        diet = 'vegetarian';
        break;
      case 'vegan':
        diet = 'vegan';
        break;
      case 'keto':
        diet = 'ketogenic';
        break;
      case 'paleo':
        diet = 'paleo';
        break;
      default:
        diet = '';
    }

    // Map meal type to Spoonacular meal type
    let spoonacularMealType = '';
    switch (mealType) {
      case 'breakfast':
        spoonacularMealType = 'breakfast';
        break;
      case 'lunch':
      case 'dinner':
        spoonacularMealType = 'main course';
        break;
      case 'snacks':
        spoonacularMealType = 'snack';
        break;
    }

    const excludeIngredients = preferences?.dislikedFood ? preferences.dislikedFood.join(',') : '';
    
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&type=${spoonacularMealType}&diet=${diet}&excludeIngredients=${excludeIngredients}&number=4&addRecipeInformation=true&fillIngredients=true&addRecipeNutrition=true&maxCalories=${Math.round(targetCalories * 1.2)}&minCalories=${Math.round(targetCalories * 0.8)}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.results.map((recipe: any) => ({
        name: recipe.title,
        calories: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || targetCalories),
        protein: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0),
        carbs: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0),
        fat: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0),
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        sourceUrl: recipe.sourceUrl
      }));
    } else {
      console.log('Spoonacular API request failed, using fallback');
      return getFallbackMealSuggestions(mealType);
    }
  } catch (error) {
    console.error('Error fetching from Spoonacular API:', error);
    return getFallbackMealSuggestions(mealType);
  }
}

// Fallback meal suggestions when API is not available
function getFallbackMealSuggestions(mealType: string): Array<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const mealSuggestions: Record<string, Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>> = {};

  return mealSuggestions[mealType] || [];
}

// Regenerate nutrition plan endpoint
app.post("/make-server-b9678739/regenerate-plan", async (c) => {
  try {
    const user = await verifyUser(c);
    if (!user) {
      return c.text('Unauthorized', 401);
    }

    // Get current questionnaire answers
    const questionnaire = await kv.get(`questionnaire_${user.id}`);
    if (!questionnaire) {
      return c.text('No questionnaire found. Please complete the questionnaire first.', 404);
    }

    // Generate new nutrition plan
    const newPlan = await generateNutritionPlan(questionnaire.answers);
    
    // Store the new nutrition plan
    await kv.set(`nutrition_plan_${user.id}`, {
      user_id: user.id,
      plan: newPlan,
      created_at: new Date().toISOString(),
      regenerated: true
    });

    return c.json({ 
      success: true, 
      message: 'Plan regenerated successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Plan regeneration error:', error);
    return c.text(`Error regenerating plan: ${error.message}`, 500);
  }
});

Deno.serve(app.fetch);