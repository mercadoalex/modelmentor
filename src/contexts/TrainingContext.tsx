import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trainingJobService } from '@/services/trainingJobService';
import type { TrainModelRequest, TrainModelResponse } from '@/types/subscription';

interface TrainingProgress {
  sessionId: string;
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  elapsedSeconds: number;
}

interface TrainingJob {
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'queued' | 'timeout';
  modelType: string;
  startedAt: string;
  metrics?: { accuracy: number; loss: number; precision: number; recall: number; f1_score: number };
  error?: string;
}

interface TrainingContextType {
  activeJobs: TrainingJob[];
  jobHistory: TrainingJob[];
  currentProgress: Map<string, TrainingProgress>;
  startTraining: (request: TrainModelRequest) => Promise<TrainModelResponse>;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 3000;

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [jobHistory, setJobHistory] = useState<TrainingJob[]>([]);
  const [currentProgress, setCurrentProgress] = useState<Map<string, TrainingProgress>>(new Map());

  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const moveJobToHistory = useCallback((sessionId: string, updatedJob: Partial<TrainingJob>) => {
    setActiveJobs((prev) => prev.filter((j) => j.sessionId !== sessionId));
    setJobHistory((prev) => {
      const existing = prev.find((j) => j.sessionId === sessionId);
      if (existing) return prev;
      const activeJob = activeJobs.find((j) => j.sessionId === sessionId);
      if (!activeJob) return prev;
      return [{ ...activeJob, ...updatedJob }, ...prev];
    });
    setCurrentProgress((prev) => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
    cleanupSubscription(sessionId);
  }, [activeJobs]);

  const cleanupSubscription = useCallback((sessionId: string) => {
    const unsub = unsubscribeRefs.current.get(sessionId);
    if (unsub) {
      unsub();
      unsubscribeRefs.current.delete(sessionId);
    }
    const interval = pollIntervalsRef.current.get(sessionId);
    if (interval) {
      clearInterval(interval);
      pollIntervalsRef.current.delete(sessionId);
    }
  }, []);

  const startPolling = useCallback((sessionId: string) => {
    // Don't start duplicate polling
    if (pollIntervalsRef.current.has(sessionId)) return;

    const interval = setInterval(async () => {
      const session = await trainingJobService.pollTrainingStatus(sessionId);
      if (!session) return;

      if (session.status === 'completed' || session.status === 'failed' || session.status === 'timeout') {
        const metrics = session.accuracy !== null
          ? {
              accuracy: session.accuracy ?? 0,
              loss: session.loss ?? 0,
              precision: session.precision_score ?? 0,
              recall: session.recall_score ?? 0,
              f1_score: session.f1_score ?? 0,
            }
          : undefined;

        moveJobToHistory(sessionId, {
          status: session.status as TrainingJob['status'],
          metrics,
          error: session.error_message ?? undefined,
        });
      } else {
        // Update progress from polling data
        if (session.current_epoch > 0) {
          setCurrentProgress((prev) => {
            const next = new Map(prev);
            next.set(sessionId, {
              sessionId,
              epoch: session.current_epoch,
              totalEpochs: session.epochs,
              loss: session.loss ?? 0,
              accuracy: session.accuracy ?? 0,
              elapsedSeconds: 0,
            });
            return next;
          });
        }
      }
    }, POLL_INTERVAL_MS);

    pollIntervalsRef.current.set(sessionId, interval);
  }, [moveJobToHistory]);

  const subscribeToJob = useCallback((sessionId: string) => {
    const unsubscribe = trainingJobService.subscribeToProgress(sessionId, (event) => {
      setCurrentProgress((prev) => {
        const next = new Map(prev);
        next.set(sessionId, {
          sessionId,
          epoch: event.epoch,
          totalEpochs: event.total_epochs,
          loss: event.loss,
          accuracy: event.accuracy,
          elapsedSeconds: event.elapsed_seconds,
        });
        return next;
      });

      // Check if training is complete (last epoch)
      if (event.epoch >= event.total_epochs) {
        // Poll once to get final status and metrics
        trainingJobService.pollTrainingStatus(sessionId).then((session) => {
          if (session && (session.status === 'completed' || session.status === 'failed' || session.status === 'timeout')) {
            const metrics = session.accuracy !== null
              ? {
                  accuracy: session.accuracy ?? 0,
                  loss: session.loss ?? 0,
                  precision: session.precision_score ?? 0,
                  recall: session.recall_score ?? 0,
                  f1_score: session.f1_score ?? 0,
                }
              : undefined;

            moveJobToHistory(sessionId, {
              status: session.status as TrainingJob['status'],
              metrics,
              error: session.error_message ?? undefined,
            });
          }
        });
      }
    });

    unsubscribeRefs.current.set(sessionId, unsubscribe);

    // Set up fallback polling in case Realtime disconnects
    // We start polling after a delay — if Realtime is working, the progress updates
    // will keep coming. If not, polling takes over.
    const fallbackTimeout = setTimeout(() => {
      // Check if we've received any progress for this job
      // If not, start polling as fallback
      setCurrentProgress((prev) => {
        if (!prev.has(sessionId)) {
          startPolling(sessionId);
        }
        return prev;
      });
    }, POLL_INTERVAL_MS * 2);

    // Store cleanup for the fallback timeout
    const originalUnsubscribe = unsubscribeRefs.current.get(sessionId);
    unsubscribeRefs.current.set(sessionId, () => {
      clearTimeout(fallbackTimeout);
      if (originalUnsubscribe) originalUnsubscribe();
    });
  }, [moveJobToHistory, startPolling]);

  const startTraining = useCallback(async (request: TrainModelRequest): Promise<TrainModelResponse> => {
    if (!user) {
      throw new Error('Must be authenticated to start training');
    }

    const response = await trainingJobService.submitTrainingJob(request, user.id);

    const newJob: TrainingJob = {
      sessionId: response.session_id,
      status: response.status as TrainingJob['status'],
      modelType: request.model_type,
      startedAt: new Date().toISOString(),
      metrics: response.metrics,
      error: response.error,
    };

    if (response.status === 'completed' || response.status === 'failed') {
      setJobHistory((prev) => [newJob, ...prev]);
    } else {
      setActiveJobs((prev) => [...prev, newJob]);
      subscribeToJob(response.session_id);
    }

    return response;
  }, [user, subscribeToJob]);

  // Load existing active jobs on mount
  useEffect(() => {
    if (!user) return;

    const loadExistingJobs = async () => {
      try {
        const sessions = await trainingJobService.listTrainingSessions(user.id);

        const active: TrainingJob[] = [];
        const history: TrainingJob[] = [];

        for (const session of sessions) {
          const job: TrainingJob = {
            sessionId: session.id,
            status: session.status as TrainingJob['status'],
            modelType: session.model_type,
            startedAt: session.started_at ?? session.created_at,
            metrics: session.accuracy !== null
              ? {
                  accuracy: session.accuracy ?? 0,
                  loss: session.loss ?? 0,
                  precision: session.precision_score ?? 0,
                  recall: session.recall_score ?? 0,
                  f1_score: session.f1_score ?? 0,
                }
              : undefined,
            error: session.error_message ?? undefined,
          };

          if (session.status === 'running' || session.status === 'pending' || session.status === 'queued') {
            active.push(job);
          } else {
            history.push(job);
          }
        }

        setActiveJobs(active);
        setJobHistory(history);

        // Subscribe to progress for active jobs
        for (const job of active) {
          subscribeToJob(job.sessionId);
        }
      } catch (error) {
        console.error('Error loading training sessions:', error);
      }
    };

    loadExistingJobs();
  }, [user, subscribeToJob]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      for (const unsub of unsubscribeRefs.current.values()) {
        unsub();
      }
      unsubscribeRefs.current.clear();

      for (const interval of pollIntervalsRef.current.values()) {
        clearInterval(interval);
      }
      pollIntervalsRef.current.clear();
    };
  }, []);

  const value: TrainingContextType = {
    activeJobs,
    jobHistory,
    currentProgress,
    startTraining,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}
