import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTTS } from "@/hooks/useTTS";
import { Volume2, Zap } from "lucide-react";

export function TTSSettings() {
  const { voices, config, updateConfig, speak } = useTTS();
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current TTS settings from server
  const { data: settings } = trpc.settings.getSettings.useQuery();

  // Update TTS config mutation
  const updateTTSMutation = trpc.settings.updateTTSConfig.useMutation({
    onSuccess: () => {
      console.log("TTS settings saved successfully");
    },
    onError: (error) => {
      console.error("Failed to save TTS settings:", error);
    },
  });

  // Initialize local config from server settings
  useEffect(() => {
    if (settings?.settings) {
      const serverConfig = {
        voiceIndex: (settings.settings as any).ttsVoiceIndex ?? 0,
        rate: parseFloat((settings.settings as any).ttsRate as string) ?? 1,
        pitch: parseFloat((settings.settings as any).ttsPitch as string) ?? 1,
        volume: parseFloat((settings.settings as any).ttsVolume as string) ?? 1,
      };
      setLocalConfig(serverConfig);
      updateConfig(serverConfig);
    }
  }, [settings, updateConfig]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    updateTTSMutation.mutate({
      ttsVoiceIndex: localConfig.voiceIndex,
      ttsRate: localConfig.rate,
      ttsPitch: localConfig.pitch,
      ttsVolume: localConfig.volume,
    });
    setIsSaving(false);
  };

  const handleVoiceChange = (voiceIndex: string) => {
    const index = parseInt(voiceIndex);
    setLocalConfig((prev) => ({ ...prev, voiceIndex: index }));
    updateConfig({ voiceIndex: index });
  };

  const handleRateChange = (value: number[]) => {
    const rate = value[0];
    setLocalConfig((prev) => ({ ...prev, rate }));
    updateConfig({ rate });
  };

  const handlePitchChange = (value: number[]) => {
    const pitch = value[0];
    setLocalConfig((prev) => ({ ...prev, pitch }));
    updateConfig({ pitch });
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setLocalConfig((prev) => ({ ...prev, volume }));
    updateConfig({ volume });
  };

  const handleTestSpeak = () => {
    const testText = "This is a test of the text-to-speech system.";
    speak(testText);
  };

  const selectedVoice = voices[localConfig.voiceIndex];

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Text-to-Speech Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure voice synthesis for chat responses
        </p>
      </div>

      {/* Enable/Disable TTS */}
      <div className="flex items-center justify-between">
        <Label htmlFor="tts-enabled" className="text-base">
          Enable Text-to-Speech
        </Label>
        <Switch
          id="tts-enabled"
          checked={true}
          onCheckedChange={() => {}}
        />
      </div>

      {true && (
        <>
          {/* Voice Selection */}
          <div className="space-y-3">
            <Label htmlFor="voice-select" className="text-base">
              Voice
            </Label>
            <Select
              value={localConfig.voiceIndex.toString()}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger id="voice-select">
                <SelectValue
                  placeholder={selectedVoice?.name || "Select a voice"}
                />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice && (
              <p className="text-xs text-muted-foreground">
                {selectedVoice.name} - {selectedVoice.lang}
              </p>
            )}
          </div>

          {/* Speech Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Speech Rate</Label>
              <span className="text-sm font-medium">{localConfig.rate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[localConfig.rate]}
              onValueChange={handleRateChange}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust how fast the text is spoken (0.1x to 10x)
            </p>
          </div>

          {/* Pitch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Pitch</Label>
              <span className="text-sm font-medium">{localConfig.pitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[localConfig.pitch]}
              onValueChange={handlePitchChange}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust the pitch of the voice (0 to 2)
            </p>
          </div>

          {/* Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Volume</Label>
              <span className="text-sm font-medium">{Math.round(localConfig.volume * 100)}%</span>
            </div>
            <Slider
              value={[localConfig.volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust the volume of the speech (0% to 100%)
            </p>
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTestSpeak}
            variant="outline"
            className="w-full"
          >
            <Zap className="w-4 h-4 mr-2" />
            Test Voice
          </Button>
        </>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSaveSettings}
        disabled={isSaving || updateTTSMutation.isPending}
        className="w-full"
      >
        {isSaving || updateTTSMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </Card>
  );
}
