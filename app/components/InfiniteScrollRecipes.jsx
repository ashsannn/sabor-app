import React, { useState, useEffect, useRef } from 'react';

export default function InfiniteScrollRecipes({ recipes = [], onSelect }) {
  const [displayedRecipes, setDisplayedRecipes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const INITIAL_LOAD = 3;
  const BATCH_SIZE = 1;

  const loadMoreRecipes = (count = BATCH_SIZE) => {
    console.log('loadMoreRecipes called. currentIndex:', currentIndex, 'recipes.length:', recipes.length, 'isLoading:', isLoading);
    
    if (isLoading || currentIndex >= recipes.length) {
      console.log('Returning early - isLoading:', isLoading, 'currentIndex >= recipes.length:', currentIndex >= recipes.length);
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const recipesToLoad = Math.min(count, recipes.length - currentIndex);
      const newRecipes = recipes.slice(currentIndex, currentIndex + recipesToLoad);

      console.log('Loading recipes:', newRecipes);
      setDisplayedRecipes(prev => [...prev, ...newRecipes]);
      setCurrentIndex(prev => prev + recipesToLoad);
      setIsLoading(false);
    }, 300);
  };

  // Initial load on mount
  useEffect(() => {
    console.log('InfiniteScrollRecipes mounted with recipes:', recipes);
    loadMoreRecipes(INITIAL_LOAD);
  }, []); // Empty dependency - only run once

  // Scroll listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const element = containerRef.current;
      const rect = element.getBoundingClientRect();
      const distanceFromBottom = window.innerHeight - rect.top;
      
      console.log('Scroll detected. Distance from bottom:', distanceFromBottom);
      
      // If the container is within 400px of the bottom of the viewport
      if (distanceFromBottom > -400 && distanceFromBottom < window.innerHeight + 400) {
        console.log('Container in view range, checking if should load more...');
        console.log('currentIndex:', currentIndex, 'recipes.length:', recipes.length, 'isLoading:', isLoading);
        if (currentIndex < recipes.length && !isLoading) {
          console.log('Loading more recipes...');
          loadMoreRecipes(BATCH_SIZE);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentIndex, isLoading, recipes.length, loadMoreRecipes]);

  const getRandomRotation = () => {
    return Math.random() * 6 - 3; // -3 to +3 degrees
  };

  const getRandomOffset = () => {
    return Math.random() * 48 - 24; // -24 to +24 pixels (doubled from -12 to +12)
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={containerRef} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0px', 
        position: 'relative',
        width: '280px'
      }}>
      {displayedRecipes.map((recipe, index) => {
        const recipeName = typeof recipe === 'string' ? recipe : recipe.name || recipe;
        // Use index as seed to consistently generate same rotation/offset for this card position
        const rotation = (Math.sin(index * 123.456) * 3); // -3 to +3 degrees
        const offset = (Math.sin(index * 789.012) * 24); // -24 to +24 pixels
        const zIndex = 100 - index;

        return (
          <button
            key={index}
            onClick={() => {
              const recipeName = typeof recipe === 'string' ? recipe : recipe.name || recipe;
              onSelect?.(recipeName);
            }}
            style={{
              background: 'white',
              border: '1px solid #d4d4d0',
              borderRadius: '0',
              padding: '20px',
              cursor: 'pointer',
              minHeight: '140px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.07)',
              animation: 'slideUp 0.5s ease-out',
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 26px,
                rgba(100, 150, 220, 0.08) 26px,
                rgba(100, 150, 220, 0.08) 27px
              )`,
              backgroundPosition: '0 56px',
              transition: 'all 0.2s ease',
              marginBottom: '-4px',
              transformOrigin: 'top center',
              transform: `rotate(${rotation}deg) translateX(${offset}px)`,
              zIndex: zIndex,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: '1.05em',
                fontWeight: 500,
                color: '#1a1a1a',
                textAlign: 'center',
                lineHeight: '1.5',
                letterSpacing: '0.05em',
                fontFamily: 'Karla, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
              }}
            >
              {recipeName}
            </div>
          </button>
        );
      })}

      <style>{`
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
      </div>
    </div>
  );
}