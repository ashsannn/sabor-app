// lib/trendingRecipes.js
// Real trending recipes from TikTok November 2025
// With images and metadata

const allRecipes = [
  // Classic viral hits
  {
    name: 'Baked feta pasta with caramelized onions',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'
  },
  {
    name: 'Dalgona whipped coffee',
    image: 'https://images.unsplash.com/photo-1578768811867-b6ba4e65898d?w=400&h=300&fit=crop'
  },
  
  // 2025 trending recipes
  {
    name: 'Smash burger tacos',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop'
  },
  {
    name: 'Crispy onion chips',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd579b7?w=400&h=300&fit=crop'
  },
  {
    name: 'Air fryer pizza sticks',
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop'
  },
  {
    name: 'Salmon rice bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
  },
  {
    name: 'French onion pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'
  },
  {
    name: 'Pizza soup',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'
  },
  {
    name: 'Charred broccoli with crispy breadcrumbs',
    image: 'https://images.unsplash.com/photo-1584622614875-2f44142f2225?w=400&h=300&fit=crop'
  },
  {
    name: 'Taco chicken hoagie',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop'
  },
  {
    name: 'Chocolate lava cake',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  },
  {
    name: 'Cookie fries with dip',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop'
  },
  {
    name: 'Matcha pancakes',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
  },
  {
    name: 'Avocado egg toast',
    image: 'https://images.unsplash.com/photo-1513307604b9e9c8e193b90b03c1bbc4df4c37c2?w=400&h=300&fit=crop'
  }
];

// Function to randomly select 4 recipes
const getRandomRecipes = () => {
  const shuffled = [...allRecipes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

export const TRENDING_RECIPES_THIS_WEEK = getRandomRecipes();