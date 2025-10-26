'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function Onboarding({ onComplete, editMode = false, initialPreferences = null }) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState({
    cookingFor: initialPreferences?.cooking_for || '',
    cookingStyle: initialPreferences?.cooking_style || [],
    dietaryPattern: initialPreferences?.dietary_pattern || [],
    avoidances: initialPreferences?.avoidances || [],
    mealGoals: initialPreferences?.meal_goals || [],
    cuisines: initialPreferences?.cuisines || [],
    otherDietaryPattern: initialPreferences?.other_dietary_pattern || '',
    otherAvoidances: initialPreferences?.other_avoidances || ''
  });

  const handleSelect = (category, value) => {
    setPreferences(prev => {
      if (category === 'cookingFor') {
        return { ...prev, cookingFor: value };
      }
      
      // For multi-select categories
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const handleComplete = () => {
    // Clear saved progress when completing
    localStorage.removeItem('sabor_onboarding_progress');
    onComplete(preferences);
  };

  const handleSkip = () => {
    // Clear saved progress when skipping
    localStorage.removeItem('sabor_onboarding_progress');
    onComplete(null);
  };

  const handleSaveProgress = () => {
    // Save current progress to localStorage
    localStorage.setItem('sabor_onboarding_progress', JSON.stringify({
      step,
      preferences
    }));
    onComplete(null); // Exit onboarding but don't clear data
  };

  // Load saved progress on mount
  useEffect(() => {
    if (!editMode) {
      const savedProgress = localStorage.getItem('sabor_onboarding_progress');
      if (savedProgress) {
        const { step: savedStep, preferences: savedPreferences } = JSON.parse(savedProgress);
        setStep(savedStep);
        setPreferences(savedPreferences);
      }
    }
  }, [editMode]);

  const screens = [
    {
      title: editMode ? "Edit your profile preferences" : "Welcome to Sabor!",
      subtitle: editMode ? "Update your cooking preferences below" : "Let's make meals that fit you.",
      content: (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-6">👨‍🍳</div>
          <p className="text-gray-600 text-center max-w-md">
            {editMode 
              ? "Review and update your preferences to get better personalized recipes."
              : "We'll ask you a few quick questions to personalize your recipe recommendations."}
          </p>
        </div>
      )
    },
    {
      title: "Who do you usually cook for?",
      subtitle: "This helps us adjust serving sizes",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { value: 'just-me', label: 'Just me', emoji: '👩‍🍳' },
            { value: 'me-and-one', label: 'Me and one person', emoji: '👩‍🍳👨‍🍳' },
            { value: 'family-3-4', label: 'Family (3-4 people)', emoji: '👨‍👩‍👧' },
            { value: 'group-5plus', label: 'Group (5+ people)', emoji: '👨‍👩‍👧‍👦' },
            { value: 'depends', label: 'It depends', emoji: '🍽️' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect('cookingFor', option.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                preferences.cookingFor === option.value
                  ? 'border-amber-600 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
            >
              <div className="text-4xl mb-2">{option.emoji}</div>
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "How do you like to cook?",
      subtitle: "Select all that apply (optional)",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { value: 'quick', label: 'Quick meals (under 30 min)', emoji: '⚡' },
            { value: 'one-pot', label: 'One-pot recipes', emoji: '🍲' },
            { value: 'slow-cooked', label: 'Slow-cooked', emoji: '⏳' },
            { value: 'meal-prep', label: 'Meal prep & batch cooking', emoji: '🥗' },
            { value: 'weekend-chef', label: 'Weekend chef', emoji: '🎉' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect('cookingStyle', option.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                preferences.cookingStyle.includes(option.value)
                  ? 'border-amber-600 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
            >
              <div className="text-4xl mb-2">{option.emoji}</div>
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Anything we should avoid?",
      subtitle: "Select at least one option",
      content: (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { value: 'gluten', label: 'Gluten', emoji: '🌾' },
              { value: 'dairy', label: 'Dairy', emoji: '🥛' },
              { value: 'nuts', label: 'Nuts', emoji: '🥜' },
              { value: 'shellfish', label: 'Shellfish', emoji: '🦐' },
              { value: 'soy', label: 'Soy', emoji: '🌱' },
              { value: 'eggs', label: 'Eggs', emoji: '🥚' },
              { value: 'none', label: 'None', emoji: '🚫' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect('avoidances', option.value)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  preferences.avoidances.includes(option.value)
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="text-4xl mb-2">{option.emoji}</div>
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other dietary restrictions or avoidances:
            </label>
            <input
              type="text"
              value={preferences.otherAvoidances}
              onChange={(e) => setPreferences(prev => ({ ...prev, otherAvoidances: e.target.value }))}
              placeholder="e.g., low sodium, no red meat"
              className="w-full px-4 py-3 rounded-lg border-2 border-stone-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      )
    },
    {
      title: "What kind of meals are you looking for?",
      subtitle: "Select all that apply (optional)",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { value: 'high-protein', label: 'High protein', emoji: '💪' },
            { value: 'low-carb', label: 'Low carb', emoji: '🍚' },
            { value: 'high-fiber', label: 'More fiber', emoji: '🌿' },
            { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
            { value: 'light', label: 'Light meals', emoji: '☀️' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect('mealGoals', option.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                preferences.mealGoals.includes(option.value)
                  ? 'border-amber-600 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
            >
              <div className="text-4xl mb-2">{option.emoji}</div>
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: editMode ? "Preferences updated!" : "You're all set!",
      subtitle: editMode ? "Your profile has been updated" : "Here's what we learned about you",
      content: (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 space-y-4">
            {preferences.cookingFor && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Cooking for:</div>
                <div className="text-gray-900">{preferences.cookingFor.replace(/-/g, ' ')}</div>
              </div>
            )}
            
            {preferences.cookingStyle.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Cooking style:</div>
                <div className="text-gray-900">{preferences.cookingStyle.join(', ')}</div>
              </div>
            )}
            
            {preferences.avoidances.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Avoiding:</div>
                <div className="text-gray-900">{preferences.avoidances.join(', ')}</div>
              </div>
            )}
            
            {preferences.otherAvoidances && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Other restrictions:</div>
                <div className="text-gray-900">{preferences.otherAvoidances}</div>
              </div>
            )}
            
            {preferences.mealGoals.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Meal goals:</div>
                <div className="text-gray-900">{preferences.mealGoals.join(', ')}</div>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={handleComplete}
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors"
            >
              {editMode ? "Save Changes" : "Start Cooking!"}
            </button>
          </div>
        </div>
      )
    }
  ];

  const currentScreen = screens[step];
  const isLastStep = step === screens.length - 1;
  
  // Check if user has saved progress
  const hasSavedProgress = !editMode && localStorage.getItem('sabor_onboarding_progress') !== null && step > 0;
  
  // Determine if current step can be skipped (only cooking style and meal goals)
  const canSkipStep = step === 2 || step === 4; // Cooking style (step 2) and meal goals (step 4)
  
  // Check if required fields are filled for navigation
  const canProceed = () => {
    if (step === 1 && !preferences.cookingFor) return false; // Who you cook for is required
    if (step === 3 && preferences.avoidances.length === 0) return false; // Must select at least one avoidance option (including "none")
    return true;
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-amber-700">SABOR</h1>
            {hasSavedProgress && (
              <p className="text-xs text-green-600">Continuing from where you left off</p>
            )}
          </div>
          <div className="flex gap-2">
            {!editMode && (
              <button
                onClick={handleSaveProgress}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 px-3 py-1 rounded-lg hover:bg-green-50"
              >
                Save & Come Back
              </button>
            )}
            {(canSkipStep || editMode) && (
              <button
                onClick={editMode ? handleSkip : () => setStep(step + 1)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1"
              >
                {editMode ? "Cancel" : "Skip"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= step ? 'bg-amber-600' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentScreen.title}
            </h2>
            <p className="text-gray-600">{currentScreen.subtitle}</p>
          </div>

          <div className="mb-12">
            {currentScreen.content}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-stone-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              step === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-amber-600 hover:bg-amber-50'
            }`}
          >
            ← Back
          </button>
          
          {!isLastStep && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                canProceed()
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
