import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, Sparkles, FileText, Image, TrendingUp, Users, Heart, Home, Star, Eye, Package } from 'lucide-react';
import type { ModelType } from '@/types/types';
import { toast } from 'sonner';
import { generateImageClassification, generateColorPatterns, generateDigits, generateAnimalSilhouettes, generateFashionItems, generateVehicles, generateFlowers, generatePlantDiseases, generateDogBreeds, generateFacialExpressions, type ImageDatasetRow } from '@/services/syntheticDatasetGeneratorService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DatasetTemplate {
  id: string;
  name: string;
  description: string;
  modelType: ModelType;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Number of rows/images that will be generated */
  rows: number;
  /** CSV column names (empty for image datasets) */
  columns: string[];
  /** One-liner about how this is used in industry */
  realWorldUse: string;
  icon: React.ElementType;
  iconColor: string;
  /** Returns synthetic rows (excluding header) for tabular data */
  generateData: () => string[][];
  /** Whether this template uses bundled/synthetic data (no network required) */
  bundledImages?: boolean;
  /** For image templates: generates image dataset */
  generateImageData?: () => ImageDatasetRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic data helpers — no network or DB required
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a random number between min and max, rounded to `decimals` places */
function randomBetween(min: number, max: number, decimals = 0): number {
  const val = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
}

/** Picks a random element from an array */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Template definitions
// Each template generates realistic synthetic data that mirrors the real dataset
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: DatasetTemplate[] = [

  // ── Classification ─────────────────────────────────────────────────────────

  {
    id: 'iris',
    name: 'Iris Flowers 🌸',
    description: 'Classic dataset: classify flowers by petal and sepal measurements. Perfect first ML project.',
    modelType: 'classification',
    tags: ['classic', 'biology', 'multiclass'],
    difficulty: 'beginner',
    rows: 150,
    columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
    realWorldUse: 'Used to introduce ML at universities worldwide. Same technique classifies plant diseases.',
    icon: Star,
    iconColor: 'text-pink-500',
    generateData: () => {
      const rows: string[][] = [];
      // Each class has distinct measurement ranges to create separable clusters
      const classes = [
        { name: 'setosa',     sl: [4.6, 5.4], sw: [3.0, 3.9], pl: [1.0, 1.9], pw: [0.1, 0.6] },
        { name: 'versicolor', sl: [4.9, 7.0], sw: [2.0, 3.4], pl: [3.0, 5.1], pw: [1.0, 1.8] },
        { name: 'virginica',  sl: [6.0, 7.9], sw: [2.6, 3.8], pl: [4.5, 6.9], pw: [1.4, 2.5] },
      ];
      for (let i = 0; i < 150; i++) {
        const c = classes[i % 3];
        rows.push([
          randomBetween(c.sl[0], c.sl[1], 1).toString(),
          randomBetween(c.sw[0], c.sw[1], 1).toString(),
          randomBetween(c.pl[0], c.pl[1], 1).toString(),
          randomBetween(c.pw[0], c.pw[1], 1).toString(),
          c.name,
        ]);
      }
      return rows;
    },
  },

  {
    id: 'titanic',
    name: 'Titanic Survival 🚢',
    description: 'Predict who survived the Titanic based on passenger info. A classic binary classification problem.',
    modelType: 'classification',
    tags: ['history', 'binary', 'famous'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['age', 'fare', 'pclass', 'sex', 'siblings_aboard', 'survived'],
    realWorldUse: 'Same technique predicts loan defaults, disease risk, and customer churn.',
    icon: Users,
    iconColor: 'text-blue-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const pclass = randomChoice([1, 2, 3]);
        const sex = randomChoice(['male', 'female']);
        const age = randomBetween(1, 75);
        // Fare correlates with class (realistic)
        const fare = pclass === 1 ? randomBetween(50, 500) : pclass === 2 ? randomBetween(10, 50) : randomBetween(5, 20);
        const siblings = randomBetween(0, 4);
        // Survival chance based on historical patterns: women and 1st class had higher survival
        const surviveChance = (sex === 'female' ? 0.7 : 0.2) + (pclass === 1 ? 0.2 : 0);
        const survived = Math.random() < surviveChance ? 1 : 0;
        rows.push([age.toString(), fare.toString(), pclass.toString(), sex, siblings.toString(), survived.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'heart-disease',
    name: 'Heart Disease Risk ❤️',
    description: 'Predict heart disease risk from patient health metrics. High-impact real-world application.',
    modelType: 'classification',
    tags: ['healthcare', 'binary', 'important'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['age', 'cholesterol', 'blood_pressure', 'heart_rate', 'blood_sugar', 'has_heart_disease'],
    realWorldUse: 'Used by hospitals to flag high-risk patients for early intervention.',
    icon: Heart,
    iconColor: 'text-red-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const age = randomBetween(30, 75);
        const cholesterol = randomBetween(150, 400);
        const bp = randomBetween(90, 180);
        const hr = randomBetween(60, 120);
        const bs = randomChoice([0, 1]); // 0 = normal, 1 = elevated blood sugar
        // Risk accumulates from multiple factors (medically inspired heuristic)
        const risk =
          (age > 55 ? 0.3 : 0) +
          (cholesterol > 240 ? 0.3 : 0) +
          (bp > 140 ? 0.2 : 0) +
          (bs === 1 ? 0.2 : 0);
        const disease = Math.random() < risk ? 1 : 0;
        rows.push([age.toString(), cholesterol.toString(), bp.toString(), hr.toString(), bs.toString(), disease.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'customer-churn',
    name: 'Customer Churn 📉',
    description: 'Predict if a customer will cancel their subscription based on usage patterns.',
    modelType: 'classification',
    tags: ['business', 'binary', 'retention'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['tenure_months', 'monthly_charges', 'total_charges', 'contract_type', 'support_tickets', 'churned'],
    realWorldUse: 'Subscription services use this to identify at-risk customers and improve retention.',
    icon: Users,
    iconColor: 'text-orange-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const tenure = randomBetween(1, 72);
        const monthlyCharges = randomBetween(20, 120);
        const totalCharges = tenure * monthlyCharges + randomBetween(-100, 100);
        const contractType = randomChoice(['month-to-month', 'one-year', 'two-year']);
        const supportTickets = randomBetween(0, 10);
        // Churn probability based on realistic factors
        const churnProb =
          (contractType === 'month-to-month' ? 0.3 : 0.05) +
          (tenure < 12 ? 0.2 : 0) +
          (supportTickets > 5 ? 0.2 : 0) +
          (monthlyCharges > 80 ? 0.1 : 0);
        const churned = Math.random() < churnProb ? 1 : 0;
        rows.push([tenure.toString(), monthlyCharges.toString(), Math.round(totalCharges).toString(), contractType, supportTickets.toString(), churned.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'diabetes',
    name: 'Diabetes Prediction 🩺',
    description: 'Predict diabetes risk from patient health metrics. Classic medical ML dataset.',
    modelType: 'classification',
    tags: ['healthcare', 'binary', 'medical'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['glucose', 'blood_pressure', 'bmi', 'age', 'insulin', 'has_diabetes'],
    realWorldUse: 'Healthcare providers use this for early diabetes screening and prevention.',
    icon: Heart,
    iconColor: 'text-teal-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const glucose = randomBetween(70, 200);
        const bp = randomBetween(60, 120);
        const bmi = randomBetween(18, 45, 1);
        const age = randomBetween(21, 81);
        const insulin = randomBetween(0, 300);
        // Diabetes probability based on medical risk factors
        const diabetesProb =
          (glucose > 140 ? 0.4 : 0) +
          (bmi > 30 ? 0.2 : 0) +
          (age > 45 ? 0.15 : 0) +
          (insulin > 150 ? 0.1 : 0);
        const hasDiabetes = Math.random() < diabetesProb ? 1 : 0;
        rows.push([glucose.toString(), bp.toString(), bmi.toString(), age.toString(), insulin.toString(), hasDiabetes.toString()]);
      }
      return rows;
    },
  },

  // ── Regression ─────────────────────────────────────────────────────────────

  {
    id: 'house-prices',
    name: 'House Prices 🏠',
    description: 'Predict house sale prices from size, location, and features. The hello world of regression.',
    modelType: 'regression',
    tags: ['real-estate', 'popular', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['sqft', 'bedrooms', 'bathrooms', 'age_years', 'garage', 'price'],
    realWorldUse: 'Zillow, Redfin and every real estate app uses this exact approach.',
    icon: Home,
    iconColor: 'text-green-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const sqft = randomBetween(600, 4000);
        const beds = randomBetween(1, 6);
        const baths = randomBetween(1, 4);
        const age = randomBetween(0, 60);
        const garage = randomChoice([0, 1, 2]); // number of garage spaces
        // Price formula with realistic weights + noise
        const price = Math.round(
          sqft * 150 +
          beds * 10000 +
          baths * 8000 -
          age * 1000 +
          garage * 15000 +
          randomBetween(-20000, 20000),
        );
        rows.push([sqft.toString(), beds.toString(), baths.toString(), age.toString(), garage.toString(), price.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'salary',
    name: 'Salary Prediction 💼',
    description: 'Predict employee salary from years of experience, education, and role.',
    modelType: 'regression',
    tags: ['HR', 'career', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['years_experience', 'education_level', 'role_level', 'skills_count', 'salary'],
    realWorldUse: 'HR teams use this to ensure fair pay and create transparent salary bands.',
    icon: TrendingUp,
    iconColor: 'text-purple-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const exp = randomBetween(0, 25);
        const edu = randomBetween(1, 4);  // 1=HS, 2=BS, 3=MS, 4=PhD
        const role = randomBetween(1, 5); // 1=junior … 5=director
        const skills = randomBetween(2, 15);
        const salary = Math.round(
          30000 +
          exp * 3000 +
          edu * 8000 +
          role * 12000 +
          skills * 500 +
          randomBetween(-5000, 5000),
        );
        rows.push([exp.toString(), edu.toString(), role.toString(), skills.toString(), salary.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'weather-temperature',
    name: 'Weather Temperature 🌡️',
    description: 'Predict temperature based on weather conditions and historical patterns.',
    modelType: 'regression',
    tags: ['weather', 'forecasting', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['humidity', 'wind_speed', 'pressure', 'cloud_cover', 'month', 'temperature'],
    realWorldUse: 'Weather apps and climate models use this for temperature forecasting.',
    icon: TrendingUp,
    iconColor: 'text-sky-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const month = randomBetween(1, 12);
        const humidity = randomBetween(20, 95);
        const windSpeed = randomBetween(0, 30);
        const pressure = randomBetween(990, 1030);
        const cloudCover = randomBetween(0, 100);
        // Temperature based on month (seasonal) and other factors
        const baseTemp = month <= 6 ? 10 + month * 5 : 40 - (month - 6) * 5;
        const temperature = Math.round(
          baseTemp -
          humidity * 0.1 -
          windSpeed * 0.3 +
          (pressure - 1010) * 0.2 -
          cloudCover * 0.05 +
          randomBetween(-5, 5)
        );
        rows.push([humidity.toString(), windSpeed.toString(), pressure.toString(), cloudCover.toString(), month.toString(), temperature.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'song-popularity',
    name: 'Song Popularity 🎵',
    description: 'Predict song popularity score based on audio features like tempo and energy.',
    modelType: 'regression',
    tags: ['music', 'entertainment', 'numeric'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['tempo', 'energy', 'danceability', 'loudness', 'duration_sec', 'popularity'],
    realWorldUse: 'Spotify and music platforms use this to recommend songs and predict hits.',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const tempo = randomBetween(60, 180);
        const energy = randomBetween(10, 100);
        const danceability = randomBetween(10, 100);
        const loudness = randomBetween(-20, 0);
        const duration = randomBetween(120, 360);
        // Popularity formula based on typical hit song characteristics
        const popularity = Math.min(100, Math.max(0, Math.round(
          30 +
          (energy > 60 ? 15 : 0) +
          (danceability > 60 ? 15 : 0) +
          (tempo > 100 && tempo < 140 ? 10 : 0) +
          (duration > 180 && duration < 270 ? 10 : 0) +
          randomBetween(-15, 15)
        )));
        rows.push([tempo.toString(), energy.toString(), danceability.toString(), loudness.toString(), duration.toString(), popularity.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'car-prices',
    name: 'Used Car Prices 🚗',
    description: 'Predict used car prices based on mileage, age, and features.',
    modelType: 'regression',
    tags: ['automotive', 'pricing', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['year', 'mileage', 'engine_size', 'horsepower', 'fuel_efficiency', 'price'],
    realWorldUse: 'Car dealerships and marketplaces use this to price vehicles accurately.',
    icon: TrendingUp,
    iconColor: 'text-slate-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const year = randomBetween(2010, 2024);
        const mileage = randomBetween(5000, 150000);
        const engineSize = randomChoice([1.4, 1.6, 2.0, 2.5, 3.0, 3.5]);
        const horsepower = Math.round(engineSize * 60 + randomBetween(-20, 40));
        const fuelEfficiency = Math.round(40 - engineSize * 5 + randomBetween(-3, 3));
        // Price formula
        const basePrice = 15000 + (year - 2010) * 2000;
        const price = Math.round(
          basePrice -
          mileage * 0.05 +
          horsepower * 50 +
          randomBetween(-2000, 2000)
        );
        rows.push([year.toString(), mileage.toString(), engineSize.toString(), horsepower.toString(), fuelEfficiency.toString(), Math.max(5000, price).toString()]);
      }
      return rows;
    },
  },

  {
    id: 'sales-forecasting',
    name: 'Sales Forecasting 📊',
    description: 'Predict product sales based on historical data, seasonality, and marketing spend.',
    modelType: 'regression',
    tags: ['business', 'forecasting', 'retail'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['month', 'marketing_spend', 'price', 'competitor_price', 'holiday_flag', 'units_sold'],
    realWorldUse: 'Retailers use sales forecasting to optimize inventory, staffing, and marketing budgets.',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const month = randomBetween(1, 12);
        const marketingSpend = randomBetween(1000, 10000);
        const price = randomBetween(20, 100);
        const competitorPrice = price + randomBetween(-15, 15);
        const holidayFlag = randomChoice([0, 0, 0, 1]); // 25% chance of holiday
        // Sales formula with seasonality and marketing effect
        const seasonalFactor = month === 11 || month === 12 ? 1.5 : month === 1 || month === 2 ? 0.7 : 1.0;
        const priceFactor = competitorPrice > price ? 1.2 : 0.9;
        const baseSales = 100 + marketingSpend * 0.01;
        const unitsSold = Math.round(
          baseSales * seasonalFactor * priceFactor +
          (holidayFlag ? 50 : 0) +
          randomBetween(-20, 20)
        );
        rows.push([month.toString(), marketingSpend.toString(), price.toString(), competitorPrice.toString(), holidayFlag.toString(), Math.max(10, unitsSold).toString()]);
      }
      return rows;
    },
  },

  {
    id: 'stock-indicators',
    name: 'Stock Price Movement 📈',
    description: 'Predict stock price changes based on technical indicators and market data.',
    modelType: 'regression',
    tags: ['finance', 'trading', 'numeric'],
    difficulty: 'advanced',
    rows: 200,
    columns: ['open_price', 'volume', 'moving_avg_5', 'moving_avg_20', 'rsi', 'price_change'],
    realWorldUse: 'Quantitative traders use technical indicators to predict short-term price movements.',
    icon: TrendingUp,
    iconColor: 'text-green-600',
    generateData: () => {
      const rows: string[][] = [];
      let prevPrice = 100;
      for (let i = 0; i < 200; i++) {
        const openPrice = prevPrice + randomBetween(-5, 5, 2);
        const volume = randomBetween(100000, 1000000);
        const ma5 = openPrice + randomBetween(-3, 3, 2);
        const ma20 = openPrice + randomBetween(-8, 8, 2);
        const rsi = randomBetween(20, 80);
        // Price change based on indicators
        const trendSignal = ma5 > ma20 ? 1 : -1;
        const rsiSignal = rsi < 30 ? 1 : rsi > 70 ? -1 : 0;
        const volumeSignal = volume > 500000 ? 0.5 : 0;
        const priceChange = (
          trendSignal * randomBetween(0, 3, 2) +
          rsiSignal * randomBetween(0, 2, 2) +
          volumeSignal * randomBetween(-1, 1, 2) +
          randomBetween(-2, 2, 2)
        );
        prevPrice = openPrice + priceChange;
        rows.push([openPrice.toFixed(2), volume.toString(), ma5.toFixed(2), ma20.toFixed(2), rsi.toString(), priceChange.toFixed(2)]);
      }
      return rows;
    },
  },

  // ── Text Classification ────────────────────────────────────────────────────

  {
    id: 'sentiment',
    name: 'Product Reviews 💬',
    description: 'Classify customer reviews as positive or negative. Core NLP task used everywhere.',
    modelType: 'text_classification',
    tags: ['NLP', 'sentiment', 'e-commerce'],
    difficulty: 'beginner',
    rows: 100,
    columns: ['review_text', 'sentiment'],
    realWorldUse: 'Amazon, Yelp, and every review platform uses sentiment analysis to surface quality content.',
    icon: FileText,
    iconColor: 'text-yellow-500',
    generateData: () => {
      const positive = [
        'Absolutely love this product! Works perfectly.',
        'Great quality, fast shipping. Highly recommend!',
        'Exceeded my expectations. Will buy again.',
        'Perfect fit, looks exactly like the picture.',
        'Amazing value for the price. Very happy!',
        'Fantastic product, my family loves it.',
        'Super easy to use and works great.',
        'Best purchase I made this year!',
        'Outstanding quality and quick delivery.',
        'Five stars! Would definitely recommend.',
      ];
      const negative = [
        'Terrible quality, broke after one week.',
        'Does not match the description at all.',
        'Very disappointed. Waste of money.',
        'Arrived damaged and customer service was unhelpful.',
        'Poor quality materials, fell apart quickly.',
        'Completely different from the photo shown.',
        'Stopped working after 3 days. Awful.',
        'Not worth the price at all.',
        'Worst product I have ever bought.',
        'Would give zero stars if I could.',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        // Alternate positive / negative for balanced classes
        rows.push(i % 2 === 0
          ? [randomChoice(positive), 'positive']
          : [randomChoice(negative), 'negative'],
        );
      }
      return rows;
    },
  },

  {
    id: 'spam',
    name: 'Spam Detection 📧',
    description: 'Classify emails as spam or not spam. One of the earliest practical ML applications.',
    modelType: 'text_classification',
    tags: ['NLP', 'email', 'classic'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['email_text', 'label'],
    realWorldUse: 'Gmail, Outlook and every email provider uses this to keep your inbox clean.',
    icon: FileText,
    iconColor: 'text-orange-500',
    generateData: () => {
      const spam = [
        'WINNER! You have been selected for a $1000 prize. Click now!',
        'Congratulations! Claim your free iPhone today. Limited offer!',
        'Make $5000 a week from home. No experience needed.',
        'URGENT: Your account will be suspended. Verify immediately.',
        'Buy cheap meds online. No prescription needed. 90% off.',
      ];
      const ham = [
        'Hi, can we reschedule our meeting to Thursday afternoon?',
        'Please find attached the report from last quarter.',
        'Just checking in to see how the project is going.',
        'Reminder: team lunch is tomorrow at noon.',
        'Thanks for your help with the presentation yesterday.',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        // Alternate spam / ham for balanced classes
        rows.push(i % 2 === 0
          ? [randomChoice(spam), 'spam']
          : [randomChoice(ham), 'ham'],
        );
      }
      return rows;
    },
  },

  {
    id: 'toxic-comments',
    name: 'Toxic Comments 🚫',
    description: 'Classify comments as toxic or non-toxic. Learn content moderation techniques.',
    modelType: 'text_classification',
    tags: ['NLP', 'moderation', 'safety'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['comment_text', 'label'],
    realWorldUse: 'Social media platforms use this to automatically flag harmful content and protect users.',
    icon: FileText,
    iconColor: 'text-red-500',
    generateData: () => {
      // Note: These are synthetic examples for educational purposes only
      // Real toxic comment detection requires much more nuanced training data
      const toxic = [
        'You are so stupid, I cannot believe anyone listens to you.',
        'This is the worst idea ever. You should be ashamed.',
        'Nobody cares about your opinion. Just shut up already.',
        'What a complete waste of time. You are an idiot.',
        'I hate everything about this. You are terrible at your job.',
        'This is garbage. The person who made this should quit.',
        'You are completely worthless and should just give up.',
        'What a joke. This is pathetic and so are you.',
        'I cannot stand people like you. You ruin everything.',
        'This is so bad it makes me angry. You are the worst.',
        'Stop posting this nonsense. Nobody wants to hear from you.',
        'You have no idea what you are talking about. Shut up.',
        'This is embarrassing. How can you be so clueless?',
        'I wish people like you would just disappear.',
        'Your opinion is worthless. Stop wasting everyone\'s time.',
      ];
      const nonToxic = [
        'I respectfully disagree with your point of view.',
        'Thanks for sharing your perspective on this topic.',
        'I think there might be a better approach to consider.',
        'Great discussion! I learned something new today.',
        'While I see your point, I have a different opinion.',
        'This is an interesting take. Can you explain more?',
        'I appreciate you taking the time to write this.',
        'Good points raised here. Food for thought.',
        'I understand where you are coming from on this.',
        'Thanks for the thoughtful response to my question.',
        'I had not considered that angle before. Interesting!',
        'Well said. I agree with most of your points.',
        'This is a complex topic with many valid viewpoints.',
        'I appreciate the civil discussion happening here.',
        'Good feedback. I will take this into consideration.',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        rows.push(i % 2 === 0
          ? [randomChoice(toxic), 'toxic']
          : [randomChoice(nonToxic), 'non_toxic'],
        );
      }
      return rows;
    },
  },

  {
    id: 'news-topics',
    name: 'News Topics 📰',
    description: 'Classify news headlines by topic (sports, tech, politics, entertainment).',
    modelType: 'text_classification',
    tags: ['NLP', 'news', 'multiclass'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['headline', 'topic'],
    realWorldUse: 'News aggregators use topic classification to organize content and personalize feeds.',
    icon: FileText,
    iconColor: 'text-blue-500',
    generateData: () => {
      const sports = [
        'Team wins championship in overtime thriller',
        'Star player signs record-breaking contract extension',
        'Coach announces retirement after legendary career',
        'Underdog team upsets favorites in playoff game',
        'Athlete breaks world record at international competition',
        'Trade deadline sees major moves across the league',
        'Injury sidelines key player for rest of season',
      ];
      const tech = [
        'New smartphone features revolutionary AI assistant',
        'Tech giant announces major acquisition deal',
        'Startup raises billions in latest funding round',
        'Software update brings significant performance improvements',
        'Company unveils next-generation processor chip',
        'Cybersecurity breach affects millions of users',
        'Electric vehicle maker reports record quarterly sales',
      ];
      const politics = [
        'Senate passes landmark legislation after debate',
        'President announces new economic policy initiative',
        'Election results show shift in voter preferences',
        'International summit addresses climate change concerns',
        'Governor signs controversial bill into law',
        'Political parties clash over budget proposal',
        'Diplomatic talks resume between rival nations',
      ];
      const entertainment = [
        'Blockbuster movie breaks opening weekend records',
        'Popular TV series renewed for another season',
        'Music artist announces world tour dates',
        'Award show celebrates best performances of the year',
        'Streaming service releases highly anticipated series',
        'Celebrity couple announces engagement news',
        'Film festival premieres groundbreaking documentary',
      ];
      const topics = [
        { headlines: sports, label: 'sports' },
        { headlines: tech, label: 'tech' },
        { headlines: politics, label: 'politics' },
        { headlines: entertainment, label: 'entertainment' },
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        const topic = topics[i % 4];
        rows.push([randomChoice(topic.headlines), topic.label]);
      }
      return rows;
    },
  },

  {
    id: 'language-detection',
    name: 'Language Detection 🌍',
    description: 'Detect the language of a given text (English, Spanish, French, German, Italian).',
    modelType: 'text_classification',
    tags: ['NLP', 'language', 'multilingual'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['text', 'language'],
    realWorldUse: 'Translation services and international platforms use this to route content to the right language model.',
    icon: FileText,
    iconColor: 'text-emerald-500',
    generateData: () => {
      const english = [
        'The weather is beautiful today and I feel great.',
        'Can you help me find the nearest coffee shop?',
        'I love reading books about science and technology.',
        'The meeting has been rescheduled to next Monday.',
        'Thank you for your help with this project.',
        'What time does the train leave for the city?',
        'I would like to order a pizza with extra cheese.',
      ];
      const spanish = [
        'El clima está hermoso hoy y me siento muy bien.',
        'Me puedes ayudar a encontrar la cafetería más cercana?',
        'Me encanta leer libros sobre ciencia y tecnología.',
        'La reunión se ha reprogramado para el próximo lunes.',
        'Gracias por tu ayuda con este proyecto.',
        'A qué hora sale el tren hacia la ciudad?',
        'Me gustaría pedir una pizza con queso extra.',
      ];
      const french = [
        'Le temps est magnifique aujourd hui et je me sens bien.',
        'Pouvez-vous m aider à trouver le café le plus proche?',
        'J adore lire des livres sur la science et la technologie.',
        'La réunion a été reportée à lundi prochain.',
        'Merci pour votre aide sur ce projet.',
        'À quelle heure part le train pour la ville?',
        'Je voudrais commander une pizza avec du fromage supplémentaire.',
      ];
      const german = [
        'Das Wetter ist heute wunderschön und ich fühle mich großartig.',
        'Können Sie mir helfen das nächste Café zu finden?',
        'Ich liebe es Bücher über Wissenschaft und Technologie zu lesen.',
        'Das Meeting wurde auf nächsten Montag verschoben.',
        'Vielen Dank für Ihre Hilfe bei diesem Projekt.',
        'Wann fährt der Zug in die Stadt ab?',
        'Ich möchte eine Pizza mit extra Käse bestellen.',
      ];
      const italian = [
        'Il tempo è bellissimo oggi e mi sento benissimo.',
        'Puoi aiutarmi a trovare il bar più vicino?',
        'Adoro leggere libri di scienza e tecnologia.',
        'La riunione è stata riprogrammata per lunedì prossimo.',
        'Grazie per il tuo aiuto con questo progetto.',
        'A che ora parte il treno per la città?',
        'Vorrei ordinare una pizza con formaggio extra.',
      ];
      const languages = [
        { texts: english, label: 'english' },
        { texts: spanish, label: 'spanish' },
        { texts: french, label: 'french' },
        { texts: german, label: 'german' },
        { texts: italian, label: 'italian' },
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        const lang = languages[i % 5];
        rows.push([randomChoice(lang.texts), lang.label]);
      }
      return rows;
    },
  },

  {
    id: 'fake-news',
    name: 'Fake News Detection 📢',
    description: 'Classify news articles as real or fake. Learn to identify misinformation.',
    modelType: 'text_classification',
    tags: ['NLP', 'news', 'misinformation'],
    difficulty: 'advanced',
    rows: 100,
    columns: ['headline', 'label'],
    realWorldUse: 'Social media platforms and fact-checkers use this to combat misinformation.',
    icon: FileText,
    iconColor: 'text-rose-500',
    generateData: () => {
      // Synthetic examples for educational purposes
      const fake = [
        'Scientists discover that the moon is actually made of cheese',
        'Celebrity secretly replaced by robot clone says insider',
        'New study proves that sleeping makes you taller overnight',
        'Government hiding evidence of time travel technology',
        'Eating chocolate for breakfast cures all diseases',
        'Famous landmark disappears overnight baffling experts',
        'Secret society controls all world weather patterns',
        'Ancient civilization found living under major city',
        'Popular drink found to grant temporary superpowers',
        'Aliens confirmed to be running major tech companies',
      ];
      const real = [
        'Stock market closes higher after positive economic data',
        'New research shows benefits of regular exercise',
        'City council approves budget for infrastructure repairs',
        'Scientists publish findings on climate change effects',
        'Tech company announces quarterly earnings results',
        'Health officials recommend updated vaccination schedule',
        'University researchers develop new renewable energy method',
        'International trade agreement signed by member nations',
        'Local hospital expands emergency department capacity',
        'Transportation department announces road construction plans',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        rows.push(i % 2 === 0
          ? [randomChoice(fake), 'fake']
          : [randomChoice(real), 'real'],
        );
      }
      return rows;
    },
  },

  {
    id: 'star-ratings',
    name: 'Star Ratings ⭐',
    description: 'Classify product reviews by star rating (1-5 stars). Multiclass sentiment analysis.',
    modelType: 'text_classification',
    tags: ['NLP', 'sentiment', 'multiclass'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['review_text', 'stars'],
    realWorldUse: 'E-commerce platforms use this to automatically categorize and analyze customer feedback.',
    icon: FileText,
    iconColor: 'text-amber-500',
    generateData: () => {
      const oneStarReviews = [
        'Absolutely terrible. Complete waste of money. Avoid at all costs.',
        'Worst purchase ever. Broke immediately. No refund offered.',
        'Horrible quality. Nothing like the description. Very angry.',
      ];
      const twoStarReviews = [
        'Pretty disappointing. Expected much better for the price.',
        'Not great. Has some issues but somewhat usable.',
        'Below average. Would not recommend to others.',
      ];
      const threeStarReviews = [
        'It is okay. Nothing special but gets the job done.',
        'Average product. Some pros and cons. Decent value.',
        'Middle of the road. Not bad but not impressive either.',
      ];
      const fourStarReviews = [
        'Good product overall. Minor issues but mostly satisfied.',
        'Pretty happy with this purchase. Works well.',
        'Nice quality. Would consider buying again.',
      ];
      const fiveStarReviews = [
        'Absolutely perfect! Exceeded all my expectations!',
        'Best purchase I have ever made. Highly recommend!',
        'Amazing quality and fast shipping. Love it!',
      ];
      const ratings = [
        { reviews: oneStarReviews, stars: '1' },
        { reviews: twoStarReviews, stars: '2' },
        { reviews: threeStarReviews, stars: '3' },
        { reviews: fourStarReviews, stars: '4' },
        { reviews: fiveStarReviews, stars: '5' },
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        const rating = ratings[i % 5];
        rows.push([randomChoice(rating.reviews), rating.stars]);
      }
      return rows;
    },
  },

  {
    id: 'email-categories',
    name: 'Email Categories 📬',
    description: 'Sort emails into categories (work, personal, promotions, social).',
    modelType: 'text_classification',
    tags: ['NLP', 'email', 'organization'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['email_subject', 'category'],
    realWorldUse: 'Email clients like Gmail use this to automatically organize your inbox.',
    icon: FileText,
    iconColor: 'text-violet-500',
    generateData: () => {
      const work = [
        'Q3 Budget Review Meeting - Action Required',
        'Project deadline extended to Friday',
        'Please review the attached proposal',
        'Team standup notes from today',
        'Your performance review is scheduled',
        'Client feedback on the latest deliverable',
        'Updated project timeline attached',
      ];
      const personal = [
        'Happy Birthday! Hope you have a great day',
        'Family reunion this weekend - RSVP',
        'Photos from our vacation last month',
        'Dinner plans for Saturday night?',
        'Miss you! Let us catch up soon',
        'Your package has been delivered',
        'Reminder: Doctor appointment tomorrow',
      ];
      const promotions = [
        'SALE: 50% off everything this weekend only!',
        'Your exclusive member discount inside',
        'Flash sale starts in 2 hours!',
        'New arrivals you will love - Shop now',
        'Limited time offer: Free shipping on all orders',
        'Your cart is waiting - Complete your purchase',
        'Special deal just for you - 30% off',
      ];
      const social = [
        'John commented on your photo',
        'You have 5 new connection requests',
        'Sarah mentioned you in a post',
        'Your friend just joined the platform',
        'Weekly digest: See what you missed',
        'New message from your group',
        'Event reminder: Tech meetup tonight',
      ];
      const categories = [
        { subjects: work, category: 'work' },
        { subjects: personal, category: 'personal' },
        { subjects: promotions, category: 'promotions' },
        { subjects: social, category: 'social' },
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        const cat = categories[i % 4];
        rows.push([randomChoice(cat.subjects), cat.category]);
      }
      return rows;
    },
  },

  {
    id: 'scientific-papers',
    name: 'Scientific Papers 📚',
    description: 'Classify research paper abstracts by field (physics, biology, computer science, medicine).',
    modelType: 'text_classification',
    tags: ['NLP', 'academic', 'multiclass'],
    difficulty: 'advanced',
    rows: 100,
    columns: ['abstract', 'field'],
    realWorldUse: 'Academic databases use this to categorize papers and help researchers find relevant work.',
    icon: FileText,
    iconColor: 'text-indigo-500',
    generateData: () => {
      const physics = [
        'We present a novel approach to quantum entanglement using superconducting qubits at near absolute zero temperatures.',
        'This study investigates the properties of dark matter through gravitational lensing observations.',
        'Our research demonstrates a new method for achieving nuclear fusion with improved plasma confinement.',
        'We analyze the behavior of particles in high-energy collisions at the Large Hadron Collider.',
        'This paper presents theoretical predictions for gravitational waves from binary black hole mergers.',
        'We propose a unified field theory that reconciles quantum mechanics with general relativity.',
        'Our experiments reveal new insights into the nature of antimatter and its interactions.',
      ];
      const biology = [
        'We discovered a novel gene editing technique using modified CRISPR-Cas9 systems for precise DNA modification.',
        'This study examines the role of gut microbiome in immune system development and disease prevention.',
        'Our research identifies new biomarkers for early detection of neurodegenerative diseases.',
        'We present findings on cellular regeneration mechanisms in stem cell therapy applications.',
        'This paper analyzes the evolutionary adaptations of deep-sea organisms to extreme pressure.',
        'We investigate the molecular pathways involved in cancer cell metastasis and tumor growth.',
        'Our study reveals the genetic basis of antibiotic resistance in bacterial populations.',
      ];
      const computerScience = [
        'We introduce a transformer architecture that achieves state-of-the-art results in natural language processing.',
        'This paper presents a novel algorithm for distributed computing with improved fault tolerance.',
        'Our research develops new techniques for privacy-preserving machine learning on encrypted data.',
        'We propose an efficient method for training deep neural networks with limited computational resources.',
        'This study introduces a blockchain-based system for secure and transparent supply chain management.',
        'We present advances in computer vision for autonomous vehicle navigation and obstacle detection.',
        'Our work demonstrates improved methods for detecting and preventing cybersecurity threats.',
      ];
      const medicine = [
        'We report clinical trial results for a new immunotherapy treatment showing improved cancer survival rates.',
        'This study evaluates the efficacy of mRNA vaccines against emerging viral variants.',
        'Our research identifies novel drug targets for treating autoimmune disorders.',
        'We present findings on the long-term effects of COVID-19 on cardiovascular health.',
        'This paper analyzes the effectiveness of telemedicine in improving patient outcomes.',
        'We investigate the role of inflammation in chronic disease progression and treatment.',
        'Our clinical study demonstrates improved outcomes with personalized medicine approaches.',
      ];
      const fields = [
        { abstracts: physics, field: 'physics' },
        { abstracts: biology, field: 'biology' },
        { abstracts: computerScience, field: 'computer_science' },
        { abstracts: medicine, field: 'medicine' },
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        const f = fields[i % 4];
        rows.push([randomChoice(f.abstracts), f.field]);
      }
      return rows;
    },
  },

  // ── Image Classification ───────────────────────────────────────────────────

  {
    id: 'shapes-classification',
    name: 'Shapes Classification 🔷',
    description: 'Classify geometric shapes (circles, squares, triangles). Perfect for learning image classification basics.',
    modelType: 'image_classification',
    tags: ['images', 'shapes', 'beginner-friendly'],
    difficulty: 'beginner',
    rows: 36, // 12 circles + 12 squares + 12 triangles
    columns: ['image', 'label'],
    realWorldUse: 'Same technique powers Google Photos, medical imaging, and autonomous vehicles.',
    icon: Image,
    iconColor: 'text-cyan-500',
    bundledImages: true,
    generateData: () => [], // Not used for image datasets
    generateImageData: () => {
      const dataset = generateImageClassification();
      return dataset.images;
    },
  },

  {
    id: 'colors-classification',
    name: 'Color Patterns 🎨',
    description: 'Classify images by dominant color (red, green, blue). Great for understanding how models see color.',
    modelType: 'image_classification',
    tags: ['images', 'colors', 'beginner-friendly'],
    difficulty: 'beginner',
    rows: 36, // 12 per color class
    columns: ['image', 'label'],
    realWorldUse: 'Color detection is used in quality control, fashion apps, and accessibility tools.',
    icon: Image,
    iconColor: 'text-rose-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateColorPatterns();
      return dataset.images;
    },
  },

  {
    id: 'digits-classification',
    name: 'Handwritten Digits 🔢',
    description: 'Classify handwritten digits 0-9. The classic MNIST-inspired dataset for beginners.',
    modelType: 'image_classification',
    tags: ['images', 'digits', 'classic'],
    difficulty: 'beginner',
    rows: 40, // 4 per digit
    columns: ['image', 'label'],
    realWorldUse: 'Digit recognition powers check processing, postal sorting, and form digitization.',
    icon: Image,
    iconColor: 'text-indigo-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateDigits();
      return dataset.images;
    },
  },

  {
    id: 'animals-classification',
    name: 'Animal Silhouettes 🐱',
    description: 'Classify animal silhouettes (cat, dog, bird). Learn shape-based recognition.',
    modelType: 'image_classification',
    tags: ['images', 'animals', 'shapes'],
    difficulty: 'intermediate',
    rows: 36, // 12 per animal
    columns: ['image', 'label'],
    realWorldUse: 'Animal detection is used in wildlife monitoring, pet apps, and smart cameras.',
    icon: Image,
    iconColor: 'text-amber-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateAnimalSilhouettes();
      return dataset.images;
    },
  },

  {
    id: 'fashion-items',
    name: 'Fashion Items 👕',
    description: 'Classify clothing items (shirt, pants, shoe, bag). Fashion-MNIST inspired dataset.',
    modelType: 'image_classification',
    tags: ['images', 'fashion', 'clothing'],
    difficulty: 'beginner',
    rows: 40, // 10 per item
    columns: ['image', 'label'],
    realWorldUse: 'Fashion recognition powers e-commerce search, virtual try-on, and inventory management.',
    icon: Image,
    iconColor: 'text-pink-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateFashionItems();
      return dataset.images;
    },
  },

  {
    id: 'vehicles-classification',
    name: 'Vehicle Types 🚗',
    description: 'Classify vehicle types (car, truck, motorcycle, bicycle). Learn transportation recognition.',
    modelType: 'image_classification',
    tags: ['images', 'vehicles', 'transportation'],
    difficulty: 'beginner',
    rows: 40, // 10 per vehicle
    columns: ['image', 'label'],
    realWorldUse: 'Vehicle detection is used in traffic monitoring, parking systems, and autonomous driving.',
    icon: Image,
    iconColor: 'text-blue-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateVehicles();
      return dataset.images;
    },
  },

  {
    id: 'flowers-classification',
    name: 'Flower Types 🌸',
    description: 'Classify flower types (rose, tulip, sunflower, daisy). Beautiful botanical classification.',
    modelType: 'image_classification',
    tags: ['images', 'flowers', 'nature'],
    difficulty: 'beginner',
    rows: 40, // 10 per flower
    columns: ['image', 'label'],
    realWorldUse: 'Plant identification apps use this to help gardeners and botanists identify species.',
    icon: Image,
    iconColor: 'text-rose-400',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateFlowers();
      return dataset.images;
    },
  },

  {
    id: 'plant-diseases',
    name: 'Plant Diseases 🍃',
    description: 'Classify plant leaf conditions (healthy, bacterial_spot, early_blight, late_blight). Learn agricultural AI.',
    modelType: 'image_classification',
    tags: ['images', 'plants', 'agriculture', 'disease', 'leaf'],
    difficulty: 'intermediate',
    rows: 40, // 10 per condition
    columns: ['image', 'label'],
    realWorldUse: 'Agricultural apps help farmers detect crop diseases early, saving billions in crop losses worldwide.',
    icon: Image,
    iconColor: 'text-green-600',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generatePlantDiseases();
      return dataset.images;
    },
  },

  {
    id: 'dog-breeds',
    name: 'Dog Breeds 🐕',
    description: 'Classify dog breeds (labrador, german_shepherd, bulldog, poodle). Popular pet recognition task.',
    modelType: 'image_classification',
    tags: ['images', 'dogs', 'pets', 'animals', 'breeds'],
    difficulty: 'intermediate',
    rows: 40, // 10 per breed
    columns: ['image', 'label'],
    realWorldUse: 'Pet apps and shelters use breed recognition to help match dogs with potential adopters.',
    icon: Image,
    iconColor: 'text-amber-600',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateDogBreeds();
      return dataset.images;
    },
  },

  {
    id: 'facial-expressions',
    name: 'Facial Expressions 😊',
    description: 'Classify emotions (happy, sad, angry, surprised). Learn emotion recognition AI.',
    modelType: 'image_classification',
    tags: ['images', 'faces', 'emotions', 'expressions'],
    difficulty: 'advanced',
    rows: 40, // 10 per expression
    columns: ['image', 'label'],
    realWorldUse: 'Emotion AI is used in customer service, mental health apps, and accessibility tools.',
    icon: Image,
    iconColor: 'text-purple-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateFacialExpressions();
      return dataset.images;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV helper
// ─────────────────────────────────────────────────────────────────────────────

/** Converts headers + rows into a CSV string with quoted values */
function toCSV(headers: string[], rows: string[][]): string {
  return [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface DatasetTemplatesPanelProps {
  /** Only templates matching this model type are shown */
  modelType: ModelType;
  /** Optional project description for smart template matching */
  projectDescription?: string;
  /** Called with the generated CSV text, filename, and template metadata */
  onLoadDataset: (csvText: string, filename: string, template: DatasetTemplate) => void;
  /** Called with image dataset for image classification templates */
  onLoadImageDataset?: (images: ImageDatasetRow[], template: DatasetTemplate) => void;
}

/**
 * Calculate relevance score between a template and project description
 * Higher score = more relevant
 */
function calculateRelevanceScore(template: DatasetTemplate, projectDescription: string): number {
  if (!projectDescription) return 0;
  
  const desc = projectDescription.toLowerCase();
  let score = 0;
  
  // Keywords that indicate specific template matches
  const keywordMatches: Record<string, string[]> = {
    'plant-diseases': ['plant', 'disease', 'leaf', 'crop', 'agriculture', 'farming', 'blight', 'bacterial', 'tomato', 'potato'],
    'dog-breeds': ['dog', 'breed', 'puppy', 'canine', 'pet', 'labrador', 'shepherd', 'bulldog', 'poodle'],
    'flowers-classification': ['flower', 'floral', 'botanical', 'rose', 'tulip', 'sunflower', 'daisy', 'petal', 'bloom'],
    'digits-classification': ['digit', 'number', 'handwritten', 'mnist', 'numeral', 'handwriting'],
    'shapes-classification': ['shape', 'geometric', 'circle', 'square', 'triangle'],
    'colors-classification': ['color', 'colour', 'rgb', 'hue', 'pattern'],
    'animals-classification': ['animal', 'cat', 'bird', 'wildlife', 'silhouette'],
    'fashion-items': ['fashion', 'clothing', 'shirt', 'pants', 'shoe', 'bag', 'apparel', 'garment'],
    'vehicles-classification': ['vehicle', 'car', 'truck', 'motorcycle', 'bicycle', 'traffic', 'transport'],
    'facial-expressions': ['face', 'facial', 'emotion', 'expression', 'happy', 'sad', 'angry', 'feeling'],
    // Text classification
    'sentiment': ['review', 'sentiment', 'opinion', 'positive', 'negative', 'feedback'],
    'spam': ['spam', 'email', 'message', 'filter', 'inbox'],
    'news-topics': ['news', 'article', 'headline', 'topic', 'category'],
    'toxic-comments': ['toxic', 'comment', 'moderation', 'harmful', 'offensive'],
    'language-detection': ['language', 'detect', 'multilingual', 'translation'],
    'fake-news': ['fake', 'misinformation', 'fact', 'check', 'real'],
    // Classification
    'iris': ['iris', 'flower', 'petal', 'sepal', 'species'],
    'titanic': ['titanic', 'survival', 'passenger', 'ship'],
    'heart-disease': ['heart', 'disease', 'health', 'medical', 'cardiac', 'patient'],
    'customer-churn': ['churn', 'customer', 'subscription', 'retention', 'cancel'],
    'diabetes': ['diabetes', 'glucose', 'blood', 'sugar', 'medical'],
    // Regression
    'house-prices': ['house', 'price', 'real estate', 'property', 'home', 'housing'],
    'salary': ['salary', 'wage', 'pay', 'income', 'compensation', 'hr'],
    'weather-temperature': ['weather', 'temperature', 'forecast', 'climate'],
    'song-popularity': ['song', 'music', 'spotify', 'popularity', 'audio'],
    'car-prices': ['car', 'vehicle', 'price', 'used', 'automotive'],
    'sales-forecasting': ['sales', 'forecast', 'retail', 'inventory', 'demand'],
    'stock-indicators': ['stock', 'market', 'trading', 'finance', 'investment'],
  };
  
  const templateKeywords = keywordMatches[template.id] || [];
  
  // Check for keyword matches
  for (const keyword of templateKeywords) {
    if (desc.includes(keyword)) {
      score += 10; // Strong match for each keyword
    }
  }
  
  // Also check template name and tags
  if (desc.includes(template.name.toLowerCase().replace(/[^\w\s]/g, ''))) {
    score += 15;
  }
  
  for (const tag of template.tags) {
    if (desc.includes(tag.toLowerCase())) {
      score += 5;
    }
  }
  
  // Check description overlap
  const templateDescWords = template.description.toLowerCase().split(/\s+/);
  for (const word of templateDescWords) {
    if (word.length > 4 && desc.includes(word)) {
      score += 2;
    }
  }
  
  return score;
}

export function DatasetTemplatesPanel({ modelType, projectDescription, onLoadDataset, onLoadImageDataset }: DatasetTemplatesPanelProps) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // Controls which template's info panel is expanded
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Filter by model type first, then by search query, then sort by relevance
  const filtered = TEMPLATES.filter(t =>
    t.modelType === modelType &&
    (search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))),
  ).map(t => ({
    ...t,
    relevanceScore: calculateRelevanceScore(t, projectDescription || ''),
  })).sort((a, b) => {
    // Sort by relevance score (descending), then by difficulty (beginner first)
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  const difficultyColor: Record<DatasetTemplate['difficulty'], string> = {
    beginner:     'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    advanced:     'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  /** Generate data, convert to CSV, and hand off to the parent page */
  const handleLoad = async (template: DatasetTemplate) => {
    setLoadingId(template.id);
    await new Promise(r => setTimeout(r, 400)); // brief delay for UX feedback

    try {
      // Handle image classification templates with bundled images
      if (template.modelType === 'image_classification' && template.bundledImages && template.generateImageData) {
        const images = template.generateImageData();
        
        if (onLoadImageDataset) {
          onLoadImageDataset(images, template);
          toast.success(`✅ Loaded "${template.name}" — ${images.length} images ready!`);
        } else {
          // Fallback: convert to CSV format for compatibility
          const csvRows = images.map(img => [img.filename, img.label]);
          const csv = toCSV(['filename', 'label'], csvRows);
          onLoadDataset(csv, `${template.id}-sample.csv`, template);
          toast.success(`✅ Loaded "${template.name}" — ${images.length} images ready!`);
        }
        
        setLoadingId(null);
        return;
      }

      // Handle tabular datasets
      const rows = template.generateData();
      const csv = toCSV(template.columns, rows);
      onLoadDataset(csv, `${template.id}-sample.csv`, template);

      toast.success(`✅ Loaded "${template.name}" — ${rows.length} rows ready!`);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template data. Please try again.');
    }
    
    setLoadingId(null);
  };

  /** Check if template can be loaded (has data or bundled images) */
  const canLoadTemplate = (template: DatasetTemplate): boolean => {
    if (template.bundledImages) return true;
    return template.rows > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Dataset Templates
        </CardTitle>
        <CardDescription>
          One-click sample datasets — no upload needed. Used by real companies.
        </CardDescription>

        {/* Search — only rendered when there are templates to filter */}
        {filtered.length > 0 && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">

        {/* Empty state */}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No templates found for this project type.
          </p>
        )}

        {filtered.map((template, index) => {
          const Icon = template.icon;
          const isLoading = loadingId === template.id;
          const isPreview = previewId === template.id;
          const canLoad = canLoadTemplate(template);
          // Show "Best Match" badge for first template if it has high relevance
          const isBestMatch = index === 0 && template.relevanceScore >= 10 && projectDescription;

          return (
            <div
              key={template.id}
              className={`rounded-lg border p-4 space-y-3 hover:border-primary transition-colors ${isBestMatch ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''}`}
            >
              {/* ── Header: icon + name + difficulty badge + description ── */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-5 w-5 ${template.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{template.name}</p>
                    {isBestMatch && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary text-primary-foreground">
                        ✨ Best Match
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[template.difficulty]}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                </div>
                {/* Row/image count badge with bundled indicator */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {template.bundledImages ? (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {template.rows} images
                      </Badge>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                        <Package className="h-3 w-3 mr-1" />
                        Bundled
                      </Badge>
                    </>
                  ) : template.rows > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {template.rows} rows
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">
                      Upload Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* ── Tags ── */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* ── Expandable info panel: real-world use + column names ── */}
              {isPreview && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">🌍 Real-World Use</p>
                  <p className="text-xs text-muted-foreground">{template.realWorldUse}</p>
                  {template.columns.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-2">📋 Columns</p>
                      <div className="flex flex-wrap gap-1">
                        {template.columns.map(col => (
                          <code key={col} className="text-xs bg-background border px-1.5 py-0.5 rounded">
                            {col}
                          </code>
                        ))}
                      </div>
                    </>
                  )}
                  {template.bundledImages && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      ✓ Works offline — images are bundled with the app
                    </p>
                  )}
                </div>
              )}

              {/* ── Actions: load dataset + toggle info panel ── */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleLoad(template)}
                  disabled={isLoading || !canLoad}
                >
                  {isLoading
                    ? <><span className="animate-spin mr-2">⏳</span>Loading...</>
                    : <><Download className="h-4 w-4 mr-2" />Use This Dataset</>
                  }
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewId(isPreview ? null : template.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isPreview ? 'Hide' : 'Info'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
