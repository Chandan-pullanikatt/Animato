interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples: string[];
  category: 'premade' | 'cloned' | 'professional' | 'instant';
  description: string;
  preview_url: string;
  use_speaker_boost: boolean;
  fine_tuning: {
    model_id: string;
  };
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: VoiceSettings;
  pronunciation_dictionary_locators?: any[];
}

interface VoiceCloneRequest {
  name: string;
  description: string;
  files: File[];
  remove_background_noise?: boolean;
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string | null = null;
  private baseURL = 'https://api.elevenlabs.io/v1';

  private constructor() {
    this.apiKey = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY || null;
    console.log('🎙️ ElevenLabs Creator Tier configured:', !!this.apiKey);
  }

  public static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 20;
  }

  // Premium Creator Tier Features
  public async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isConfigured()) {
      return this.getDemoVoices();
    }

    try {
      const response = await fetch(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey!,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        samples: voice.samples || [],
        category: voice.category || 'premade',
        description: voice.description || '',
        preview_url: voice.preview_url || '',
        use_speaker_boost: voice.settings?.use_speaker_boost || false,
        fine_tuning: voice.fine_tuning || { model_id: 'eleven_turbo_v2' }
      }));
    } catch (error) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      return this.getDemoVoices();
    }
  }

  public async generateSpeech(request: TextToSpeechRequest): Promise<string> {
    if (!this.isConfigured()) {
      return this.getDemoAudio(request.text);
    }

    try {
      console.log('🎙️ Generating premium speech with ElevenLabs Creator Tier...');
      
      const response = await fetch(`${this.baseURL}/text-to-speech/${request.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_turbo_v2', // Creator Tier model
          voice_settings: {
            stability: request.voice_settings?.stability || 0.5,
            similarity_boost: request.voice_settings?.similarity_boost || 0.8,
            style: request.voice_settings?.style || 0.0,
            use_speaker_boost: request.voice_settings?.use_speaker_boost || true
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('✅ Premium speech generated successfully');
      return audioUrl;
    } catch (error) {
      console.error('ElevenLabs speech generation failed:', error);
      return this.getDemoAudio(request.text);
    }
  }

  // NEW: Voice Cloning (Creator Tier Feature)
  public async cloneVoice(request: VoiceCloneRequest): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key required for voice cloning');
    }

    try {
      console.log('🧬 Cloning voice with Creator Tier access...');
      
      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('description', request.description);
      
      request.files.forEach((file, index) => {
        formData.append('files', file, `sample_${index}.wav`);
      });

      if (request.remove_background_noise) {
        formData.append('remove_background_noise', 'true');
      }

      const response = await fetch(`${this.baseURL}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey!,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voice cloning error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Voice cloned successfully:', data.voice_id);
      return data.voice_id;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      throw error;
    }
  }

  // NEW: Get User Subscription Info
  public async getSubscriptionInfo(): Promise<any> {
    if (!this.isConfigured()) {
      return { tier: 'demo', credits_remaining: 0 };
    }

    try {
      const response = await fetch(`${this.baseURL}/user/subscription`, {
        headers: {
          'xi-api-key': this.apiKey!,
        },
      });

      if (!response.ok) {
        throw new Error(`Subscription info error: ${response.status}`);
      }

      const data = await response.json();
      return {
        tier: data.tier || 'creator',
        credits_remaining: data.character_count || 100000,
        credits_used: data.character_limit - (data.character_count || 0),
        next_character_count_reset_unix: data.next_character_count_reset_unix
      };
    } catch (error) {
      console.error('Failed to get subscription info:', error);
      return { tier: 'creator', credits_remaining: 100000 };
    }
  }

  // Premium voice mapping for characters
  public getOptimalVoiceForCharacter(character: any): string {
    const premiumVoices = {
      // Professional voices for different character types
      'young_male': 'pNInz6obpgDQGcFmaJgB', // Adam - Young male
      'young_female': 'EXAVITQu4vr4xnSDxMaL', // Bella - Young female  
      'mature_male': '29vD33N1CtxCmqQRPOHJ', // Drew - Mature male
      'mature_female': 'MF3mGyEYCl7XYWbV9V6O', // Elli - Mature female
      'elderly_male': 'VR6AewLTigWG4xSOukaG', // Arnold - Elderly male
      'elderly_female': 'oWAxZDx7w5VEj9dCyTzz', // Grace - Elderly female
      'narrator': 'pqHfZKP75CvOlQylNhV4', // Bill - Professional narrator
      'child': 'nPczCjzI2devNBz1zQrb', // Brian - Child-like
      'dramatic': 'g5CIjZEefAph4nQFvHAz', // Gigi - Dramatic female
      'mysterious': 'cgSgspJ2msm6clMCkdW9'  // Jessica - Mysterious
    };

    // Determine voice based on character attributes
    if (character.appearance?.age === 'child') return premiumVoices.child;
    if (character.role === 'narrator') return premiumVoices.narrator;
    if (character.personality?.includes('mysterious')) return premiumVoices.mysterious;
    if (character.personality?.includes('dramatic')) return premiumVoices.dramatic;
    
    // Age and gender based selection
    const age = character.appearance?.age || 'adult';
    const gender = character.appearance?.gender || 'male';
    
    if (age === 'elderly') {
      return gender === 'female' ? premiumVoices.elderly_female : premiumVoices.elderly_male;
    } else if (age === 'young' || age === 'teenager') {
      return gender === 'female' ? premiumVoices.young_female : premiumVoices.young_male;
    } else {
      return gender === 'female' ? premiumVoices.mature_female : premiumVoices.mature_male;
    }
  }

  // Enhanced audio generation with Creator Tier features
  public async generateCharacterSpeech(text: string, character: any): Promise<string> {
    const voiceId = this.getOptimalVoiceForCharacter(character);
    
    return await this.generateSpeech({
      text: text,
      voice_id: voiceId,
      model_id: 'eleven_turbo_v2', // Creator Tier model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: character.personality?.includes('dramatic') ? 0.3 : 0.0,
        use_speaker_boost: true // Creator Tier feature
      }
    });
  }

  private getDemoVoices(): ElevenLabsVoice[] {
    return [
      {
        voice_id: 'demo-adam',
        name: 'Adam (Demo)',
        samples: [],
        category: 'premade',
        description: 'Young male voice - Demo mode',
        preview_url: '',
        use_speaker_boost: false,
        fine_tuning: { model_id: 'demo' }
      },
      {
        voice_id: 'demo-bella',
        name: 'Bella (Demo)', 
        samples: [],
        category: 'premade',
        description: 'Young female voice - Demo mode',
        preview_url: '',
        use_speaker_boost: false,
        fine_tuning: { model_id: 'demo' }
      }
    ];
  }

  private getDemoAudio(text: string): string {
    // Return a demo audio blob URL for development
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
    return 'demo-audio-url';
  }

  public getCreatorTierFeatures(): string[] {
    return [
      '✨ 100,000 credits per month',
      '🎭 Professional voice cloning',
      '🔊 192 kbps premium audio quality',
      '⚡ Turbo v2 model access',
      '🎯 Speaker boost technology',
      '🎨 Advanced voice styles',
      '📈 Usage analytics',
      '🎪 Commercial license included'
    ];
  }

  // NEW: Get theme-optimized voice for story narration
  public getThemeOptimizedVoice(theme: string): { voice_id: string; settings: VoiceSettings } {
    const themeVoices: Record<string, { voice_id: string; settings: VoiceSettings }> = {
      fantasy: {
        voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, storytelling voice
        settings: { stability: 0.7, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
      },
      'sci-fi': {
        voice_id: 'ErXwobaYiN019PkySvjV', // Antoni - crisp, futuristic
        settings: { stability: 0.6, similarity_boost: 0.9, style: 0.2, use_speaker_boost: true }
      },
      horror: {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli - mysterious, whispery
        settings: { stability: 0.8, similarity_boost: 0.7, style: 0.6, use_speaker_boost: false }
      },
      romance: {
        voice_id: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - soft, emotional
        settings: { stability: 0.7, similarity_boost: 0.9, style: 0.4, use_speaker_boost: true }
      },
      drama: {
        voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - dramatic, expressive
        settings: { stability: 0.6, similarity_boost: 0.8, style: 0.5, use_speaker_boost: true }
      },
      adventure: {
        voice_id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - energetic, clear
        settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
      },
      comedy: {
        voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - friendly, upbeat
        settings: { stability: 0.5, similarity_boost: 0.7, style: 0.2, use_speaker_boost: true }
      },
      mystery: {
        voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - deep, mysterious
        settings: { stability: 0.8, similarity_boost: 0.8, style: 0.4, use_speaker_boost: false }
      }
    };

    return themeVoices[theme] || themeVoices.fantasy;
  }

  // NEW: Generate story-specific narration with Creator Tier
  public async generateStoryNarration(
    storyText: string, 
    theme: string,
    characterVoices?: Map<string, string>
  ): Promise<{ audioUrl: string; segments: any[] }> {
    if (!this.isConfigured()) {
      return {
        audioUrl: this.getDemoAudio(storyText),
        segments: [{ text: storyText, type: 'narration', audioUrl: this.getDemoAudio(storyText) }]
      };
    }

    try {
      console.log('🎙️ Generating Creator Tier story narration...');
      
      // Split story into narration and dialogue segments
      const segments = this.parseStorySegments(storyText);
      const audioSegments = [];

      for (const segment of segments) {
        let voiceConfig;
        
        if (segment.type === 'narration') {
          voiceConfig = this.getThemeOptimizedVoice(theme);
        } else if (segment.type === 'dialogue' && characterVoices?.has(segment.character)) {
          const characterVoiceId = characterVoices.get(segment.character);
          voiceConfig = {
            voice_id: characterVoiceId,
            settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
          };
        } else {
          voiceConfig = this.getThemeOptimizedVoice(theme);
        }

        const audioUrl = await this.generateSpeech({
          text: segment.text,
          voice_id: voiceConfig.voice_id,
          voice_settings: voiceConfig.settings,
          model_id: 'eleven_turbo_v2' // Creator Tier model
        });

        audioSegments.push({
          ...segment,
          audioUrl,
          voiceId: voiceConfig.voice_id
        });
      }

      // For now, return the first segment's audio as primary
      // In a full implementation, you'd concatenate all segments
      const primaryAudio = audioSegments[0]?.audioUrl || this.getDemoAudio(storyText);

      return {
        audioUrl: primaryAudio,
        segments: audioSegments
      };

    } catch (error) {
      console.error('Story narration generation failed:', error);
      return {
        audioUrl: this.getDemoAudio(storyText),
        segments: [{ text: storyText, type: 'narration', audioUrl: this.getDemoAudio(storyText) }]
      };
    }
  }

  // NEW: Parse story into narration and dialogue segments
  private parseStorySegments(storyText: string): Array<{
    text: string;
    type: 'narration' | 'dialogue';
    character?: string;
  }> {
    const segments = [];
    const lines = storyText.split('\n');
    let currentNarration = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for dialogue (format: **CHARACTER**: text or "text" - Character)
      const dialogueMatch = trimmed.match(/^\*\*([A-Z][A-Z\s]+)\*\*:?\s*(.+)/) || 
                           trimmed.match(/"([^"]+)"\s*-\s*([A-Z][A-Za-z\s]+)/);

      if (dialogueMatch) {
        // Save any accumulated narration first
        if (currentNarration.trim()) {
          segments.push({
            text: currentNarration.trim(),
            type: 'narration'
          });
          currentNarration = '';
        }

        // Add dialogue segment
        const character = dialogueMatch[1] || dialogueMatch[2];
        const dialogue = dialogueMatch[2] || dialogueMatch[1];
        
        if (character && dialogue) {
          segments.push({
            text: dialogue.trim(),
            type: 'dialogue' as const,
            character: character.trim().toUpperCase()
          });
        }
      } else {
        // Accumulate narration
        currentNarration += (currentNarration ? ' ' : '') + trimmed;
      }
    }

    // Add any remaining narration
    if (currentNarration.trim()) {
      segments.push({
        text: currentNarration.trim(),
        type: 'narration' as const
      });
    }

    return segments;
  }

  // NEW: Generate voices for extracted characters using Creator Tier
  public async generateCharacterVoices(characters: any[]): Promise<Map<string, string>> {
    const characterVoices = new Map<string, string>();
    
    if (!this.isConfigured()) {
      // Return demo voice mappings
      characters.forEach(char => {
        characterVoices.set(char.name.toUpperCase(), this.getOptimalVoiceForCharacter(char));
      });
      return characterVoices;
    }

    try {
      console.log('🎭 Generating character voices with Creator Tier...');
      
      for (const character of characters) {
        const voiceId = this.getOptimalVoiceForCharacter(character);
        characterVoices.set(character.name.toUpperCase(), voiceId);
      }

      return characterVoices;
    } catch (error) {
      console.error('Character voice generation failed:', error);
      return characterVoices;
    }
  }
}

export const elevenLabsService = ElevenLabsService.getInstance(); 