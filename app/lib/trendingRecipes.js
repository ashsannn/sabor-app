// lib/trendingRecipes.js
// Real trending recipes from TikTok November 2025
// With full details and metadata

const allRecipes = [
  // Classic viral hits
  {
    name: 'Baked feta pasta with caramelized onions',
    title: 'Baked Feta Pasta with Caramelized Onions',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Creamy, tangy feta cheese baked with tomatoes and pasta',
    servings: 4,
    servingSize: '1 1/2 cups',
    calories: 420,
    prep: 10,
    cook: 35,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '35 mins',
    totalTimeDisplay: '45 mins',
    ingredients: ['8 oz feta cheese block', '1 lb cherry tomatoes', '3 large onions, sliced', '1 lb pasta (penne or rigatoni)', '6 cloves garlic, minced', '1/4 cup olive oil', '1 tsp Italian seasoning', 'Salt and pepper to taste', 'Fresh basil', 'Red pepper flakes'],
    instructions: ['Caramelize onions: Heat 2 tbsp olive oil in large pan over medium heat, add sliced onions and cook for 20-25 minutes until golden and soft, stirring occasionally', 'Roast tomatoes: Preheat oven to 400°F. Place cherry tomatoes and feta block in baking dish', 'Add aromatics: Scatter minced garlic around feta, drizzle with remaining olive oil, season with Italian seasoning, salt, and pepper', 'Roast: Bake for 15-20 minutes until tomatoes burst and feta softens', 'Cook pasta: While roasting, cook pasta according to package directions until al dente', 'Combine: Drain pasta and add to baking dish with caramelized onions, toss gently to combine', 'Finish: Top with fresh basil and red pepper flakes, serve warm'],
    toolsNeeded: ['Large skillet', 'Baking dish', 'Large pot', 'Wooden spoon', 'Colander'],
    nutrition: { protein: '14g', carbs: '48g', fat: '18g', fiber: '3g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Baked feta with tomatoes technique' }],
    tags: ['Pasta', 'Vegetarian', 'Baked', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Spicy Version', description: 'Add 1 tsp red pepper flakes and fresh chili peppers to the roasted tomatoes' },
      { name: 'Protein Boost', description: 'Add 8 oz chickpeas or white beans during roasting for extra protein' },
      { name: 'Creamy Style', description: 'Stir in 1/2 cup heavy cream after roasting for a creamier sauce' }
    ]
  },
  {
    name: 'Dalgona whipped coffee',
    title: 'Dalgona Whipped Coffee',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Fluffy whipped coffee topping over creamy milk',
    servings: 2,
    servingSize: '1 cup',
    calories: 150,
    prep: 5,
    cook: 0,
    prepTimeDisplay: '5 mins',
    cookTimeDisplay: '0 mins',
    totalTimeDisplay: '5 mins',
    ingredients: ['2 tbsp instant coffee', '2 tbsp sugar', '2 tbsp hot water', '1 cup milk (cold)', 'Ice cubes', 'Cocoa powder for topping'],
    instructions: ['Mix: In a bowl, combine instant coffee, sugar, and hot water', 'Whip: Whisk vigorously for 2-3 minutes until mixture becomes fluffy and light brown, or use an electric mixer', 'Prepare glass: Fill glass with cold milk and ice cubes', 'Top: Spoon fluffy coffee mixture over the cold milk', 'Stir: Stir well before drinking to combine with the milk', 'Garnish: Dust with cocoa powder if desired'],
    toolsNeeded: ['Bowl', 'Whisk or electric mixer', 'Spoon', 'Glass'],
    nutrition: { protein: '4g', carbs: '18g', fat: '3g', fiber: '0g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Whipped coffee preparation' }],
    tags: ['Beverage', 'Coffee', 'Quick', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Iced Tea Version', description: 'Replace coffee with matcha powder for a green tea version' },
      { name: 'Chocolate Twist', description: 'Add 1 tbsp cocoa powder to the whipped mixture' },
      { name: 'Oat Milk Variation', description: 'Use oat milk instead of regular milk for a creamier texture' }
    ]
  },
  {
    name: 'Smash burger tacos',
    title: 'Smash Burger Tacos',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Crispy smashed beef patties with all the burger toppings in taco form',
    servings: 4,
    servingSize: '2 tacos',
    calories: 520,
    prep: 15,
    cook: 20,
    prepTimeDisplay: '15 mins',
    cookTimeDisplay: '20 mins',
    totalTimeDisplay: '35 mins',
    ingredients: ['1 lb ground beef', '8 small flour tortillas', '4 slices American cheese', '1 tomato, diced', '1/2 cup shredded lettuce', '1/4 cup diced onion', '4 tbsp ketchup', '2 tbsp mustard', '2 tbsp mayonnaise', 'Salt and pepper to taste', '2 tbsp butter'],
    instructions: ['Heat griddle: Preheat cast iron griddle or skillet to high heat until very hot', 'Season meat: Divide ground beef into 8 small portions, season generously with salt and pepper', 'Smash: Place portions on hot griddle and immediately smash flat with spatula, cook 1-2 minutes per side until crispy', 'Add cheese: Top with cheese slice and let melt, about 30 seconds', 'Toast tortillas: Lightly butter and toast tortillas on griddle until warm and slightly crispy', 'Assemble: Layer each tortilla with lettuce, smashed patty, tomato, onion, ketchup, mustard, and mayo', 'Serve: Fold and serve immediately while warm'],
    toolsNeeded: ['Cast iron griddle or skillet', 'Metal spatula', 'Cutting board', 'Sharp knife'],
    nutrition: { protein: '28g', carbs: '38g', fat: '24g', fiber: '1g' },
    sources: [{ name: 'Bon Appétit', url: 'https://www.bonappetit.com', type: 'Magazine', learned: 'Smash burger technique' }],
    tags: ['Beef', 'Tacos', 'American', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Crispy Fried Version', description: 'Deep fry the smashed patties instead of griddle cooking for extra crunch' },
      { name: 'Vegetarian Option', description: 'Replace ground beef with crumbled tofu or lentil crumbles' },
      { name: 'Loaded Style', description: 'Add crispy bacon, fried onions, and pickles for a fully loaded version' }
    ]
  },
  {
    name: 'Crispy onion chips',
    title: 'Crispy Onion Chips',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Thinly sliced onions fried until golden and crispy, addictively crunchy',
    servings: 4,
    servingSize: '1/2 cup',
    calories: 180,
    prep: 10,
    cook: 15,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '15 mins',
    totalTimeDisplay: '25 mins',
    ingredients: ['3 large yellow onions', '1 cup all-purpose flour', '1 tsp paprika', '1 tsp garlic powder', '1 tsp salt', '1/2 tsp black pepper', 'Oil for frying (vegetable or peanut)', '1/4 cup cornstarch'],
    instructions: ['Slice onions: Cut onions into thin slices, about 1/8 inch thick, separating into rings', 'Prepare coating: Mix flour, cornstarch, paprika, garlic powder, salt, and pepper in bowl', 'Coat: Working in batches, toss onion rings in flour mixture until fully coated', 'Heat oil: Fill deep pot or fryer with oil to 350°F (175°C)', 'Fry: Carefully add coated onions to hot oil, frying until golden and crispy, about 2-3 minutes per batch', 'Drain: Remove with slotted spoon and drain on paper towels', 'Season: Sprinkle with additional salt while still warm', 'Serve: Enjoy immediately as a snack or side dish'],
    toolsNeeded: ['Deep pot or fryer', 'Slotted spoon', 'Paper towels', 'Shallow bowl', 'Thermometer', 'Sharp knife'],
    nutrition: { protein: '3g', carbs: '22g', fat: '8g', fiber: '2g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Fried onion ring preparation' }],
    tags: ['Snack', 'Fried', 'Vegetarian', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Air Fryer Method', description: 'Use air fryer at 380°F for 12-15 minutes instead of deep frying for a lighter option' },
      { name: 'Parmesan & Herb', description: 'Toss with grated Parmesan and Italian herbs after frying' },
      { name: 'Spicy Cajun', description: 'Season with Cajun spice blend and cayenne pepper instead of paprika' }
    ]
  },
  {
    name: 'Air fryer pizza sticks',
    title: 'Air Fryer Pizza Sticks',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Mozzarella and pepperoni-filled breadstick bites, crispy outside and gooey inside',
    servings: 4,
    servingSize: '6 sticks',
    calories: 240,
    prep: 15,
    cook: 12,
    prepTimeDisplay: '15 mins',
    cookTimeDisplay: '12 mins',
    totalTimeDisplay: '27 mins',
    ingredients: ['1 lb pizza dough (store-bought or homemade)', '8 oz mozzarella cheese, cut into sticks', '24 pepperoni slices', '2 tbsp olive oil', '1 tsp Italian seasoning', '1/2 tsp garlic powder', 'Salt and pepper to taste', 'Marinara sauce for dipping'],
    instructions: ['Prepare dough: Divide pizza dough into 24 small pieces and flatten each into a small rectangle', 'Fill: Place 1 mozzarella stick and 1 pepperoni slice on each piece of dough', 'Wrap: Fold dough around filling and seal edges, rolling into a stick shape', 'Season: Brush with olive oil and sprinkle with Italian seasoning, garlic powder, salt, and pepper', 'Air fry: Place in air fryer basket in single layer, cook at 375°F for 10-12 minutes until golden', 'Rest: Let cool for 1-2 minutes before serving', 'Serve: Serve hot with marinara sauce for dipping'],
    toolsNeeded: ['Air fryer', 'Cutting board', 'Small bowl', 'Brush or spoon'],
    nutrition: { protein: '10g', carbs: '28g', fat: '9g', fiber: '1g' },
    sources: [{ name: 'Tasty', url: 'https://www.tasty.co', type: 'Video Recipes', learned: 'Air fryer appetizer technique' }],
    tags: ['Appetizer', 'Air Fryer', 'Cheese', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Vegetarian Version', description: 'Skip pepperoni and add roasted red peppers or sun-dried tomatoes' },
      { name: 'Spinach & Ricotta', description: 'Fill with spinach and ricotta cheese instead of mozzarella' },
      { name: 'Deep Fried Option', description: 'Deep fry at 350°F for 2-3 minutes for an extra crispy exterior' }
    ]
  },
  {
    name: 'Salmon rice bowl',
    title: 'Salmon Rice Bowl',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Sushi-style rice bowl with grilled salmon, cucumber, avocado, and sriracha mayo',
    servings: 2,
    servingSize: '1 bowl',
    calories: 520,
    prep: 20,
    cook: 15,
    prepTimeDisplay: '20 mins',
    cookTimeDisplay: '15 mins',
    totalTimeDisplay: '35 mins',
    ingredients: ['2 salmon fillets (6 oz each)', '2 cups cooked sushi rice', '1 avocado, sliced', '1 cucumber, julienned', '2 carrots, julienned', '2 nori sheets, cut into strips', '3 tbsp sriracha', '2 tbsp mayo', '2 tbsp soy sauce', '1 tbsp rice vinegar', '1 tbsp sesame oil', 'Sesame seeds', 'Green onions'],
    instructions: ['Cook rice: Prepare sushi rice according to package directions and let cool', 'Season salmon: Brush salmon with soy sauce and sesame oil', 'Grill: Heat grill or skillet to medium-high, cook salmon 4-5 minutes per side until cooked through', 'Make sauce: Mix sriracha and mayo in small bowl', 'Assemble bowls: Divide rice between 2 bowls, arrange salmon, avocado, cucumber, and carrots on top', 'Drizzle: Drizzle with sriracha mayo and rice vinegar', 'Garnish: Top with nori strips, sesame seeds, and green onions', 'Serve: Serve immediately, optional soy sauce on the side'],
    toolsNeeded: ['Grill or skillet', 'Bowls', 'Small knife', 'Cutting board', 'Small bowl', 'Spoon'],
    nutrition: { protein: '32g', carbs: '45g', fat: '18g', fiber: '5g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Sushi rice bowl assembly' }],
    tags: ['Seafood', 'Asian', 'Healthy', 'Trending'],
    difficulty: 'Medium',
    variations: [
      { name: 'Vegetarian Bowl', description: 'Replace salmon with baked tofu or roasted chickpeas' },
      { name: 'Tuna Version', description: 'Use sushi-grade tuna instead of salmon, served raw or seared' },
      { name: 'Spicy Mayo Bowl', description: 'Add wasabi to the sriracha mayo for extra heat and depth' }
    ]
  },
  {
    name: 'French onion pasta',
    title: 'French Onion Pasta',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Creamy pasta inspired by the classic French onion soup',
    servings: 4,
    servingSize: '1 1/2 cups',
    calories: 450,
    prep: 10,
    cook: 40,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '40 mins',
    totalTimeDisplay: '50 mins',
    ingredients: ['1 lb pasta (fettuccine or pappardelle)', '4 large onions, thinly sliced', '4 tbsp butter', '2 cups beef broth', '1/2 cup heavy cream', '4 oz Gruyere cheese, grated', '2 cloves garlic, minced', 'Salt and pepper to taste', 'Fresh thyme', '2 tbsp balsamic vinegar'],
    instructions: ['Caramelize onions: Melt butter in large pot over medium heat, add sliced onions and cook 30-35 minutes until deep golden brown, stirring frequently', 'Add garlic: Stir in minced garlic and cook for 1 minute until fragrant', 'Deglaze: Add balsamic vinegar and scrape up any browned bits', 'Add broth: Pour in beef broth and simmer for 5 minutes', 'Add cream: Stir in heavy cream and bring to gentle simmer', 'Cook pasta: In separate pot, cook pasta according to package directions until al dente', 'Combine: Add drained pasta to onion sauce and toss well', 'Finish: Stir in grated Gruyere cheese until melted, season with salt and pepper', 'Serve: Garnish with fresh thyme and serve immediately'],
    toolsNeeded: ['Large pot', 'Wooden spoon', 'Large pot for pasta', 'Colander', 'Whisk'],
    nutrition: { protein: '16g', carbs: '52g', fat: '22g', fiber: '2g' },
    sources: [{ name: 'Bon Appétit', url: 'https://www.bonappetit.com', type: 'Magazine', learned: 'French onion soup technique' }],
    tags: ['Pasta', 'French', 'Cheese', 'Trending'],
    difficulty: 'Medium',
    variations: [
      { name: 'Vegetarian Version', description: 'Use vegetable broth instead of beef broth, add mushrooms for umami' },
      { name: 'Light & Healthy', description: 'Replace heavy cream with Greek yogurt and reduce butter by half' },
      { name: 'Wine Addition', description: 'Add 1/2 cup dry white wine when deglazing for deeper flavor' }
    ]
  },
  {
    name: 'Pizza soup',
    title: 'Pizza Soup',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'All your favorite pizza flavors in a warm, comforting soup',
    servings: 4,
    servingSize: '1 1/2 cups',
    calories: 320,
    prep: 15,
    cook: 25,
    prepTimeDisplay: '15 mins',
    cookTimeDisplay: '25 mins',
    totalTimeDisplay: '40 mins',
    ingredients: ['2 tbsp olive oil', '1 onion, diced', '4 cloves garlic, minced', '8 oz Italian sausage, browned', '1 can (28 oz) crushed tomatoes', '2 cups beef broth', '1 cup diced bell peppers', '8 oz mozzarella cheese, shredded', '1 tsp Italian seasoning', '1/2 tsp oregano', 'Salt and pepper to taste', 'Fresh basil for garnish', 'Pepperoni slices'],
    instructions: ['Heat oil: Heat olive oil in large pot over medium heat', 'Sauté: Add diced onion and cook 5 minutes until softened', 'Add garlic: Stir in minced garlic and cook 1 minute', 'Brown sausage: Add browned Italian sausage and stir to combine', 'Add tomatoes: Pour in crushed tomatoes and beef broth', 'Season: Add Italian seasoning, oregano, salt, and pepper', 'Simmer: Bring to simmer and cook 15 minutes', 'Add peppers: Stir in diced bell peppers and cook 5 more minutes', 'Add cheese: Remove from heat and stir in mozzarella cheese until melted', 'Serve: Ladle into bowls, top with pepperoni slices and fresh basil'],
    toolsNeeded: ['Large pot', 'Wooden spoon', 'Ladle', 'Knife', 'Cutting board'],
    nutrition: { protein: '18g', carbs: '24g', fat: '16g', fiber: '3g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Pizza soup concept' }],
    tags: ['Soup', 'Italian', 'Comfort Food', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Vegetarian Version', description: 'Omit sausage, add roasted vegetables like zucchini and mushrooms' },
      { name: 'Loaded Meat Style', description: 'Add both Italian sausage and pepperoni for extra meaty flavor' },
      { name: 'Creamy Version', description: 'Add 1 cup heavy cream at the end for a creamier, lighter soup' }
    ]
  },
  {
    name: 'Charred broccoli with crispy breadcrumbs',
    title: 'Charred Broccoli with Crispy Breadcrumbs',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Roasted broccoli with a crunchy, garlicky breadcrumb topping',
    servings: 4,
    servingSize: '1 cup',
    calories: 180,
    prep: 10,
    cook: 20,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '20 mins',
    totalTimeDisplay: '30 mins',
    ingredients: ['1 lb fresh broccoli florets', '1 cup panko breadcrumbs', '4 cloves garlic, minced', '1/4 cup olive oil', '2 tbsp butter', '1/2 tsp red pepper flakes', 'Salt and pepper to taste', 'Parmesan cheese', 'Lemon wedges'],
    instructions: ['Prepare broccoli: Preheat oven to 425°F. Toss broccoli with 2 tbsp olive oil, salt, and pepper', 'Roast: Spread on baking sheet and roast for 15-18 minutes until charred and tender', 'Toast breadcrumbs: While broccoli roasts, heat 2 tbsp olive oil and butter in skillet over medium heat', 'Add garlic: Stir in minced garlic and red pepper flakes, cook 1 minute', 'Toast: Add panko breadcrumbs and toast 3-4 minutes, stirring frequently, until golden brown', 'Combine: Toss roasted broccoli with crispy breadcrumb mixture', 'Finish: Sprinkle with Parmesan cheese and serve with lemon wedges'],
    toolsNeeded: ['Baking sheet', 'Skillet', 'Wooden spoon', 'Tongs'],
    nutrition: { protein: '8g', carbs: '16g', fat: '10g', fiber: '4g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Roasted vegetable preparation' }],
    tags: ['Vegetable', 'Vegetarian', 'Healthy', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Asian Fusion', description: 'Top with sesame seeds and drizzle with soy sauce and ginger oil' },
      { name: 'Spicy Kick', description: 'Add cayenne pepper and extra red pepper flakes to the breadcrumb mix' },
      { name: 'Cheesy Version', description: 'Add grated cheddar or fontina cheese to the breadcrumbs before toasting' }
    ]
  },
  {
    name: 'Taco chicken hoagie',
    title: 'Taco Chicken Hoagie',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Seasoned pulled chicken with taco toppings on a crusty hoagie roll',
    servings: 4,
    servingSize: '1 sandwich',
    calories: 480,
    prep: 10,
    cook: 25,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '25 mins',
    totalTimeDisplay: '35 mins',
    ingredients: ['1.5 lbs chicken breast', '4 hoagie rolls', '2 tbsp taco seasoning', '1/2 cup salsa', '1 cup shredded cheddar cheese', '1 cup shredded lettuce', '1 tomato, sliced', '1/2 cup sour cream', '1/4 cup fresh cilantro', 'Jalapeños (optional)', 'Lime wedges'],
    instructions: ['Cook chicken: Dice chicken breast and cook in skillet over medium-high heat for 8-10 minutes until cooked through', 'Season: Sprinkle taco seasoning over chicken and stir in salsa, simmer 5 minutes', 'Toast rolls: Lightly toast hoagie rolls until golden', 'Assemble: Spread sour cream on bottom of each roll', 'Layer: Add lettuce, then spoon seasoned chicken onto roll', 'Top: Add tomato slices, cheese, cilantro, and jalapeños if desired', 'Finish: Top with hoagie roll and serve with lime wedges'],
    toolsNeeded: ['Skillet', 'Cutting board', 'Sharp knife', 'Spoon'],
    nutrition: { protein: '34g', carbs: '38g', fat: '16g', fiber: '2g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Taco seasoning and sandwich assembly' }],
    tags: ['Sandwich', 'Chicken', 'Mexican', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Crispy Shell Version', description: 'Use crispy tortilla shells or fried wonton wraps instead of hoagie rolls' },
      { name: 'Vegetarian Option', description: 'Replace chicken with seasoned black beans and roasted vegetables' },
      { name: 'Buffalo Twist', description: 'Toss chicken in buffalo sauce instead of taco seasoning, add blue cheese' }
    ]
  },
  {
    name: 'Chocolate lava cake',
    title: 'Chocolate Lava Cake',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Warm chocolate cake with a gooey molten center',
    servings: 4,
    servingSize: '1 cake',
    calories: 340,
    prep: 10,
    cook: 14,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '14 mins',
    totalTimeDisplay: '24 mins',
    ingredients: ['6 oz dark chocolate, chopped', '1/2 cup butter', '2 large eggs', '2 egg yolks', '1/4 cup sugar', '2 tbsp flour', 'Pinch of salt', 'Butter and cocoa powder for ramekins', 'Vanilla ice cream (optional)'],
    instructions: ['Prepare: Preheat oven to 425°F. Butter 4 ramekins and dust with cocoa powder', 'Melt chocolate: Heat chocolate and butter together over double boiler or microwave until smooth', 'Beat eggs: Whisk eggs, egg yolks, and sugar until thick and pale, about 3 minutes', 'Combine: Fold melted chocolate into egg mixture gently', 'Add flour: Fold in flour and salt until just combined', 'Divide: Pour batter evenly into prepared ramekins', 'Bake: Bake for 12-14 minutes until edges are firm but center is soft', 'Serve: Invert onto plates and serve immediately with ice cream if desired'],
    toolsNeeded: ['Ramekins', 'Double boiler or microwave', 'Mixing bowls', 'Whisk', 'Spatula', 'Oven'],
    nutrition: { protein: '6g', carbs: '32g', fat: '21g', fiber: '2g' },
    sources: [{ name: 'Martha Stewart', url: 'https://www.marthastewart.com', type: 'Lifestyle', learned: 'Molten chocolate cake technique' }],
    tags: ['Dessert', 'Chocolate', 'Elegant', 'Trending'],
    difficulty: 'Medium',
    variations: [
      { name: 'Raspberry Center', description: 'Place a fresh raspberry in the center before baking for tartness' },
      { name: 'Salted Caramel', description: 'Add 1 tbsp dulce de leche in the center for a salted caramel lava' },
      { name: 'Mini Bites', description: 'Use muffin tins instead of ramekins to make individual bite-sized cakes' }
    ]
  },
  {
    name: 'Cookie fries with dip',
    title: 'Cookie Fries with Dip',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Sugar cookie cut into fries and served with chocolate and caramel dipping sauces',
    servings: 4,
    servingSize: '8-10 fries',
    calories: 280,
    prep: 15,
    cook: 10,
    prepTimeDisplay: '15 mins',
    cookTimeDisplay: '10 mins',
    totalTimeDisplay: '25 mins',
    ingredients: ['1 lb sugar cookie dough (store-bought or homemade)', '1 cup chocolate sauce', '1/2 cup caramel sauce', '2 tbsp sea salt', 'Powdered sugar for dusting'],
    instructions: ['Prepare: Preheat oven to 375°F', 'Roll dough: Roll out sugar cookie dough into 1/4 inch thick rectangle on parchment paper', 'Cut fries: Cut into fry-shaped strips about 3 inches long and 1/2 inch wide', 'Bake: Place on baking sheet and bake 8-10 minutes until light golden', 'Cool: Let cool slightly, about 2 minutes', 'Season: Sprinkle with sea salt and powdered sugar while still warm', 'Warm sauces: Heat chocolate and caramel sauces according to package directions', 'Serve: Arrange cookie fries in cone or cup and serve with chocolate and caramel dips'],
    toolsNeeded: ['Rolling pin', 'Knife', 'Baking sheet', 'Parchment paper', 'Small bowls'],
    nutrition: { protein: '2g', carbs: '42g', fat: '8g', fiber: '0g' },
    sources: [{ name: 'Tasty', url: 'https://www.tasty.co', type: 'Video Recipes', learned: 'Cookie decoration and dipping concept' }],
    tags: ['Dessert', 'Sweet', 'Fun', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Chocolate Dipped', description: 'Dip half of each cookie fry in melted dark chocolate' },
      { name: 'Cinnamon Sugar', description: 'Roll warm fries in cinnamon sugar instead of sea salt and powdered sugar' },
      { name: 'Snickerdoodle Style', description: 'Use snickerdoodle dough for the fries with cinnamon sugar coating' }
    ]
  },
  {
    name: 'Matcha pancakes',
    title: 'Matcha Pancakes',
    is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Fluffy green tea pancakes with a light, earthy flavor',
    servings: 4,
    servingSize: '2-3 pancakes',
    calories: 240,
    prep: 10,
    cook: 15,
    prepTimeDisplay: '10 mins',
    cookTimeDisplay: '15 mins',
    totalTimeDisplay: '25 mins',
    ingredients: ['1 1/2 cups all-purpose flour', '2 tbsp matcha powder', '2 tsp baking powder', '1/2 tsp salt', '1 tbsp sugar', '1 1/4 cups milk', '1 large egg', '2 tbsp melted butter', 'Butter for cooking', 'Maple syrup and whipped cream for serving'],
    instructions: ['Mix dry: Whisk together flour, matcha powder, baking powder, salt, and sugar in large bowl', 'Mix wet: In another bowl, whisk milk, egg, and melted butter together', 'Combine: Pour wet ingredients into dry ingredients, stir until just combined (some lumps are okay)', 'Heat griddle: Heat griddle or skillet over medium heat and lightly butter', 'Cook pancakes: Pour 1/4 cup batter for each pancake onto griddle', 'Flip: Cook 2-3 minutes until edges look set, flip and cook another 1-2 minutes until golden', 'Serve: Stack pancakes on plate and top with maple syrup and whipped cream'],
    toolsNeeded: ['Mixing bowls', 'Whisk', 'Griddle or skillet', 'Spatula', 'Measuring cups'],
    nutrition: { protein: '6g', carbs: '38g', fat: '6g', fiber: '1g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Pancake base with matcha powder' }],
    tags: ['Breakfast', 'Vegetarian', 'Green Tea', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'White Chocolate Chips', description: 'Add white chocolate chips to the batter for sweetness' },
      { name: 'Red Bean Topping', description: 'Top with sweetened red bean paste and condensed milk' },
      { name: 'Protein Boost', description: 'Add 1/4 cup protein powder to the dry ingredients' }
    ]
  },
  {
    name: 'Avocado egg toast',
    title: 'Avocado Egg Toast',
     is_seeded: true,  // ADD THIS LINE to each recipe
    save_count: 0,
    description: 'Creamy mashed avocado on crispy toast topped with a perfect fried egg',
    servings: 1,
    servingSize: '1 toast',
    calories: 280,
    prep: 5,
    cook: 8,
    prepTimeDisplay: '5 mins',
    cookTimeDisplay: '8 mins',
    totalTimeDisplay: '13 mins',
    ingredients: ['1 slice bread (sourdough or whole grain)', '1/2 avocado, ripe', '1 large egg', '1 tbsp butter', 'Salt and pepper to taste', 'Red pepper flakes', 'Lemon juice', 'Fresh herbs (optional)'],
    instructions: ['Toast bread: Toast bread until golden and crispy on both sides', 'Mash avocado: Scoop avocado onto toast and mash gently with fork, leaving slightly chunky', 'Season avocado: Drizzle with lemon juice, sprinkle with salt and pepper', 'Cook egg: Heat butter in skillet over medium heat, crack egg into pan', 'Fry: Cook egg to desired doneness, about 3-4 minutes for sunny-side up', 'Top: Carefully slide fried egg onto avocado toast', 'Finish: Sprinkle with red pepper flakes and fresh herbs', 'Serve: Eat immediately while warm'],
    toolsNeeded: ['Toaster', 'Skillet', 'Spatula', 'Fork', 'Small knife'],
    nutrition: { protein: '12g', carbs: '22g', fat: '14g', fiber: '3g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Avocado preparation and egg cooking' }],
    tags: ['Breakfast', 'Vegetarian', 'Quick', 'Trending'],
    difficulty: 'Easy',
    variations: [
      { name: 'Scrambled Egg Version', description: 'Use scrambled eggs instead of fried for a different texture' },
      { name: 'Crispy Bacon Add-On', description: 'Add crispy bacon strips and sliced tomato on top' },
      { name: 'Poached Egg Style', description: 'Use a perfectly poached egg for an elegant presentation' }
    ]
  }
];

// Function to randomly select 3 recipes
const getRandomRecipes = () => {
  const shuffled = [...allRecipes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

export const TRENDING_RECIPES_THIS_WEEK = getRandomRecipes();

export const findSeededRecipe = (query) => {
  if (!query) return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const recipe of allRecipes) {
    const recipeName = recipe.name.toLowerCase();
    const recipeTitle = recipe.title.toLowerCase();
    
    if (
      recipeName === normalizedQuery ||
      recipeTitle === normalizedQuery ||
      recipeName.includes(normalizedQuery) ||
      normalizedQuery.includes(recipeName)
    ) {
      return recipe;
    }
  }
  
  return null;
};