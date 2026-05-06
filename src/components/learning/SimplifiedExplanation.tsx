import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Info, Sparkles } from 'lucide-react';

interface SimplifiedExplanationProps {
  term: string;
  explanation: string;
  example?: string;
  variant?: 'default' | 'tip' | 'fun';
}

export function SimplifiedExplanation({ 
  term, 
  explanation, 
  example,
  variant = 'default' 
}: SimplifiedExplanationProps) {
  const icons = {
    default: Info,
    tip: Lightbulb,
    fun: Sparkles
  };

  const Icon = icons[variant];

  const colors = {
    default: 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30',
    tip: 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30',
    fun: 'border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30'
  };

  const iconColors = {
    default: 'text-blue-600 dark:text-blue-400',
    tip: 'text-yellow-600 dark:text-yellow-400',
    fun: 'text-purple-600 dark:text-purple-400'
  };

  return (
    <Alert className={colors[variant]}>
      <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
      <AlertDescription>
        <p className="font-semibold mb-1">{term}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {explanation}
        </p>
        {example && (
          <div className="mt-2 p-2 rounded bg-background/50 border">
            <p className="text-xs font-semibold mb-1">Example:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {example}
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Pre-defined explanations for common ML terms
export const mlExplanations = {
  accuracy: {
    term: "What is Accuracy? 🎯",
    explanation: "Accuracy tells you how often your AI gets the right answer. Think of it like a test score - if your AI gets 9 out of 10 questions right, that's 90% accuracy!",
    example: "If your AI tries to identify 100 cats and correctly identifies 95 of them, your accuracy is 95%."
  },
  loss: {
    term: "What is Loss? 📉",
    explanation: "Loss measures how wrong your AI's guesses are. Lower loss = better! It's like counting mistakes - fewer mistakes means your AI is learning well.",
    example: "When training starts, loss might be high (lots of mistakes). As training continues, loss should go down (fewer mistakes)."
  },
  epoch: {
    term: "What is an Epoch? 🔄",
    explanation: "An epoch is one complete pass through all your training data. It's like reading a textbook once - the more times you read it (more epochs), the better you understand it!",
    example: "If you have 100 examples and train for 10 epochs, your AI will study all 100 examples 10 times."
  },
  learningRate: {
    term: "What is Learning Rate? 🎚️",
    explanation: "Learning rate controls how fast your AI learns. Too fast and it might miss important details. Too slow and it takes forever to learn!",
    example: "Think of it like walking speed - too fast and you might trip, too slow and you'll never reach your destination."
  },
  overfitting: {
    term: "What is Overfitting? 🤔",
    explanation: "Overfitting happens when your AI memorizes the training data instead of learning patterns. It's like memorizing test answers without understanding the subject!",
    example: "Your AI might get 100% on training data but only 60% on new data - that's overfitting!"
  },
  batchSize: {
    term: "What is Batch Size? 📦",
    explanation: "Batch size is how many examples your AI looks at before updating what it learned. Smaller batches = more frequent updates, larger batches = faster training.",
    example: "If batch size is 32, your AI studies 32 examples, then adjusts its understanding, then studies the next 32."
  },
  validation: {
    term: "What is Validation? ✅",
    explanation: "Validation is like a practice test! We set aside some data that the AI hasn't seen during training to check if it really learned or just memorized.",
    example: "If you study with 80 flashcards and test yourself with 20 new ones, those 20 are your validation set."
  },
  features: {
    term: "What are Features? 🔍",
    explanation: "Features are the characteristics or properties of your data that help the AI make decisions. They're like clues that help solve a mystery!",
    example: "For identifying fruits: color, size, shape, and taste are all features that help distinguish an apple from an orange."
  },
  neuralNetwork: {
    term: "What is a Neural Network? 🧠",
    explanation: "A neural network is inspired by how your brain works! It has layers of connected 'neurons' that process information and learn patterns.",
    example: "Just like your brain has neurons that fire when you see a cat, artificial neurons activate when they detect cat-like features in images."
  },
  hyperparameters: {
    term: "What are Hyperparameters? ⚙️",
    explanation: "Hyperparameters are settings you adjust before training starts. They're like the difficulty settings in a video game - they control how your AI learns!",
    example: "Learning rate, batch size, and number of epochs are all hyperparameters you can tune to improve your AI."
  }
};
