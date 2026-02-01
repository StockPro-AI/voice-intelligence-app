import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, X, Eye, EyeOff, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'chat' | 'embedding' | 'image' | 'audio';
  contextWindow?: number;
}

export function APIManager() {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'lmstudio' | 'ollama'>('openai');
  const [endpoint, setEndpoint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const saveApiKeyMutation = trpc.apiManager.saveApiKey.useMutation();
  const testConnectionMutation = trpc.apiManager.testConnection.useMutation();
  const getModelsMutation = trpc.apiManager.getAvailableModels.useMutation();

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error(t('apiManager.apiKeyRequired'));
      return;
    }

    setIsTesting(true);
    try {
      const result = await testConnectionMutation.mutateAsync({
        apiKey,
        provider,
        endpoint: endpoint || undefined,
      });

      setTestResult({
        success: true,
        message: result.message,
      });

      // Get available models after successful connection
      const modelsResult = await getModelsMutation.mutateAsync({
        apiKey,
        provider,
        endpoint: endpoint || undefined,
      });

      setAvailableModels(modelsResult.models);
      toast.success(t('apiManager.connectionSuccessful'));
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || t('apiManager.connectionFailed'),
      });
      toast.error(t('apiManager.connectionFailed'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t('apiManager.apiKeyRequired'));
      return;
    }

    if (!selectedModel) {
      toast.error(t('apiManager.modelRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await saveApiKeyMutation.mutateAsync({
        apiKey,
        provider,
        selectedModel,
        endpoint: endpoint || undefined,
      });

      toast.success(t('apiManager.apiKeySaved'));
      setApiKey('');
      setSelectedModel('');
    } catch (error: any) {
      toast.error(error.message || t('apiManager.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('apiManager.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiManager.description')}</p>
        </div>
      </div>

      {/* Provider Selection */}
      <Card className="p-6 bg-card border-border">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('apiManager.provider')}
        </label>
        <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
            <SelectItem value="lmstudio">LMStudio (Local)</SelectItem>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Endpoint Input for Local Services */}
      {(provider === 'lmstudio' || provider === 'ollama') && (
        <Card className="p-6 bg-card border-border">
          <label className="block text-sm font-medium text-foreground mb-2">
            Endpoint
          </label>
          <Input
            type="text"
            placeholder={provider === 'lmstudio' ? 'http://localhost:1234' : 'http://localhost:11434'}
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </Card>
      )}

      {/* API Key Input */}
      <Card className="p-6 bg-card border-border">
        <label className="block text-sm font-medium text-foreground mb-2">
          {(provider === 'lmstudio' || provider === 'ollama') ? 'API Key (optional)' : t('apiManager.apiKey')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={(provider === 'lmstudio' || provider === 'ollama') ? 'Leave empty for local services' : t('apiManager.apiKeyPlaceholder')}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || (!apiKey.trim() && provider !== 'lmstudio' && provider !== 'ollama')}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('apiManager.testing')}
              </>
            ) : (
              t('apiManager.test')
            )}
          </Button>
        </div>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card className={`p-4 border-2 ${testResult.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {testResult.message}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Available Models */}
      {availableModels.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('apiManager.selectModel')}
          </label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('apiManager.chooseModel')} />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">({model.type})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model Details */}
          {selectedModel && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              {availableModels.map((model) => {
                if (model.id === selectedModel) {
                  return (
                    <div key={model.id} className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-foreground">{t('apiManager.modelName')}:</span>
                        <span className="text-muted-foreground ml-2">{model.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{t('apiManager.provider')}:</span>
                        <span className="text-muted-foreground ml-2">{model.provider}</span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{t('apiManager.type')}:</span>
                        <span className="text-muted-foreground ml-2">{model.type}</span>
                      </div>
                      {model.contextWindow && (
                        <div>
                          <span className="font-medium text-foreground">{t('apiManager.contextWindow')}:</span>
                          <span className="text-muted-foreground ml-2">{model.contextWindow.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSaveApiKey}
        disabled={isLoading || !selectedModel}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('apiManager.saving')}
          </>
        ) : (
          t('apiManager.saveConfiguration')
        )}
      </Button>
    </div>
  );
}
