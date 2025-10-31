'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';


export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showingOptions, setShowingOptions] = useState(null);
  const router = useRouter();
  const supabase = createClient(); // Move it here

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('🔵 1. Starting loadUserData');
        setLoading(true);
        
        console.log('🔵 1.5. Creating supabase client');
        const supabase = createClient();
        console.log('🔵 1.6. Client created');
        
        console.log('🔵 1.7. Calling getSession');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔵 2. Got session:', session?.user?.email);
        
        if (!session?.user) {
          console.log('🔵 3. No session, redirecting');
          router.push('/');
          return;
        }

        setUser(session.user);
        console.log('🔵 4. Set user');

        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('🔵 5. Got preferences:', data);

        setPreferences(data || {
          cooking_for: [],
          cooking_style: [],
          dietary_pattern: [],
          avoidances: [],
          meal_goals: [],
          cuisines: []
        });
        
        console.log('🔵 6. Done!');
      } catch (err) {
        console.error('🔴 Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      alert('Preferences saved successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (field, value) => {
    const current = preferences[field] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setPreferences({...preferences, [field]: newValue});
  };

  const removeItem = (field, value) => {
    setPreferences({
      ...preferences,
      [field]: preferences[field].filter(v => v !== value)
    });
  };

  const options = {
    cooking_for: [
      { value: 'just_me', label: 'Just me' },
      { value: 'two_people', label: 'Me and one person' },
      { value: 'three_people', label: '3 people' },
      { value: 'four_people', label: '4 people' },
      { value: 'five_plus', label: '5+ people' }
    ],
    cooking_style: [
      { value: 'quick', label: 'Quick & Easy' },
      { value: 'balanced', label: 'Balanced' },
      { value: 'elaborate', label: 'Elaborate & Gourmet' },
      { value: 'meal_prep', label: 'Meal prep / Batch cooking' }
    ],
    dietary_pattern: [
      'None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Mediterranean',
      'Low FODMAP', 'Whole30', 'Halal', 'Kosher', 'Raw food', 'Carnivore'
    ],
    avoidances: [
      'Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Eggs', 'Fish', 'Pork', 'Beef', 'Chicken',
      'Lamb', 'Garlic', 'Onions', 'Mushrooms', 'Tomatoes', 'Citrus', 'Spicy foods', 'Alcohol'
    ],
    meal_goals: [
      'High protein', 'Low carb', 'Low calorie', 'Quick meals', 'Budget friendly', 'Meal prep', 'Kid friendly', 'Heart healthy'
    ],
    cuisines: [
      'Italian', 'Mexican', 'Thai', 'Chinese', 'Japanese', 'Indian', 'Mediterranean', 'Korean', 'Vietnamese', 'French', 'Spanish', 'Greek',
      'Middle Eastern', 'Caribbean', 'Filipino', 'Ethiopian', 'Moroccan', 'Turkish', 'Brazilian', 'Soul Food', 'Cajun/Creole', 'German'
    ]
  };

  const getLabel = (field, value) => {
    if (field === 'cooking_for') {
      const option = options.cooking_for.find(o => o.value === value);
      return option?.label || value;
    }
    if (field === 'cooking_style') {
      const option = options.cooking_style.find(o => o.value === value);
      return option?.label || value;
    }
    return value;
  };

  const PreferenceSection = ({ field, title, hasCustomInput = false }) => {
    const isShowing = showingOptions === field;
    const items = preferences?.[field] || [];

    return (
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h4>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {items.filter(item => item !== '__other__').map(item => (
            <span 
              key={item}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-medium"
            >
              {getLabel(field, item)}
              <button
                onClick={() => removeItem(field, item)}
                className="hover:text-amber-900 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          
          {(() => {
            const presetOptions = field === 'cooking_for' || field === 'cooking_style'
              ? options[field].map(o => o.value)
              : options[field];
            
            const unselected = presetOptions
              .filter(opt => !items.includes(opt))
              .slice(0, 5);
            
            return unselected.map(item => (
              <button 
                key={`unselected-${item}`}
                onClick={() => toggleItem(field, item)}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {field === 'cooking_for' || field === 'cooking_style'
                  ? options[field].find(o => o.value === item)?.label || item
                  : item
                }
              </button>
            ));
          })()}
          
          {(() => {
            const presetOptions = field === 'cooking_for' || field === 'cooking_style'
              ? options[field].map(o => o.value)
              : options[field];
            
            const unselectedCount = presetOptions.filter(opt => !items.includes(opt)).length;
            const showAddButton = unselectedCount > 5 || hasCustomInput;
            
            if (!showAddButton) return null;
            
            return (
              <button
                onClick={() => setShowingOptions(isShowing ? null : field)}
                className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 border-2 border-dashed border-amber-300 text-amber-700 hover:border-amber-400 hover:text-amber-800 rounded-full text-xs sm:text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add
              </button>
            );
          })()}
        </div>

        {isShowing && (
          <div className="bg-stone-50 rounded-lg p-3 sm:p-4 mb-4 border border-stone-200">
            <div className={`${field === 'avoidances' || field === 'meal_goals' || field === 'cuisines' || field === 'dietary_pattern' ? 'grid grid-cols-1 sm:grid-cols-2' : ''} gap-2`}>
              {field === 'cooking_for' || field === 'cooking_style' 
                ? options[field].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={items.includes(option.value)}
                        onChange={() => toggleItem(field, option.value)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-gray-700 text-sm">{option.label}</span>
                    </label>
                  ))
                : options[field].map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={items.includes(option)}
                        onChange={() => toggleItem(field, option)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-gray-700 text-sm">{option}</span>
                    </label>
                  ))
              }
              
              {hasCustomInput && (
                <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                  <input
                    type="checkbox"
                    checked={items.includes('__other__')}
                    onChange={() => toggleItem(field, '__other__')}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-gray-700 text-sm">Other</span>
                </label>
              )}
            </div>

            {hasCustomInput && items.includes('__other__') && (
              <div className="mt-3 pt-3 border-t border-stone-300">
                <input
                  type="text"
                  placeholder="Type and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const value = e.target.value.trim();
                      
                      const inappropriate = /\b(fuck|shit|damn|hell|ass|bitch)\b/i;
                      if (inappropriate.test(value)) {
                        alert('Please enter appropriate items only.');
                        return;
                      }
                      
                      if (!items.includes(value)) {
                        toggleItem(field, value);
                      }
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Press Enter to add</p>
              </div>
            )}

            <button
              onClick={() => setShowingOptions(null)}
              className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-amber-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-amber-600 text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-amber-700">Profile</h1>
          <div className="w-16 sm:w-24"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <User size={24} className="sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{user?.email}</h2>
              <p className="text-xs sm:text-sm text-gray-500">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Your Preferences</h3>

          <div className="space-y-6 sm:space-y-8">
            <PreferenceSection 
              field="cooking_for" 
              title="Who are you usually cooking for?"
            />

            <PreferenceSection 
              field="cooking_style" 
              title="What's your cooking style?"
            />

            <PreferenceSection 
              field="dietary_pattern" 
              title="Do you follow any dietary patterns?"
              hasCustomInput={true}
            />

            <PreferenceSection 
              field="avoidances" 
              title="Any foods you avoid?"
              hasCustomInput={true}
            />

            <PreferenceSection 
              field="meal_goals" 
              title="What are your meal goals?"
              hasCustomInput={true}
            />

            <PreferenceSection 
              field="cuisines" 
              title="What cuisines do you enjoy?"
              hasCustomInput={true}
            />
          </div>

          <div className="mt-6 sm:mt-8 pt-6 border-t border-stone-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
