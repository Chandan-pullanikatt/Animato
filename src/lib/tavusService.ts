interface TavusVideoAgent {
  id: string;
  name: string;
  replica_id: string;
  status: 'active' | 'inactive';
  video_url?: string;
}

interface TavusConversationRequest {
  message: string;
  replica_id: string;
  context: string;
  background?: string;
}

interface TavusConversationResponse {
  id: string;
  video_url: string;
  audio_url?: string;
  transcript: string;
  duration: number;
  replica_id: string;
}

interface TavusReplicaRequest {
  replica_name: string;
  train_video_url?: string;
  callback_url?: string;
}

export class TavusService {
  private static instance: TavusService;
  private apiKey: string | null = null;
  private baseURL = 'https://tavusapi.com/v2';

  private constructor() {
    this.apiKey = (import.meta as any).env?.VITE_TAVUS_API_KEY || null;
    console.log('🎬 Tavus API configured:', !!this.apiKey);
    console.log('🎬 API Key length:', this.apiKey?.length || 0);
    if (this.apiKey) {
      console.log('🎬 API Key preview:', this.apiKey.substring(0, 8) + '...');
    }
  }

  public static getInstance(): TavusService {
    if (!TavusService.instance) {
      TavusService.instance = new TavusService();
    }
    return TavusService.instance;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 20;
  }

  public async createVideoAgent(character: any): Promise<TavusVideoAgent> {
    if (!this.isConfigured()) {
      return this.getDemoVideoAgent(character);
    }

    try {
      console.log('🎭 Creating Tavus replica for character:', character.name);

      const existingReplicas = await this.listReplicas();
      const existingReplica = existingReplicas.find(r => r.replica_name === character.name);

      if (existingReplica) {
        console.log('✅ Using existing Tavus replica:', existingReplica.replica_id);
        return {
          id: existingReplica.replica_id,
          name: character.name,
          replica_id: existingReplica.replica_id,
          status: 'active'
        };
      }

      const replicaPayload = {
        replica_name: character.name,
        train_video_url: character.photo_url || character.image_url || 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
        callback_url: 'https://example.com/tavus-callback'
      };

      console.log('📤 Tavus replica request payload:', replicaPayload);

      const response = await fetch(`${this.baseURL}/replicas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify(replicaPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tavus replica creation failed:', response.status, errorText);
        throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus replica created:', data);

      const replicaId = data.replica_id;
      await this.waitForReplicaReady(replicaId);

      return {
        id: replicaId,
        name: character.name,
        replica_id: replicaId,
        status: 'active'
      };
    } catch (error: any) {
      console.log('ℹ️ Tavus video agent unavailable, using demo mode:', error.message);
      return this.getDemoVideoAgent(character);
    }
  }

  public async generateConversationalVideo(request: TavusConversationRequest): Promise<TavusConversationResponse> {
    if (!this.isConfigured()) {
      return this.getDemoConversationalVideo(request);
    }

    if (!request.replica_id) {
      console.error('❌ No replica_id provided for video generation');
      return this.getDemoConversationalVideo(request);
    }

    try {
      console.log('🎬 Generating Tavus video with replica:', request.replica_id);

      const payload = {
        replica_id: request.replica_id,
        script: {
          type: 'text',
          input: request.message
        }
      };

      console.log('📤 Tavus video request payload:', payload);

      const response = await fetch(`${this.baseURL}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tavus video generation failed:', response.status, errorText);
        throw new Error(`Tavus video API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus video generated:', data);

      return {
        id: data.video_id,
        video_url: data.download_url || data.hosted_url,
        audio_url: data.audio_url || undefined,
        transcript: request.message,
        duration: data.duration || 30,
        replica_id: request.replica_id
      };
    } catch (error: any) {
      console.log('ℹ️ Tavus conversational video unavailable, using demo mode:', error.message);
      return this.getDemoConversationalVideo(request);
    }
  }

  private async waitForReplicaReady(replicaId: string, maxWaitTime: number = 30000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000;

    console.log('⏳ Waiting for replica to be ready:', replicaId);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${this.baseURL}/replicas/${replicaId}`, {
          headers: {
            'x-api-key': this.apiKey!,
          },
        });

        if (response.ok) {
          const replica = await response.json();
          console.log('🔍 Replica status:', replica.status);

          if (replica.status === 'ready') {
            console.log('✅ Replica is ready!');
            return;
          } else if (replica.status === 'error') {
            console.error('❌ Replica creation failed with error status');
            throw new Error(`Replica ${replicaId} is in error state: ${replica.error_message || 'Unknown error'}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('❌ Error checking replica status:', error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.log('⚠️ Replica may not be ready yet, but proceeding anyway...');
  }

  private async listReplicas(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/replicas`, {
        headers: {
          'x-api-key': this.apiKey!,
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to list Tavus replicas:', response.status);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Failed to list Tavus replicas:', error);
      return [];
    }
  }

  private getDemoVideoAgent(character: any): TavusVideoAgent {
    return {
      id: `demo-agent-${character.name.toLowerCase()}`,
      name: character.name,
      replica_id: `demo-replica-${character.name.toLowerCase()}`,
      status: 'active',
      video_url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
    };
  }

  private getDemoConversationalVideo(request: TavusConversationRequest): TavusConversationResponse {
    return {
      id: `demo-conv-${Date.now()}`,
      video_url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      audio_url: 'https://samplelib.com/lib/preview/mp3/sample-9s.mp3',
      transcript: request.message,
      duration: 5,
      replica_id: request.replica_id
    };
  }

  public async listVideoAgents(): Promise<TavusVideoAgent[]> {
    if (!this.isConfigured()) {
      return [
        {
          id: 'demo-agent-1',
          name: 'Story Guide',
          replica_id: 'demo-replica-1',
          status: 'active'
        },
        {
          id: 'demo-agent-2',
          name: 'Character Creator',
          replica_id: 'demo-replica-2',
          status: 'active'
        }
      ];
    }

    try {
      const replicas = await this.listReplicas();
      return replicas.map(replica => ({
        id: replica.replica_id,
        name: replica.replica_name,
        replica_id: replica.replica_id,
        status: replica.status === 'ready' ? 'active' : 'inactive'
      }));
    } catch (error) {
      console.error('Failed to list Tavus video agents:', error);
      return [];
    }
  }
}

export const tavusService = TavusService.getInstance();
