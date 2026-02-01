import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { transcribeAudio } from '../_core/voiceTranscription';
import { invokeLLM } from '../_core/llm';
import { storagePut } from '../storage';
import { nanoid } from 'nanoid';

export const transcriptionRouter = router({
  transcribeAudio: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[Transcription] Starting transcription for URL:', input.audioUrl);
        
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });

        if ('error' in result) {
          console.error('[Transcription] Transcription error:', result.error, result.details);
          throw new Error(`${result.error}${result.details ? `: ${result.details}` : ''}`);
        }

        console.log('[Transcription] Transcription successful, text length:', result.text.length);
        
        return {
          success: true,
          text: result.text,
          language: result.language || 'unknown',
          segments: result.segments || [],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        console.error('[Transcription] Error:', message);
        throw new Error(`Transcription error: ${message}`);
      }
    }),

  transcribeAudioDirect: publicProcedure
    .input(
      z.object({
        audioData: z.string(), // Base64 encoded
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[Transcription] Starting direct transcription');
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audioData, 'base64');
        console.log('[Transcription] Audio buffer size:', audioBuffer.length, 'bytes');
        
        // Upload to storage first to get a URL
        const fileKey = `audio/temp/${nanoid()}.webm`;
        const { url: audioUrl } = await storagePut(fileKey, audioBuffer, 'audio/webm');
        
        console.log('[Transcription] Audio uploaded to:', audioUrl);
        
        // Now transcribe using the URL
        const result = await transcribeAudio({
          audioUrl,
          language: input.language,
        });

        if ('error' in result) {
          console.error('[Transcription] Transcription error:', result.error, result.details);
          throw new Error(`${result.error}${result.details ? `: ${result.details}` : ''}`);
        }

        console.log('[Transcription] Direct transcription successful');
        
        return {
          success: true,
          text: result.text,
          language: result.language || 'unknown',
          segments: result.segments || [],
          audioUrl,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        console.error('[Transcription] Direct transcription error:', message);
        throw new Error(`Transcription error: ${message}`);
      }
    }),

  enrichTranscription: publicProcedure
    .input(
      z.object({
        text: z.string(),
        mode: z.enum(['summary', 'structure', 'format', 'context']),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[Enrichment] Starting enrichment with mode:', input.mode);
        
        const prompts = {
          summary: `Erstelle eine prägnante Zusammenfassung des folgenden Textes in 2-3 Sätzen:\n\n${input.text}`,
          structure: `Strukturiere den folgenden Text mit Überschriften und Aufzählungspunkten:\n\n${input.text}`,
          format: `Formatiere den folgenden Text als strukturierte Notiz mit klaren Abschnitten:\n\n${input.text}`,
          context: `Analysiere den folgenden Text im Kontext von: ${input.context}\n\nText:\n${input.text}`,
        };

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Du bist ein hilfreicher Assistent, der Transkripte intelligent aufbereitet.',
            },
            {
              role: 'user',
              content: prompts[input.mode],
            },
          ],
        });

        const enrichedText =
          response.choices[0]?.message.content || 'Enrichment failed';

        console.log('[Enrichment] Enrichment successful');
        
        return {
          success: true,
          enrichedText,
          mode: input.mode,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Enrichment failed';
        console.error('[Enrichment] Error:', message);
        throw new Error(`Enrichment error: ${message}`);
      }
    }),

  uploadAudio: publicProcedure
    .input(
      z.object({
        audioData: z.string(), // Base64 encoded
        filename: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[Upload] Starting audio upload:', input.filename);
        
        const buffer = Buffer.from(input.audioData, 'base64');
        console.log('[Upload] Buffer size:', buffer.length, 'bytes');
        
        const fileKey = `audio/${nanoid()}-${input.filename}`;

        const { url } = await storagePut(fileKey, buffer, 'audio/webm');

        console.log('[Upload] Audio uploaded successfully:', url);
        
        return {
          success: true,
          url,
          fileKey,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('[Upload] Error:', message);
        throw new Error(`Upload error: ${message}`);
      }
    }),
});
