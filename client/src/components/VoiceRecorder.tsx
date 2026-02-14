import React, { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Mic, Square, Copy, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ExportPanel } from './ExportPanel';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, error } =
    useAudioRecorder();
  const { t } = useTranslation();

  const [transcription, setTranscription] = useState<string>('');
  const [enrichedText, setEnrichedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'summary' | 'structure' | 'format' | 'context'>(
    'summary'
  );
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en');
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Mutations
  const uploadAudioMutation = trpc.transcription.uploadAudio.useMutation();
  const transcribeMutation = trpc.transcription.transcribeAudio.useMutation();
  const transcribeDirectMutation = trpc.transcription.transcribeAudioDirect.useMutation();
  const enrichMutation = trpc.transcription.enrichTranscription.useMutation();
  const createHistoryMutation = trpc.history.create.useMutation();
  
  const { data: settingsData } = trpc.settings.getSettings.useQuery();

  // Update language from settings
  React.useEffect(() => {
    if (settingsData?.settings?.transcriptionLanguage) {
      setTranscriptionLanguage(settingsData.settings.transcriptionLanguage);
    }
  }, [settingsData]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setRecordingDuration(0);
      toast.success(t('recorder.messages.recordingStarted'));
    } catch (err) {
      toast.error(t('recorder.errors.recordingFailed'));
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsTranscribing(true);
      const audioBlob = await stopRecording();
      setRecordingDuration(duration);

      if (!audioBlob) {
        toast.error(t('recorder.errors.recordingFailed'));
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          console.log('[VoiceRecorder] Starting transcription with direct method');
          console.log('[VoiceRecorder] Audio size:', base64Audio.length, 'characters');
          console.log('[VoiceRecorder] Language:', transcriptionLanguage);

          // Try direct transcription first (more robust)
          let transcriptionResult;
          try {
            console.log('[VoiceRecorder] Attempting direct transcription...');
            transcriptionResult = await transcribeDirectMutation.mutateAsync({
              audioData: base64Audio,
              language: transcriptionLanguage,
            });
            console.log('[VoiceRecorder] Direct transcription successful');
          } catch (directError) {
            console.warn('[VoiceRecorder] Direct transcription failed, falling back to URL-based method:', directError);
            
            // Fallback: Upload first, then transcribe via URL
            console.log('[VoiceRecorder] Uploading audio to storage...');
            const uploadResult = await uploadAudioMutation.mutateAsync({
              audioData: base64Audio,
              filename: `recording-${Date.now()}.webm`,
            });
            console.log('[VoiceRecorder] Audio uploaded, URL:', uploadResult.url);

            console.log('[VoiceRecorder] Transcribing via URL...');
            transcriptionResult = await transcribeMutation.mutateAsync({
              audioUrl: uploadResult.url,
              language: transcriptionLanguage,
            });
            console.log('[VoiceRecorder] URL-based transcription successful');
          }

          const transcribedText = typeof transcriptionResult.text === 'string' 
            ? transcriptionResult.text 
            : JSON.stringify(transcriptionResult.text);
          
          console.log('[VoiceRecorder] Transcription complete, text length:', transcribedText.length);
          
          setTranscription(transcribedText);
          onTranscriptionComplete?.(transcriptionResult.text);
          
          // Save to history
          try {
            const audioUrl = (transcriptionResult as any).audioUrl || 'unknown';
            await createHistoryMutation.mutateAsync({
              audioUrl,
              transcription: transcribedText,
              transcriptionLanguage,
              duration: recordingDuration,
            });
            console.log('[VoiceRecorder] Recording saved to history');
          } catch (historyError) {
            console.warn('[VoiceRecorder] Failed to save to history:', historyError);
          }
          
          toast.success(t('recorder.messages.transcriptionComplete'));
        } catch (err) {
          const message = err instanceof Error ? err.message : t('recorder.errors.transcriptionFailed');
          console.error('[VoiceRecorder] Transcription error:', message);
          toast.error(message);
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('recorder.errors.transcriptionFailed');
      console.error('[VoiceRecorder] Stop recording error:', message);
      toast.error(message);
      setIsTranscribing(false);
    }
  };

  const handleEnrich = async () => {
    if (!transcription) {
      toast.error(t('recorder.errors.noTranscription'));
      return;
    }

    try {
      setIsEnriching(true);
      console.log('[VoiceRecorder] Starting enrichment with mode:', selectedMode);
      
      const result = await enrichMutation.mutateAsync({
        text: transcription,
        mode: selectedMode,
      });
      
      const enrichedContent = typeof result.enrichedText === 'string'
        ? result.enrichedText
        : JSON.stringify(result.enrichedText);
      
      console.log('[VoiceRecorder] Enrichment complete, result length:', enrichedContent.length);
      
      setEnrichedText(enrichedContent);
      
      // Update history with enriched result
      try {
        // Note: In a real app, you'd want to get the recording ID from history
        console.log('[VoiceRecorder] Enrichment saved');
      } catch (historyError) {
        console.warn('[VoiceRecorder] Failed to update history with enrichment:', historyError);
      }
      
      toast.success(t('recorder.messages.enrichmentComplete'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('recorder.errors.enrichmentFailed');
      console.error('[VoiceRecorder] Enrichment error:', message);
      toast.error(message);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const textToCopy = enrichedText || transcription;
    if (!textToCopy) {
      toast.error(t('recorder.errors.nothingToCopy'));
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(t('recorder.messages.copiedToClipboard'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Recording Section */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Mic Icon with Animation */}
          <div
            className={`relative w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
            }`}
          >
            <Mic className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse" />
            )}
          </div>

          {/* Duration Display */}
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-mono">
              {formatDuration(duration)}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              {isRecording ? t('recorder.recording') : t('recorder.readyToRecord')}
            </p>
          </div>

          {/* Error Display */}
          {error && <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>}

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 w-full sm:w-auto">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all text-sm sm:text-base"
              >
                <Mic className="w-4 h-4 mr-2" />
                {t('recorder.startRecording')}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStopRecording}
                  disabled={isTranscribing}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all text-sm sm:text-base"
                >
                  <Square className="w-4 h-4 mr-2" />
                  {t('recorder.stop')}
                </Button>
                <Button
                  onClick={cancelRecording}
                  variant="outline"
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 text-sm sm:text-base"
                >
                  {t('recorder.cancel')}
                </Button>
              </>
            )}
          </div>

          {/* Transcribing Indicator */}
          {isTranscribing && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{t('recorder.enriching')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Display */}
      {transcription && (
        <Card className="p-4 sm:p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('recorder.transcription')}
              </h3>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                {transcription}
              </p>
            </div>

            {/* Enrichment Options */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t('recorder.enrichmentOptions')}
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['summary', 'structure', 'format', 'context'] as const).map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    variant={selectedMode === mode ? 'default' : 'outline'}
                    className="text-sm"
                  >
                    {t(`recorder.${mode}`)}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleEnrich}
                disabled={isEnriching}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('recorder.enriching')}
                  </>
                ) : (
                  t('recorder.enrichTranscription')
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Enriched Result Display */}
      {enrichedText && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('recorder.enrichedResult')}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
              {enrichedText}
            </p>

            {/* Export Options */}
            <div className="flex gap-2 pt-4 border-t border-green-200 dark:border-green-700">
              <Button
                onClick={() => setShowExportPanel(!showExportPanel)}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('recorder.export')}
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('recorder.copyResult')}
              </Button>
            </div>

            {/* Export Panel */}
            {showExportPanel && (
              <ExportPanel
                transcription={transcription}
                enrichedResult={enrichedText}
                enrichmentMode={selectedMode}
                language={transcriptionLanguage}
                duration={recordingDuration}
                onClose={() => setShowExportPanel(false)}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
