export type LayerType = 'dense' | 'conv2d' | 'lstm' | 'attention' | 'dropout' | 'batch_norm';
export type ActivationType = 'relu' | 'tanh' | 'sigmoid' | 'swish' | 'gelu';
export type ConnectionType = 'sequential' | 'skip' | 'residual';
export type SearchStrategy = 'random' | 'evolutionary' | 'reinforcement_learning';

export interface Layer {
  id: string;
  type: LayerType;
  units?: number;
  filters?: number;
  kernelSize?: number;
  rate?: number;
  activation?: ActivationType;
}

export interface Architecture {
  id: string;
  layers: Layer[];
  connections: ConnectionType;
  generation: number;
  metrics: {
    accuracy: number;
    parameters: number;
    flops: number;
    latency: number;
    trainingTime: number;
  };
  fitness: number;
}

export interface SearchSpace {
  maxLayers: number;
  minLayers: number;
  layerTypes: LayerType[];
  activations: ActivationType[];
  unitsRange: [number, number];
  filtersRange: [number, number];
  allowSkipConnections: boolean;
  allowResidualBlocks: boolean;
}

export interface SearchConfig {
  strategy: SearchStrategy;
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  maxParameters: number;
  maxLatency: number;
  targetAccuracy: number;
}

export interface ParetoPoint {
  architecture: Architecture;
  isDominated: boolean;
}

export const neuralArchitectureSearchService = {
  /**
   * Generate random architecture
   */
  generateRandomArchitecture(searchSpace: SearchSpace, generation: number = 0): Architecture {
    const numLayers = Math.floor(
      Math.random() * (searchSpace.maxLayers - searchSpace.minLayers + 1) + searchSpace.minLayers
    );

    const layers: Layer[] = [];
    for (let i = 0; i < numLayers; i++) {
      const layerType = searchSpace.layerTypes[
        Math.floor(Math.random() * searchSpace.layerTypes.length)
      ];

      const layer: Layer = {
        id: `layer_${i}`,
        type: layerType,
      };

      if (layerType === 'dense' || layerType === 'lstm') {
        layer.units = Math.floor(
          Math.random() * (searchSpace.unitsRange[1] - searchSpace.unitsRange[0] + 1) +
          searchSpace.unitsRange[0]
        );
        layer.activation = searchSpace.activations[
          Math.floor(Math.random() * searchSpace.activations.length)
        ];
      } else if (layerType === 'conv2d') {
        layer.filters = Math.floor(
          Math.random() * (searchSpace.filtersRange[1] - searchSpace.filtersRange[0] + 1) +
          searchSpace.filtersRange[0]
        );
        layer.kernelSize = [3, 5, 7][Math.floor(Math.random() * 3)];
        layer.activation = searchSpace.activations[
          Math.floor(Math.random() * searchSpace.activations.length)
        ];
      } else if (layerType === 'dropout') {
        layer.rate = 0.1 + Math.random() * 0.4; // 0.1 to 0.5
      }

      layers.push(layer);
    }

    const connectionType: ConnectionType = 
      searchSpace.allowSkipConnections && Math.random() > 0.5 ? 'skip' :
      searchSpace.allowResidualBlocks && Math.random() > 0.7 ? 'residual' : 'sequential';

    const architecture: Architecture = {
      id: `arch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      layers,
      connections: connectionType,
      generation,
      metrics: {
        accuracy: 0,
        parameters: 0,
        flops: 0,
        latency: 0,
        trainingTime: 0,
      },
      fitness: 0,
    };

    return this.evaluateArchitecture(architecture);
  },

  /**
   * Evaluate architecture performance
   */
  evaluateArchitecture(architecture: Architecture): Architecture {
    // Calculate parameters
    let parameters = 0;
    let flops = 0;

    for (let i = 0; i < architecture.layers.length; i++) {
      const layer = architecture.layers[i];
      
      if (layer.type === 'dense' && layer.units) {
        const inputSize = i === 0 ? 784 : (architecture.layers[i - 1].units || 128);
        parameters += inputSize * layer.units + layer.units; // weights + bias
        flops += 2 * inputSize * layer.units;
      } else if (layer.type === 'conv2d' && layer.filters && layer.kernelSize) {
        const inputChannels = i === 0 ? 3 : (architecture.layers[i - 1].filters || 32);
        parameters += layer.kernelSize * layer.kernelSize * inputChannels * layer.filters + layer.filters;
        flops += 2 * layer.kernelSize * layer.kernelSize * inputChannels * layer.filters * 224 * 224; // Assuming 224x224 input
      } else if (layer.type === 'lstm' && layer.units) {
        const inputSize = i === 0 ? 100 : (architecture.layers[i - 1].units || 128);
        parameters += 4 * (layer.units * (inputSize + layer.units + 1)); // 4 gates
        flops += 8 * layer.units * (inputSize + layer.units);
      }
    }

    // Estimate latency (ms) based on FLOPs
    const latency = (flops / 1e9) * 10; // Rough approximation

    // Estimate accuracy based on architecture characteristics
    const baseAccuracy = 0.7;
    const depthBonus = Math.min(architecture.layers.length * 0.02, 0.15);
    const connectionBonus = architecture.connections === 'residual' ? 0.03 : 
                           architecture.connections === 'skip' ? 0.02 : 0;
    const complexityPenalty = parameters > 1e7 ? -0.05 : 0;
    
    const accuracy = Math.min(0.95, baseAccuracy + depthBonus + connectionBonus + complexityPenalty + (Math.random() - 0.5) * 0.05);

    // Training time (minutes) based on parameters and layers
    const trainingTime = (parameters / 1e6) * 2 + architecture.layers.length * 0.5;

    architecture.metrics = {
      accuracy,
      parameters,
      flops,
      latency,
      trainingTime,
    };

    // Calculate fitness (multi-objective)
    architecture.fitness = accuracy - (parameters / 1e7) * 0.1 - (latency / 100) * 0.05;

    return architecture;
  },

  /**
   * Mutate architecture
   */
  mutateArchitecture(architecture: Architecture, searchSpace: SearchSpace, mutationRate: number): Architecture {
    const mutated = JSON.parse(JSON.stringify(architecture)) as Architecture;
    mutated.id = `arch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    mutated.generation = architecture.generation + 1;

    // Mutation operations
    if (Math.random() < mutationRate) {
      const operation = Math.floor(Math.random() * 4);

      switch (operation) {
        case 0: // Add layer
          if (mutated.layers.length < searchSpace.maxLayers) {
            const newLayer = this.generateRandomArchitecture(searchSpace).layers[0];
            const position = Math.floor(Math.random() * (mutated.layers.length + 1));
            mutated.layers.splice(position, 0, newLayer);
          }
          break;

        case 1: // Remove layer
          if (mutated.layers.length > searchSpace.minLayers) {
            const position = Math.floor(Math.random() * mutated.layers.length);
            mutated.layers.splice(position, 1);
          }
          break;

        case 2: // Modify layer
          if (mutated.layers.length > 0) {
            const position = Math.floor(Math.random() * mutated.layers.length);
            const layer = mutated.layers[position];
            
            if (layer.units) {
              layer.units = Math.floor(
                Math.random() * (searchSpace.unitsRange[1] - searchSpace.unitsRange[0] + 1) +
                searchSpace.unitsRange[0]
              );
            }
            if (layer.activation) {
              layer.activation = searchSpace.activations[
                Math.floor(Math.random() * searchSpace.activations.length)
              ];
            }
          }
          break;

        case 3: // Change connection type
          const connectionTypes: ConnectionType[] = ['sequential'];
          if (searchSpace.allowSkipConnections) connectionTypes.push('skip');
          if (searchSpace.allowResidualBlocks) connectionTypes.push('residual');
          mutated.connections = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
          break;
      }
    }

    return this.evaluateArchitecture(mutated);
  },

  /**
   * Crossover two architectures
   */
  crossoverArchitectures(parent1: Architecture, parent2: Architecture): Architecture {
    const child: Architecture = {
      id: `arch_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      layers: [],
      connections: Math.random() > 0.5 ? parent1.connections : parent2.connections,
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      metrics: {
        accuracy: 0,
        parameters: 0,
        flops: 0,
        latency: 0,
        trainingTime: 0,
      },
      fitness: 0,
    };

    // Single-point crossover
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.layers.length, parent2.layers.length));
    
    child.layers = [
      ...parent1.layers.slice(0, crossoverPoint),
      ...parent2.layers.slice(crossoverPoint),
    ];

    return this.evaluateArchitecture(child);
  },

  /**
   * Random search strategy
   */
  randomSearch(searchSpace: SearchSpace, config: SearchConfig): Architecture[] {
    const architectures: Architecture[] = [];

    for (let i = 0; i < config.populationSize * config.generations; i++) {
      const arch = this.generateRandomArchitecture(searchSpace, Math.floor(i / config.populationSize));
      
      // Filter by constraints
      if (arch.metrics.parameters <= config.maxParameters &&
          arch.metrics.latency <= config.maxLatency) {
        architectures.push(arch);
      }
    }

    return architectures.sort((a, b) => b.fitness - a.fitness);
  },

  /**
   * Evolutionary search strategy
   */
  evolutionarySearch(searchSpace: SearchSpace, config: SearchConfig): Architecture[] {
    let population: Architecture[] = [];
    const allArchitectures: Architecture[] = [];

    // Initialize population
    for (let i = 0; i < config.populationSize; i++) {
      const arch = this.generateRandomArchitecture(searchSpace, 0);
      population.push(arch);
      allArchitectures.push(arch);
    }

    // Evolution loop
    for (let gen = 1; gen < config.generations; gen++) {
      const newPopulation: Architecture[] = [];

      // Elitism: keep top 20%
      const eliteCount = Math.floor(config.populationSize * 0.2);
      const sortedPop = [...population].sort((a, b) => b.fitness - a.fitness);
      newPopulation.push(...sortedPop.slice(0, eliteCount));

      // Generate offspring
      while (newPopulation.length < config.populationSize) {
        // Tournament selection
        const parent1 = this.tournamentSelection(population, 3);
        const parent2 = this.tournamentSelection(population, 3);

        let offspring: Architecture;

        if (Math.random() < config.crossoverRate) {
          // Crossover
          offspring = this.crossoverArchitectures(parent1, parent2);
        } else {
          // Mutation only
          offspring = this.mutateArchitecture(parent1, searchSpace, config.mutationRate);
        }

        // Apply constraints
        if (offspring.metrics.parameters <= config.maxParameters &&
            offspring.metrics.latency <= config.maxLatency) {
          newPopulation.push(offspring);
          allArchitectures.push(offspring);
        }
      }

      population = newPopulation;
    }

    return allArchitectures.sort((a, b) => b.fitness - a.fitness);
  },

  /**
   * Tournament selection
   */
  tournamentSelection(population: Architecture[], tournamentSize: number): Architecture {
    const tournament: Architecture[] = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    return tournament.reduce((best, current) => current.fitness > best.fitness ? current : best);
  },

  /**
   * Calculate Pareto frontier
   */
  calculateParetoFrontier(architectures: Architecture[]): ParetoPoint[] {
    const paretoPoints: ParetoPoint[] = architectures.map(arch => ({
      architecture: arch,
      isDominated: false,
    }));

    // Check dominance
    for (let i = 0; i < paretoPoints.length; i++) {
      for (let j = 0; j < paretoPoints.length; j++) {
        if (i !== j) {
          const arch1 = paretoPoints[i].architecture;
          const arch2 = paretoPoints[j].architecture;

          // arch2 dominates arch1 if it's better in all objectives
          if (
            arch2.metrics.accuracy >= arch1.metrics.accuracy &&
            arch2.metrics.parameters <= arch1.metrics.parameters &&
            arch2.metrics.latency <= arch1.metrics.latency &&
            (arch2.metrics.accuracy > arch1.metrics.accuracy ||
             arch2.metrics.parameters < arch1.metrics.parameters ||
             arch2.metrics.latency < arch1.metrics.latency)
          ) {
            paretoPoints[i].isDominated = true;
            break;
          }
        }
      }
    }

    return paretoPoints;
  },

  /**
   * Get default search space
   */
  getDefaultSearchSpace(): SearchSpace {
    return {
      maxLayers: 10,
      minLayers: 2,
      layerTypes: ['dense', 'dropout', 'batch_norm'],
      activations: ['relu', 'tanh', 'sigmoid'],
      unitsRange: [32, 512],
      filtersRange: [16, 256],
      allowSkipConnections: true,
      allowResidualBlocks: true,
    };
  },

  /**
   * Get default search config
   */
  getDefaultSearchConfig(): SearchConfig {
    return {
      strategy: 'evolutionary',
      populationSize: 20,
      generations: 10,
      mutationRate: 0.3,
      crossoverRate: 0.7,
      maxParameters: 10000000, // 10M
      maxLatency: 100, // 100ms
      targetAccuracy: 0.9,
    };
  },

  /**
   * Run architecture search
   */
  runSearch(searchSpace: SearchSpace, config: SearchConfig): Architecture[] {
    switch (config.strategy) {
      case 'random':
        return this.randomSearch(searchSpace, config);
      case 'evolutionary':
        return this.evolutionarySearch(searchSpace, config);
      case 'reinforcement_learning':
        // Simplified RL (similar to random for demo)
        return this.randomSearch(searchSpace, config);
      default:
        return this.randomSearch(searchSpace, config);
    }
  },
};
