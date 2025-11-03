import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState({
    cooking_for: [],
    cooking_style: [],
    dietary_pattern: [],
    avoidances: [],
    meal_goals: [],
    cuisines: []
  });

  const questions = [
    {
      id: 'cooking_for',
      question: "Who are you usually cooking for?",
      options: [
        { value: 'just_me', label: 'Just me' },
        { value: 'two_people', label: 'Me and one person' },
        { value: 'three_people', label: '3 people' },
        { value: 'four_people', label: '4 people' },
        { value: 'five_plus', label: '5+ people' }
      ],
      multiSelect: true
    },
    {
      id: 'cooking_style',
      question: "What's your cooking style?",
      options: [
        { value: 'quick', label: 'Quick & Easy' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'elaborate', label: 'Elaborate & Gourmet' },
        { value: 'meal_prep', label: 'Meal prep / Batch cooking' }
      ],
      multiSelect: true
    },
    {
      id: 'dietary_pattern',
      question: "Do you follow any dietary patterns?",
      options: [
        'None',
        'Vegetarian',
        'Vegan', 
        'Pescatarian',
        'Keto',
        'Paleo',
        'Mediterranean',
        'Low FODMAP',
        'Whole30',
        'Halal',
        'Kosher',
        'Raw food',
        'Carnivore'
      ],
      multiSelect: true,
      gridLayout: true,
      hasCustomInput: true,
      customInputLabel: 'Other'
    },
    {
      id: 'avoidances',
      question: "Any foods you avoid?",
      options: [
        'Nuts',
        'Dairy',
        'Gluten',
        'Shellfish',
        'Soy',
        'Eggs',
        'Fish',
        'Pork',
        'Beef',
        'Chicken',
        'Lamb',
        'Garlic',
        'Onions',
        'Mushrooms',
        'Tomatoes',
        'Citrus',
        'Spicy foods',
        'Alcohol'
      ],
      multiSelect: true,
      gridLayout: true,
      hasCustomInput: true,
      customInputLabel: 'Other'
    },
    {
      id: 'meal_goals',
      question: "What are your meal goals?",
      options: [
        'High protein',
        'Low carb',
        'Low calorie',
        'Quick meals',
        'Budget friendly',
        'Meal prep',
        'Kid friendly',
        'Heart healthy'
      ],
      multiSelect: true,
      gridLayout: true,
      hasCustomInput: true,
      customInputLabel: 'Other',
      optional: true
    },
    {
      id: 'cuisines',
      question: "What cuisines do you enjoy?",
      options: [
        'Italian',
        'Mexican',
        'Thai',
        'Chinese',
        'Japanese',
        'Indian',
        'Mediterranean',
        'Korean',
        'Vietnamese',
        'French',
        'Spanish',
        'Greek',
        'Middle Eastern',
        'Caribbean',
        'Filipino',
        'Ethiopian',
        'Moroccan',
        'Turkish',
        'Brazilian',
        'Soul Food',
        'Cajun/Creole',
        'German'
      ],
      multiSelect: true,
      gridLayout: true,
      hasCustomInput: true,
      customInputLabel: 'Other'
    }
  ];

  const currentQuestion = questions[currentStep];

  const toggleAnswer = (questionId, value) => {
    const current = answers[questionId] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers({...answers, [questionId]: newValue});
  };

  const addCustomAnswer = (questionId, value) => {
    const current = answers[questionId] || [];
    if (!current.includes(value)) {
      setAnswers({...answers, [questionId]: [...current, value]});
    }
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences to Supabase
      await savePreferences();
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found');
        setIsSaving(false);
        return;
      }

      // Save to user_preferences table
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          cooking_for: answers.cooking_for,
          cooking_style: answers.cooking_style,
          dietary_pattern: answers.dietary_pattern,
          avoidances: answers.avoidances,
          meal_goals: answers.meal_goals,
          cuisines: answers.cuisines,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving preferences:', error);
      } else {
        console.log('✅ Preferences saved successfully');
        // Call the onComplete callback to close onboarding
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = currentQuestion.optional || answers[currentQuestion.id]?.length > 0;

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className={currentQuestion.gridLayout ? 'grid grid-cols-2 gap-3 mb-6' : 'space-y-3 mb-6'}>
            {currentQuestion.options.map(option => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              const isSelected = answers[currentQuestion.id]?.includes(value);

              return (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-amber-600 bg-amber-50' 
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAnswer(currentQuestion.id, value)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-gray-900 font-medium">{label}</span>
                </label>
              );
            })}
            
            {/* Other Option */}
            {currentQuestion.hasCustomInput && (
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  answers[currentQuestion.id]?.includes('__other__') 
                    ? 'border-amber-600 bg-amber-50' 
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={answers[currentQuestion.id]?.includes('__other__')}
                  onChange={() => toggleAnswer(currentQuestion.id, '__other__')}
                  className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-gray-900 font-medium">Other</span>
              </label>
            )}
          </div>

          {/* Custom Input - Only show if Other is checked */}
          {currentQuestion.hasCustomInput && answers[currentQuestion.id]?.includes('__other__') && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify:
              </label>
              <input
                type="text"
                placeholder="Type and press Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    addCustomAnswer(currentQuestion.id, e.target.value.trim());
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Press Enter to add multiple items</p>
              
              {/* Show pills for custom entries only */}
              {answers[currentQuestion.id]?.filter(item => {
                // Filter out preset options and __other__ marker
                const presetValues = currentQuestion.options.map(opt => 
                  typeof opt === 'string' ? opt : opt.value
                );
                return item !== '__other__' && !presetValues.includes(item);
              }).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {answers[currentQuestion.id]
                    .filter(item => {
                      const presetValues = currentQuestion.options.map(opt => 
                        typeof opt === 'string' ? opt : opt.value
                      );
                      return item !== '__other__' && !presetValues.includes(item);
                    })
                    .map(item => (
                      <span 
                        key={item} 
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                      >
                        {item}
                        <button
                          onClick={() => {
                            setAnswers({
                              ...answers,
                              [currentQuestion.id]: answers[currentQuestion.id].filter(a => a !== item)
                            });
                          }}
                          className="hover:text-amber-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed || isSaving}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          {!canProceed && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Select at least one option to continue
            </p>
          )}
          
          {currentQuestion.optional && answers[currentQuestion.id]?.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4 italic">
              Optional - you can skip this question
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
