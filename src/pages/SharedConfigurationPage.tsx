import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { configurationService } from '@/services/configurationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import type { SandboxConfiguration } from '@/types/types';

export default function SharedConfigurationPage() {
  const { token }    = useParams<{ token: string }>();
  const navigate     = useNavigate();
  const [config,     setConfig]     = useState<SandboxConfiguration | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    configurationService.getByShareToken(token)
      .then(data => { data ? setConfig(data) : setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Configuration Not Found</CardTitle>
          <CardDescription>This link may have expired or been removed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/')}>Go to ModelMentor</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{config!.name}</CardTitle>
            {config!.is_assignment && <Badge variant="secondary">Assignment</Badge>}
          </div>
          {config!.description && (
            <CardDescription>{config!.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Settings grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Learning Rate',  config!.learning_rate],
              ['Normalization',  config!.normalization ? 'Enabled' : 'Disabled'],
              ['Batch Size',     config!.batch_size],
              ['Epochs',         config!.epochs],
              ['Failure Mode',   config!.failure_mode ?? '—'],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold mt-0.5">{value as string}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Shared on {new Date(config!.created_at).toLocaleDateString()}
          </p>

          <Button className="w-full" onClick={() => navigate('/sandbox', { state: { loadConfig: config } })}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Debugging Sandbox
          </Button>

          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Go to ModelMentor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}