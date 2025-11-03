'use client';

import React, { useState, useEffect, useMemo } from 'react'; // <-- Add useMemo to imports
import { Sparkles, Plus, Minus, X, Menu, Bookmark, Sliders, User, LogOut, RefreshCw, Download, ChevronRight } from 'lucide-react';
import Onboarding from './Onboarding';
import AuthComponent from './CustomAuth'; // Change from './Auth' to './CustomAuth'
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { prettifyIngredient } from "@/lib/ingredientFormatter";

import { Icon } from '@iconify/react';
<Icon icon="mdi:plus-minus" width={18} height={18} />

import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [invalidInput, setInvalidInput] = useState(false);
  const [quantitySteps, setQuantitySteps] = useState(0);
  const [expandedVersionId, setExpandedVersionId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saveCount, setSaveCount] = useState(0);
  const [saveCountTrigger, setSaveCountTrigger] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedRecipe, setLastSavedRecipe] = useState(null);

  const isRecipeSaved = currentRecipe && savedRecipes.some(r => r.title === currentRecipe.title);

  const [hasSeenEditMode, setHasSeenEditMode] = useState(false); // Track if they've turned it on

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setHasSeenEditMode(true); // Mark as seen when turning ON
    }
  };

  const FORBIDDEN_RULES = [
    /illegal/i,
    /self\s*harm/i,
    /hate\s*speech/i,
    /adult\s*content/i,
    /unsafe/i,
  ];

  function isInvalid(text) {
    return FORBIDDEN_RULES.some((r) => r.test(text));
  }

  function parseQtyAndName(s) {
    if (!s) return { quantity: "", name: "" };
    const text = String(s).replace(/\s+/g, " ").trim();
    const rx = /^\s*([~≈]?\d+(?:\.\d+)?(?:\s*(?:\/\s*\d+)?)?(?:\s*(?:-|to)\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)?\s*(?:tsp|teaspoons?|tbsp|tablespoons?|cup|cups|oz|ounces?|g|grams?|kg|ml|milliliters?|l|liters?|pinch(?:es)?|clove(?:s)?)(?:\s*each)?)\s+(.*)$/i;
    const m = text.match(rx);
    if (m) return { quantity: m[1].trim(), name: m[2].trim() };
    return { quantity: "", name: text };
  }

  // Format time - show hours if >= 60 mins
  const formatTime = (mins) => {
    const num = parseInt(mins) || 0;
    if (num >= 60) {
      const hours = Math.floor(num / 60);
      const remaining = num % 60;
      if (remaining === 0) {
        return `${hours} hr${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hr${hours > 1 ? 's' : ''} ${remaining} mins`;
    }
    return `${num} mins`;
  };

  // Random example prompts
  const [examplePrompts, setExamplePrompts] = useState([
    // 🇺🇸 Mainstream American
    "Classic chicken noodle soup, cozy and simple",
    "Creamy mac and cheese for weeknights",
    "BBQ pulled pork sliders, tangy and sweet",
    "Grilled salmon with lemon and herbs",
    "Loaded baked potato with sour cream and bacon",
    "Homemade burger with caramelized onions",
    "Crispy chicken tenders, oven-baked and golden",

    // 🌎 Cultural favorites
    "Taco night with fresh pico de gallo",
    "Margherita pizza, simple and fresh",
    "Chicken teriyaki bowl, quick and savory",
    "Mediterranean grain bowl with feta and veggies",
    "Thai coconut curry soup, cozy and mild",

    // 🧁 Baked goods & desserts
    "Banana bread, moist and nutty",
    "Chocolate chip cookies, chewy center",
    "Blueberry muffins, bakery-style crumb",
    "Cinnamon rolls, gooey and fluffy",
    "Lemon loaf cake, light and zesty",

    // 🍂 Seasonal & cozy picks
    "Pumpkin spice loaf, warm and fragrant",
    "Apple crisp with oat topping",
    "Butternut squash soup, creamy and sweet",
    "Summer peach cobbler, easy and golden",
    "Strawberry shortcake, light and fresh"
  ]);


  // Check authentication state silently (don't force login)
  useEffect(() => {
    const supabase = createClient();
    console.log('🔵 useEffect STARTED');
    console.log('🔵 supabase exists?', !!supabase);
    
    let isSubscribed = true; // Flag to prevent state updates after unmount
    
    const checkUser = async () => {
    try {
      setAuthLoading(true);
      console.log('🔵 checkUser STARTED');
      
      const result = await supabase.auth.getSession();
      console.log('🔵 getSession result:', result);
      
      const session = result?.data?.session;
      console.log('🔵 Got session:', session);
      
      if (!isSubscribed) return;
      
      setUser(session?.user ?? null);
      console.log('🔵 User set to:', session?.user);
        
      if (session?.user) {
        console.log('🔵 User found, checking first-time login status');
        
        // Load preferences
        try {
          // FIRST, check if user has completed first-time login
          const { data: accountData, error: accountError } = await supabase
            .from('user_accounts')
            .select('first_login_completed')
            .eq('user_id', session.user.id)
            .single();
          
          if (accountError) {
            console.log('🔵 No user_accounts record - brand new user');
            // Brand new user - show onboarding
            if (isSubscribed) {
              setShowOnboarding(true);
            }
          } else if (accountData && !accountData.first_login_completed) {
            console.log('🔵 User has not completed first-time onboarding yet');
            // First-time login not completed - show onboarding
            if (isSubscribed) {
              setShowOnboarding(true);
            }
          } else {
            console.log('🔵 User has already completed onboarding - skip it');
          }
          
          // Then load their preferences if they exist
          const { data: prefsData, error: prefsError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (prefsError) {
            console.log('🔵 Preferences error:', prefsError);
          } else if (prefsData && isSubscribed) {
            console.log('🔵 Preferences loaded:', prefsData);
            setUserPreferences(prefsData);
          }
        } catch (err) {
          console.error('🔵 Error loading preferences:', err);
        }
        
        // Load recipes
        try {
          await loadSavedRecipes(session.user.id);
          console.log('🔵 Recipes loaded');
        } catch (err) {
          console.error('🔵 Error loading recipes:', err);
        }
      } else {
        console.log('🔵 No session, checking localStorage');
        const localPrefs = localStorage.getItem('sabor_preferences');
        if (localPrefs && isSubscribed) {
          setUserPreferences(JSON.parse(localPrefs));
        }
        if (isSubscribed) {
          setSavedRecipes([]);
        }
      }
    } catch (error) {
      console.error('🔵 Error in checkUser:', error);
      if (isSubscribed) {
        console.log('🔵 Retrying checkUser in 1 second...');
        setTimeout(() => {
          if (isSubscribed) checkUser();
        }, 1000);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  checkUser();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔵 Auth state changed:', event);
    
    if (!isSubscribed) return;
    
    setUser(session?.user ?? null);
    
    // ... rest of your onAuthStateChange code ...
  });

  return () => {
    isSubscribed = false; // Prevent state updates after unmount
    subscription.unsubscribe();
  };
}, []);
  
  useEffect(() => {
    if (!currentRecipe) {
      setHasUnsavedChanges(false);
      return;
    }
    if (lastSavedRecipe) {
      const recipesAreSame = JSON.stringify(currentRecipe) === lastSavedRecipe;
      setHasUnsavedChanges(!recipesAreSame);
    }
  }, [currentRecipe, lastSavedRecipe, isRecipeSaved]);

  // Randomize prompts when landing page is shown - pick 3 random from 4 pillars
    useEffect(() => {
      if (view === 'landing') {
        // Pillar 1: Cultural
        const cultural = [
          "Korean tofu soup, high protein and cozy",
          "Mexican enchiladas with corn tortillas, gluten-free",
          "Japanese curry rice, weeknight comfort",
          "Indian butter chicken, creamy and balanced spice",
          "Mediterranean chickpea salad, fresh and citrusy"
        ];
        
        // Pillar 2: American comfort
        const americanComfort = [
          "Classic chicken noodle soup, cozy and simple",
          "Homemade mac and cheese, extra creamy",
          "BBQ pulled pork sandwich, tangy and sweet",
          "Loaded baked potato, diner-style",
          "Hearty veggie chili for meal prep"
        ];
        
        // Pillar 3: Bakery + sweets / Trendy
        const bakerySweetsTrendy = [
          "Blueberry muffins, bakery-style soft crumb",
          "Cinnamon rolls, gooey and fluffy",
          "Banana bread, moist and nutty",
          "Chocolate chip cookies, chewy center",
          "Lemon loaf cake, light and zesty",
          "Avocado toast with chili crunch and poached egg",
          "Salmon rice bowl, TikTok-inspired",
          "Brown butter chocolate chip cookies",
          "Matcha pancakes with oat milk glaze",
          "Greek yogurt parfait with honey and pistachios"
        ];

        // Pillar 4: Health / Restrictions / Allergies
        const healthRestrictions = [
          "Gluten-free pasta carbonara, creamy and satisfying",
          "Dairy-free Buddha bowl, plant-based protein",
          "Nut-free energy balls, allergy-friendly snack",
          "Low sodium grilled salmon, heart-healthy",
          "Keto-friendly cauliflower rice stir-fry",
          "Paleo chicken and vegetable skewers",
          "Vegan black bean tacos, high fiber",
          "Sugar-free chocolate avocado mousse, guilt-free",
          "Egg-free banana pancakes, breakfast option",
          "Low FODMAP chicken and rice, digestive-friendly"
        ];

        // All 4 pillars
        const allPillars = [
          { name: 'cultural', prompts: cultural },
          { name: 'american', prompts: americanComfort },
          { name: 'bakery', prompts: bakerySweetsTrendy },
          { name: 'health', prompts: healthRestrictions }
        ];

        // Shuffle and pick 3 random pillars
        const shuffled = [...allPillars].sort(() => Math.random() - 0.5);
        const selectedPillars = shuffled.slice(0, 3);

        // Pick one prompt from each selected pillar
        const selectedPrompts = selectedPillars.map(pillar => 
          pillar.prompts[Math.floor(Math.random() * pillar.prompts.length)]
        );
        
        setExamplePrompts(selectedPrompts);
      }
    }, [view]);
      
      // Load saved recipes
      const loadSavedRecipes = async (userId) => {
        const supabase = createClient();
        console.log('📚 Loading saved recipes for user:', userId);
        
        if (!userId) {
          console.log('📚 No userId provided, skipping load');
          return;
        }
        
        try {
          const { data, error } = await supabase
            .from('saved_recipes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          console.log('📚 Loaded recipes:', data);
          console.log('📚 Load error:', error);
          
          if (error) {
            console.error('📚 Error loading saved recipes:', error);
            // Don't throw - just log and continue
            return;
          }
          
          if (data) {
            console.log('📚 Setting', data.length, 'recipes');
            setSavedRecipes(data);
          } else {
            console.log('📚 No data returned, setting empty array');
            setSavedRecipes([]);
          }
        } catch (err) {
          console.error('📚 Catch error in loadSavedRecipes:', err);
          // Set empty array on error so app continues to work
          setSavedRecipes([]);
        }
      };

  // Load save count when recipe changes
useEffect(() => {
  const loadSaveCount = async () => {
    if (!currentRecipe?.title) {
      setSaveCount(0);
      return;
    }
    
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('saved_recipes')
        .select('*', { count: 'exact', head: true })
        .eq('title', currentRecipe.title);
      
      if (error) {
        console.error('Error loading save count:', error);
        setSaveCount(0);
      } else {
        console.log('📊 Save count loaded:', count);
        setSaveCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading save count:', err);
      setSaveCount(0);
    }
  };
  
  loadSaveCount();
}, [currentRecipe?.title, saveCountTrigger]);

  {/* Notification */}
    {notification && (
      <div 
        className="fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 pointer-events-none"
        style={{ backgroundColor: '#55814E', color: 'white' }}
      >
        {notification}
      </div>
    )}
  // Modals
  const [quantityModal, setQuantityModal] = useState(null);
  const [quantityModalParsed, setQuantityModalParsed] = useState(null);
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
    const supabase = createClient();
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
    const q = searchInput.trim();
    if (!q) return;

    // Client-side guard: show inline message and bail early
    if (isInvalid(q)) {
      setInvalidInput(true);
      setTimeout(() => setInvalidInput(false), 4000);
      return;
    }

    const showNotification = (message, type = 'info', duration = 3000) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), duration);
    };

    setView('recipe');
    const stepInterval = startLoading('generate');

    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          // Send preferences UNLESS cooking for others
          userPreferences: cookingForOthers ? null : userPreferences,
        }),
      });

      // Server-side validation: show inline message for 422
      if (response.status === 422) {
        setInvalidInput(true);
        setTimeout(() => setInvalidInput(false), 4000);
        clearInterval(stepInterval);
        setView('landing');
        return;
      }

      // robust error surfacing
        const __respText = await response.text();
        let __payload;
        try { __payload = JSON.parse(__respText); } catch { __payload = { error: 'NON_JSON', message: __respText }; }
        if (!response.ok) {
          const __msg = `${__payload.error || 'REQUEST_FAILED'}: ${__payload.message || 'Unknown error'} (HTTP ${response.status})`;
          console.error('🔴 Generate error:', __msg, __payload);
          throw new Error(__msg);
        }
        const recipe = __payload;
        clearInterval(stepInterval);
              setCurrentRecipe(recipe);
              setRecipeVersions([recipe]);
              setEditMode(false);
            } catch (error) {
              clearInterval(stepInterval);
              console.error('Error:', error);
              // Keep your existing graceful fallback
              setView('landing');
            } finally {
              setLoading(false);
            }
          };


      const handleSaveRecipe = async () => {
      console.log('📖 ENV CHECK:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      });
    const supabase = createClient();
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Capture the recipe NOW to prevent race conditions
    const recipeToSave = currentRecipe;
    
    if (!recipeToSave || !recipeToSave.title) {
      console.error('📖 No recipe to save!');
      setNotification('Error: No recipe to save');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      console.log('📖 Starting save/unsave...');
      console.log('📖 User ID:', user.id);
      console.log('📖 Recipe title:', recipeToSave.title);
      console.log('📖 About to check if recipe exists...');
      
      // Check if recipe already exists
      console.log('📖 Calling supabase.from...');
      const checkQuery = supabase
        .from('saved_recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', recipeToSave.title);
      
      console.log('📖 Query created, awaiting result...');
      const { data: existingRecipes, error: checkError} = await checkQuery;
      
      console.log('📖 Query completed!');
      console.log('📖 Check error:', checkError);
      console.log('📖 Existing recipes found:', existingRecipes);
      
      if (checkError) {
        console.error('📖 Check error details:', checkError);
        throw checkError;
      }
      
      // Generate a stable recipe ID from the title
      const recipeId = recipeToSave.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // If recipe exists, DELETE it (unsave)
      if (existingRecipes && existingRecipes.length > 0) {
        console.log('📖 Recipe already saved, unsaving...');
        
        const { error: deleteError } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('title', recipeToSave.title);
        
        if (deleteError) {
          console.error('📖 Delete error:', deleteError);
          throw deleteError;
        }
        
        console.log('📖 Recipe unsaved successfully!');
        await loadSavedRecipes(user.id);
        
        // Trigger save count reload
        setSaveCountTrigger(prev => prev + 1);
        
        setNotification('Recipe unsaved!');
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      // If recipe doesn't exist, INSERT it (save)
      console.log('📖 Recipe not saved yet, saving...');
      
      const testData = {
        user_id: user.id,
        title: recipeToSave.title || 'Test Recipe',
        servings: recipeToSave.servings || 4,
        calories: recipeToSave.calories || 0,
        prep: recipeToSave.prep || '0 mins',
        cook: recipeToSave.cook || '0 mins',
        time: recipeToSave.time || '0 mins',
        serving_size: recipeToSave.servingSize || '1 serving',
        ingredients: recipeToSave.ingredients || [],
        instructions: recipeToSave.instructions || [],
        tools_needed: recipeToSave.toolsNeeded || [],
        nutrition: recipeToSave.nutrition || {},
        sources: recipeToSave.sources || []
      };

      console.log('📖 About to insert...');
      
      const result = await supabase
        .from('saved_recipes')
        .insert(testData)
        .select();
      
      console.log('📖 Raw result:', result);
      
      if (result.error) {
        console.error('📖 Insert error:', result.error);
        throw result.error;
      }

      console.log('📖 Success! Data:', result.data);
      await loadSavedRecipes(user.id);
      
      // Trigger save count reload
      setSaveCountTrigger(prev => prev + 1);
      
      setNotification('Recipe saved!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('📖 Catch error:', error);
      setLastSavedRecipe(JSON.stringify(currentRecipe));
      setHasUnsavedChanges(false);
      showNotification('✅ Recipe saved successfully!', 'success');
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

  const testConnection = async () => {
                  const { data, error } = await supabase.from('saved_recipes').select('*').limit(1);
                  console.log('Test query:', data, error);
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

      try {
        const descResponse = await fetch("/api/update-recipe-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalRecipe: currentRecipe,
            modifiedRecipe: newRecipe,
            originalTitle: currentRecipe.title,
            originalDescription: currentRecipe.description || ""
          }),
        });
        
        if (descResponse.ok) {
          const updates = await descResponse.json();
          newRecipe.title = updates.title;
          newRecipe.description = updates.description;
        }
      } catch (err) {
        console.warn("Could not update description:", err.message);
      }

      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `adjusted to ${newServings} servings`,
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

  // Accepts a NUMBER representing number of 0.5 steps
  // Example: 1 => +0.5, 2 => +1.0, -1 => -0.5
  const handleAdjustQuantity = async (steps) => {
    if (typeof steps !== "number" || isNaN(steps)) {
      console.error("handleAdjustQuantity expects a number");
      return;
    }
    if (!quantityModal) return;

    const stepInterval = startLoading?.("adjust-quantity");
    setLoading(true);

    try {
      const parts = String(quantityModal).split(" ");
      const ingredientName =
        parts.length > 2 ? parts.slice(2).join(" ") : parts.join(" ");

      const response = await fetch("/api/adjust-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: currentRecipe,
          ingredient: ingredientName,
          deltaSteps: steps, // backend multiplies steps × 0.5
        }),
      });

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        throw new Error(
          `Failed to adjust quantity (HTTP ${response.status}) ${t}`
        );
      }

      const newRecipe = await response.json();
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `adjusted ${ingredientName}`,
        flavorImpact: newRecipe.flavorImpact // Use what backend generated
      };
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions?.([...recipeVersions, recipeWithChange]);
      setQuantityModal(null);
      setQuantitySteps(0);
      showNotification?.(
        `✓ Adjusted ${ingredientName} by ${(steps * 0.5).toFixed(1)}`
      );
    } catch (err) {
      console.error(err);
      showNotification(err?.message || "Failed to adjust quantity");
    } finally {
      clearInterval?.(stepInterval);
      setLoading(false);
    }
  };

  const handleRemoveIngredient = async (ingredient) => {
    if (!ingredient) return;
    
    const stepInterval = startLoading?.("remove-ingredient");
    setLoading(true);

    try {
      const response = await fetch("/api/remove-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: currentRecipe,
          ingredientToRemove: String(ingredient),
        }),
      });

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        throw new Error(
          `Failed to remove ingredient (HTTP ${response.status}) ${t}`
        );
      }

      const newRecipe = await response.json();

      try {
        const descResponse = await fetch("/api/update-recipe-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalRecipe: currentRecipe,
            modifiedRecipe: newRecipe,
            originalTitle: currentRecipe.title,
            originalDescription: currentRecipe.description || ""
          }),
        });
        
        if (descResponse.ok) {
          const updates = await descResponse.json();
          newRecipe.title = updates.title;
          newRecipe.description = updates.description;
        }
      } catch (err) {
        console.warn("Could not update description:", err.message);
      }

      const ingredientName = String(ingredient).split(',')[0];
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `removed ${ingredientName}`,
        flavorImpact: newRecipe.flavorImpact
      };
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions?.([...recipeVersions, recipeWithChange]);
      setRemoveModal(null);
      showNotification?.(`✓ Removed ${ingredientName}`);
    } catch (err) {
      console.error(err);
      showNotification?.("Error removing ingredient");
    } finally {
      setLoading(false);
      if (stepInterval) clearInterval(stepInterval);
    }
  };

  const handleApplySubstitute = async (originalIngredient, substituteIngredient) => {
    if (!originalIngredient || !substituteIngredient) return;
    
    const stepInterval = startLoading?.("apply-substitute");
    setLoading(true);

    try {
      const response = await fetch("/api/apply-substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: currentRecipe,
          originalIngredient: String(originalIngredient),
          substituteIngredient: String(substituteIngredient),
        }),
      });

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        throw new Error(
          `Failed to apply substitute (HTTP ${response.status}) ${t}`
        );
      }

      const newRecipe = await response.json();

      try {
        const descResponse = await fetch("/api/update-recipe-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalRecipe: currentRecipe,
            modifiedRecipe: newRecipe,
            originalTitle: currentRecipe.title,
            originalDescription: currentRecipe.description || ""
          }),
        });
        
        if (descResponse.ok) {
          const updates = await descResponse.json();
          newRecipe.title = updates.title;
          newRecipe.description = updates.description;
        }
      } catch (err) {
        console.warn("Could not update description:", err.message);
      }

      const originalName = String(originalIngredient).split(',')[0];
      const substituteName = String(substituteIngredient).split(',')[0];
      const recipeWithChange = {
        ...newRecipe,
        changeDescription: `substituted ${originalName} with ${substituteName}`,
        flavorImpact: newRecipe.flavorImpact // Use what the backend returned
      };
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions?.([...recipeVersions, recipeWithChange]);
      setSubstituteOptions(null);
      showNotification?.(`✓ Substituted ${originalName} with ${substituteName}`);
    } catch (err) {
      console.error(err);
      showNotification?.("Error applying substitute");
    } finally {
      setLoading(false);
      if (stepInterval) clearInterval(stepInterval);
    }
  };

  // Show auth screen if user clicked "Sign up"
  if (showAuth) {
    return <AuthComponent onSuccess={handleAuthComplete} onBack={handleAuthBack} />;
  }

  // Main return with sidebar available for all views
  return (
    <>
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg text-white font-medium z-[2000] ${
          typeof notification === 'string' ? 'bg-blue-600' : 
          notification.type === 'success' ? 'bg-green-600' : 
          notification.type === 'error' ? 'bg-red-600' : 
          'bg-blue-600'
        }`}>
          {typeof notification === 'string' ? notification : notification.message}
        </div>
      )}
    {hasUnsavedChanges && view === 'recipe' && (
      <div className="fixed top-20 right-4 px-4 py-2 bg-amber-100 border-2 border-amber-400 text-amber-900 rounded-lg text-sm font-medium z-[1999] flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        Unsaved changes
      </div>
    )}
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
              <Link 
                href="/profile" 
                onClick={() => {
                  console.log('🟢 Profile clicked, user:', user?.email);
                  setSidebarOpen(false);
                }}
              >
                <div className="mb-6 pb-6 border-b border-stone-200 w-full text-left hover:bg-amber-50 rounded-lg transition-colors px-2 py-2 cursor-pointer">
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
                </div>
              </Link>
            )}
            
            <nav className="space-y-2 flex-1">
            <button
              onClick={() => {
                setView('landing');
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
              style={{ fontFamily: 'Birdie, cursive', color: '#55814E' }}
            >
              Home
            </button>

            <button
              onClick={() => {
                setView('saved');
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
              style={{ fontFamily: 'Birdie, cursive', color: '#55814E' }}
            >
              Saved Recipes ({savedRecipes.length})
            </button>

          
            {user && (
            <Link 
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="block w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg transition-colors"
              style={{ fontFamily: 'Birdie, cursive', color: '#55814E' }}
            >
              Edit Profile
            </Link>
            )}
          </nav>


            
            {/* Auth Buttons */}
            {user ? (
              <>
                {console.log('Rendering Sign Out button for user:', user.email)}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors mt-auto"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
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
      <div className="min-h-screen bg-stone-100 pb-8">
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
        <div
              className="bg-mobile-note flex items-center justify-center px-2 py-48 min-h-screen"
              style={{
                backgroundAttachment: 'scroll',
                backgroundPosition: 'top center',
                backgroundSize: '100%',
              }}
            >

          <div className="w-full max-w-2xl">
           {/* Title */}
            <div className="relative w-full overflow-x-hidden flex justify-center">
              <div className="overflow-visible relative w-full flex justify-center">
                <img
                  src="/images/sabor-logo.png"
                  alt="Sabor"
                  className="block"
                  style={{
                    width: '80%',
                    maxWidth: 'none'
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
              <div className="px-2">
                <div
                  className="bg-white rounded-3xl p-8 mb-8 shadow-sm w-full"
                  style={{
                    border: '1px solid #DADADA',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <textarea
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="What should we make today?"
                    className="w-full h-20 px-0 py-0 border-0 focus:outline-none focus:ring-0 resize-none"
                    style={{
                      color: searchInput ? '#1F120C' : '#666',
                      fontSize: '16px',
                      fontFamily: "'Karla', sans-serif",
                      fontWeight: 400,
                      lineHeight: '20px',
                    }}
                    disabled={loading}
                  />

                  {/* message goes BELOW the textarea */}
                  {invalidInput && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm leading-snug">
                      Invalid search input — please try again with a different request 💛
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mt-4">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || !searchInput.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: searchInput.trim()
                          ? '#55814E'
                          : 'rgba(187, 205, 184, 0.40)',
                        border: searchInput.trim()
                          ? '1px solid #55814E'
                          : '1px solid #BBCDB8',
                        cursor: searchInput.trim() ? 'pointer' : 'not-allowed',
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
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
              </div>


            {loading && (
              <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                  <span className="text-amber-600 font-medium text-lg">Creating your perfect recipe...</span>
                </div>
              </div>
            )}

            {/* Toggle Section */}
            <div className="px-2">
              <div className="flex items-center justify-between mb-12 w-full">
                <div>
                  <div className="text-gray-900 font-medium">Make for someone else</div>
                  <div className="text-gray-400 text-sm">Forget my preferences</div>
                </div>
                <button className="relative w-14 h-7 rounded-full transition-colors bg-gray-300">
                  <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform"></div>
                </button>
              </div>
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

        
      </div>
      )}

      {/* Recipe View */}
      {view === 'recipe' && (
        <>
          {loading ? (
            <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#F5F5F5', zIndex: 9999 }}>
              <div className="text-center">
                <h2 className="text-4xl font-semi-bold text-gray-600 mb-4" style={{ fontFamily: 'Crustacean, sans-serif' }}>
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
            
        <div className="min-h-screen bg-stone-100 pb-24" style={{ backgroundColor: '#F5F5F5', fontFamily: "'Karla', sans-serif" }}>
        
         {/* Header */}
        <header className="bg-transparent backdrop-blur-md border-b border-stone-200/50 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Right side - Version History & Edit Mode */}
            <div className="flex items-center justify-end gap-3">
              {recipeVersions.length > 1 && (
                <button
                  onClick={() => setVersionsExpanded(!versionsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-stone-100"
                  style={{ 
                    backgroundColor: versionsExpanded ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                    border: versionsExpanded ? '1px solid #F59E0B' : '2px solid transparent'
                  }}
                >
                  <Sparkles size={18} className="text-amber-600" />
                  <span className="text-sm font-medium" style={{ color: '#616161', fontFamily: "'Karla', sans-serif" }}>
                    ({recipeVersions.length})
                  </span>
                </button>
              )}

              {/* Edit Mode - Always visible */}
              <div className="flex items-center gap-3">
                {/* Try Me! label with arrow - only show if editMode is OFF AND they haven't seen it yet */}
                {!editMode && !hasSeenEditMode && (
                  <style>{`
                    @keyframes arrow-slide-right {
                      0%, 100% {
                        opacity: 0.6;
                        transform: translateX(4px);
                      }
                      50% {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                    .try-me-arrow {
                      animation: arrow-slide-right 1s ease-in-out infinite;
                    }
                  `}</style>
                )}
                {!editMode && !hasSeenEditMode && (
                  <span 
                    className="text-sm font-bold flex items-center gap-1"
                    style={{
                      color: '#eab308',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      textShadow: '0 0 8px rgba(234, 179, 8, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>Try Me!</span>
                    <span className="try-me-arrow">→</span>
                  </span>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-medium" style={{ color: '#616161', fontFamily: "'Karla', sans-serif" }}>Edit Mode</span>
                  <div 
                    onClick={handleEditModeToggle}
                    className="relative w-14 h-8 rounded-full transition-colors"
                    style={{ 
                      backgroundColor: editMode ? '#E07A3F' : '#D1D5DB',
                      cursor: 'pointer',
                      boxShadow: !editMode && !hasSeenEditMode ? '0 0 8px rgba(234, 179, 8, 0.3)' : 'none',
                      animation: !editMode && !hasSeenEditMode ? 'subtle-glow 1.5s ease-in-out infinite' : 'none'
                    }}
                  >
                    <style>{`
                      @keyframes subtle-glow {
                        0%, 100% {
                          box-shadow: 0 0 8px rgba(234, 179, 8, 0.3);
                        }
                        50% {
                          box-shadow: 0 0 15px rgba(234, 179, 8, 0.6);
                        }
                      }
                    `}</style>
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
          </div>
        </header>

        {/* Version History Modal */}
        {versionsExpanded && (
          <>
            {/* Modal Header */}
            <header className="bg-transparent backdrop-blur-md border-b border-stone-200/50 fixed top-0 left-0 right-0 z-50">
              <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-gray-700" />
                </button>
                <button
                  onClick={() => setVersionsExpanded(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-700" />
                </button>
              </div>
            </header>

            {/* Modal Content */}
            <div className="max-w-4xl mx-auto px-4 pt-20 pb-0">
              <div className="bg-white rounded-xl p-4 shadow-sm border-0 border-amber-400">
                <h3 className="font-bold text-gray-800 mb-3">Recipe History</h3>
                <div className="space-y-2">
                  {recipeVersions?.map((version, index) => {
                    const hasIngredientChange = version.changeDescription && (
                      version.changeDescription.toLowerCase().includes('substitut') || 
                      version.changeDescription.toLowerCase().includes('remov') || 
                      version.changeDescription.toLowerCase().includes('add') ||
                      version.changeDescription.toLowerCase().includes('adjusted')

                    );                    
                    return (
                      <div key={index}>
                        <button
                          onClick={() => {
                            setCurrentRecipe(version);
                            setVersionsExpanded(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between gap-2 ${
                            version === currentRecipe
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              V{index + 1}
                            </div>
                            {version.changeDescription && (
                              <div className="text-sm text-gray-600 mt-1">
                                {version.changeDescription}
                              </div>
                            )}
                            {hasIngredientChange && expandedVersionId === index && version.flavorImpact && (
                              <div className="text-sm text-gray-500 mt-2 italic">
                                {version.flavorImpact}
                              </div>
                            )}
                          </div>
                          {hasIngredientChange && (
                            <ChevronRight
                              size={18}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedVersionId(expandedVersionId === index ? null : index);
                              }}
                              className={`text-gray-400 flex-shrink-0 transition-transform cursor-pointer ${
                                expandedVersionId === index ? 'rotate-90 text-amber-500' : 'rotate-180'
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    );
                  }) || null}
                </div>
              </div>
            </div>
          </>
        )}



      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pt-1 pb-10 space-y-6">          
          
          {/* Title Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ position: 'relative', marginTop: versionsExpanded ? '1.5rem' : '4rem' }}>
            <div style={{ position: 'relative', minHeight: '40px' }}>
              <h1
                className="text-center font-bold"
                style={{
                  fontSize: '40px',
                  lineHeight: '1.2',
                  color: '#55814E',
                  padding: '8 8px',
                  marginRight: '28px',
                  marginTop: '8px', // tighten vertical gap
                  fontFamily: 'Birdie, cursive',
                }}
              >
                {currentRecipe?.title?.split('(')[0].trim()}
                {currentRecipe?.title?.includes('(') && (
                  <>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '22px',
                        lineHeight: '1',
                        fontWeight: '400',
                        marginTop: '12px', // tighten vertical gap
                      }}
                    >
                      ({currentRecipe?.title?.split('(')[1]}
                    </span>
                  </>
                )}
              </h1>
                 
                {currentRecipe.description && (
                 <p
                    className="text-[12px] italic text-center mx-auto max-w-xl leading-snug"
                    style={{
                      color: '#616161',
                      fontFamily: "'Karla', sans-serif",
                      marginTop: '16px',
                    }}
                  >
                    {currentRecipe.description}
                  </p>
              )}
              

              {/* Icons - Fixed top right, vertically stacked */}
              <div style={{ 
                position: 'absolute',
                top: 0,
                right: -12,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 10
              }}>
                <button
                  onClick={handleSaveRecipe}
                  className="hover:opacity-70 transition-opacity flex flex-col items-center gap-1"
                  style={{ color: isRecipeSaved ? '#55814E' : '#666' }}
                >
                  {isRecipeSaved ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  ) : (
                    <Bookmark size={24} />
                  )}
                  {isRecipeSaved && saveCount > 0 && (
                    <span className="text-sm font-semibold" style={{ color: '#E07A3F' }}>
                      {saveCount}
                    </span>
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
                  fontFamily: 'Birdie, cursive',
                }}>
                  SERVES {editMode && '▼'}
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '40px', 
                  color: '#666',
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
                  CALS/SERVING
                </div>
                <div className="font-bold" style={{ 
                  fontSize: '40px', 
                  color: '#666',
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
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.prepTimeDisplay || formatTime(currentRecipe.prep)}
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
                  color: '#666',
                  fontFamily: 'Birdie, cursive'
                }}>
                  {currentRecipe.cookTimeDisplay || formatTime(currentRecipe.cook)}
                </div>
              </div>
            </div>

            <div
              className="text-[12px] italic text-center mt-3"
              style={{ color: '#666', fontFamily: "'Karla', sans-serif" }}
            >
              Serving size: {currentRecipe.servingSize}
              <br />
              Total time: {currentRecipe.totalTimeDisplay || formatTime((parseInt(currentRecipe.prep) || 0) + (parseInt(currentRecipe.cook) || 0))}
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
            <h2 className="text-xl font-bold mb-4" style={{ color: '#55814E' }}>
              Ingredients:
            </h2>
            <ul className="space-y-1 : space-y-0">
              {currentRecipe.ingredients?.map((ingredient, index) => {
                const ingredientStr = typeof ingredient === 'string' ? ingredient : ingredient.name || '';
                const isSectionHeader = ingredientStr.startsWith('**') && ingredientStr.endsWith('**');
                
                if (isSectionHeader) {
                  const headerText = ingredientStr.replace(/\*\*/g, '');
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
                    className="flex items-center justify-between p-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: editMode ? "rgba(244, 198, 178, 0.25)" : "transparent",
                    }}
                  >
                    {(() => {
                      const isHeader =
                        typeof ingredient === "string" &&
                        ingredient.startsWith("**") &&
                        ingredient.endsWith("**");
                      if (isHeader) {
                        const header = ingredient.slice(2, -2).trim();
                        return (
                          <span
                            className="flex-1"
                            style={{
                              color: "#55814E",
                              fontSize: "14px",
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                              textTransform: "uppercase",
                              fontFamily: "'Karla', sans-serif",
                            }}
                          >
                            {header}
                          </span>
                        );
                      }

                      // Normal ingredient line → pretty-format quantities for legibility
                      return (
                        <span
                          className="flex-1"
                          style={{ color: "#616161", fontSize: "15px", fontFamily: "'Karla', sans-serif" }}
                        >
                          • {prettifyIngredient(typeof ingredient === 'string' ? ingredient : `${ingredient.displayQuantity || ingredient.quantity} ${ingredient.unit} ${ingredient.name}`.trim())}
                        </span>
                      );
                    })()}

                    {!(
                      typeof ingredient === "string" &&
                      ingredient.startsWith("**") &&
                      ingredient.endsWith("**")
                    ) &&
                      editMode && (
                        <div className="flex gap-2">
                          <button
                            className="inline-flex items-center justify-center w-6 h-6 rounded"
                            style={{ color: "#E07A3F" }}
                            title="Adjust quantity"
                            onClick={() => {
                              setQuantityModal(ingredient);
                              // Extract quantity + unit more reliably
                              const match = String(ingredient).match(/^([\d\s\/\.½¼¾⅓⅔]+(?:\s*(?:tsp|teaspoon|tbsp|tablespoon|cup|oz|g|kg|ml|l|pinch|clove)s?)?)/i);
                              const qty = match ? match[1].trim() : String(ingredient);
                              setQuantityModalParsed(qty);
                              setQuantitySteps(0);
                            }}
                          >
                            <Icon icon="mdi:plus-minus" width={18} height={18} />
                          </button>
                          <button
                            onClick={() => setSubstituteModal(ingredient)}
                            className="hover:bg-opacity-10 rounded-md p-1 transition-colors"
                            title="Substitute"
                            style={{ color: "#E07A3F" }}
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            onClick={() => setRemoveModal(ingredient)}
                            className="hover:bg-opacity-10 rounded-md p-1 transition-colors"
                            title="Remove"
                            style={{ color: "#DC2626" }}
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
            <div className="space-y-4">
              {currentRecipe.instructions?.map((instruction, index) => {
                const trimmed = (instruction ?? '').trim();
                const m = trimmed.match(/^\s*(\*\*[^*]+?\*\*|\*[^*]+?\*|[^:]+):\s*(.*)$/);
                const cleanTitle = m ? m[1].replace(/^\*+|\*+$/g, '') : null;
                const rest = m ? m[2] : null;
                
                // Check if this is a subheader (starts with ** or *)
                const isSubheader = m && (m[1].startsWith('**') || m[1].startsWith('*'));

                return (
                  <div key={index} className="flex gap-4 items-start">
                    {!isSubheader && (
                      <span 
                        className="font-bold flex-shrink-0" 
                        style={{ fontSize: '16px', color: '#E07A3F', width: '15px' }}
                      >
                        {index + 1}.
                      </span>
                    )}
                    
                    {m ? (
                      <div className="flex-1" style={{ color: '#616161', fontSize: '15px', lineHeight: '1.7', fontFamily: "'Karla', sans-serif" }}>
                        <span className={isSubheader ? "font-bold" : "font-bold"} style={{ color: isSubheader ? '#55814E' : '#55814E' }}>
                          {cleanTitle}{isSubheader ? '' : ':'}
                        </span>
                        {rest && !isSubheader && <> {rest}</>}
                        {rest && isSubheader && <> {rest}</>}
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
                <ul className="mt-6 space-y-4">
                  {currentRecipe.sources?.map((source, index) => (
                    <li 
                      key={index} 
                      className="pl-5" 
                      style={{ 
                        color: '#616161',
                        position: 'relative',
                        lineHeight: '1.6',
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
                        style={{ color: '#666', fontSize: '15px' }}
                      >
                        {source.name}
                      </a>
                      <div style={{ fontSize: '13px', color: '#999', marginTop: '3px' }}>
                        {source.type}
                      </div>
                      <div style={{ fontSize: '14px', color: '#55814E', marginTop: '4px', fontWeight: '500' }}>
                        {source.learned}
                      </div>
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
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]"
              onClick={() => { setQuantityModal(null); setQuantitySteps(0); }}
            >
              <div
                className="bg-white p-8 w-full max-w-md shadow-sm"
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '1px solid #DADADA',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px'
                }}
              >
                <h3 className="text-1xl font-bold text-gray-900 mb-1" style={{ color: '#666' }}>
                  Adjust Quantity
                </h3>
                <p className="text-gray-500 text-sm mb-8">
                  Adjust the amount of <strong className="text-gray-700">{quantityModal}</strong>
                </p>

                {/* Original Amount */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#DADADA' }}>
                  <p className="text-xs text-gray-500 mb-2">Original amount</p>
                  <p className="text-lg font-semibold text-gray-900" style={{ color: '#666' }}>
                    {quantityModalParsed}
                  </p>
                </div>

                {/* Quantity Adjuster */}
                <div className="flex items-center justify-center gap-6 my-8">
                  <button
                    onClick={() => setQuantitySteps(Math.max(0, quantitySteps - 1))}
                    className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: '#E4703E', 
                      color: 'white', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    <Minus size={20} strokeWidth={3} />
                  </button>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Adjustment</div>
                    <div className="text-4xl font-bold" style={{ color: '#E4703E', minWidth: '120px' }}>
                      {quantitySteps === 0
                        ? '0'
                        : `${quantitySteps > 0 ? '+' : '−'}${(Math.abs(quantitySteps) * 0.5).toFixed(1)}`}
                    </div>
                  </div>

                  <button
                    onClick={() => setQuantitySteps(quantitySteps + 1)}
                    className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: '#E4703E', 
                      color: 'white', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>

                {/* New Amount */}
                <div className="mb-8 pb-6 border-b" style={{ borderColor: '#DADADA' }}>
                  <p className="text-xs text-gray-500 mb-2">New amount</p>
                  <p className="text-lg font-semibold text-gray-900" style={{ color: '#666' }}>
                    {quantitySteps === 0 
                      ? quantityModalParsed
                      : (() => {
                          // Parse the original quantity to calculate the new one
                          const origQty = parseFloat(String(quantityModalParsed).match(/[\d.]+/)?.[0] || 0);
                          const newQty = origQty + (quantitySteps * 0.5);
                          const unit = String(quantityModalParsed).match(/[a-z]+(?:\s+[a-z]+)?/i)?.[0] || '';
                          return `${newQty.toFixed(1)} ${unit}`;
                        })()}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (quantitySteps === 0) { setQuantityModal(null); setQuantitySteps(0); return; }
                      handleAdjustQuantity(quantitySteps);
                    }}
                    disabled={loading}
                    className="w-full text-white py-3 rounded font-semibold text-base transition-all hover:shadow-md disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#E4703E', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Adjusting...' : 'Apply Changes'}
                  </button>
                  <button
                    onClick={() => { setQuantityModal(null); setQuantitySteps(0); }}
                    className="w-full text-gray-700 py-3 rounded font-semibold text-base transition-all"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #DADADA',
                      borderRadius: '4px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Servings Modal */}
          {servingsModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" 
              onClick={() => setServingsModal(null)}
            >
              <div 
                className="bg-white p-8 w-full max-w-md shadow-sm"
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '1px solid #DADADA',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px'
                }}
              >
                <h3 className="text-1.5xl font-bold text-gray-900 mb-1" style={{ color: '#666' }}>
                  Adjust Servings
                </h3>
                <p className="text-gray-500 text-sm mb-8">How many servings would you like?</p>

                {/* Servings Adjuster */}
                <div className="flex items-center justify-center gap-6 my-12">
                  <button
                    onClick={() => setServingsModal(Math.max(1, servingsModal - 1))}
                    className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: '#E4703E', 
                      borderRadius: '4px',
                      border: '1px solid #E4703E'
                    }}
                  >
                    <Minus size={20} strokeWidth={2} />
                  </button>
                  
                  <div className="text-5xl font-bold" style={{ color: '#E4703E', minWidth: '120px', textAlign: 'center' }}>
                    {servingsModal}
                  </div>

                  <button
                    onClick={() => setServingsModal(servingsModal + 1)}
                    className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: '#E4703E', 
                      borderRadius: '4px',
                      border: '1px solid #E4703E'
                    }}
                  >
                    <Plus size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setServingsModal(null)}
                    className="flex-1 text-gray-700 py-3 rounded font-semibold text-base transition-all"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #DADADA',
                      borderRadius: '4px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAdjustServings(servingsModal)}
                    disabled={loading}
                    className="flex-1 text-white py-3 rounded font-semibold text-base transition-all hover:shadow-md disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#E4703E', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Recipe'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Substitute Confirmation Modal */}
          {substituteModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" 
              onClick={() => setSubstituteModal(null)}
            >
              <div 
                className="bg-white p-8 w-full max-w-md shadow-sm"
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '1px solid #DADADA',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px'
                }}
              >
                <h3 className="text-1xl font-bold text-gray-700 mb-1" style={{ color: '#666' }}>
                  Substitute Ingredient
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Get substitute suggestions for <strong className="text-gray-700">{substituteModal}</strong>?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSubstituteModal(null)}
                    className="flex-1 text-gray-700 py-3 rounded font-semibold transition-all"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #DADADA',
                      borderRadius: '4px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubstitute(substituteModal, true)}
                    className="flex-1 text-white py-3 rounded font-semibold transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: '#55814E', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    Get Suggestions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Substitute Options Modal */}
          {substituteOptions && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" 
              onClick={() => setSubstituteOptions(null)}
            >
              <div 
                className="bg-white w-full max-w-lg max-h-[85vh] flex flex-col shadow-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '1px solid #DADADA',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px'
                }}
              >
                {/* Header */}
                <div className="p-8 border-b" style={{ borderColor: '#DADADA' }}>
                  <h3 className="text-1.5xl font-bold text-gray-900 mb-1" style={{ color: '#666' }}>
                    Substitute Ingredient
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Choose a substitute for <strong className="text-gray-700">{substituteOptions.originalIngredient}</strong>
                  </p>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="space-y-3 mb-6">
                    {substituteOptions.options?.map((option, index) => {
                      const selectionString = `${option.quantity ? option.quantity + ' ' : ''}${option.name}`;
                      const isSelected = substituteOptions.selectedOption === selectionString;

                      return (
                        <button
                          key={index}
                          onClick={() =>
                            setSubstituteOptions({
                              ...substituteOptions,
                              selectedOption: selectionString,
                            })
                          }
                          disabled={loading}
                          className={`w-full text-left p-4 transition-all disabled:opacity-50`}
                          style={{
                            border: `1px solid ${isSelected ? '#55814E' : '#DADADA'}`,
                            backgroundColor: isSelected ? '#55814e21' : 'transparent',
                            borderRadius: '4px'
                          }}
                        >
                          <div className="font-semibold text-gray-900 mb-1 text-base" style={{ color: '#1F120C' }}>
                            {option.name}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {option.quantity || 'Quantity varies'}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {option.impact}
                          </div>
                        </button>
                      );
                    }) || null}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t flex gap-3" style={{ borderColor: '#DADADA' }}>
                  <button
                    onClick={() => setSubstituteOptions(null)}
                    className="flex-1 text-gray-700 py-3 rounded font-semibold text-base transition-all"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #DADADA',
                      borderRadius: '4px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (substituteOptions.selectedOption) {
                        handleApplySubstitute(substituteOptions.originalIngredient, substituteOptions.selectedOption);
                      }
                    }}
                    disabled={!substituteOptions.selectedOption || loading}
                    className="flex-1 text-white py-3 rounded font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                    style={{ 
                      backgroundColor: '#55814E', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    Substitute
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remove Modal */}
          {removeModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" 
              onClick={() => setRemoveModal(null)}
            >
              <div 
                className="bg-white p-8 w-full max-w-md shadow-sm"
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '1px solid #DADADA',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px'
                }}
              >
                <h3 className="text-1.5xl font-bold text-gray-900 mb-4" style={{ color: '#666' }}>
                  Remove Ingredient?
                </h3>
                <p className="text-gray-500 text-sm mb-8">
                  Remove <strong className="text-gray-700">{removeModal}</strong>? Recipe will be regenerated.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setRemoveModal(null)}
                    className="flex-1 text-gray-700 py-3 rounded font-semibold text-sm transition-all"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #DADADA',
                      borderRadius: '4px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemoveIngredient(removeModal)}
                    disabled={loading}
                    className="flex-1 text-white py-3 rounded font-semibold text-sm transition-all hover:shadow-md disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#EF4444', 
                      borderRadius: '4px',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          )}


        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]" onClick={() => setShowLoginPrompt(false)}>
            <div className="bg-white rounded-3xl p-10 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Bookmark className="text-green-700" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to start saving recipes?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create an account to save your favorite recipes and access them anywhere.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-semibold text-base transition-all hover:shadow-lg"
                >
                  Log In / Sign Up
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-semibold text-base transition-all"
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
      
      {/* Auth Modal */}
        {showAuthModal && (
          <>
            <style jsx global>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]"
              onClick={() => setShowAuthModal(false)}
            >
              <div 
                className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'slideUp 0.3s ease-out' }}
              >
                {/* Header */}
                <div 
                  className="flex justify-between items-center px-6 py-5 border-b"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <img 
                    src="/images/sabor-logo.png" 
                    alt="Sabor" 
                    style={{ height: '32px', width: 'auto' }}
                  />
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-8 py-10">
                  <AuthComponent 
                    onSuccess={async () => {
                      console.log('✅ Auth success callback triggered');
                      setShowAuthModal(false);
                      
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();

                
                      if (user) {
                        const { data } = await supabase
                          .from('user_preferences')
                          .select('*')
                          .eq('user_id', user.id)
                          .single();
                        
                        if (data) {
                          setUserPreferences(data);
                        } else {
                          setShowOnboarding(true);
                        }
                        
                        await loadSavedRecipes(user.id);
                      }
                    }}
                    onBack={() => setShowAuthModal(false)}
                  />
                </div>
              </div>
            </div>
          </>
        )} 

  
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]"
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <Onboarding 
              isFirstTime={true}  // Set to true for first-time users, false for returning users editing
              onComplete={async () => {
                console.log('✅ Onboarding complete');
                
                // Mark first login as complete
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                  try {
                    await supabase
                      .from('user_accounts')
                      .update({ first_login_completed: true })
                      .eq('user_id', user.id);
                    console.log('✅ Marked first_login_completed = true');
                  } catch (err) {
                    console.error('Error marking first login complete:', err);
                  }
                }
                
                // Close onboarding
                setShowOnboarding(false);
              }}
            />
          </div>
        </div>
      )}



      {/* Sticky Login Banner - only show if not logged in */}
      {!user && (
        <div className="fixed inset-x-0 bottom-0 z-[100]">
          <div className="relative">
            {/* top fade */}
            <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>
            {/* banner container */}
            <div className="bg-white/90 backdrop-blur-md px-4 py-4 border-t border-stone-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center gap-2 font-semibold transition-colors group"
                  style={{ color: '#55814E' }}
                >
                  <span>Log in to save your recipes</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  


      {/* Saved Recipes View */}
      {view === 'saved' && (
      <div className="min-h-screen bg-stone-100 pt-0">
        {/* Header */}
       <header className="bg-transparent backdrop-blur-md border-b border-stone-200/50 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
      </header>

        <div className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#55814E', fontFamily: 'Birdie, cursive' }}>Saved Recipes</h1>
          
          {savedRecipes.length === 0 ? (
            <p className="text-gray-600">No saved recipes yet.</p>
          ) : (
            <div className="grid gap-4">
              {savedRecipes.map((recipe, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow flex items-center justify-between"
                >
                  <div
                    onClick={() => {
                      setCurrentRecipe({
                        title: recipe.title,
                        servings: recipe.servings,
                        calories: recipe.calories,
                        prep: recipe.prep,
                        cook: recipe.cook,
                        time: recipe.totalTimeDisplay,
                        servingSize: recipe.serving_size,
                        ingredients: recipe.ingredients,
                        instructions: recipe.instructions,
                        toolsNeeded: recipe.tools_needed,
                        nutrition: recipe.nutrition,
                        sources: recipe.sources
                      });
                      setView('recipe');
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>⏱️ {recipe.totalTimeDisplay} </span>
                      <span> {recipe.servings} servings</span>
                      <span> {recipe.calories} cal</span>
                    </div>
                  </div>
                  
                  <div className="relative ml-4">
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          // Unsave directly without relying on currentRecipe state
                          const unsaveRecipe = async () => {
                            const supabase = createClient();
                            if (!user) {
                              setShowLoginPrompt(true);
                              return;
                            }
                            try {
                              const { error } = await supabase
                                .from('saved_recipes')
                                .delete()
                                .eq('user_id', user.id)
                                .eq('title', recipe.title);
                              
                              if (error) throw error;
                              
                              await loadSavedRecipes(user.id);
                              setSaveCountTrigger(prev => prev + 1);
                              showNotification('Recipe unsaved!');
                            } catch (err) {
                              showNotification('Error unsaving recipe');
                            }
                          };
                          unsaveRecipe();
                        }}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: '#55814E' }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </button>
                    {recipe.save_count > 0 && (
                      <div 
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-sm font-semibold"
                        style={{ color: '#E07A3F' }}
                      >
                        {recipe.save_count}
                      </div>
                    )}
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