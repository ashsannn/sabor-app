// scripts/seed-trending-recipes.js
// Run with: node scripts/seed-trending-recipes.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  'https://rfygndzxinogrfoptpqr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeWduZHp4aW5vZ3Jmb3B0cHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTE2NzYsImV4cCI6MjA3NzAyNzY3Nn0.vq8cQBbixvx_imW6mFhuIqGRjgSQuexfmm0bRADe9K0'
);


const trendingRecipes = [
  {
    title: 'Baked Feta Pasta with Caramelized Onions',
    description: 'Creamy, tangy feta cheese baked with tomatoes and pasta',
    servings: 4,
    servingsize: '1 1/2 cups',
    calories: '420',
    prep: '10',
    cook: '35',
    total_time: '45 mins',
    ingredients: ['8 oz feta cheese block', '1 lb cherry tomatoes', '3 large onions, sliced', '1 lb pasta (penne or rigatoni)', '6 cloves garlic, minced', '1/4 cup olive oil', '1 tsp Italian seasoning', 'Salt and pepper to taste', 'Fresh basil', 'Red pepper flakes'],
    instructions: ['Caramelize onions: Heat 2 tbsp olive oil in large pan over medium heat, add sliced onions and cook for 20-25 minutes until golden and soft, stirring occasionally', 'Roast tomatoes: Preheat oven to 400°F. Place cherry tomatoes and feta block in baking dish', 'Add aromatics: Scatter minced garlic around feta, drizzle with remaining olive oil, season with Italian seasoning, salt, and pepper', 'Roast: Bake for 15-20 minutes until tomatoes burst and feta softens', 'Cook pasta: While roasting, cook pasta according to package directions until al dente', 'Combine: Drain pasta and add to baking dish with caramelized onions, toss gently to combine', 'Finish: Top with fresh basil and red pepper flakes, serve warm'],
    tools_needed: ['Large skillet', 'Baking dish', 'Large pot', 'Wooden spoon', 'Colander'],
    nutrition: { protein: '14g', carbs: '48g', fat: '18g', fiber: '3g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Baked feta with tomatoes technique' }],
    tags: ['Pasta', 'Vegetarian', 'Baked', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Spicy Version', variation_description: 'Add 1 tsp red pepper flakes and fresh chili peppers to the roasted tomatoes' }, { variation_name: 'Protein Boost', variation_description: 'Add 8 oz chickpeas or white beans during roasting for extra protein' }, { variation_name: 'Creamy Style', variation_description: 'Stir in 1/2 cup heavy cream after roasting for a creamier sauce' }]
  },
  {
    title: 'Dalgona Whipped Coffee',
    description: 'Fluffy whipped coffee topping over creamy milk',
    servings: 2,
    servingsize: '1 cup',
    calories: '150',
    prep: '5',
    cook: '0',
    total_time: '5 mins',
    ingredients: ['2 tbsp instant coffee', '2 tbsp sugar', '2 tbsp hot water', '1 cup milk (cold)', 'Ice cubes', 'Cocoa powder for topping'],
    instructions: ['Mix: In a bowl, combine instant coffee, sugar, and hot water', 'Whip: Whisk vigorously for 2-3 minutes until mixture becomes fluffy and light brown, or use an electric mixer', 'Prepare glass: Fill glass with cold milk and ice cubes', 'Top: Spoon fluffy coffee mixture over the cold milk', 'Stir: Stir well before drinking to combine with the milk', 'Garnish: Dust with cocoa powder if desired'],
    tools_needed: ['Bowl', 'Whisk or electric mixer', 'Spoon', 'Glass'],
    nutrition: { protein: '4g', carbs: '18g', fat: '3g', fiber: '0g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Whipped coffee preparation' }],
    tags: ['Beverage', 'Coffee', 'Quick', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Iced Tea Version', variation_description: 'Replace coffee with matcha powder for a green tea version' }, { variation_name: 'Chocolate Twist', variation_description: 'Add 1 tbsp cocoa powder to the whipped mixture' }, { variation_name: 'Oat Milk Variation', variation_description: 'Use oat milk instead of regular milk for a creamier texture' }]
  },
  {
    title: 'Smash Burger Tacos',
    description: 'Crispy smashed beef patties with all the burger toppings in taco form',
    servings: 4,
    servingsize: '2 tacos',
    calories: '520',
    prep: '15',
    cook: '20',
    total_time: '35 mins',
    ingredients: ['1 lb ground beef', '8 small flour tortillas', '4 slices American cheese', '1 tomato, diced', '1/2 cup shredded lettuce', '1/4 cup diced onion', '4 tbsp ketchup', '2 tbsp mustard', '2 tbsp mayonnaise', 'Salt and pepper to taste', '2 tbsp butter'],
    instructions: ['Heat griddle: Preheat cast iron griddle or skillet to high heat until very hot', 'Season meat: Divide ground beef into 8 small portions, season generously with salt and pepper', 'Smash: Place portions on hot griddle and immediately smash flat with spatula, cook 1-2 minutes per side until crispy', 'Add cheese: Top with cheese slice and let melt, about 30 seconds', 'Toast tortillas: Lightly butter and toast tortillas on griddle until warm and slightly crispy', 'Assemble: Layer each tortilla with lettuce, smashed patty, tomato, onion, ketchup, mustard, and mayo', 'Serve: Fold and serve immediately while warm'],
    tools_needed: ['Cast iron griddle or skillet', 'Metal spatula', 'Cutting board', 'Sharp knife'],
    nutrition: { protein: '28g', carbs: '38g', fat: '24g', fiber: '1g' },
    sources: [{ name: 'Bon Appétit', url: 'https://www.bonappetit.com', type: 'Magazine', learned: 'Smash burger technique' }],
    tags: ['Beef', 'Tacos', 'American', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Crispy Fried Version', variation_description: 'Deep fry the smashed patties instead of griddle cooking for extra crunch' }, { variation_name: 'Vegetarian Option', variation_description: 'Replace ground beef with crumbled tofu or lentil crumbles' }, { variation_name: 'Loaded Style', variation_description: 'Add crispy bacon, fried onions, and pickles for a fully loaded version' }]
  },
  {
    title: 'Crispy Onion Chips',
    description: 'Thinly sliced onions fried until golden and crispy, addictively crunchy',
    servings: 4,
    servingsize: '1/2 cup',
    calories: '180',
    prep: '10',
    cook: '15',
    total_time: '25 mins',
    ingredients: ['3 large yellow onions', '1 cup all-purpose flour', '1 tsp paprika', '1 tsp garlic powder', '1 tsp salt', '1/2 tsp black pepper', 'Oil for frying (vegetable or peanut)', '1/4 cup cornstarch'],
    instructions: ['Slice onions: Cut onions into thin slices, about 1/8 inch thick, separating into rings', 'Prepare coating: Mix flour, cornstarch, paprika, garlic powder, salt, and pepper in bowl', 'Coat: Working in batches, toss onion rings in flour mixture until fully coated', 'Heat oil: Fill deep pot or fryer with oil to 350°F (175°C)', 'Fry: Carefully add coated onions to hot oil, frying until golden and crispy, about 2-3 minutes per batch', 'Drain: Remove with slotted spoon and drain on paper towels', 'Season: Sprinkle with additional salt while still warm', 'Serve: Enjoy immediately as a snack or side dish'],
    tools_needed: ['Deep pot or fryer', 'Slotted spoon', 'Paper towels', 'Shallow bowl', 'Thermometer', 'Sharp knife'],
    nutrition: { protein: '3g', carbs: '22g', fat: '8g', fiber: '2g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Fried onion ring preparation' }],
    tags: ['Snack', 'Fried', 'Vegetarian', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Air Fryer Method', variation_description: 'Use air fryer at 380°F for 12-15 minutes instead of deep frying for a lighter option' }, { variation_name: 'Parmesan & Herb', variation_description: 'Toss with grated Parmesan and Italian herbs after frying' }, { variation_name: 'Spicy Cajun', variation_description: 'Season with Cajun spice blend and cayenne pepper instead of paprika' }]
  },
  {
    title: 'Air Fryer Pizza Sticks',
    description: 'Mozzarella and pepperoni-filled breadstick bites, crispy outside and gooey inside',
    servings: 4,
    servingsize: '6 sticks',
    calories: '240',
    prep: '15',
    cook: '12',
    total_time: '27 mins',
    ingredients: ['1 lb pizza dough (store-bought or homemade)', '8 oz mozzarella cheese, cut into sticks', '24 pepperoni slices', '2 tbsp olive oil', '1 tsp Italian seasoning', '1/2 tsp garlic powder', 'Salt and pepper to taste', 'Marinara sauce for dipping'],
    instructions: ['Prepare dough: Divide pizza dough into 24 small pieces and flatten each into a small rectangle', 'Fill: Place 1 mozzarella stick and 1 pepperoni slice on each piece of dough', 'Wrap: Fold dough around filling and seal edges, rolling into a stick shape', 'Season: Brush with olive oil and sprinkle with Italian seasoning, garlic powder, salt, and pepper', 'Air fry: Place in air fryer basket in single layer, cook at 375°F for 10-12 minutes until golden', 'Rest: Let cool for 1-2 minutes before serving', 'Serve: Serve hot with marinara sauce for dipping'],
    tools_needed: ['Air fryer', 'Cutting board', 'Small bowl', 'Brush or spoon'],
    nutrition: { protein: '10g', carbs: '28g', fat: '9g', fiber: '1g' },
    sources: [{ name: 'Tasty', url: 'https://www.tasty.co', type: 'Video Recipes', learned: 'Air fryer appetizer technique' }],
    tags: ['Appetizer', 'Air Fryer', 'Cheese', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Vegetarian Version', variation_description: 'Skip pepperoni and add roasted red peppers or sun-dried tomatoes' }, { variation_name: 'Spinach & Ricotta', variation_description: 'Fill with spinach and ricotta cheese instead of mozzarella' }, { variation_name: 'Deep Fried Option', variation_description: 'Deep fry at 350°F for 2-3 minutes for an extra crispy exterior' }]
  },
  {
    title: 'Salmon Rice Bowl',
    description: 'Sushi-style rice bowl with grilled salmon, cucumber, avocado, and sriracha mayo',
    servings: 2,
    servingsize: '1 bowl',
    calories: '520',
    prep: '20',
    cook: '15',
    total_time: '35 mins',
    ingredients: ['2 salmon fillets (6 oz each)', '2 cups cooked sushi rice', '1 avocado, sliced', '1 cucumber, julienned', '2 carrots, julienned', '2 nori sheets, cut into strips', '3 tbsp sriracha', '2 tbsp mayo', '2 tbsp soy sauce', '1 tbsp rice vinegar', '1 tbsp sesame oil', 'Sesame seeds', 'Green onions'],
    instructions: ['Cook rice: Prepare sushi rice according to package directions and let cool', 'Season salmon: Brush salmon with soy sauce and sesame oil', 'Grill: Heat grill or skillet to medium-high, cook salmon 4-5 minutes per side until cooked through', 'Make sauce: Mix sriracha and mayo in small bowl', 'Assemble bowls: Divide rice between 2 bowls, arrange salmon, avocado, cucumber, and carrots on top', 'Drizzle: Drizzle with sriracha mayo and rice vinegar', 'Garnish: Top with nori strips, sesame seeds, and green onions', 'Serve: Serve immediately, optional soy sauce on the side'],
    tools_needed: ['Grill or skillet', 'Bowls', 'Small knife', 'Cutting board', 'Small bowl', 'Spoon'],
    nutrition: { protein: '32g', carbs: '45g', fat: '18g', fiber: '5g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Sushi rice bowl assembly' }],
    tags: ['Seafood', 'Asian', 'Healthy', 'Trending'],
    difficulty: 'Medium',
    variations: [{ variation_name: 'Vegetarian Bowl', variation_description: 'Replace salmon with baked tofu or roasted chickpeas' }, { variation_name: 'Tuna Version', variation_description: 'Use sushi-grade tuna instead of salmon, served raw or seared' }, { variation_name: 'Spicy Mayo Bowl', variation_description: 'Add wasabi to the sriracha mayo for extra heat and depth' }]
  },
  {
    title: 'French Onion Pasta',
    description: 'Creamy pasta inspired by the classic French onion soup',
    servings: 4,
    servingsize: '1 1/2 cups',
    calories: '450',
    prep: '10',
    cook: '40',
    total_time: '50 mins',
    ingredients: ['1 lb pasta (fettuccine or pappardelle)', '4 large onions, thinly sliced', '4 tbsp butter', '2 cups beef broth', '1/2 cup heavy cream', '4 oz Gruyere cheese, grated', '2 cloves garlic, minced', 'Salt and pepper to taste', 'Fresh thyme', '2 tbsp balsamic vinegar'],
    instructions: ['Caramelize onions: Melt butter in large pot over medium heat, add sliced onions and cook 30-35 minutes until deep golden brown, stirring frequently', 'Add garlic: Stir in minced garlic and cook for 1 minute until fragrant', 'Deglaze: Add balsamic vinegar and scrape up any browned bits', 'Add broth: Pour in beef broth and simmer for 5 minutes', 'Add cream: Stir in heavy cream and bring to gentle simmer', 'Cook pasta: In separate pot, cook pasta according to package directions until al dente', 'Combine: Add drained pasta to onion sauce and toss well', 'Finish: Stir in grated Gruyere cheese until melted, season with salt and pepper', 'Serve: Garnish with fresh thyme and serve immediately'],
    tools_needed: ['Large pot', 'Wooden spoon', 'Large pot for pasta', 'Colander', 'Whisk'],
    nutrition: { protein: '16g', carbs: '52g', fat: '22g', fiber: '2g' },
    sources: [{ name: 'Bon Appétit', url: 'https://www.bonappetit.com', type: 'Magazine', learned: 'French onion soup technique' }],
    tags: ['Pasta', 'French', 'Cheese', 'Trending'],
    difficulty: 'Medium',
    variations: [{ variation_name: 'Vegetarian Version', variation_description: 'Use vegetable broth instead of beef broth, add mushrooms for umami' }, { variation_name: 'Light & Healthy', variation_description: 'Replace heavy cream with Greek yogurt and reduce butter by half' }, { variation_name: 'Wine Addition', variation_description: 'Add 1/2 cup dry white wine when deglazing for deeper flavor' }]
  },
  {
    title: 'Pizza Soup',
    description: 'All your favorite pizza flavors in a warm, comforting soup',
    servings: 4,
    servingsize: '1 1/2 cups',
    calories: '320',
    prep: '15',
    cook: '25',
    total_time: '40 mins',
    ingredients: ['2 tbsp olive oil', '1 onion, diced', '4 cloves garlic, minced', '8 oz Italian sausage, browned', '1 can (28 oz) crushed tomatoes', '2 cups beef broth', '1 cup diced bell peppers', '8 oz mozzarella cheese, shredded', '1 tsp Italian seasoning', '1/2 tsp oregano', 'Salt and pepper to taste', 'Fresh basil for garnish', 'Pepperoni slices'],
    instructions: ['Heat oil: Heat olive oil in large pot over medium heat', 'Sauté: Add diced onion and cook 5 minutes until softened', 'Add garlic: Stir in minced garlic and cook 1 minute', 'Brown sausage: Add browned Italian sausage and stir to combine', 'Add tomatoes: Pour in crushed tomatoes and beef broth', 'Season: Add Italian seasoning, oregano, salt, and pepper', 'Simmer: Bring to simmer and cook 15 minutes', 'Add peppers: Stir in diced bell peppers and cook 5 more minutes', 'Add cheese: Remove from heat and stir in mozzarella cheese until melted', 'Serve: Ladle into bowls, top with pepperoni slices and fresh basil'],
    tools_needed: ['Large pot', 'Wooden spoon', 'Ladle', 'Knife', 'Cutting board'],
    nutrition: { protein: '18g', carbs: '24g', fat: '16g', fiber: '3g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Pizza soup concept' }],
    tags: ['Soup', 'Italian', 'Comfort Food', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Vegetarian Version', variation_description: 'Omit sausage, add roasted vegetables like zucchini and mushrooms' }, { variation_name: 'Loaded Meat Style', variation_description: 'Add both Italian sausage and pepperoni for extra meaty flavor' }, { variation_name: 'Creamy Version', variation_description: 'Add 1 cup heavy cream at the end for a creamier, lighter soup' }]
  },
  {
    title: 'Charred Broccoli with Crispy Breadcrumbs',
    description: 'Roasted broccoli with a crunchy, garlicky breadcrumb topping',
    servings: 4,
    servingsize: '1 cup',
    calories: '180',
    prep: '10',
    cook: '20',
    total_time: '30 mins',
    ingredients: ['1 lb fresh broccoli florets', '1 cup panko breadcrumbs', '4 cloves garlic, minced', '1/4 cup olive oil', '2 tbsp butter', '1/2 tsp red pepper flakes', 'Salt and pepper to taste', 'Parmesan cheese', 'Lemon wedges'],
    instructions: ['Prepare broccoli: Preheat oven to 425°F. Toss broccoli with 2 tbsp olive oil, salt, and pepper', 'Roast: Spread on baking sheet and roast for 15-18 minutes until charred and tender', 'Toast breadcrumbs: While broccoli roasts, heat 2 tbsp olive oil and butter in skillet over medium heat', 'Add garlic: Stir in minced garlic and red pepper flakes, cook 1 minute', 'Toast: Add panko breadcrumbs and toast 3-4 minutes, stirring frequently, until golden brown', 'Combine: Toss roasted broccoli with crispy breadcrumb mixture', 'Finish: Sprinkle with Parmesan cheese and serve with lemon wedges'],
    tools_needed: ['Baking sheet', 'Skillet', 'Wooden spoon', 'Tongs'],
    nutrition: { protein: '8g', carbs: '16g', fat: '10g', fiber: '4g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Roasted vegetable preparation' }],
    tags: ['Vegetable', 'Vegetarian', 'Healthy', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Asian Fusion', variation_description: 'Top with sesame seeds and drizzle with soy sauce and ginger oil' }, { variation_name: 'Spicy Kick', variation_description: 'Add cayenne pepper and extra red pepper flakes to the breadcrumb mix' }, { variation_name: 'Cheesy Version', variation_description: 'Add grated cheddar or fontina cheese to the breadcrumbs before toasting' }]
  },
  {
    title: 'Taco Chicken Hoagie',
    description: 'Seasoned pulled chicken with taco toppings on a crusty hoagie roll',
    servings: 4,
    servingsize: '1 sandwich',
    calories: '480',
    prep: '10',
    cook: '25',
    total_time: '35 mins',
    ingredients: ['1.5 lbs chicken breast', '4 hoagie rolls', '2 tbsp taco seasoning', '1/2 cup salsa', '1 cup shredded cheddar cheese', '1 cup shredded lettuce', '1 tomato, sliced', '1/2 cup sour cream', '1/4 cup fresh cilantro', 'Jalapeños (optional)', 'Lime wedges'],
    instructions: ['Cook chicken: Dice chicken breast and cook in skillet over medium-high heat for 8-10 minutes until cooked through', 'Season: Sprinkle taco seasoning over chicken and stir in salsa, simmer 5 minutes', 'Toast rolls: Lightly toast hoagie rolls until golden', 'Assemble: Spread sour cream on bottom of each roll', 'Layer: Add lettuce, then spoon seasoned chicken onto roll', 'Top: Add tomato slices, cheese, cilantro, and jalapeños if desired', 'Finish: Top with hoagie roll and serve with lime wedges'],
    tools_needed: ['Skillet', 'Cutting board', 'Sharp knife', 'Spoon'],
    nutrition: { protein: '34g', carbs: '38g', fat: '16g', fiber: '2g' },
    sources: [{ name: 'Food Network', url: 'https://www.foodnetwork.com', type: 'TV Network', learned: 'Taco seasoning and sandwich assembly' }],
    tags: ['Sandwich', 'Chicken', 'Mexican', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Crispy Shell Version', variation_description: 'Use crispy tortilla shells or fried wonton wraps instead of hoagie rolls' }, { variation_name: 'Vegetarian Option', variation_description: 'Replace chicken with seasoned black beans and roasted vegetables' }, { variation_name: 'Buffalo Twist', variation_description: 'Toss chicken in buffalo sauce instead of taco seasoning, add blue cheese' }]
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a gooey molten center',
    servings: 4,
    servingsize: '1 cake',
    calories: '340',
    prep: '10',
    cook: '14',
    total_time: '24 mins',
    ingredients: ['6 oz dark chocolate, chopped', '1/2 cup butter', '2 large eggs', '2 egg yolks', '1/4 cup sugar', '2 tbsp flour', 'Pinch of salt', 'Butter and cocoa powder for ramekins', 'Vanilla ice cream (optional)'],
    instructions: ['Prepare: Preheat oven to 425°F. Butter 4 ramekins and dust with cocoa powder', 'Melt chocolate: Heat chocolate and butter together over double boiler or microwave until smooth', 'Beat eggs: Whisk eggs, egg yolks, and sugar until thick and pale, about 3 minutes', 'Combine: Fold melted chocolate into egg mixture gently', 'Add flour: Fold in flour and salt until just combined', 'Divide: Pour batter evenly into prepared ramekins', 'Bake: Bake for 12-14 minutes until edges are firm but center is soft', 'Serve: Invert onto plates and serve immediately with ice cream if desired'],
    tools_needed: ['Ramekins', 'Double boiler or microwave', 'Mixing bowls', 'Whisk', 'Spatula', 'Oven'],
    nutrition: { protein: '6g', carbs: '32g', fat: '21g', fiber: '2g' },
    sources: [{ name: 'Martha Stewart', url: 'https://www.marthastewart.com', type: 'Lifestyle', learned: 'Molten chocolate cake technique' }],
    tags: ['Dessert', 'Chocolate', 'Elegant', 'Trending'],
    difficulty: 'Medium',
    variations: [{ variation_name: 'Raspberry Center', variation_description: 'Place a fresh raspberry in the center before baking for tartness' }, { variation_name: 'Salted Caramel', variation_description: 'Add 1 tbsp dulce de leche in the center for a salted caramel lava' }, { variation_name: 'Mini Bites', variation_description: 'Use muffin tins instead of ramekins to make individual bite-sized cakes' }]
  },
  {
    title: 'Cookie Fries with Dip',
    description: 'Sugar cookie cut into fries and served with chocolate and caramel dipping sauces',
    servings: 4,
    servingsize: '8-10 fries',
    calories: '280',
    prep: '15',
    cook: '10',
    total_time: '25 mins',
    ingredients: ['1 lb sugar cookie dough (store-bought or homemade)', '1 cup chocolate sauce', '1/2 cup caramel sauce', '2 tbsp sea salt', 'Powdered sugar for dusting'],
    instructions: ['Prepare: Preheat oven to 375°F', 'Roll dough: Roll out sugar cookie dough into 1/4 inch thick rectangle on parchment paper', 'Cut fries: Cut into fry-shaped strips about 3 inches long and 1/2 inch wide', 'Bake: Place on baking sheet and bake 8-10 minutes until light golden', 'Cool: Let cool slightly, about 2 minutes', 'Season: Sprinkle with sea salt and powdered sugar while still warm', 'Warm sauces: Heat chocolate and caramel sauces according to package directions', 'Serve: Arrange cookie fries in cone or cup and serve with chocolate and caramel dips'],
    tools_needed: ['Rolling pin', 'Knife', 'Baking sheet', 'Parchment paper', 'Small bowls'],
    nutrition: { protein: '2g', carbs: '42g', fat: '8g', fiber: '0g' },
    sources: [{ name: 'Tasty', url: 'https://www.tasty.co', type: 'Video Recipes', learned: 'Cookie decoration and dipping concept' }],
    tags: ['Dessert', 'Sweet', 'Fun', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Chocolate Dipped', variation_description: 'Dip half of each cookie fry in melted dark chocolate' }, { variation_name: 'Cinnamon Sugar', variation_description: 'Roll warm fries in cinnamon sugar instead of sea salt and powdered sugar' }, { variation_name: 'Snickerdoodle Style', variation_description: 'Use snickerdoodle dough for the fries with cinnamon sugar coating' }]
  },
  {
    title: 'Matcha Pancakes',
    description: 'Fluffy green tea pancakes with a light, earthy flavor',
    servings: 4,
    servingsize: '2-3 pancakes',
    calories: '240',
    prep: '10',
    cook: '15',
    total_time: '25 mins',
    ingredients: ['1 1/2 cups all-purpose flour', '2 tbsp matcha powder', '2 tsp baking powder', '1/2 tsp salt', '1 tbsp sugar', '1 1/4 cups milk', '1 large egg', '2 tbsp melted butter', 'Butter for cooking', 'Maple syrup and whipped cream for serving'],
    instructions: ['Mix dry: Whisk together flour, matcha powder, baking powder, salt, and sugar in large bowl', 'Mix wet: In another bowl, whisk milk, egg, and melted butter together', 'Combine: Pour wet ingredients into dry ingredients, stir until just combined (some lumps are okay)', 'Heat griddle: Heat griddle or skillet over medium heat and lightly butter', 'Cook pancakes: Pour 1/4 cup batter for each pancake onto griddle', 'Flip: Cook 2-3 minutes until edges look set, flip and cook another 1-2 minutes until golden', 'Serve: Stack pancakes on plate and top with maple syrup and whipped cream'],
    tools_needed: ['Mixing bowls', 'Whisk', 'Griddle or skillet', 'Spatula', 'Measuring cups'],
    nutrition: { protein: '6g', carbs: '38g', fat: '6g', fiber: '1g' },
    sources: [{ name: 'AllRecipes', url: 'https://www.allrecipes.com', type: 'Recipe Site', learned: 'Pancake base with matcha powder' }],
    tags: ['Breakfast', 'Vegetarian', 'Green Tea', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'White Chocolate Chips', variation_description: 'Add white chocolate chips to the batter for sweetness' }, { variation_name: 'Red Bean Topping', variation_description: 'Top with sweetened red bean paste and condensed milk' }, { variation_name: 'Protein Boost', variation_description: 'Add 1/4 cup protein powder to the dry ingredients' }]
  },
  {
    title: 'Avocado Egg Toast',
    description: 'Creamy mashed avocado on crispy toast topped with a perfect fried egg',
    servings: 1,
    servingsize: '1 toast',
    calories: '280',
    prep: '5',
    cook: '8',
    total_time: '13 mins',
    ingredients: ['1 slice bread (sourdough or whole grain)', '1/2 avocado, ripe', '1 large egg', '1 tbsp butter', 'Salt and pepper to taste', 'Red pepper flakes', 'Lemon juice', 'Fresh herbs (optional)'],
    instructions: ['Toast bread: Toast bread until golden and crispy on both sides', 'Mash avocado: Scoop avocado onto toast and mash gently with fork, leaving slightly chunky', 'Season avocado: Drizzle with lemon juice, sprinkle with salt and pepper', 'Cook egg: Heat butter in skillet over medium heat, crack egg into pan', 'Fry: Cook egg to desired doneness, about 3-4 minutes for sunny-side up', 'Top: Carefully slide fried egg onto avocado toast', 'Finish: Sprinkle with red pepper flakes and fresh herbs', 'Serve: Eat immediately while warm'],
    tools_needed: ['Toaster', 'Skillet', 'Spatula', 'Fork', 'Small knife'],
    nutrition: { protein: '12g', carbs: '22g', fat: '14g', fiber: '3g' },
    sources: [{ name: 'Serious Eats', url: 'https://www.seriouseats.com', type: 'Food Blog', learned: 'Avocado preparation and egg cooking' }],
    tags: ['Breakfast', 'Vegetarian', 'Quick', 'Trending'],
    difficulty: 'Easy',
    variations: [{ variation_name: 'Scrambled Egg Version', variation_description: 'Use scrambled eggs instead of fried for a different texture' }, { variation_name: 'Crispy Bacon Add-On', variation_description: 'Add crispy bacon strips and sliced tomato on top' }, { variation_name: 'Poached Egg Style', variation_description: 'Use a perfectly poached egg for an elegant presentation' }]
  }
];

async function seedRecipes() {
  console.log('🌱 Starting to seed trending recipes...');
  
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert(trendingRecipes);

    if (error) {
      console.error('❌ Error seeding recipes:', error);
      process.exit(1);
    }

    console.log('✅ Successfully seeded', trendingRecipes.length, 'recipes!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedRecipes();
