'use client';

import React, { useState } from 'react';
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

  const handleGenerate = async () => {
    if (!searchInput.trim()) return;
    
    setLoading(true);
    setView('recipe');
    setLoadingStep(0);
    
    // Randomly pick a loading theme
    const loadingThemes = [
      [
        "Selecting ingredients...",
        "Preparing instructions...",
        "Measuring portions...",
        "Plating your recipe..."
      ],
      [
        "Preheating the oven...",
        "Chopping ingredients...",
        "Mixing flavors...",
        "Tasting perfection..."
      ],
      [
        "Flipping through cookbooks...",
        "Finding the perfect recipe...",
        "Writing ingredients...",
        "Adding final touches..."
      ],
      [
        "Consulting master chefs...",
        "Balancing flavors...",
        "Crafting instructions...",
        "Garnishing details..."
      ]
    ];
    
    const randomTheme = loadingThemes[Math.floor(Math.random() * loadingThemes.length)];
    setLoadingSteps(randomTheme);
    
    // Animate through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < randomTheme.length - 1) return prev + 1;
        return prev;
      });
    }, 800);
    
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
    setLoading(true);
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
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setRemoveModal(null);
      showNotification(`✓ Removed "${ingredient}" - Recipe regenerated and rebalanced`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to remove ingredient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubstitute = async (originalIngredient, substituteIngredient) => {
  setLoading(true);
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
    const ingredientName = substituteIngredient.split(' ').slice(2).join(' '); // Get ingredient name without quantity
    const recipeWithChange = {
      ...newRecipe,
      changeDescription: `substituted ${originalIngredient.split(' ')[2]} with ${ingredientName}`
    };
    
    setCurrentRecipe(recipeWithChange);
    setRecipeVersions([...recipeVersions, recipeWithChange]);
    setSubstituteOptions(null);
    showNotification(`✓ Substituted ${originalIngredient.split(' ')[2]} with ${ingredientName}`);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to apply substitute. Please try again.');
  } finally {
    setLoading(false);
  }
  };

  const handleSubstitute = async (ingredient, showSuggestions) => {
      if (showSuggestions) {
        setLoading(true);
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
          setSubstituteOptions({
            ...data,
            originalIngredient: ingredient
          });
          setSubstituteModal(null);
        } catch (error) {
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
    setLoading(true);
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
      
      setCurrentRecipe(recipeWithChange);
      setRecipeVersions([...recipeVersions, recipeWithChange]);
      setServingsModal(null);
      showNotification(`✓ Adjusted to ${newServings} servings - Recipe scaled`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to adjust servings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Landing View
  if (view === 'landing') {
    const examplePrompts = [
      "Korean tofu soup with a kick of protein",
      "Ecuadorian lentil soup with 30g of protein",
      "Tandoori chicken meal, lactose free"
    ];

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
    // Show loading screen if still loading
    if (loading && loadingSteps.length > 0) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="mb-8 animate-bounce">
                <Sparkles className="text-amber-600" size={64} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Creating Your Recipe</h2>
              
              <div className="w-full space-y-4">
                {loadingSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index === loadingStep 
                        ? 'bg-amber-100 text-amber-900' 
                        : index < loadingStep 
                        ? 'bg-green-50 text-green-900' 
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {index < loadingStep ? (
                      <span className="text-green-600 font-bold text-xl">✓</span>
                    ) : index === loadingStep ? (
                      <div className="w-5 h-5 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="w-5 h-5 border-2 border-gray-300 rounded-full"></span>
                    )}
                    <span className="font-medium text-gray-900">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Show actual recipe when loaded
    if (!currentRecipe) return null;
    
    return (
      <div className="min-h-screen bg-stone-100">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-20 border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-800 hover:text-amber-700 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-amber-700">SABOR</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveRecipe}
                className="flex items-center gap-2 text-gray-800 hover:text-amber-700 transition-colors"
              >
                <Bookmark size={20} />
                <span className="hidden sm:inline font-medium text-gray-800">save recipe</span>
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800 font-medium">Edit Mode</span>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    editMode ? 'bg-green-700' : 'bg-gray-400'
                  }`}
                  aria-label={editMode ? 'Disable edit mode' : 'Enable edit mode'}
                  aria-pressed={editMode}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      editMode ? 'translate-x-7' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
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

        {/* Recipe Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Title & Meta */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentRecipe.title}</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-4">
              <div
                onClick={() => editMode && setServingsModal(currentRecipe.servings)}
                className={editMode ? 'cursor-pointer hover:bg-amber-50 rounded-lg p-2 -m-2' : ''}
              >
                <div className={`text-xs uppercase tracking-wide mb-1 flex items-center justify-center gap-1 ${
                  editMode ? 'text-amber-800 font-bold' : 'text-gray-700'
                }`}>
                  SERVES {editMode && '▼'}
                </div>
                <div className="text-2xl font-semibold text-black">{currentRecipe.servings}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-700 mb-1">CALORIES/SERVING</div>
                <div className="text-2xl font-semibold text-black">{currentRecipe.calories}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-700 mb-1">PREP</div>
                <div className="text-2xl font-semibold text-black">{currentRecipe.prep}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-700 mb-1">COOK</div>
                <div className="text-2xl font-semibold text-black">{currentRecipe.cook}</div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-800 font-medium">
              serving size: {currentRecipe.servingSize} | total time: {currentRecipe.time}
            </div>
          </div>

          {/* Edit Mode Helper */}
          {editMode && (
            <div className="bg-amber-50 border-2 border-amber-600 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Sparkles className="text-amber-700 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-gray-900 font-medium">
                Click icons to adjust quantity, substitute, or remove ingredients
              </p>
            </div>
          )}

          {/* Ingredients */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients:</h2>
            <ul className="space-y-2">
              {currentRecipe.ingredients.map((ingredient, index) => {
                // Check if this is a section header (wrapped in **)
                const isSectionHeader = ingredient.startsWith('**') && ingredient.endsWith('**');
                
                if (isSectionHeader) {
                  // Render as a header without bullet point
                  const headerText = ingredient.replace(/\*\*/g, '');
                  return (
                    <li key={index} className="mt-4 mb-2 list-none">
                      <h3 className="text-lg font-bold text-gray-800">{headerText}</h3>
                    </li>
                  );
                }
                
                // Regular ingredient with bullet point
                return (
                  <li
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      editMode ? 'bg-amber-50 border border-amber-200' : ''
                    }`}
                  >
                    <span className="text-green-700 font-bold text-xl">•</span>
                    <span className="flex-1 text-gray-900">{ingredient}</span>
                    
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setQuantityModal(ingredient);
                            setQuantityMultiplier(1.0);
                          }}
                          className="text-amber-600 hover:text-amber-700 text-xl font-bold"
                          title="Adjust quantity"
                        >
                          +/−
                        </button>
                        <button
                          onClick={() => setSubstituteModal(ingredient)}
                          className="text-amber-600 hover:text-amber-700"
                          title="Substitute ingredient"
                        >
                          <Sliders size={20} />
                        </button>
                        <button
                          onClick={() => setRemoveModal(ingredient)}
                          className="text-amber-600 hover:text-amber-700"
                          title="Remove ingredient"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
             <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions:</h2>
            <ol className="space-y-4">
              {currentRecipe.instructions.map((instruction, index) => {
                // Check if this is a section header (wrapped in **)
                const isSectionHeader = instruction.startsWith('**') && instruction.endsWith('**');
                
                if (isSectionHeader) {
                  // Render as a header without number
                  const headerText = instruction.replace(/\*\*/g, '');
                  return (
                    <li key={index} className="mt-6 mb-2 list-none">
                      <h3 className="text-lg font-bold text-gray-800">{headerText}</h3>
                    </li>
                  );
                }
                
                // Regular instruction with number
                return (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}.
                    </span>
                    <p className="flex-1 pt-1 text-gray-700">{instruction}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Tools Needed */}
          {currentRecipe.toolsNeeded && currentRecipe.toolsNeeded.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <button
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="text-xl font-bold text-gray-900">Tools Needed</h2>
                <span className={`transform transition-transform ${toolsExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {toolsExpanded && (
                <ul className="space-y-2">
                  {currentRecipe.toolsNeeded.map((tool, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-amber-600 text-lg">🔧</span>
                      <span className="text-gray-700">{tool}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Nutrition Information */}
          {currentRecipe.nutrition && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <button
                onClick={() => setNutritionExpanded(!nutritionExpanded)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="text-xl font-bold text-gray-900">Nutrition Information</h2>
                <span className={`transform transition-transform ${nutritionExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {nutritionExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.protein}</div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.carbs}</div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.fat}</div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.fiber}</div>
                    <div className="text-sm text-gray-600">Fiber</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.sugar}</div>
                    <div className="text-sm text-gray-600">Sugar</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{currentRecipe.nutrition.sodium}</div>
                    <div className="text-sm text-gray-600">Sodium</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sources */}
          {currentRecipe.sources && currentRecipe.sources.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="text-xl font-bold text-gray-900">Sources</h2>
                <span className={`transform transition-transform ${sourcesExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {sourcesExpanded && (
                <ul className="space-y-3">
                  {currentRecipe.sources.map((source, index) => (
                    <li key={index} className="text-sm">
                      <div className="font-semibold text-gray-900">{source.name}</div>
                      {source.type && <div className="text-gray-600">{source.type}</div>}
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-700 hover:underline"
                        >
                          {source.url}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

            {/* Recipe Versions */}
          {recipeVersions.length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <button
                onClick={() => setVersionsExpanded(!versionsExpanded)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h2 className="text-xl font-bold text-gray-900">Recipe versions:</h2>
                <span className={`transform transition-transform ${versionsExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {versionsExpanded && (
              <div className="space-y-2">
                {recipeVersions.map((version, index) => {
                  const isOriginal = index === 0;
                  // Check if this version is the one currently being displayed
                  const isCurrent = currentRecipe && 
                    version.title === currentRecipe.title && 
                    version.changeDescription === currentRecipe.changeDescription;
                  let displayName = '';
                  
                  if (isOriginal) {
                    displayName = version.title;
                  } else if (version.changeDescription) {
                    displayName = `${version.title} (${version.changeDescription})`;
                  } else {
                    displayName = `${version.title} (modified)`;
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentRecipe(version);
                        showNotification(`✓ Switched to version ${index + 1}`);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-green-700 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
                   </div>
            )}
        </div>
        )}
          </div>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-700 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-fade-in">
            {notification}
          </div>
        )}

        {/* Quantity Modal */}
        {quantityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-amber-600" size={24} />
                <h3 className="text-xl font-bold">Adjust Quantity</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Adjust the amount of <span className="font-semibold text-gray-900">{quantityModal}</span>
              </p>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  ×{quantityMultiplier.toFixed(1)}
                </div>
                <div className="text-gray-600">{quantityModal}</div>
                {quantityMultiplier === 0 && (
                  <div className="text-red-500 text-sm mt-2">This will remove the ingredient</div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setQuantityMultiplier(Math.max(0, quantityMultiplier - 0.5))}
                  className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl"
                >
                  −
                </button>
                <button
                  onClick={() => setQuantityMultiplier(quantityMultiplier + 0.5)}
                  className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (quantityMultiplier === 0) {
                      handleRemoveIngredient(quantityModal);
                      setQuantityModal(null);
                      setQuantityMultiplier(1.0);
                    } else {
                      handleAdjustQuantity();
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Updating...' : quantityMultiplier === 0 ? 'Remove ingredient' : 'Update quantity'}
                </button>
                <button
                  onClick={() => {
                    setQuantityModal(null);
                    setQuantityMultiplier(1.0);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold"
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
                  className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl text-gray-900"
                >
                  −
                </button>
                <button
                  onClick={() => setServingsModal(servingsModal + 1)}
                  className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl"
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
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold"
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
                  {substituteOptions.options.map((option, index) => (
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
                  ))}
                </div>
    
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSubstituteOptions(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold"
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
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold"
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