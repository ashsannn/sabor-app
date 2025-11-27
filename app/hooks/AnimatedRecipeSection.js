import React from 'react';

/**
 * AnimatedRecipeSection - A wrapper component that fades in recipe content
 * with a staggered animation for each major section
 */
export function AnimatedRecipeSection({ 
  isVisible, 
  children, 
  delay = 0,
  className = '',
  animate = true 
}) {
  const animationClass = animate && isVisible 
    ? 'animate-fadeInUp' 
    : '';

  return (
    <div
      className={`${animationClass} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        animation: animate && isVisible 
          ? `fadeInUp 0.6s ease-out forwards ${delay}ms` 
          : 'none',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/**
 * TypewriterText - Animated text reveal for titles
 */
export function TypewriterText({ text, isVisible, speed = 30 }) {
  const [displayText, setDisplayText] = React.useState('');

  React.useEffect(() => {
    if (!isVisible || !text) {
      setDisplayText(text || '');
      return;
    }

    if (displayText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.substring(0, displayText.length + 1));
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [text, isVisible, displayText, speed]);

  return (
    <span>
      {displayText}
      {isVisible && displayText.length < (text?.length || 0) && (
        <span className="animate-pulse">_</span>
      )}
    </span>
  );
}

/**
 * IngredientLineAnimation - Animates each ingredient line-by-line
 */
export function IngredientLineAnimation({ 
  ingredients, 
  isVisible,
  staggerDelay = 50 
}) {
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) {
      setVisibleCount(0);
      return;
    }

    if (visibleCount < ingredients.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, staggerDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, visibleCount, ingredients.length, staggerDelay]);

  return (
    <div>
      {ingredients.map((ingredient, index) => (
        <div
          key={index}
          style={{
            opacity: index < visibleCount ? 1 : 0,
            animation: index < visibleCount 
              ? `fadeInLeft 0.4s ease-out forwards ${index * staggerDelay}ms`
              : 'none',
            willChange: 'opacity, transform',
          }}
        >
          {ingredient}
        </div>
      ))}
    </div>
  );
}
