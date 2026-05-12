import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { migrationService } from '@/services/migrationService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FolderSync,
  X,
} from 'lucide-react';

interface MigrationResult {
  migrated: number;
  failed: Array<{ title: string; reason: string }>;
}

export function MigrationPrompt() {
  const { user, isAuthenticated } = useAuth();
  const [localProjects, setLocalProjects] = useState<
    ReturnType<typeof migrationService.getLocalProjects>
  >([]);
  const [dismissed, setDismissed] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const projects = migrationService.getLocalProjects();
      setLocalProjects(projects);
    }
  }, [isAuthenticated]);

  // Don't render if not authenticated, no local projects, or dismissed
  if (!isAuthenticated || localProjects.length === 0 || dismissed) {
    return null;
  }

  const handleMigrate = async () => {
    if (!user) return;

    setMigrating(true);
    try {
      const response = await migrationService.migrateLocalData(
        localProjects,
        user.id
      );
      setResult(response);

      // Clear local data only for successfully migrated items
      if (response.migrated > 0 && response.failed.length === 0) {
        // All items migrated successfully — clear all local data
        migrationService.clearLocalData();
        toast.success(
          `Successfully migrated ${response.migrated} project${response.migrated > 1 ? 's' : ''}`
        );
      } else if (response.migrated > 0 && response.failed.length > 0) {
        // Partial success — retain local data for failed items
        // Only clear the successfully migrated items from local storage
        const failedTitles = new Set(response.failed.map((f) => f.title));
        const remainingProjects = localProjects.filter((p) =>
          failedTitles.has(p.title)
        );

        if (remainingProjects.length === 0) {
          migrationService.clearLocalData();
        } else {
          // Store only the failed projects back
          localStorage.setItem(
            'modelmentor_local_projects',
            JSON.stringify(remainingProjects)
          );
        }

        toast.success(
          `Migrated ${response.migrated} project${response.migrated > 1 ? 's' : ''}. ${response.failed.length} failed.`
        );
      } else {
        // All failed — retain all local data
        toast.error('Migration failed for all projects. Local data retained.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Migration failed unexpectedly'
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Show results view after migration completes
  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="h-5 w-5" />
            Migration Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.migrated > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Successfully migrated</AlertTitle>
              <AlertDescription>
                {result.migrated} project{result.migrated > 1 ? 's' : ''}{' '}
                migrated to your account.
              </AlertDescription>
            </Alert>
          )}

          {result.failed.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Failed to migrate</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {result.failed.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        — {item.reason}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Local data has been retained for failed items.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleDismiss} className="w-full">
            Dismiss
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show migration prompt
  return (
    <Card>
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-6 w-6"
          onClick={handleDismiss}
          aria-label="Dismiss migration prompt"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="h-5 w-5" />
          Migrate Your Offline Work
        </CardTitle>
        <CardDescription>
          We found {localProjects.length} project
          {localProjects.length > 1 ? 's' : ''} saved locally. Would you like to
          migrate them to your account for cloud storage and access across
          devices?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {localProjects.map((project, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Badge variant="secondary" className="text-xs">
                {project.model_type}
              </Badge>
              <span>{project.title}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleMigrate} disabled={migrating} className="flex-1">
          {migrating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Migrate Projects
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleDismiss} disabled={migrating}>
          Not Now
        </Button>
      </CardFooter>
    </Card>
  );
}
