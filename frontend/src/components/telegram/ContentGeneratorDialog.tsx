import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ContentGenerationRequest, GeneratedContent } from '@/types/api';
import { useTelegramStore } from '@/store';

interface ContentGeneratorDialogProps {
  channelId: string;
  onClose: () => void;
}

export function ContentGeneratorDialog({
  channelId,
  onClose,
}: ContentGeneratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<ContentGenerationRequest>({
    topic: '',
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
    includeEmojis: true,
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(
    null
  );

  const { generateContent, schedulePost } = useTelegramStore();

  const handleGenerate = async () => {
    if (!request.topic) return;

    try {
      setLoading(true);
      const content = await generateContent(channelId, request);
      setGeneratedContent(content);
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!generatedContent) return;

    try {
      setLoading(true);
      await schedulePost(channelId, {
        content: generatedContent.content,
        scheduledAt: generatedContent.suggestedTime || new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to schedule post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Content Generator</DialogTitle>
          <DialogDescription>
            Generate engaging content for your Telegram channel using AI
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topic" className="text-right">
              Topic
            </Label>
            <Input
              id="topic"
              placeholder="Enter the topic or theme for your content"
              value={request.topic}
              onChange={(e) =>
                setRequest((prev) => ({ ...prev, topic: e.target.value }))
              }
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tone</Label>
            <Select
              value={request.tone}
              onValueChange={(value: any) =>
                setRequest((prev) => ({ ...prev, tone: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Length</Label>
            <Select
              value={request.length}
              onValueChange={(value: any) =>
                setRequest((prev) => ({ ...prev, length: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Options</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={request.includeHashtags}
                  onCheckedChange={(checked) =>
                    setRequest((prev) => ({ ...prev, includeHashtags: checked }))
                  }
                />
                <Label>Include Hashtags</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={request.includeEmojis}
                  onCheckedChange={(checked) =>
                    setRequest((prev) => ({ ...prev, includeEmojis: checked }))
                  }
                />
                <Label>Include Emojis</Label>
              </div>
            </div>
          </div>

          {generatedContent && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Generated Content</Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  value={generatedContent.content}
                  readOnly
                  className="min-h-[200px]"
                />
                {generatedContent.hashtags && (
                  <div className="text-sm text-gray-500">
                    Hashtags: {generatedContent.hashtags.join(' ')}
                  </div>
                )}
                {generatedContent.suggestedTime && (
                  <div className="text-sm text-gray-500">
                    Suggested Time: {new Date(generatedContent.suggestedTime).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {generatedContent ? (
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Post'}
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Content'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 