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

  const uploadAudioMutation = trpc.transcription.uploadAudio.useMutation();
  const transcribeMutation = trpc.transcription.transcribeAudio.useMutation();
  const enrichMutation = trpc.transcription.enrichTranscription.useMutation();
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
      toast.success(t('recorder.messages.recordingStarted'));
    } catch (err) {
      toast.error(t('recorder.errors.recordingFailed'));
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsTranscribing(true);
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        toast.error(t('recorder.errors.recordingFailed'));
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Upload audio
        const uploadResult = await uploadAudioMutation.mutateAsync({
          audioData: base64Audio,
          filename: `recording-${Date.now()}.webm`,
        });

        // Transcribe audio
        const transcriptionResult = await transcribeMutation.mutateAsync({
          audioUrl: uploadResult.url,
        });

        const transcribedText = typeof transcriptionResult.text === 'string' 
          ? transcriptionResult.text 
          : JSON.stringify(transcriptionResult.text);
        
        setTranscription(transcribedText);
        onTranscriptionComplete?.(transcriptionResult.text);
        toast.success(t('recorder.messages.transcriptionComplete'));
      };

      reader.readAsDataURL(audioBlob);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('recorder.errors.transcriptionFailed');
      toast.error(message);
    } finally {
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
      const result = await enrichMutation.mutateAsync({
        text: transcription,
        mode: selectedMode,
      });
      
      const enrichedContent = typeof result.enrichedText === 'string'
        ? result.enrichedText
        : JSON.stringify(result.enrichedText);
      
      setEnrichedText(enrichedContent);
      toast.success(t('recorder.messages.enrichmentComplete'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('recorder.errors.enrichmentFailed');
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Recording Section */}
      <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          {/* Mic Icon with Animation */}
          <div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
            }`}
          >
            <Mic className="w-12 h-12 text-white" />
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse" />
            )}
          </div>

          {/* Duration Display */}
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900 dark:text-white font-mono">
              {formatDuration(duration)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {isRecording ? t('recorder.recording') : t('recorder.readyToRecord')}
            </p>
          </div>

          {/* Error Display */}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {/* Control Buttons */}
          <div className="flex gap-4 pt-4">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
              >
                <Mic className="w-4 h-4 mr-2" />
                {t('recorder.startRecording')}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStopRecording}
                  disabled={isTranscribing}
                  className="px-8 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                >
                  <Square className="w-4 h-4 mr-2" />
                  {t('recorder.stop')}
                </Button>
                <Button
                  onClick={cancelRecording}
                  variant="outline"
                  className="px-8 py-2"
                >
                  {t('recorder.cancel')}
                </Button>
              </>
            )}
          </div>

          {isTranscribing && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('recorder.recording')}
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Display */}
      {transcription && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('recorder.transcription')}
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {transcription}
          </p>
        </Card>
      )}

      {/* Enrichment Section */}
      {transcription && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('recorder.enrichmentOptions')}
          </h3>

          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              {(['summary', 'structure', 'format', 'context'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedMode === mode
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t(`recorder.${mode}`)}
                </button>
              ))}
            </div>

            {/* Enrich Button */}
            <Button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all"
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
        </Card>
      )}

      {/* Enriched Result Display with Export */}
      {enrichedText && (
        <>
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('recorder.enrichedResult')}
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  title={t('common.save')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowExportPanel(!showExportPanel)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  title="Export options"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {enrichedText}
            </p>
          </Card>

          {/* Export Panel */}
          {showExportPanel && (
            <ExportPanel
              transcription={transcription}
              enrichedResult={enrichedText}
              language={transcriptionLanguage}
              enrichmentMode={selectedMode}
              duration={duration}
              onClose={() => setShowExportPanel(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
