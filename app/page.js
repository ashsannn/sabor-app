'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Minus, X, Menu, Bookmark, Sliders } from 'lucide-react';

export default function SaborApp() {
  const [view, setView] = useState('landing');
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
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
  
  // Random example prompts
  const [examplePrompts, setExamplePrompts] = useState([
    "Korean tofu soup, high protein",
    "Mexican enchiladas with corn tortillas, gluten-free",
    "Italian osso buco, slow cooked comfort"
  ]);
  
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
  
  // Modals
  const [quantityModal, setQuantityModal] = useState(null);
  const [quantityMultiplier, setQuantityMultiplier] = useState(1.0);
  const [substituteModal, setSubstituteModal] = useState(null);
  const [removeModal, setRemoveModal] = useState(null);
  const [servingsModal, setServingsModal] = useState(null);
  const [substituteOptions, setSubstituteOptions] = useState(null);


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
        body: JSON.stringify({ prompt: searchInput }),
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

  const handleSaveRecipe = () => {
    if (currentRecipe && !savedRecipes.find(r => r.title === currentRecipe.title)) {
      setSavedRecipes([...savedRecipes, currentRecipe]);
      alert('Recipe saved!');
    }
  };

  const handleRemoveIngredient = async (ingredient) => {
    const stepInterval = startLoading('remove');
    
    try {
      const response = await fetch('/api/remove-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe: currentRecipe,
          ingredientToRemove: ingredient 
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
          substituteIngredient: substituteIngredient
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
            ingredientToSubstitute: ingredient 
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

  // Landing View
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-stone-100">
        {/* Header */}
        <div className="px-4 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-700 hover:text-amber-600 transition-colors"
          >
            <Menu size={28} />
          </button>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-amber-600">SABOR</h2>
                <button onClick={() => setSidebarOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <nav className="space-y-4">
                <button
                  onClick={() => {
                    setView('landing');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg"
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => {
                    setView('saved');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 rounded-lg"
                >
                  📚 Saved Recipes ({savedRecipes.length})
                </button>
              </nav>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            {/* Title */}
            <h1 className="text-5xl font-bold text-amber-700 text-center mb-6">SABOR</h1>
            <h2 className="text-4xl font-bold text-green-900 text-center mb-12">
              Let's start chef-ing.
            </h2>

            {/* Search Box */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
              <textarea
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="What do you want to make today?"
                className="w-full h-40 px-0 py-0 border-0 focus:outline-none focus:ring-0 text-gray-800 text-lg resize-none placeholder-gray-400"
                disabled={loading}
              />
              
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !searchInput.trim()}
                  className="w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors"
                >
                  <span className="text-xl">→</span>
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
            <div className="px-2">
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
    );
  }

  // Recipe View
  if (view === 'recipe') {
    if (loading) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center">
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
      );
    }

    if (!currentRecipe) {
      return (
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
      );
    }

    return (
      <div className="min-h-screen bg-stone-100">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            
            <h1 className="text-xl font-bold text-amber-700">SABOR</h1>
            
            <div className="flex items-center gap-3">
              {recipeVersions.length > 1 && (
                <button
                  onClick={() => setVersionsExpanded(!versionsExpanded)}
                  className="text-sm text-gray-600 hover:text-amber-600 flex items-center gap-1"
                >
                  <Sparkles size={14} />
                  {recipeVersions.length} versions
                </button>
              )}
              <button
                onClick={handleSaveRecipe}
                className="flex items-center gap-1 text-gray-700 hover:text-amber-700"
              >
                <Bookmark size={20} />
                <span className="text-sm">save recipe</span>
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-700">Edit Mode</span>
                <div 
                  onClick={() => setEditMode(!editMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    editMode ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    editMode ? 'translate-x-6' : ''
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSidebarOpen(false)}>
            <div className="bg-white w-64 h-full p-6" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSidebarOpen(false)}
                className="mb-6 text-gray-600 hover:text-gray-800"
              >
                ✕ Close
              </button>
              <nav className="space-y-4">
                <button
                  onClick={() => {
                    setView('landing');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-100 rounded-lg"
                >
                  ← Back to Home
                </button>
                <button
                  onClick={() => {
                    setView('saved');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-stone-100 rounded-lg"
                >
                  <Bookmark size={20} />
                  Saved Recipes
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
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
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Title Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentRecipe.title}</h1>
            
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <button
                onClick={() => setServingsModal(currentRecipe.servings)}
                className={`rounded-lg p-2 transition-colors cursor-pointer ${
                  editMode ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-stone-50'
                }`}
              >
                <div className="text-gray-600 text-sm mb-1">SERVES ▼</div>
                <div className="text-2xl font-bold text-gray-900">{currentRecipe.servings}</div>
              </button>
              <div>
                <div className="text-gray-600 text-sm mb-1">CALORIES/SERVING</div>
                <div className="text-2xl font-bold text-gray-900">{currentRecipe.calories}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">PREP</div>
                <div className="text-2xl font-bold text-gray-900">{currentRecipe.prep}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">COOK</div>
                <div className="text-2xl font-bold text-gray-900">{currentRecipe.cook}</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 text-center">
              serving size: {currentRecipe.servingSize} | total time: {currentRecipe.time}
            </div>
          </div>

          {/* Edit Mode Banner */}
          {editMode && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="text-amber-600" size={24} />
              <p className="text-gray-700 font-medium">
                Click icons to adjust quantity, substitute, or remove ingredients
              </p>
            </div>
          )}

          {/* Ingredients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients:</h2>
            <ul className="space-y-1">
              {currentRecipe.ingredients?.map((ingredient, index) => {
                const isSectionHeader = ingredient.startsWith('**') && ingredient.endsWith('**');
                
                if (isSectionHeader) {
                  const headerText = ingredient.replace(/\*\*/g, '');
                  return (
                    <li key={index} className="font-bold text-gray-900 mt-4 mb-2 list-none">
                      {headerText}
                    </li>
                  );
                }
                
                return (
                  <li 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      editMode ? 'bg-amber-50' : ''
                    }`}
                  >
                    <span className="text-gray-700 flex-1">• {ingredient}</span>
                    {editMode && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQuantityModal(ingredient)}
                          className="text-amber-700 hover:text-amber-900 px-2"
                          title="Adjust quantity"
                        >
                          +/−
                        </button>
                        <button
                          onClick={() => setSubstituteModal(ingredient)}
                          className="text-amber-700 hover:text-amber-900 px-2"
                          title="Substitute"
                        >
                          ⚊⚊
                        </button>
                        <button
                          onClick={() => setRemoveModal(ingredient)}
                          className="text-amber-700 hover:text-amber-900 px-2"
                          title="Remove"
                        >
                          ✕
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions:</h2>
            <ol className="space-y-4">
              {currentRecipe.instructions?.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="font-bold text-amber-600 text-lg flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700 flex-1">{instruction}</span>
                </li>
              )) || null}
            </ol>
          </div>

          {/* Tools Needed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-900">Tools Needed</h2>
              <span className="text-2xl text-gray-500">{toolsExpanded ? '−' : '+'}</span>
            </button>
            
            {toolsExpanded && (
              <ul className="mt-4 space-y-2">
                {currentRecipe.toolsNeeded?.map((tool, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <span className="text-amber-600">•</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Nutrition Facts</h2>
              <span className="text-2xl text-gray-500">{nutritionExpanded ? '−' : '+'}</span>
            </button>
            
            {nutritionExpanded && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-4">
                  Per serving ({currentRecipe.servingSize})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-gray-600 text-sm">Calories</div>
                    <div className="font-bold text-gray-900 text-lg">{currentRecipe.calories}</div>
                  </div>
                  {currentRecipe.nutrition && Object.entries(currentRecipe.nutrition).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-gray-600 text-sm capitalize">{key}</div>
                      <div className="font-bold text-gray-900 text-lg">{value}</div>
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
                <h2 className="text-2xl font-bold text-gray-900">Sources</h2>
                <span className="text-2xl text-gray-500">{sourcesExpanded ? '−' : '+'}</span>
              </button>
              
              {sourcesExpanded && (
                <div className="mt-4 space-y-3">
                  {currentRecipe.sources?.map((source, index) => (
                    <div key={index} className="border-l-4 border-amber-500 pl-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-amber-600 hover:text-amber-700 break-words"
                      >
                        {source.name}
                      </a>
                      <div className="text-sm text-gray-600">{source.type}</div>
                    </div>
                  )) || null}
                </div>
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
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
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
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
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
                <h3 className="text-xl font-bold">Substitute Ingredient</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Would you like suggested substitutes for <span className="font-semibold">{substituteModal}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubstitute(substituteModal, true)}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
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
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Regenerating...' : 'Yes, regenerate recipe'}
                </button>
                <button
                  onClick={() => setRemoveModal(null)}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white py-3 rounded-lg font-semibold"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Saved Recipes View
  if (view === 'saved') {
    return (
      <div className="min-h-screen bg-stone-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-6"
          >
            ← Back to Home
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Saved Recipes</h1>
          
          {savedRecipes.length === 0 ? (
            <p className="text-gray-600">No saved recipes yet.</p>
          ) : (
            <div className="grid gap-4">
              {savedRecipes.map((recipe, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentRecipe(recipe);
                    setView('recipe');
                  }}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>⏱️ {recipe.time}</span>
                    <span>🍽️ {recipe.servings} servings</span>
                    <span>🔥 {recipe.calories} cal</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}