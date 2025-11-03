import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function Onboarding({ isFirstTime = true, onComplete }) {
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
      id: 'welcome',
      isWelcomeScreen: true,
      question: "Hi, welcome to Sabor!",
      subtitle: "Help us learn about you so we can personalize your meals.",
      description: "(Promise it's brief & you can always come back later!)"
    },
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
        'None',
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
        'Heart healthy',
        'Figuring it out'
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
      await savePreferences();
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Session:', session);
      
      if (!session) {
        console.error('❌ No session found - user is not logged in');
        setIsSaving(false);
        return;
      }

      const user = session.user;
      
      if (!user) {
        console.error('❌ No user in session');
        setIsSaving(false);
        return;
      }

      console.log('✅ User authenticated:', user.id);

      // Check if preferences exist
      const { data: existing, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing preferences:', checkError);
      }

      const prefsData = {
        user_id: user.id,
        cooking_for: answers.cooking_for,
        cooking_style: answers.cooking_style,
        dietary_pattern: answers.dietary_pattern,
        avoidances: answers.avoidances,
        meal_goals: answers.meal_goals,
        cuisines: answers.cuisines,
        completed_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing
        console.log('🔄 Updating existing preferences');
        const { error } = await supabase
          .from('user_preferences')
          .update(prefsData)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Error updating preferences:', error);
          setIsSaving(false);
          return;
        }
        console.log('✅ Preferences updated');
      } else {
        // Insert new
        console.log('➕ Inserting new preferences');
        const { error } = await supabase
          .from('user_preferences')
          .insert([prefsData]);

        if (error) {
          console.error('❌ Error inserting preferences:', error);
          setIsSaving(false);
          return;
        }
        console.log('✅ Preferences inserted');
      }

      // Mark first login as complete
      if (isFirstTime) {
        try {
          const { error: accountError } = await supabase
            .from('user_accounts')
            .update({ first_login_completed: true })
            .eq('user_id', user.id);
          
          if (accountError) {
            console.error('⚠️ Error marking first login complete:', accountError);
          } else {
            console.log('✅ Marked first_login_completed = true');
          }
        } catch (err) {
          console.error('⚠️ Error updating user_accounts:', err);
        }
      }

      console.log('✅ All preferences saved successfully');
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('❌ Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = currentQuestion.isWelcomeScreen || currentQuestion.optional || answers[currentQuestion.id]?.length > 0;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isSaving}
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="w-6"></div>
        )}
        <img 
          src="/images/sabor-logo.png" 
          alt="Sabor" 
          style={{ height: '32px', width: 'auto' }}
        />
        <div className="w-6"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Progress Bar */}
        {!currentQuestion.isWelcomeScreen && (
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2" style={{ color: '#55814E' }}>
              <span>Question {currentStep} of {questions.length - 1}</span>
              <span>{Math.round(((currentStep) / (questions.length - 1)) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ width: `${((currentStep) / (questions.length - 1)) * 100}%`, backgroundColor: '#55814E' }}
              />
            </div>
          </div>
        )}

        {/* Welcome Screen */}
        {currentQuestion.isWelcomeScreen ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <h2
              className="text-4xl font-bold mb-6"
              style={{
                fontFamily: 'Birdie, cursive',
                color: '#55814E',
              }}
            >
              Hi, Welcome to Sabor!
            </h2>
            <p className="text-lg text-gray-700 mb-3">
              {currentQuestion.subtitle}
            </p>
            <p className="text-gray-500">
              {currentQuestion.description}
            </p>
          </div>
        ) : (
          <>
            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
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
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all`}
                    style={{
                      borderColor: isSelected ? '#55814E' : '#E5E7EB',
                      backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAnswer(currentQuestion.id, value)}
                      className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-0"
                      style={{
                        accentColor: '#55814E',
                      }}
                    />
                    <span className="text-gray-900 font-medium text-sm">{label}</span>
                  </label>
                );
              })}
              
              {/* Other Option */}
              {currentQuestion.hasCustomInput && (
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all`}
                  style={{
                    borderColor: answers[currentQuestion.id]?.includes('__other__') ? '#55814E' : '#E5E7EB',
                    backgroundColor: answers[currentQuestion.id]?.includes('__other__') ? '#F0F9FF' : '#FFFFFF',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={answers[currentQuestion.id]?.includes('__other__')}
                    onChange={() => toggleAnswer(currentQuestion.id, '__other__')}
                    className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-0"
                    style={{
                      accentColor: '#55814E',
                    }}
                  />
                  <span className="text-gray-900 font-medium text-sm">Other</span>
                </label>
              )}
            </div>

            {/* Custom Input */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{
                    focusRing: '#55814E',
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Press Enter to add multiple items</p>
                
                {/* Custom entries pills */}
                {answers[currentQuestion.id]?.filter(item => {
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
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: '#E8F5E9',
                            color: '#55814E',
                          }}
                        >
                          {item}
                          <button
                            onClick={() => {
                              setAnswers({
                                ...answers,
                                [currentQuestion.id]: answers[currentQuestion.id].filter(a => a !== item)
                              });
                            }}
                            className="hover:opacity-70"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-gray-200">
        <div className="flex gap-3 mb-4">
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
            className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: canProceed && !isSaving ? '#55814E' : '#D1D5DB',
            }}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : currentQuestion.isWelcomeScreen ? (
              <>
                Fill out profile
                <ArrowRight size={20} />
              </>
            ) : (
              <>
                {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Subtle save & come back later link - only show on actual questions */}
        {!currentQuestion.isWelcomeScreen && (
          <button
            onClick={() => {
              console.log('User closed onboarding to come back later');
              if (onComplete) {
                onComplete();
              }
            }}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Save & come back later
          </button>
        )}
      </div>

      {!canProceed && !currentQuestion.isWelcomeScreen && (
        <p className="text-sm text-gray-500 text-center pb-4">
          Select at least one option to continue
        </p>
      )}
      
      {!currentQuestion.isWelcomeScreen && currentQuestion.optional && answers[currentQuestion.id]?.length === 0 && (
        <p className="text-sm text-gray-400 text-center pb-4 italic">
          Optional - you can skip this question
        </p>
      )}
    </div>
  );
}