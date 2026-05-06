import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, X, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { SandboxConfiguration } from '@/types/types';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';

interface ShareConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: SandboxConfiguration | null;
}

export function ShareConfigurationDialog({
  open,
  onOpenChange,
  configuration
}: ShareConfigurationDialogProps) {
  const [shareLink, setShareLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && configuration) {
      generateShareLink();
    }
  }, [open, configuration]);

  const generateShareLink = async () => {
    if (!configuration) return;

    setIsGenerating(true);
    try {
      // Check if share already exists
      const { data: existing } = await supabase
        .from('shared_configurations')
        .select('share_token')
        .eq('configuration_id', configuration.id)
        .maybeSingle();

      let token: string;

      if (existing) {
        token = existing.share_token;
      } else {
        // Create new share
        const { data, error } = await supabase
          .from('shared_configurations')
          .insert({
            configuration_id: configuration.id,
            is_assignment: false
          })
          .select('share_token')
          .single();

        if (error) throw error;
        token = data.share_token;
      }

      const link = `${window.location.origin}/sandbox/shared/${token}`;
      setShareLink(link);
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  if (!configuration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Configuration</DialogTitle>
          <DialogDescription>
            Share this configuration with others via a unique link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Configuration Details */}
          <div className="space-y-2">
            <Label>Configuration</Label>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{configuration.name}</p>
              {configuration.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {configuration.description}
                </p>
              )}
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                disabled={isGenerating || !shareLink}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can load this configuration
            </p>
          </div>

          {/* QR Code */}
          {shareLink && (
            <div className="space-y-2">
              <Label>QR Code</Label>
              <div className="flex justify-center bg-muted p-4 rounded-lg">
                <QRCodeDataUrl text={shareLink} width={200} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan to open on mobile device
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleCopy} disabled={isGenerating || !shareLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
