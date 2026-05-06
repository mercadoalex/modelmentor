import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  Zap,
  Info,
  TrendingUp,
  Activity
} from 'lucide-react';
import { LineChart } from '@/components/charts/ChartComponents';
import { 
  reinforcementLearningService,
  type Environment,
  type Episode,
  type TrainingMetrics
} from '@/services/reinforcementLearningService';

type Algorithm = 'q_learning' | 'dqn' | 'policy_gradient' | 'actor_critic';
type EnvironmentType = 'gridworld' | 'cartpole' | 'mountaincar' | 'frozenlake';

export function ReinforcementLearningPlayground() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('q_learning');
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType>('gridworld');
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  
  // Hyperparameters
  const [episodes, setEpisodes] = useState(100);
  const [learningRate, setLearningRate] = useState(0.1);
  const [discountFactor, setDiscountFactor] = useState(0.99);
  const [epsilon, setEpsilon] = useState(0.1);

  useEffect(() => {
    initializeEnvironment();
  }, [selectedEnv]);

  const initializeEnvironment = () => {
    let env: Environment;
    switch (selectedEnv) {
      case 'gridworld':
        env = reinforcementLearningService.createGridWorld(5);
        break;
      case 'cartpole':
        env = reinforcementLearningService.createCartPole();
        break;
      case 'mountaincar':
        env = reinforcementLearningService.createMountainCar();
        break;
      case 'frozenlake':
        env = reinforcementLearningService.createFrozenLake(4);
        break;
    }
    setEnvironment(env);
    setTrainingMetrics(null);
    setCurrentEpisode(0);
  };

  const startTraining = () => {
    if (!environment) return;

    setIsTraining(true);
    setTrainingMetrics(null);
    setCurrentEpisode(0);

    // Run training in background
    setTimeout(() => {
      let metrics: TrainingMetrics;

      const onEpisodeComplete = (episode: Episode) => {
        setCurrentEpisode(episode.episodeNumber + 1);
      };

      switch (selectedAlgorithm) {
        case 'q_learning':
          metrics = reinforcementLearningService.qLearning(
            environment,
            episodes,
            learningRate,
            discountFactor,
            epsilon,
            onEpisodeComplete
          );
          break;
        case 'dqn':
          metrics = reinforcementLearningService.deepQNetwork(
            environment,
            episodes,
            learningRate * 0.01,
            discountFactor,
            1.0,
            32,
            onEpisodeComplete
          );
          break;
        case 'policy_gradient':
          metrics = reinforcementLearningService.policyGradient(
            environment,
            episodes,
            learningRate * 0.1,
            discountFactor,
            onEpisodeComplete
          );
          break;
        case 'actor_critic':
          metrics = reinforcementLearningService.actorCritic(
            environment,
            episodes,
            learningRate * 0.1,
            discountFactor,
            onEpisodeComplete
          );
          break;
      }

      setTrainingMetrics(metrics);
      setIsTraining(false);
    }, 100);
  };

  const reset = () => {
    setTrainingMetrics(null);
    setCurrentEpisode(0);
    initializeEnvironment();
  };

  const getAlgorithmInfo = (algo: Algorithm) => {
    const info = {
      q_learning: {
        name: 'Q-Learning',
        icon: Target,
        description: 'Value-based method learning optimal action-value function',
        features: ['Epsilon-greedy exploration', 'Q-table updates', 'Off-policy learning']
      },
      dqn: {
        name: 'Deep Q-Network',
        icon: Brain,
        description: 'Neural network approximation of Q-function',
        features: ['Experience replay', 'Target network', 'Handles large state spaces']
      },
      policy_gradient: {
        name: 'Policy Gradient',
        icon: TrendingUp,
        description: 'Directly optimize policy using gradient ascent',
        features: ['REINFORCE algorithm', 'Stochastic policy', 'On-policy learning']
      },
      actor_critic: {
        name: 'Actor-Critic',
        icon: Zap,
        description: 'Combines value and policy methods',
        features: ['Actor for policy', 'Critic for value', 'Lower variance']
      }
    };
    return info[algo];
  };

  const getEnvironmentInfo = (envType: EnvironmentType) => {
    const info = {
      gridworld: {
        name: 'GridWorld',
        description: 'Navigate grid to reach goal while avoiding obstacles',
        stateSpace: 'Discrete (25 states)',
        actionSpace: 'Discrete (4 actions: Up, Down, Left, Right)',
        difficulty: 'Easy'
      },
      cartpole: {
        name: 'CartPole',
        description: 'Balance pole on moving cart',
        stateSpace: 'Continuous (position, velocity, angle, angular velocity)',
        actionSpace: 'Discrete (2 actions: Left, Right)',
        difficulty: 'Medium'
      },
      mountaincar: {
        name: 'Mountain Car',
        description: 'Drive up steep hill using momentum',
        stateSpace: 'Continuous (position, velocity)',
        actionSpace: 'Discrete (3 actions: Left, Nothing, Right)',
        difficulty: 'Hard'
      },
      frozenlake: {
        name: 'Frozen Lake',
        description: 'Navigate slippery frozen lake to goal',
        stateSpace: 'Discrete (16 states)',
        actionSpace: 'Discrete (4 actions: Up, Down, Left, Right)',
        difficulty: 'Medium'
      }
    };
    return info[envType];
  };

  const currentAlgoInfo = getAlgorithmInfo(selectedAlgorithm);
  const currentEnvInfo = getEnvironmentInfo(selectedEnv);
  const AlgoIcon = currentAlgoInfo.icon;

  // Calculate success rate
  const successRate = trainingMetrics 
    ? (trainingMetrics.episodes.filter(e => e.success).length / trainingMetrics.episodes.length * 100).toFixed(1)
    : '0';

  // Calculate average reward (last 10 episodes)
  const avgReward = trainingMetrics && trainingMetrics.episodes.length > 0
    ? (trainingMetrics.episodes.slice(-10).reduce((sum, e) => sum + e.totalReward, 0) / Math.min(10, trainingMetrics.episodes.length)).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6" />
                Reinforcement Learning Playground
              </CardTitle>
              <CardDescription className="mt-2">
                Train agents to solve interactive environments using RL algorithms
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="h-3 w-3 mr-1" />
              Interactive Learning
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Algorithm Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Algorithm</CardTitle>
            <CardDescription>Choose RL method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['q_learning', 'dqn', 'policy_gradient', 'actor_critic'] as Algorithm[]).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const Icon = info.icon;
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  disabled={isTraining}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAlgorithm === algo
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      selectedAlgorithm === algo ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        selectedAlgorithm === algo ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">{info.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Environment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Environment</CardTitle>
            <CardDescription>Choose task to solve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['gridworld', 'cartpole', 'mountaincar', 'frozenlake'] as EnvironmentType[]).map((envType) => {
              const info = getEnvironmentInfo(envType);
              return (
                <button
                  key={envType}
                  onClick={() => setSelectedEnv(envType)}
                  disabled={isTraining}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedEnv === envType
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{info.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {info.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Hyperparameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hyperparameters</CardTitle>
          <CardDescription>Configure training parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Episodes: {episodes}</Label>
              <Slider
                value={[episodes]}
                onValueChange={([v]) => setEpisodes(v)}
                min={50}
                max={500}
                step={50}
                disabled={isTraining}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Learning Rate: {learningRate.toFixed(3)}</Label>
              <Slider
                value={[learningRate * 1000]}
                onValueChange={([v]) => setLearningRate(v / 1000)}
                min={1}
                max={500}
                step={1}
                disabled={isTraining}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Discount Factor (γ): {discountFactor.toFixed(2)}</Label>
              <Slider
                value={[discountFactor * 100]}
                onValueChange={([v]) => setDiscountFactor(v / 100)}
                min={90}
                max={99}
                step={1}
                disabled={isTraining}
              />
            </div>
            {selectedAlgorithm === 'q_learning' && (
              <div className="space-y-2">
                <Label className="text-sm">Exploration Rate (ε): {epsilon.toFixed(2)}</Label>
                <Slider
                  value={[epsilon * 100]}
                  onValueChange={([v]) => setEpsilon(v / 100)}
                  min={1}
                  max={50}
                  step={1}
                  disabled={isTraining}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={startTraining} 
              disabled={isTraining}
              className="flex-1"
            >
              {isTraining ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Training... ({currentEpisode}/{episodes})
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
            {trainingMetrics && (
              <Button onClick={reset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Progress */}
      {isTraining && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Episode {currentEpisode} of {episodes}</span>
                <span>{((currentEpisode / episodes) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentEpisode / episodes) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {trainingMetrics && (
        <>
          {/* Metrics Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{successRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Reward (Last 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgReward}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Episodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{trainingMetrics.episodes.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Reward
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Math.max(...trainingMetrics.episodes.map(e => e.totalReward)).toFixed(0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Episode Rewards Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Episode Rewards</CardTitle>
              <CardDescription>Total reward per episode over training</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={{
                  labels: trainingMetrics.episodes.map(e => e.episodeNumber.toString()),
                  datasets: [{
                    label: 'Total Reward',
                    data: trainingMetrics.episodes.map(e => e.totalReward),
                    borderColor: 'hsl(var(--chart-1))',
                    backgroundColor: 'hsla(var(--chart-1), 0.1)',
                    tension: 0.4,
                    fill: true,
                  }]
                }}
                options={{
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Episode',
                        color: 'hsl(var(--muted-foreground))',
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Total Reward',
                        color: 'hsl(var(--muted-foreground))',
                      }
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Loss Chart (for DQN, Policy Gradient, Actor-Critic) */}
          {trainingMetrics.losses && trainingMetrics.losses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Training Loss</CardTitle>
                <CardDescription>Loss over training episodes</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={{
                    labels: trainingMetrics.losses.map((_, i) => i.toString()),
                    datasets: [{
                      label: 'Loss',
                      data: trainingMetrics.losses,
                      borderColor: 'hsl(var(--chart-2))',
                      backgroundColor: 'hsla(var(--chart-2), 0.1)',
                      tension: 0.4,
                      fill: true,
                    }]
                  }}
                  options={{
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Episode',
                          color: 'hsl(var(--muted-foreground))',
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Loss',
                          color: 'hsl(var(--muted-foreground))',
                        }
                      }
                    },
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          {/* Exploration Rate */}
          {trainingMetrics.explorationRate && (
            <Card>
              <CardHeader>
                <CardTitle>Exploration Rate Decay</CardTitle>
                <CardDescription>Epsilon decay over training</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={{
                    labels: trainingMetrics.explorationRate.map((_, i) => i.toString()),
                    datasets: [{
                      label: 'Epsilon',
                      data: trainingMetrics.explorationRate,
                      borderColor: 'hsl(var(--chart-3))',
                      backgroundColor: 'hsla(var(--chart-3), 0.1)',
                      tension: 0.4,
                      fill: true,
                    }]
                  }}
                  options={{
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Episode',
                          color: 'hsl(var(--muted-foreground))',
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Exploration Rate',
                          color: 'hsl(var(--muted-foreground))',
                        },
                        min: 0,
                        max: 1
                      }
                    },
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                  height={250}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Reinforcement Learning Concepts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="concepts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
              <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="concepts" className="space-y-3">
              {[
                {
                  title: 'Exploration vs Exploitation',
                  description: 'Balance between trying new actions (exploration) and using known good actions (exploitation). Epsilon-greedy is a common strategy.'
                },
                {
                  title: 'Credit Assignment',
                  description: 'Determining which actions led to rewards. Temporal difference learning and Monte Carlo methods solve this problem.'
                },
                {
                  title: 'Discount Factor (γ)',
                  description: 'Controls how much future rewards matter. γ=0 means only immediate rewards count, γ=1 means all future rewards count equally.'
                },
                {
                  title: 'Policy vs Value',
                  description: 'Policy defines what action to take in each state. Value function estimates expected future reward from a state.'
                }
              ].map((concept, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <Activity className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{concept.title}</p>
                    <p className="text-sm text-muted-foreground">{concept.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="algorithms" className="space-y-3">
              {[
                {
                  title: 'Q-Learning',
                  description: 'Off-policy TD learning. Updates Q(s,a) using Bellman equation. Simple and effective for discrete state/action spaces.'
                },
                {
                  title: 'Deep Q-Network (DQN)',
                  description: 'Uses neural network to approximate Q-function. Experience replay and target network stabilize training.'
                },
                {
                  title: 'Policy Gradient',
                  description: 'Directly optimizes policy using gradient ascent. Works well with continuous actions and stochastic policies.'
                },
                {
                  title: 'Actor-Critic',
                  description: 'Combines policy (actor) and value (critic). Lower variance than pure policy gradient, more stable than pure value methods.'
                }
              ].map((algo, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{algo.title}</p>
                    <p className="text-sm text-muted-foreground">{algo.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="applications" className="space-y-3">
              {[
                {
                  title: 'Game Playing',
                  description: 'AlphaGo, Dota 2 bots, Atari games. RL agents can master complex games through self-play.'
                },
                {
                  title: 'Robotics',
                  description: 'Robot manipulation, locomotion, navigation. RL enables robots to learn from trial and error.'
                },
                {
                  title: 'Autonomous Vehicles',
                  description: 'Self-driving cars learn optimal driving policies through simulation and real-world experience.'
                },
                {
                  title: 'Resource Management',
                  description: 'Data center cooling, traffic light control, energy grid optimization. RL optimizes complex systems.'
                }
              ].map((app, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{app.title}</p>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
