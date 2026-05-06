import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import type { CustomFailureScenario } from '@/types/types';

interface ShareCustomScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: CustomFailureScenario | null;
}

export function ShareCustomScenarioDialog({
  open,
  onOpenChange,
  scenario,
}: ShareCustomScenarioDialogProps) {
  const [copied, setCopied] = useState(false);
  const [assignmentInstructions, setAssignmentInstructions] = useState('');

  if (!scenario) return null;

  const shareUrl = `${window.location.origin}/debugging-sandbox/custom-scenario/${scenario.share_token}`;
  const assignmentUrl = assignmentInstructions.trim()
    ? `${shareUrl}?instructions=${encodeURIComponent(assignmentInstructions.trim())}`
    : shareUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(assignmentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Custom Scenario</DialogTitle>
          <DialogDescription>
            Share this custom failure scenario with students via link or QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scenario Details */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Scenario Details</Label>
            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <div className="font-medium">{scenario.name}</div>
              {scenario.description && (
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Learning Rate:</span>
                  <span className="font-mono">{scenario.learning_rate.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Normalization:</span>
                  <span className="font-mono">
                    {scenario.normalization ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Size:</span>
                  <span className="font-mono">{scenario.batch_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Epochs:</span>
                  <span className="font-mono">{scenario.epochs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Instructions */}
          <div className="space-y-2">
            <Label htmlFor="assignment-instructions">
              Assignment Instructions (Optional)
            </Label>
            <Textarea
              id="assignment-instructions"
              placeholder="Add instructions for students about what to observe or analyze with this scenario..."
              value={assignmentInstructions}
              onChange={(e) => setAssignmentInstructions(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Instructions will be displayed to students when they load this scenario
            </p>
          </div>

          {/* Shareable Link */}
          <div className="space-y-2">
            <Label>Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                value={assignmentUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label>QR Code</Label>
            <div className="flex justify-center p-4 border rounded-lg bg-white">
              <QRCodeDataUrl text={assignmentUrl} width={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Students can scan this code to access the scenario
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
