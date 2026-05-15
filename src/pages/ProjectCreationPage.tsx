import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AppLayout } from '@/components/layouts/AppLayout';
import { DotGridBackground } from '@/components/DotGridBackground';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, BookOpen, AlertCircle, FileText, Database, GraduationCap, Zap, Bug, Share2, ArrowUp, Image, MessageSquare, TrendingUp, Star, ShoppingBag, Music, Leaf, Heart, Brain, Dog, Car, Smile, Mail, ThumbsUp, DollarSign, CloudRain, Users, Fingerprint, Languages, Mic, FileImage, Newspaper, Globe, ExternalLink, ChevronDown } from 'lucide-react';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { DatasetConnectionWizard } from '@/components/DatasetConnectionWizard';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';
import { projectService, userTriesService } from '@/services/supabase';
import { activityTrackingService } from '@/services/activityTrackingService';
import { sessionUtils } from '@/utils/helpers';
import { toast } from 'sonner';
import type { ModelType } from '@/types/types';
import type { LucideIcon } from 'lucide-react';

import type { LearningMomentType } from '@/utils/learningMomentContent';

const workflowSteps: Array<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isLearnStep: boolean;
  momentType?: LearningMomentType;
}> = [
  {
    id: 'describe',
    title: 'Describe',
    description: 'Define your ML project goals',
    icon: FileText,
    isLearnStep: false
  },
  {
    id: 'data',
    title: 'Input Data',
    description: 'Upload or select training data',
    icon: Database,
    isLearnStep: false
  },
  {
    id: 'learn-data',
    title: 'Learn: Data',
    description: 'Understand data quality & features',
    icon: GraduationCap,
    isLearnStep: true,
    momentType: 'data'
  },
  {
    id: 'train',
    title: 'Train Model',
    description: 'Train your AI model',
    icon: Zap,
    isLearnStep: false
  },
  {
    id: 'learn-model',
    title: 'Learn: Model',
    description: 'Understand how your model works',
    icon: GraduationCap,
    isLearnStep: true,
    momentType: 'model'
  },
  {
    id: 'debug',
    title: 'Test & Debug',
    description: 'Evaluate and refine',
    icon: Bug,
    isLearnStep: false
  },
  {
    id: 'deploy',
    title: 'Deploy',
    description: 'Share your model',
    icon: Share2,
    isLearnStep: false
  },
  {
    id: 'learn-next',
    title: 'Learn: Next Steps',
    description: 'Explore advanced ML concepts',
    icon: GraduationCap,
    isLearnStep: true,
    momentType: 'next_steps'
  }
];

interface ExampleProject {
  icon: LucideIcon;
  text: string;
  source?: string;
  datasetUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ExampleCategory {
  title: string;
  description: string;
  examples: ExampleProject[];
}

const exampleCategories: ExampleCategory[] = [
  {
    title: 'Image Classification',
    description: 'Train models to recognize and categorize images',
    examples: [
      {
        icon: Image,
        text: 'Train an AI to classify different types of flowers from photos',
        source: 'Inspired by Oxford Flowers dataset',
        datasetUrl: 'https://www.robots.ox.ac.uk/~vgg/data/flowers/',
        difficulty: 'beginner'
      },
      {
        icon: Leaf,
        text: 'Build a model to identify plant diseases from leaf images',
        source: 'Based on PlantVillage dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/emmarex/plantdisease',
        difficulty: 'intermediate'
      },
      {
        icon: Star,
        text: 'Create an AI to recognize handwritten digits',
        source: 'Classic MNIST dataset',
        datasetUrl: 'https://huggingface.co/datasets/mnist',
        difficulty: 'beginner'
      },
      {
        icon: Dog,
        text: 'Train a model to identify different dog breeds from photos',
        source: 'Stanford Dogs dataset',
        datasetUrl: 'http://vision.stanford.edu/aditya86/ImageNetDogs/',
        difficulty: 'intermediate'
      },
      {
        icon: Car,
        text: 'Build an AI to classify vehicle types from traffic camera images',
        source: 'Similar to CIFAR-10 vehicles',
        datasetUrl: 'https://huggingface.co/datasets/cifar10',
        difficulty: 'beginner'
      },
      {
        icon: Fingerprint,
        text: 'Create a model to recognize facial expressions and emotions',
        source: 'FER2013 emotion recognition',
        datasetUrl: 'https://www.kaggle.com/datasets/msambare/fer2013',
        difficulty: 'advanced'
      },
      {
        icon: FileImage,
        text: 'Train an AI to classify fashion items like shirts, shoes, and bags',
        source: 'Fashion-MNIST dataset',
        datasetUrl: 'https://huggingface.co/datasets/fashion_mnist',
        difficulty: 'beginner'
      }
    ]
  },
  {
    title: 'Text Classification',
    description: 'Analyze and categorize text data',
    examples: [
      {
        icon: MessageSquare,
        text: 'Build a model to detect spam messages in text',
        source: 'SMS Spam Collection dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset',
        difficulty: 'beginner'
      },
      {
        icon: Heart,
        text: 'Classify customer reviews as positive or negative',
        source: 'IMDb movie reviews dataset',
        datasetUrl: 'https://huggingface.co/datasets/imdb',
        difficulty: 'beginner'
      },
      {
        icon: Brain,
        text: 'Train an AI to categorize news articles by topic',
        source: 'AG News dataset',
        datasetUrl: 'https://huggingface.co/datasets/ag_news',
        difficulty: 'intermediate'
      },
      {
        icon: Smile,
        text: 'Create a sentiment analyzer for social media posts',
        source: 'Twitter sentiment analysis',
        datasetUrl: 'https://huggingface.co/datasets/tweet_eval',
        difficulty: 'intermediate'
      },
      {
        icon: Mail,
        text: 'Build an email classifier to sort messages into categories',
        source: 'Enron email dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/wcukierski/enron-email-dataset',
        difficulty: 'advanced'
      },
      {
        icon: Languages,
        text: 'Train a model to detect the language of a given text',
        source: 'WiLI language identification',
        datasetUrl: 'https://huggingface.co/datasets/wili_2018',
        difficulty: 'intermediate'
      },
      {
        icon: Newspaper,
        text: 'Create an AI to classify scientific paper abstracts by research field',
        source: 'arXiv dataset categories',
        datasetUrl: 'https://www.kaggle.com/datasets/Cornell-University/arxiv',
        difficulty: 'advanced'
      }
    ]
  },
  {
    title: 'Regression',
    description: 'Predict numerical values based on input features',
    examples: [
      {
        icon: TrendingUp,
        text: 'Create a system to predict house prices based on features',
        source: 'Boston Housing dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/vikrishnan/boston-house-prices',
        difficulty: 'beginner'
      },
      {
        icon: ShoppingBag,
        text: 'Build a model to forecast product sales based on historical data',
        source: 'Retail sales forecasting',
        datasetUrl: 'https://www.kaggle.com/competitions/store-sales-time-series-forecasting',
        difficulty: 'intermediate'
      },
      {
        icon: Music,
        text: 'Predict song popularity based on audio features',
        source: 'Spotify dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/zaheenhamidani/ultimate-spotify-tracks-db',
        difficulty: 'intermediate'
      },
      {
        icon: DollarSign,
        text: 'Train an AI to estimate stock prices from market indicators',
        source: 'Financial time series data',
        datasetUrl: 'https://www.kaggle.com/datasets/borismarjanovic/price-volume-data-for-all-us-stocks-etfs',
        difficulty: 'advanced'
      },
      {
        icon: CloudRain,
        text: 'Create a model to predict temperature based on weather patterns',
        source: 'Weather prediction datasets',
        datasetUrl: 'https://www.kaggle.com/datasets/muthuj7/weather-dataset',
        difficulty: 'beginner'
      },
      {
        icon: Heart,
        text: 'Build a model to predict patient health outcomes from medical data',
        source: 'UCI Heart Disease dataset',
        datasetUrl: 'https://archive.ics.uci.edu/dataset/45/heart+disease',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    title: 'Popular Hugging Face Examples',
    description: 'Inspired by well-known datasets and models from the ML community',
    examples: [
      {
        icon: Globe,
        text: 'Train a model to classify toxic comments and hate speech',
        source: 'Jigsaw Toxic Comment dataset',
        datasetUrl: 'https://www.kaggle.com/competitions/jigsaw-toxic-comment-classification-challenge',
        difficulty: 'advanced'
      },
      {
        icon: Mic,
        text: 'Build an AI to classify audio recordings by spoken command',
        source: 'Speech Commands dataset',
        datasetUrl: 'https://huggingface.co/datasets/speech_commands',
        difficulty: 'intermediate'
      },
      {
        icon: Users,
        text: 'Create a recommendation system for movies based on user preferences',
        source: 'MovieLens dataset',
        datasetUrl: 'https://grouplens.org/datasets/movielens/',
        difficulty: 'advanced'
      },
      {
        icon: ThumbsUp,
        text: 'Train a model to predict customer churn in subscription services',
        source: 'Telco Customer Churn',
        datasetUrl: 'https://www.kaggle.com/datasets/blastchar/telco-customer-churn',
        difficulty: 'intermediate'
      },
      {
        icon: Brain,
        text: 'Build an AI to detect fake news articles',
        source: 'LIAR fake news dataset',
        datasetUrl: 'https://huggingface.co/datasets/liar',
        difficulty: 'advanced'
      },
      {
        icon: Star,
        text: 'Create a model to classify product reviews by star rating',
        source: 'Amazon Reviews dataset',
        datasetUrl: 'https://huggingface.co/datasets/amazon_polarity',
        difficulty: 'beginner'
      }
    ]
  },
  {
    title: 'ModelScope & TensorFlow Hub Examples',
    description: 'Real-world projects from leading ML platforms',
    examples: [
      {
        icon: Image,
        text: 'Train an AI to detect objects in images like people, cars, and animals',
        source: 'TensorFlow Hub - COCO dataset',
        datasetUrl: 'https://www.tensorflow.org/datasets/catalog/coco',
        difficulty: 'intermediate'
      },
      {
        icon: Leaf,
        text: 'Build a model to classify crop types from satellite imagery',
        source: 'ModelScope - EuroSAT dataset',
        datasetUrl: 'https://github.com/phelber/EuroSAT',
        difficulty: 'advanced'
      },
      {
        icon: MessageSquare,
        text: 'Create an AI to answer questions based on text passages',
        source: 'TensorFlow Hub - SQuAD dataset',
        datasetUrl: 'https://huggingface.co/datasets/squad',
        difficulty: 'advanced'
      },
      {
        icon: Image,
        text: 'Train a model to colorize black and white photos',
        source: 'ModelScope - Image colorization',
        datasetUrl: 'https://www.kaggle.com/datasets/shravankumar9892/image-colorization',
        difficulty: 'advanced'
      },
      {
        icon: Brain,
        text: 'Build an AI to classify medical images for disease detection',
        source: 'TensorFlow Hub - ChestX-ray8',
        datasetUrl: 'https://www.kaggle.com/datasets/nih-chest-xrays/data',
        difficulty: 'advanced'
      },
      {
        icon: Mic,
        text: 'Create a model to transcribe spoken words into text',
        source: 'ModelScope - LibriSpeech dataset',
        datasetUrl: 'https://www.openslr.org/12',
        difficulty: 'advanced'
      }
    ]
  },
  {
    title: 'Kaggle Competition Classics',
    description: 'Popular projects from Kaggle competitions and datasets',
    examples: [
      {
        icon: Heart,
        text: 'Predict survival on the Titanic based on passenger information',
        source: 'Kaggle - Titanic dataset',
        datasetUrl: 'https://www.kaggle.com/competitions/titanic',
        difficulty: 'beginner'
      },
      {
        icon: Leaf,
        text: 'Train an AI to classify iris flowers into three species',
        source: 'Kaggle - Iris dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/uciml/iris',
        difficulty: 'beginner'
      },
      {
        icon: Car,
        text: 'Build a model to predict used car prices from features',
        source: 'Kaggle - Vehicle dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho',
        difficulty: 'intermediate'
      },
      {
        icon: Brain,
        text: 'Create an AI to detect credit card fraud from transaction patterns',
        source: 'Kaggle - Credit Card Fraud',
        datasetUrl: 'https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud',
        difficulty: 'advanced'
      },
      {
        icon: Dog,
        text: 'Train a model to classify cat and dog images',
        source: 'Kaggle - Dogs vs Cats',
        datasetUrl: 'https://www.kaggle.com/competitions/dogs-vs-cats',
        difficulty: 'beginner'
      },
      {
        icon: TrendingUp,
        text: 'Build an AI to predict diamond prices from characteristics',
        source: 'Kaggle - Diamonds dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/shivam2503/diamonds',
        difficulty: 'beginner'
      },
      {
        icon: Heart,
        text: 'Create a model to predict diabetes from patient health metrics',
        source: 'Kaggle - Pima Indians Diabetes',
        datasetUrl: 'https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database',
        difficulty: 'intermediate'
      },
      {
        icon: Smile,
        text: 'Train an AI to classify facial expressions into emotions',
        source: 'Kaggle - FER2013 dataset',
        datasetUrl: 'https://www.kaggle.com/datasets/msambare/fer2013',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    title: 'GitHub Open Source Projects',
    description: 'Community-driven ML projects from GitHub repositories',
    examples: [
      {
        icon: Image,
        text: 'Build a model to generate realistic human faces using GANs',
        source: 'GitHub - CelebA dataset',
        datasetUrl: 'https://github.com/tkarras/progressive_growing_of_gans',
        difficulty: 'advanced'
      },
      {
        icon: MessageSquare,
        text: 'Train an AI chatbot to have conversations on specific topics',
        source: 'GitHub - Cornell Movie Dialogs',
        datasetUrl: 'https://github.com/suriyadeepan/datasets/tree/master/seq2seq/cornell_movie_corpus',
        difficulty: 'advanced'
      },
      {
        icon: Music,
        text: 'Create a model to classify music genres from audio features',
        source: 'GitHub - GTZAN dataset',
        datasetUrl: 'https://github.com/mdeff/fma',
        difficulty: 'intermediate'
      },
      {
        icon: Brain,
        text: 'Build an AI to generate image captions automatically',
        source: 'GitHub - Flickr8k dataset',
        datasetUrl: 'https://github.com/jbrownlee/Datasets/releases/tag/Flickr8k',
        difficulty: 'advanced'
      },
      {
        icon: FileImage,
        text: 'Train a model to remove backgrounds from product images',
        source: 'GitHub - U2-Net background removal',
        datasetUrl: 'https://github.com/xuebinqin/U-2-Net',
        difficulty: 'advanced'
      },
      {
        icon: Languages,
        text: 'Create an AI to translate text between different languages',
        source: 'GitHub - WMT translation datasets',
        datasetUrl: 'https://github.com/pytorch/fairseq/tree/main/examples/translation',
        difficulty: 'advanced'
      },
      {
        icon: Star,
        text: 'Build a model to detect and classify traffic signs',
        source: 'GitHub - GTSRB dataset',
        datasetUrl: 'https://github.com/mohamedameen93/German-Traffic-Sign-Classification-Using-TensorFlow',
        difficulty: 'intermediate'
      },
      {
        icon: Fingerprint,
        text: 'Train an AI for face recognition and verification',
        source: 'GitHub - LFW dataset',
        datasetUrl: 'https://github.com/davidsandberg/facenet',
        difficulty: 'advanced'
      }
    ]
  }
];

export default function ProjectCreationPage() {
  const [description, setDescription] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{ modelType: ModelType; title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [triesRemaining, setTriesRemaining] = useState<number | null>(null);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<{
    url: string;
    name: string;
    source: string;
  } | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const formCardRef = useRef<HTMLDivElement>(null);
  const { elementRef: heroRef, shouldAnimate } = useEntranceAnimation({
    threshold: 0.1,
    sessionKey: 'hero-branding-animation'
  });
  
  // Onboarding
  const {
    showWelcome,
    activeTour,
    closeWelcome,
    startWelcomeTour,
    completeTour,
    skipTour,
  } = useOnboarding();

  useEffect(() => {
    checkTriesRemaining();
  }, [user]);

  const checkTriesRemaining = async () => {
    if (user) {
      setTriesRemaining(null);
      return;
    }
    
    const sessionId = sessionUtils.getSessionId();
    const tries = await userTriesService.getBySessionId(sessionId);
    
    if (tries) {
      setTriesRemaining(10 - tries.tries_count);
    } else {
      setTriesRemaining(10);
    }
  };

  const copyExampleToInput = (exampleText: string) => {
    setDescription(exampleText);
    
    // Scroll to the form card with smooth animation
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
    
    // Show a more prominent toast with action hint
    toast.success('Example loaded! Click "Analyze Project" to continue', {
      duration: 4000,
      icon: <ArrowUp className="h-4 w-4" />,
    });
  };

  const parseDescription = (desc: string): { modelType: ModelType; title: string } | null => {
    const lowerDesc = desc.toLowerCase();
    
    // Check for text classification keywords FIRST (before generic "classify")
    // This ensures "classify toxic comments" is detected as text, not image
    if (lowerDesc.includes('text') || 
        lowerDesc.includes('sentiment') || 
        lowerDesc.includes('spam') ||
        lowerDesc.includes('comment') ||
        lowerDesc.includes('review') ||
        lowerDesc.includes('email') ||
        lowerDesc.includes('message') ||
        lowerDesc.includes('toxic') ||
        lowerDesc.includes('hate speech') ||
        lowerDesc.includes('news') ||
        lowerDesc.includes('article') ||
        lowerDesc.includes('tweet') ||
        lowerDesc.includes('post')) {
      return {
        modelType: 'text_classification',
        title: desc.substring(0, 100)
      };
    }
    
    // Check for image classification keywords
    if (lowerDesc.includes('image') || 
        lowerDesc.includes('photo') || 
        lowerDesc.includes('picture') ||
        lowerDesc.includes('face') ||
        lowerDesc.includes('facial') ||
        lowerDesc.includes('emotion') ||
        lowerDesc.includes('expression') ||
        lowerDesc.includes('object') ||
        lowerDesc.includes('animal') ||
        lowerDesc.includes('flower') ||
        lowerDesc.includes('plant') ||
        lowerDesc.includes('leaf') ||
        lowerDesc.includes('dog') ||
        lowerDesc.includes('breed') ||
        lowerDesc.includes('vehicle') ||
        lowerDesc.includes('fashion') ||
        lowerDesc.includes('digit') ||
        lowerDesc.includes('shape')) {
      return {
        modelType: 'image_classification',
        title: desc.substring(0, 100)
      };
    }
    
    // Check for regression keywords
    if (lowerDesc.includes('predict') || 
        lowerDesc.includes('price') || 
        lowerDesc.includes('forecast') || 
        lowerDesc.includes('regression') ||
        lowerDesc.includes('salary') ||
        lowerDesc.includes('cost') ||
        lowerDesc.includes('value') ||
        lowerDesc.includes('estimate')) {
      return {
        modelType: 'regression',
        title: desc.substring(0, 100)
      };
    }
    
    // Check for generic classification (tabular data)
    if (lowerDesc.includes('classify') ||
        lowerDesc.includes('classification') ||
        lowerDesc.includes('categorize') ||
        lowerDesc.includes('detect') ||
        lowerDesc.includes('identify')) {
      return {
        modelType: 'classification',
        title: desc.substring(0, 100)
      };
    }
    
    // Default to classification for ambiguous cases
    return {
      modelType: 'classification',
      title: desc.substring(0, 100)
    };
  };

  const handleAnalyze = () => {
    if (!description.trim()) {
      toast.error('Please describe your project');
      return;
    }
    
    const info = parseDescription(description);
    setParsedInfo(info);
  };

  const handleStartProject = async (isGuidedTour: boolean) => {
    if (!parsedInfo) return;
    
    if (!user && triesRemaining !== null && triesRemaining <= 0) {
      toast.error('You have reached the limit of 10 tries. Please register to continue.');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      const sessionId = sessionUtils.getSessionId();
      
      if (!user) {
        await userTriesService.incrementTries(sessionId);
      }
      
      const project = await projectService.create({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        title: parsedInfo.title,
        description,
        model_type: parsedInfo.modelType,
        status: 'data_collection',
        is_guided_tour: isGuidedTour
      });
      
      // Track project creation for registered users
      if (user) {
        await activityTrackingService.trackProjectCreation(
          user.id,
          project.id,
          parsedInfo.modelType,
          description
        );
      }
      
      navigate(`/project/${project.id}/data-collection`);
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-8">
          <div 
            ref={heroRef}
            className={`flex justify-center ${shouldAnimate ? 'animate-hero-entrance' : ''}`}
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translateZ(0)' // Force GPU acceleration
            }}
          >
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bavnbc0rb9j4.png" 
              alt="ModelMentor - An AI Lab for Conceptual Learning" 
              className="h-16 w-auto max-w-full md:h-20 lg:h-24"
            />
          </div>

          <div className="relative py-12 -mx-4 px-4 overflow-hidden">
            <DotGridBackground />
            <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Learn Machine Learning by Actually Doing It
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Not videos. Not slides. You build, train, and test real ML models — step by step, with guidance at every turn. Understand the why, not just the how.
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="relative py-8 -mx-4 px-4 overflow-hidden">
            <DotGridBackground />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center space-y-2 p-4">
                <span className="text-3xl">🎯</span>
                <h3 className="font-semibold text-lg">Hands-On Learning</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Pick a project, load data, train a model, and see results — all guided, all interactive
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4">
                <span className="text-3xl">💡</span>
                <h3 className="font-semibold text-lg">Understand the Concepts</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Learn what overfitting means by seeing it happen. Quizzes, matching games, and real feedback
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4">
                <span className="text-3xl">🚀</span>
                <h3 className="font-semibold text-lg">No Code Required</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Designed for students and beginners. Just describe what you want to build and follow the steps
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              Start Free — No Signup
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>

          {!user && triesRemaining !== null && (
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {triesRemaining} {triesRemaining === 1 ? 'try' : 'tries'} remaining. 
                {triesRemaining <= 3 && ' Register to get unlimited access!'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Workflow Visualizer */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-8 pb-8">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={0} />
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          <Card ref={formCardRef}>
            <CardHeader>
              <CardTitle>Step 1: Describe Your Project</CardTitle>
              <CardDescription>
                Tell us what you want to build, or <button 
                  type="button"
                  onClick={() => {
                    const examplesSection = document.getElementById('example-projects');
                    examplesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  browse example projects below <ChevronDown className="h-3 w-3" />
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="I want to train an AI to..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={`resize-none transition-all ${description ? 'ring-2 ring-primary/50' : ''}`}
                data-tour="project-title"
              />
              
              <Button onClick={handleAnalyze} className="w-full" size="lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Analyze Project
              </Button>
            </CardContent>
          </Card>

          {parsedInfo && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Project Analysis</CardTitle>
                <CardDescription>We've analyzed your project description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div data-tour="model-type">
                    <p className="text-sm text-muted-foreground mb-2">Detected Model Type</p>
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {parsedInfo.modelType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div data-tour="project-description">
                    <p className="text-sm text-muted-foreground mb-2">Your Journey</p>
                    <p className="text-sm">
                      {parsedInfo.modelType === 'image_classification' && 
                        'You will collect images, train a classification model, and test its accuracy on new images.'}
                      {parsedInfo.modelType === 'text_classification' && 
                        'You will collect text samples, train a classification model, and evaluate its performance on new text.'}
                      {parsedInfo.modelType === 'regression' && 
                        'You will collect numerical data, train a regression model, and test its predictions on new data points.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => handleStartProject(false)} 
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                    data-tour="create-button"
                  >
                    Start with My Data
                  </Button>
                  <Button 
                    onClick={() => handleStartProject(true)} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    data-tour="create-project-button"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start Guided Tour
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Example Projects - Grouped by Category */}
          <div id="example-projects" className="space-y-12 scroll-mt-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Example Projects</h2>
              <p className="text-muted-foreground">
                Click any project to use it as your starting point
              </p>
            </div>

            {exampleCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-6">
                {/* Category Header */}
                <div className="space-y-1">
                  <h3 className="text-xl font-medium">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>

                {/* Category Examples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.examples.map((example, exampleIndex) => {
                    const Icon = example.icon;
                    
                    const getDifficultyColor = (difficulty: string) => {
                      switch (difficulty) {
                        case 'beginner':
                          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                        case 'intermediate':
                          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                        case 'advanced':
                          return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                        default:
                          return 'bg-muted text-muted-foreground';
                      }
                    };
                    
                    return (
                      <div
                        key={exampleIndex}
                        onClick={() => copyExampleToInput(example.text)}
                        className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-background"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            copyExampleToInput(example.text);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <p className="text-sm leading-relaxed flex-1">{example.text}</p>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs capitalize flex-shrink-0 ${getDifficultyColor(example.difficulty)}`}
                            >
                              {example.difficulty}
                            </Badge>
                          </div>
                          {example.source && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-muted-foreground italic">
                                {example.source}
                              </p>
                              {example.datasetUrl && (
                                <>
                                  <a
                                    href={example.datasetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Dataset
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDataset({
                                        url: example.datasetUrl!,
                                        name: example.text,
                                        source: example.source!
                                      });
                                      setWizardOpen(true);
                                    }}
                                  >
                                    <Database className="h-3 w-3 mr-1" />
                                    Connection Guide
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 self-center">
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                            <ArrowUp className="h-3 w-3" />
                            Use
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Connection Wizard */}
      {selectedDataset && (
        <DatasetConnectionWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          datasetUrl={selectedDataset.url}
          datasetName={selectedDataset.name}
          source={selectedDataset.source}
        />
      )}

      {/* Onboarding */}
      <WelcomeModal
        open={showWelcome}
        onClose={closeWelcome}
        onStartTour={startWelcomeTour}
        userName={user?.email?.split('@')[0]}
      />

      {activeTour && (
        <InteractiveTour
          steps={activeTour.steps}
          isActive={true}
          onComplete={completeTour}
          onSkip={skipTour}
          tourId={activeTour.id}
        />
      )}
    </AppLayout>
  );
}
