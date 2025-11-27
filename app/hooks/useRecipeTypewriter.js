import { useState, useEffect } from 'react';

export function useRecipeTypewriter(recipe, enabled = true) {
  const [revealedElements, setRevealedElements] = useState({
    title: false,
    metadata: false,
    ingredients: false,
    instructions: false,
    nutritionAndTools: false,
  });

  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    if (!enabled || !recipe) {
      setRevealedElements({
        title: true,
        metadata: true,
        ingredients: true,
        instructions: true,
        nutritionAndTools: true,
      });
      setTypingIndex(recipe?.title?.length || 0);
      return;
    }

    // Reset
    setRevealedElements({
      title: false,
      metadata: false,
      ingredients: false,
      instructions: false,
      nutritionAndTools: false,
    });
    setTypingIndex(0);

    // Timeline
    const timeline = [
      { element: 'title', delay: 100 },
      { element: 'metadata', delay: 800 },
      { element: 'ingredients', delay: 1400 },
      { element: 'instructions', delay: 2200 },
      { element: 'nutritionAndTools', delay: 3000 },
    ];

    const timers = timeline.map(({ element, delay }) =>
      setTimeout(() => {
        setRevealedElements(prev => ({ ...prev, [element]: true }));
      }, delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [recipe, enabled]);

  // Typewriter
  useEffect(() => {
    if (!enabled || !recipe?.title || !revealedElements.title) return;

    if (typingIndex < recipe.title.length) {
      const timer = setTimeout(() => {
        setTypingIndex(prev => prev + 1);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [typingIndex, recipe?.title, enabled, revealedElements.title]);

  const visibleTitle = recipe?.title?.substring(0, typingIndex) || '';

  return {
    revealedElements,
    visibleTitle,
    typingIndex,
  };
}