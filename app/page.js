'use client';

import React, { useState, useEffect, useMemo } from 'react'; // <-- Add useMemo to imports
import { Sparkles, Plus, Minus, X, Menu, Bookmark, Sliders, User, LogOut, RefreshCw, Download } from 'lucide-react';
import Onboarding from './Onboarding';
import AuthComponent from './Auth';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


export default function SaborApp() {
  const router = useRouter();

  const [view, setView] = useState('landing');
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [cookingForOthers, setCookingForOthers] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [nutritionExpanded, setNutritionExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recipeVersions, setRecipeVersions] = useState([]);
  const [versionsExpanded, setVersionsExpanded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [loadingAction, setLoadingAction] = useState('generate');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  
  // Random example prompts
  const [examplePrompts, setExamplePrompts] = useState([
    "Korean tofu soup, high protein",
    "Mexican enchiladas with corn tortillas, gluten-free",
    "Italian osso buco, slow cooked comfort"
  ]);

  // Check authentication state silently (don't force login)
  useEffect(() => {
    console.log('🔵 useEffect STARTED');
    console.log('🔵 supabase exists?', !!supabase);
    
    const checkUser = async () => {
      try {
        console.log('🔵 checkUser STARTED');
        console.log('🔵 About to call getSession');
        
        const result = await supabase.auth.getSession();
        console.log('🔵 getSession result:', result);
        
        const session = result?.data?.session;
        console.log('🔵 Got session:', session);
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load preferences
          const { data } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (data) {
            setUserPreferences(data);
          }
          
          // Load recipes
          await loadSavedRecipes(session.user.id);
        } else {
          const localPrefs = localStorage.getItem('sabor_preferences');
          if (localPrefs) {
            setUserPreferences(JSON.parse(localPrefs));
          }
          setSavedRecipes([]);
        }
      } catch (error) {
        console.error('🔵 Error in checkUser:', error);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (data) {
          setUserPreferences(data);
        }
        
        await loadSavedRecipes(session.user.id);
      } else {
        const localPrefs = localStorage.getItem('sabor_preferences');
        if (localPrefs) {
          setUserPreferences(JSON.parse(localPrefs));
        } else {
          setUserPreferences(null);
        }
        setSavedRecipes([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Randomize prompts when landing page is shown - pick one from each pillar
  useEffect(() => {
    if (view === 'landing') {
      // Pillar 1: Goal-Based (Protein/Carb/Calorie)
      const goalBased = [
        "Korean tofu soup, high protein",
        "Ethiopian doro wat with 30g of protein",
        "Cuban ropa vieja, high protein low carb",
        "Argentinian steak with chimichurri, protein-packed",
        "Indian tandoori paneer, vegetarian, high protein",
        "Vietnamese shaken beef, high protein and flavorful",
        "Peruvian ceviche, low calorie",
        "Japanese shirataki noodle bowl, low carb",
        "Cauliflower fried rice, low carb",
        "Greek lemon chicken souvlaki, high protein low fat"
      ];
      
      // Pillar 2: Restriction-Based (GF/Dairy-Free/Vegan)
      const restrictionBased = [
        "Mexican enchiladas with corn tortillas, gluten-free",
        "Moroccan chickpea tagine, gluten-free",
        "French coq au vin, dairy-free",
        "Indian butter chicken, lactose free",
        "Mediterranean chickpea salad, gluten-free and vegan",
        "Thai green curry with tofu, vegan",
        "Mexican mole poblano, low sodium",
        "Lebanese fattoush salad, vegan and fresh",
        "Japanese miso ramen, dairy-free",
        "Dominican black bean bowl, vegan high fiber"
      ];
      
      // Pillar 3: Cultural/Mood-Based (Comfort/Global/Seasonal)
      const culturalMoodBased = [
        "Italian osso buco, slow cooked comfort",
        "Filipino chicken adobo, tender and savory",
        "Spanish paella, one-pot meal",
        "Polish pierogi, comfort food",
        "Russian borscht, hearty soup",
        "Turkish shakshuka, quick breakfast",
        "Malaysian laksa with coconut milk",
        "Lebanese lentil soup, warm and cozy",
        "Persian lentil and spinach stew, aromatic",
        "Brazilian feijoada, weekend feast"
      ];
      
      // Pick one random from each pillar
      const randomGoal = goalBased[Math.floor(Math.random() * goalBased.length)];
      const randomRestriction = restrictionBased[Math.floor(Math.random() * restrictionBased.length)];
      const randomCultural = culturalMoodBased[Math.floor(Math.random() * culturalMoodBased.length)];
      
      setExamplePrompts([randomGoal, randomRestriction, randomCultural]);
    }
  }, [view]);
  
  // Load saved recipes
  const loadSavedRecipes = async (userId) => {
  console.log('📚 Loading saved recipes for user:', userId);
  
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('📚 Loaded recipes:', data);
    console.log('📚 Load error:', error);
    
    if (data) {
      setSavedRecipes(data);
    } else if (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  // Modals
  const [quantityModal, setQuantityModal] = useState(null);
  const [quantityMultiplier, setQuantityMultiplier] = useState(1.0);
  const [substituteModal, setSubstituteModal] = useState(null);
  const [removeModal, setRemoveModal] = useState(null);
  const [servingsModal, setServingsModal] = useState(null);
  const [substituteOptions, setSubstituteOptions] = useState(null);

  const handleOnboardingComplete = async (preferences) => {
    setShowOnboarding(false);
    
    if (preferences) {
      if (user) {
        // Logged in: Save to Supabase
        const { data, error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            cooking_for: preferences.cookingFor,
            cooking_style: preferences.cookingStyle,
            dietary_pattern: preferences.dietaryPattern,
            avoidances: preferences.avoidances,
            meal_goals: preferences.mealGoals,
            cuisines: preferences.cuisines,
            other_dietary_pattern: preferences.otherDietaryPattern,
            other_avoidances: preferences.otherAvoidances,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (data) {
          setUserPreferences(data);
          showNotification('✓ Preferences saved to your account!');
        } else if (error) {
          console.error('Error saving preferences:', error);
          showNotification('❌ Failed to save preferences');
        }
      } else {
        // Not logged in: Save to localStorage
        localStorage.setItem('sabor_preferences', JSON.stringify(preferences));
        setUserPreferences(preferences);
        showNotification('✓ Preferences saved locally!');
      }
    }
  };

  const handleSignUpClick = () => {
    if (user) {
      // Already logged in, go straight to onboarding
      setShowOnboarding(true);
    } else {
      // Not logged in, show auth first
      setShowAuth(true);
    }
  };

  const handleAuthComplete = async () => {
    setShowAuth(false);
    
    // Check if user already has preferences
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    // Only show onboarding if NO preferences exist (first time user)
    if (!data) {
      setShowOnboarding(true);
    }
  };

  const handleAuthBack = () => {
    setShowAuth(false);
  };

  // Calculate profile completion
  const getProfileCompletion = (prefs) => {
    if (!prefs) return { complete: false, answered: 0, total: 6 };
    
    let answered = 0;
    const total = 6; // Total onboarding questions
    
    if (prefs.cooking_for || prefs.cookingFor) answered++;
    if ((prefs.cooking_style?.length || prefs.cookingStyle?.length) > 0) answered++;
    if (prefs.dietary_pattern || prefs.dietaryPattern) answered++;
    if ((prefs.avoidances?.length || 0) > 0) answered++;
    if ((prefs.meal_goals?.length || prefs.mealGoals?.length || 0) > 0) answered++;
    if ((prefs.cuisines?.length || 0) > 0) answered++;
    
    return {
      complete: answered === total,
      answered,
      total,
      percentage: Math.round((answered / total) * 100)
    };
  };

  const handleSignOut = async () => {
    console.log('🔴 Signing out...');
    
    // Try Supabase sign out but don't wait for it
    supabase.auth.signOut().catch(err => console.log('Supabase signOut error (ignoring):', err));
    
    // Immediately clear everything
    setUser(null);
    setUserPreferences(null);
    setSidebarOpen(false);
    setCurrentRecipe(null);
    setSavedRecipes([]);
    setView('landing');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies (Supabase stores session here)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('🔴 Storage cleared, reloading...');
    
    // Force full page reload
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // Get contextual loading messages based on action
  const getLoadingMessages = (action) => {
    const messages = {
      generate: [
        ["Selecting ingredients...", "Preparing instructions...", "Measuring portions...", "Plating your recipe..."],
        ["Preheating the oven...", "Chopping ingredients...", "Mixing flavors...", "Tasting perfection..."],
        ["Flipping through cookbooks...", "Finding the perfect recipe...", "Writing ingredients...", "Adding final touches..."],
        ["Consulting master chefs...", "Balancing flavors...", "Crafting instructions...", "Garnishing details..."]
      ],
      remove: [
        ["Taking that out of the mix...", "Rebalancing flavors...", "Adjusting the recipe..."],
        ["Removing and rebalancing...", "Creating new version...", "Perfecting the dish..."],
        ["Dropping that ingredient...", "Tweaking proportions...", "Almost there..."]
      ],
      substitute: [
        ["Finding alternatives...", "Checking the pantry...", "Gathering options..."],
        ["Looking for swaps...", "Browsing substitutes...", "Almost ready..."],
        ["Searching ingredients...", "Finding matches...", "Preparing suggestions..."]
      ],
      'apply-substitute': [
        ["Swapping ingredients...", "Mixing in the substitute...", "Rebalancing recipe..."],
        ["Making the swap...", "Adjusting flavors...", "Creating new version..."],
        ["Replacing ingredient...", "Tweaking the mix...", "Finishing touches..."]
      ],
      quantity: [
        ["Measuring it out...", "Tweaking the amounts...", "Recalculating portions..."],
        ["Adjusting quantities...", "Balancing the recipe...", "Updating measurements..."],
        ["Portioning carefully...", "Fine-tuning amounts...", "Almost done..."]
      ],
      servings: [
        ["Scaling the recipe...", "Recalculating everything...", "Adjusting portions..."],
        ["Portioning it out...", "Multiplying ingredients...", "Balancing servings..."],
        ["Resizing the dish...", "Tweaking quantities...", "Finalizing changes..."]
      ]
    };
    
    const actionMessages = messages[action] || messages.generate;
    return actionMessages[Math.floor(Math.random() * actionMessages.length)];
  };

  const startLoading = (action) => {
    setLoading(true);
    setLoadingAction(action);
    setLoadingStep(0);
    
    const messages = getLoadingMessages(action);
    setLoadingSteps(messages);
    
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < messages.length - 1) return prev + 1;
        return prev;
      });
    }, 600);
    
    return stepInterval;
  };

  const handleGenerate = async () => {
    if (!searchInput.trim()) return;
    
    setView('recipe');
    const stepInterval = startLoading('generate');
    
    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: searchInput,
          // Send preferences UNLESS cooking for others
          userPreferences: cookingForOthers ? null : userPreferences
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate recipe');
      
      const recipe = await response.json();
      clearInterval(stepInterval);
      setCurrentRecipe(recipe);
      setRecipeVersions([recipe]);
      setEditMode(false);
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error:', error);
      alert('Failed to generate recipe. Please try again.');
      setView('landing');
    } finally {
      setLoading(false);
    }
  };

    const handleSaveRecipe = async () => {
    console.log('🔖 Save button clicked');
    
    // Check if user is logged in
    if (!user) {
      console.log('🔖 No user, showing login prompt');
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      // Check if recipe is already saved
      const existingRecipe = savedRecipes.find(r => r.title === currentRecipe.title);
      
      if (existingRecipe) {
        // UNSAVE: Recipe exists, so delete it
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('id', existingRecipe.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error deleting recipe:', error);
          showNotification('❌ Failed to remove recipe');
          return;
        }
        
        // Update local state - remove the recipe
        setSavedRecipes(prevRecipes => prevRecipes.filter(r => r.id !== existingRecipe.id));
        showNotification('✓ Recipe removed from saved');
      } else {
        // SAVE: Recipe doesn't exist, so save it
        const { data, error } = await supabase
          .from('saved_recipes')
          .insert({
            user_id: user.id,
            title: currentRecipe.title,
            servings: currentRecipe.servings,
            calories: currentRecipe.calories,
            prep: currentRecipe.prep,
            cook: currentRecipe.cook,
            time: currentRecipe.time,
            serving_size: currentRecipe.servingSize,
            ingredients: currentRecipe.ingredients,
            instructions: currentRecipe.instructions,
            tools_needed: currentRecipe.toolsNeeded,
            nutrition: currentRecipe.nutrition,
            sources: currentRecipe.sources,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving recipe:', error);
          showNotification('❌ Failed to save recipe');
          return;
        }
        
        // Update local state - add the recipe
        setSavedRecipes(prevRecipes => [...prevRecipes, data]);
        showNotification('✓ Recipe saved to your account!');
      }
    } catch (err) {
      console.error('🔖 Catch error:', err);
      showNotification('❌ Failed to save recipe');
    }
  };


    const isRecipeSaved = useMemo(() => {
      if (!currentRecipe) return false;
      return savedRecipes.some(r => r.title === currentRecipe.title);
    }, [currentRecipe, savedRecipes]);
  

  const handleRemoveIngredient = async (ingredient) => {
    const stepInterval = startLoading('remove');
    
    try {
      const response = await fetch('/api/remove-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe: currentRecipe,
          ingredientToRemove: ingredient,
          userPreferences: cookingForOthers ? null : userPreferences
        }),
      });
      
      if (!response.ok) throw new Error('Failed to regenerate recipe');
      
      const newRecipe = await response.json();
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `removed ${ingredient.split(',')[0]}`
      };
      clearInterval(stepInterval);
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setRemoveModal(null);
      showNotification(`✓ Removed "${ingredient}" - Recipe regenerated and rebalanced`);
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error:', error);
      alert('Failed to remove ingredient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubstitute = async (originalIngredient, substituteIngredient) => {
    const stepInterval = startLoading('apply-substitute');
    
    try {
      const response = await fetch('/api/apply-substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe: currentRecipe,
          originalIngredient: originalIngredient,
          substituteIngredient: substituteIngredient,
          userPreferences: cookingForOthers ? null : userPreferences
        }),
      });
      
      if (!response.ok) throw new Error('Failed to apply substitute');
      
      const newRecipe = await response.json();
      const ingredientName = substituteIngredient.split(' ').slice(2).join(' ');
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `substituted ${originalIngredient.split(' ')[2]} with ${ingredientName}`
      };
      
      clearInterval(stepInterval);
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setSubstituteOptions(null);
      showNotification(`✓ Substituted ${originalIngredient.split(' ')[2]} with ${ingredientName}`);
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error:', error);
      alert('Failed to apply substitute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubstitute = async (ingredient, showSuggestions) => {
    if (showSuggestions) {
      const stepInterval = startLoading('substitute');
      
      try {
        const response = await fetch('/api/substitute-ingredient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            recipe: currentRecipe,
            ingredientToSubstitute: ingredient,
            userPreferences: cookingForOthers ? null : userPreferences
          }),
        });
        
        if (!response.ok) throw new Error('Failed to get substitutes');
        
        const data = await response.json();
        console.log('Substitute options received:', data);
        clearInterval(stepInterval);
        setSubstituteOptions({
          ...data,
          originalIngredient: ingredient
        });
        setSubstituteModal(null);
      } catch (error) {
        clearInterval(stepInterval);
        console.error('Error:', error);
        alert('Failed to get substitute options. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setSubstituteModal(null);
    }
  };

  const handleAdjustServings = async (newServings) => {
    const stepInterval = startLoading('servings');
    
    try {
      const response = await fetch('/api/adjust-servings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe: currentRecipe,
          newServings: newServings 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust servings');
      
      const newRecipe = await response.json();
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `adjusted to ${newServings} servings`
      };
      clearInterval(stepInterval);
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setServingsModal(null);
      showNotification(`✓ Adjusted to ${newServings} servings`);
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error:', error);
      alert('Failed to adjust servings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustQuantity = async () => {
    const stepInterval = startLoading('quantity');
    
    try {
      const response = await fetch('/api/adjust-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe: currentRecipe,
          ingredient: quantityModal,
          multiplier: quantityMultiplier
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust quantity');
      
      const newRecipe = await response.json();
      const ingredientName = quantityModal.split(' ').slice(2).join(' ');
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `adjusted ${ingredientName} by ${quantityMultiplier}x`
      };
      clearInterval(stepInterval);
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setQuantityModal(null);
      setQuantityMultiplier(1.0);
      showNotification(`✓ Adjusted ${ingredientName} quantity by ${quantityMultiplier}x`);
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error:', error);
      alert('Failed to adjust quantity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show auth screen if user clicked "Sign up"
  if (showAuth) {
    return <AuthComponent onSuccess={handleAuthComplete} onBack={handleAuthBack} />;
  }

  // Main return with sidebar available for all views
  return (
    <>
      {/* Global Sidebar - works on all views */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-[1000] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => { setView('landing'); setSidebarOpen(false); }}>
                <img 
                    src="/images/sabor-logo.png" 
                    alt="Sabor" 
                    className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                  />
              </button>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            {/* User Info - Clickable to go to profile */}
            {user && (
              <button
                onClick={() => {
                  router.push('/profile');
                  setSidebarOpen(false);
                }}
                className="mb-6 pb-6 border-b border-stone-200 w-full text-left hover:bg-amber-50 rounded-lg transition-colors px-2 py-2"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <User size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const completion = getProfileCompletion(userPreferences);
                        if (!userPreferences) {
                          return 'No preferences set';
                        } else if (completion.complete) {
                          return '✓ Profile complete';
                        } else {
                          return `${completion.answered}/${completion.total} questions answered`;
                        }
                      })()}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">→</span>
                </div>
              </button>
            )}
            
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => {
                  setView('landing');
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
              >
                 Home
              </button>
  
              <button
                onClick={() => {
                  setView('saved');
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
              >
                 Saved Recipes ({savedRecipes.length})
              </button>
              {userPreferences && (
                <button
                  onClick={() => {
                    setShowOnboarding(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  {(() => {
                    const completion = getProfileCompletion(userPreferences);
                    if (completion.complete) {
                      return '⚙️ Edit Preferences';
                    } else {
                      return `✏️ Complete Profile (${completion.answered}/${completion.total})`;
                    }
                  })()}
                </button>
              )}
            </nav>
            
            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors mt-auto"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowAuth(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-amber-50 text-amber-700 rounded-lg transition-colors mt-auto"
              >
                <User size={18} />
                Sign In / Sign Up
              </button>
            )}
          </div>
        </>
      )}

      {/* Landing View */}
      {view === 'landing' && (
      <div className="min-h-screen bg-stone-100">
        {/* Header */}
        <header className="bg-stone-100 border-b border-stone-200/50 fixed top-0 left-0 right-0 z-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-mobile-note flex items-center justify-center px-4 py-48 min-h-screen">

          <div className="w-full max-w-2xl">
            {/* Title */}
              <div className="overflow-visible relative" style={{ width: '100%' }}>
              <div className="flex justify-center mb-2">
                <img
                  src="/images/sabor-logo.png"
                  alt="Sabor"
                  style={{ 
                    width: '420px',  // Make it oversized
                    maxWidth: 'none'  // Override any max-width constraints
                  }}
                />
              </div>
            </div>
               <h2 
                className="text-3xl text-center mb-8 mt-0"
                style={{ 
                  color: '#55814E',
                  fontFamily: 'Birdie, cursive'
                }}
              >
                Let's start chef-ing.
              </h2>

            {/* Search Box */}
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm" 
              style={{ 
                border: '1px solid #DADADA',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <textarea
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="What should we make today?"
                className="w-full h-20 px-0 py-0 border-0 focus:outline-none focus:ring-0 resize-none"
                style={{ 
                  color: searchInput ? '#1F120C' : '#DADADA',
                  fontSize: '16px',
                  fontFamily: "'Karla', sans-serif",
                  fontWeight: '400',
                  lineHeight: '20px'
                }}
                disabled={loading}
              />
              
              <div className="flex items-center justify-end mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !searchInput.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    background: searchInput.trim() ? '#55814E' : 'rgba(187, 205, 184, 0.40)',
                    border: searchInput.trim() ? '1px solid #55814E' : '1px solid #BBCDB8',
                    cursor: searchInput.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path 
                      d="M4.17 10H15.83M15.83 10L10 4.17M15.83 10L10 15.83" 
                      stroke={searchInput.trim() ? 'white' : '#55814E'}
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                <span>Creating your perfect recipe...</span>
              </div>
            )}

            {/* Make for someone else toggle */}
            <div className="flex items-center justify-between mb-12 px-2">
              <div>
                <div className="text-gray-900 font-medium">Make for someone else</div>
                <div className="text-gray-400 text-sm">Forget my preferences</div>
              </div>
              <button
                onClick={() => setCookingForOthers(!cookingForOthers)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  cookingForOthers ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    cookingForOthers ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>

            {/* Example Prompts */}
            <div className="px-2 pb-24">
              <p className="text-gray-600 text-sm mb-4 font-medium">You can say something like...</p>
              <div className="space-y-3">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchInput(prompt)}
                    className="w-full bg-white hover:bg-gray-50 rounded-2xl p-5 text-left shadow-sm transition-colors flex items-center justify-between group"
                  >
                    <span className="text-gray-900 font-medium">{prompt}</span>
                    <span className="text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Personalization CTA Banner - only show if no preferences set */}
        {!userPreferences && !user && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <div className="relative">
              {/* Gradient fade overlay */}
              <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>
              
              {/* Banner content */}
              <div className="bg-white/60 backdrop-blur-md px-4 py-4">
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={handleSignUpClick}
                    className="w-full flex items-center justify-center gap-2 text-green-700 hover:text-green-800 font-semibold transition-colors group"
                  >
                    <span>Ready to personalize your meals? {user ? 'Get started' : 'Sign in'}</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Recipe View */}
      {view === 'recipe' && (
        <>
          {loading ? (
            <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5', fontFamily: 'Karla, sans-serif' }}>
              <div className="text-center">
                <div className="mb-6">
                  <Sparkles className="w-16 h-16 text-amber-600 mx-auto animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {loadingSteps[loadingStep] || 'Working on it...'}
                </h2>
                <div className="flex gap-2 justify-center">
                  {loadingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= loadingStep ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : !currentRecipe ? (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">No recipe loaded</p>
                <button
                  onClick={() => setView('landing')}
                  className="mt-4 text-amber-600 hover:text-amber-700"
                >
                  Go back
                </button>
              </div>
            </div>
          ) : (
            
        <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5', fontFamily: "'Karla', sans-serif" }}>
        {/* Header */}
        <header className="bg-transparent backdrop-blur-md border-b border-stone-200/50 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium" style={{ color: '#616161', fontFamily: "'Karla', sans-serif" }}>Edit Mode</span>
                <div 
                  onClick={() => setEditMode(!editMode)}
                  className="relative w-14 h-8 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: editMode ? '#9CA3AF' : '#D1D5DB',
                    cursor: 'pointer'
                  }}
                >
                  <div 
                    className="absolute top-1 bg-white rounded-full transition-transform shadow-md"
                    style={{
                      width: '26px',
                      height: '26px',
                      left: editMode ? 'calc(100% - 30px)' : '4px'
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50"
            style={{ backgroundColor: '#55814E', color: 'white' }}
          >
            {notification}
          </div>
        )}

        {/* Version History */}
        {versionsExpanded && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-amber-400">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="text-amber-600" size={20} />
                Recipe History
              </h3>
              <div className="space-y-2">
                {recipeVersions?.map((version, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentRecipe(version);
                      setVersionsExpanded(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      version === currentRecipe
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">
                      Version {recipeVersions.length - index}
                    </div>
                    {version.changeDescription && (
                      <div className="text-sm text-gray-600 mt-1">
                        {version.changeDescription}
                      </div>
                    )}
                  </button>
                )) || null}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-4 pt-8 pb-16 space-y-6">
          
          {/* Title Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-12" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', minHeight: '40px' }}>
              <h1 className="text-center font-bold" style={{ 
                fontSize: '42px',
                lineHeight: '1.2',
                color: '#55814E',
                padding: '0 32px',
                fontFamily: 'Birdie, cursive'
              }}>
                {currentRecipe.title.split('(')[0].trim()}
                {currentRecipe.title.includes('(') && (
                  <>
                    <br />
                    <span style={{ fontSize: '22px', fontWeight: '400' }}>
                      ({currentRecipe.title.split('(')[1]}
                    </span>
                  </>
                )}
              </h1>
              
              {/* Icons - Fixed top right, vertically stacked */}
              <div style={{ 
                position: 'absolute',
                top: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 10
              }}>
                <button
                  onClick={handleSaveRecipe}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: isRecipeSaved ? '#55814E' : '#666' }}
                >
                  {isRecipeSaved ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  ) : (
                    <Bookmark size={24} />
                  )}
                </button>
                <button
                  onClick={() => alert('Export recipe')}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: '#666' }}
                >
                  <Download size={24} />
                </button>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-0 mt-4">
              {/* Serves */}
              <button
                onClick={() => editMode && setServingsModal(currentRecipe.servings)}
                className="p-5 text-center transition-colors rounded-lg"
                style={{ 
                  backgroundColor: editMode ? 'rgba(244, 198, 178, 0.25)' : 'transparent',
                  cursor: editMode ? 'pointer' : 'default'
                }}
              >
                <div className="text-xs uppercase tracking-wide mb-2" style={{ 
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  SERVES {editMode && '▼'}
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '36px', 
                  color: '#1A1A1A',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.servings}
                </div>
              </button>
              
              {/* Calories */}
              <div 
                className="p-5 text-center"
              >
                <div className="text-xs uppercase tracking-wide mb-2" style={{ 
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  CALORIES
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '36px', 
                  color: '#1A1A1A',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.calories}
                </div>
              </div>
              
              {/* Prep */}
              <div className="p-5 text-center">
                <div className="text-xs uppercase tracking-wide mb-2" style={{ 
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  PREP
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '28px', 
                  color: '#1A1A1A',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.prep}
                </div>
              </div>
              
              {/* Cook */}
              <div className="p-5 text-center">
                <div className="text-xs uppercase tracking-wide mb-2" style={{ 
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  COOK
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '28px', 
                  color: '#1A1A1A',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.cook}
                </div>
              </div>
            </div>

            <div className="text-sm text-center mt-4" style={{ color: '#666' }}>
              serving size: {currentRecipe.servingSize}<br />
              total time: {currentRecipe.time}
            </div>
          </div>

          {/* Edit Mode Banner */}
          {editMode && (
            <div 
              className="rounded-xl p-4 flex items-center gap-3" 
              style={{ backgroundColor: '#FEF7E0', border: '2px solid #F5C842' }}
            >
              <span style={{ fontSize: '24px' }}>*</span>
              <p className="font-medium" style={{ color: '#8B6914', fontSize: '14px' }}>
                Click icons to adjust quantity, substitute, or remove ingredients
              </p>
            </div>
          )}

          {/* Ingredients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#55814E' }}>
              Ingredients:
            </h2>
            <ul className="space-y-1">
              {currentRecipe.ingredients?.map((ingredient, index) => {
                const isSectionHeader = ingredient.startsWith('**') && ingredient.endsWith('**');
                
                if (isSectionHeader) {
                  const headerText = ingredient.replace(/\*\*/g, '');
                  return (
                    <li 
                      key={index} 
                      className="font-bold mt-4 mb-2 list-none" 
                      style={{ color: '#55814E', fontSize: '16px' }}
                    >
                      {headerText}
                    </li>
                  );
                }
                
                return (
                  <li 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg transition-all"
                    style={{ 
                      backgroundColor: editMode ? 'rgba(244, 198, 178, 0.25)' : 'transparent'
                    }}
                  >
                    <span className="flex-1" style={{ color: '#616161', fontSize: '15px', fontFamily: "'Karla', sans-serif" }}>
                      • {ingredient}
                    </span>
                    {editMode && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQuantityModal(ingredient)}
                          className="hover:bg-opacity-10 rounded-md p-1 transition-colors"
                          title="Adjust quantity"
                          style={{ color: '#E07A3F' }}
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => setSubstituteModal(ingredient)}
                          className="hover:bg-opacity-10 rounded-md p-1 transition-colors"
                          title="Substitute"
                          style={{ color: '#E07A3F' }}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => setRemoveModal(ingredient)}
                          className="hover:bg-opacity-10 rounded-md p-1 transition-colors"
                          title="Remove"
                          style={{ color: '#DC2626' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              }) || null}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#55814E' }}>
              Instructions:
            </h2>
            <div className="space-y-6">
              {currentRecipe.instructions?.map((instruction, index) => {
                const trimmed = (instruction ?? '').trim();
                const m = trimmed.match(/^\s*(\*\*[^*]+?\*\*|\*[^*]+?\*|[^:]+):\s*(.*)$/);
                const cleanTitle = m ? m[1].replace(/^\*+|\*+$/g, '') : null;
                const rest = m ? m[2] : null;

                return (
                  <div key={index} className="flex gap-4 items-start">
                    <span 
                      className="font-bold flex-shrink-0" 
                      style={{ fontSize: '16px', color: '#E07A3F', width: '15px' }}
                    >
                      {index + 1}.
                    </span>
                    
                    {m ? (
                      <div className="flex-1" style={{ color: '#616161', fontSize: '15px', lineHeight: '1.7', fontFamily: "'Karla', sans-serif" }}>
                        <span className="font-bold" style={{ color: '#55814E' }}>
                          {cleanTitle}:
                        </span>
                        {rest && <> {rest}</>}
                      </div>
                    ) : (
                      <div className="flex-1" style={{ color: '#616161', fontSize: '15px', lineHeight: '1.5', fontFamily: "'Karla', sans-serif" }}>
                        {instruction}
                      </div>
                    )}
                  </div>
                );
              }) || null}
            </div>
          </div>

          {/* Tools Needed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-bold" style={{ color: '#55814E' }}>
                Tools Needed
              </h2>
              <span style={{ 
                fontSize: '16px', 
                color: '#999',
                transform: toolsExpanded ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.3s',
                display: 'inline-block'
              }}>
                ▼
              </span>
            </button>
            
            {toolsExpanded && (
              <ul className="mt-6 space-y-3">
                {currentRecipe.toolsNeeded?.map((tool, index) => (
                  <li 
                    key={index} 
                    className="pl-5" 
                    style={{ 
                      color: '#616161',
                      position: 'relative',
                      fontSize: '15px',
                      fontFamily: "'Karla', sans-serif"
                    }}
                  >
                    <span style={{ 
                      position: 'absolute',
                      left: 0,
                      color: '#E07A3F',
                      fontSize: '20px'
                    }}>
                      •
                    </span>
                    {tool}
                  </li>
                )) || null}
              </ul>
            )}
          </div>

          {/* Nutrition Facts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <button
              onClick={() => setNutritionExpanded(!nutritionExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-bold" style={{ color: '#55814E' }}>
                Nutrition Facts
              </h2>
              <span style={{ 
                fontSize: '16px', 
                color: '#999',
                transform: nutritionExpanded ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.3s',
                display: 'inline-block'
              }}>
                ▼
              </span>
            </button>
            
            {nutritionExpanded && (
              <div className="mt-6">
                <div className="text-sm mb-4" style={{ color: '#666' }}>
                  Per serving ({currentRecipe.servingSize})
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className="text-sm" style={{ color: '#666' }}>Calories</div>
                    <div className="font-bold" style={{ fontSize: '24px', color: '#1A1A1A' }}>
                      {currentRecipe.calories}
                    </div>
                  </div>
                  {currentRecipe.nutrition && Object.entries(currentRecipe.nutrition).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm capitalize" style={{ color: '#666' }}>{key}</div>
                      <div className="font-bold" style={{ fontSize: '24px', color: '#1A1A1A' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sources */}
          {currentRecipe.sources && currentRecipe.sources.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-xl font-bold" style={{ color: '#55814E' }}>
                  Sources
                </h2>
                <span style={{ 
                  fontSize: '16px', 
                  color: '#999',
                  transform: sourcesExpanded ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 0.3s',
                  display: 'inline-block'
                }}>
                  ▼
                </span>
              </button>
              
              {sourcesExpanded && (
                <ul className="mt-6 space-y-3">
                  {currentRecipe.sources?.map((source, index) => (
                    <li 
                      key={index} 
                      className="pl-5" 
                      style={{ 
                        color: '#616161',
                        position: 'relative',
                        lineHeight: '1.6',
                        fontSize: '15px',
                        fontFamily: "'Karla', sans-serif"
                      }}
                    >
                      <span style={{ 
                        position: 'absolute',
                        left: 0,
                        color: '#E07A3F',
                        fontSize: '20px'
                      }}>
                        •
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:underline"
                        style={{ color: '#55814E' }}
                      >
                        {source.name}
                      </a>
                      {' - '}
                      <span>{source.type}</span>
                    </li>
                  )) || null}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Modals - (keeping all the same modals from before) */}
        
        {/* Quantity Modal */}
        {quantityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Adjust Quantity</h3>
              </div>
              
              <p className="text-gray-700 mb-2">
                Adjusting: <span className="font-semibold text-gray-900">{quantityModal}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Multiply the quantity by:
              </p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setQuantityMultiplier(Math.max(0.1, quantityMultiplier - 0.1))}
                  className="w-12 h-12 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xl"
                >
                  −
                </button>
                <div className="text-3xl font-bold text-amber-600 min-w-[80px] text-center">
                  {quantityMultiplier.toFixed(1)}x
                </div>
                <button
                  onClick={() => setQuantityMultiplier(quantityMultiplier + 0.1)}
                  className="w-12 h-12 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xl"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdjustQuantity}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-gray-900 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Adjusting...' : 'Apply'}
                </button>
                <button
                  onClick={() => {
                    setQuantityModal(null);
                    setQuantityMultiplier(1.0);
                  }}
                  className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Servings Modal */}
        {servingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Adjust Servings</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                How many servings would you like?
              </p>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {servingsModal} servings
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setServingsModal(Math.max(1, servingsModal - 1))}
                  className="w-16 h-16 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-2xl text-gray-900"
                >
                  −
                </button>
                <button
                  onClick={() => setServingsModal(servingsModal + 1)}
                  className="w-16 h-16 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-2xl"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAdjustServings(servingsModal)}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-gray-900 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update servings'}
                </button>
                <button
                  onClick={() => setServingsModal(null)}
                  className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Substitute Options Modal */}
        {substituteOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border-2 border-amber-500 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-600" size={24} />
                  <h3 className="text-xl font-bold">Substitute Options</h3>
                </div>
                <button
                  onClick={() => setSubstituteOptions(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-700 mb-2">
                Replacing: <span className="font-semibold text-gray-900">{substituteOptions.originalIngredient}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Choose a substitute below:
              </p>

              <div className="space-y-3">
                {substituteOptions.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplySubstitute(substituteOptions.originalIngredient, option.ingredient)}
                    disabled={loading}
                    className="w-full text-left p-4 rounded-xl border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">→</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">{option.ingredient}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  </button>
                )) || null}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSubstituteOptions(null)}
                  className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Substitute Confirmation Modal */}
        {substituteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-600" size={24} />
                <h3 className="text-xl text-gray-900 font-bold">Substitute Ingredient</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Would you like suggested substitutes for <span className="font-semibold">{substituteModal}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubstitute(substituteModal, true)}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-gray-900 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Getting substitutes...' : 'Yes, show substitutes'}
                </button>
                <button
                  onClick={() => setSubstituteModal(null)}
                  className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Modal */}
        {removeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-600" size={24} />
                <h3 className="text-xl font-bold">Recipe Regeneration</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Want to remove this ingredient? We'll create a new recipe without it.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRemoveIngredient(removeModal)}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-gray-900 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Regenerating...' : 'Yes, regenerate recipe'}
                </button>
                <button
                  onClick={() => setRemoveModal(null)}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-gray-900 py-3 rounded-lg font-semibold"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to start saving recipes?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Create an account to save your favorite recipes and access them anywhere.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setShowAuth(true);
                  }}
                  className="w-full bg-green-700 hover:bg-green-800 text-gray-900 py-3 rounded-lg font-semibold transition-colors"
                >
                  Log In / Sign Up
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full bg-stone-200 hover:bg-stone-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
          )}
        </>
      )}

      {/* Saved Recipes View */}
      {view === 'saved' && (
      <div className="min-h-screen bg-stone-100">
        {/* Header */}
        <header className="bg-transparent backdrop-blur-md border-b border-stone-200/50 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <button onClick={() => setView('landing')}>
              <img 
                src="/images/sabor-logo.png" 
                alt="Sabor" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </button>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </header>

        <div className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Saved Recipes</h1>
          
          {savedRecipes.length === 0 ? (
            <p className="text-gray-600">No saved recipes yet.</p>
          ) : (
            <div className="grid gap-4">
              {savedRecipes.map((recipe, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentRecipe({
                      title: recipe.title,
                      servings: recipe.servings,
                      calories: recipe.calories,
                      prep: recipe.prep,
                      cook: recipe.cook,
                      time: recipe.time,
                      servingSize: recipe.serving_size, // database uses snake_case
                      ingredients: recipe.ingredients,
                      instructions: recipe.instructions,
                      toolsNeeded: recipe.tools_needed, // database uses snake_case
                      nutrition: recipe.nutrition,
                      sources: recipe.sources
                    });
                    setView('recipe');
                  }}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>⏱️ {recipe.time}</span>
                    <span> {recipe.servings} servings</span>
                    <span> {recipe.calories} cal</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
      )}
    </>
  );
}
