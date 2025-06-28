interface DappierCopilotRequest {
  query: string;
  context?: string;
  story_content?: string;
  characters?: any[];
  intent?: 'rewrite' | 'enhance' | 'suggest' | 'analyze' | 'search';
}

interface DappierResponse {
  id: string;
  response: string;
  suggestions: string[];
  story_modifications?: {
    original_text: string;
    modified_text: string;
    changes_explanation: string;
  };
  confidence: number;
}

interface DappierSearchRequest {
  query: string;
  search_type: 'characters' | 'plots' | 'themes' | 'writing_tips' | 'story_elements';
  filters?: {
    genre?: string;
    complexity?: string;
    target_audience?: string;
  };
}

export class DappierService {
  private static instance: DappierService;
  private apiKey: string | null = null;
  private baseURL = 'https://api.dappier.com/v1';
  private credits: number = 25; // $25 in free credits

  private constructor() {
    this.apiKey = (import.meta as any).env?.VITE_DAPPIER_API_KEY || null;
    console.log('🧠 Dappier AI Copilot configured:', !!this.apiKey);
  }

  public static getInstance(): DappierService {
    if (!DappierService.instance) {
      DappierService.instance = new DappierService();
    }
    return DappierService.instance;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 20;
  }

  // Smart Story Assistant
  public async getStoryAssistance(request: DappierCopilotRequest): Promise<DappierResponse> {
    if (!this.isConfigured()) {
      return this.getDemoResponse(request);
    }

    try {
      console.log('🧠 Getting Dappier AI assistance for:', request.intent);
      
      const response = await fetch(`${this.baseURL}/copilot/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Credits-Available': this.credits.toString()
        },
        body: JSON.stringify({
          query: request.query,
          context: {
            story_content: request.story_content || '',
            characters: request.characters || [],
            additional_context: request.context || ''
          },
          intent: request.intent || 'suggest',
          response_format: 'detailed'
        }),
      });

      if (!response.ok) {
        throw new Error(`Dappier API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update credits usage
      this.credits -= data.credits_used || 1;
      
      return {
        id: data.response_id,
        response: data.response,
        suggestions: data.suggestions || [],
        story_modifications: data.story_modifications,
        confidence: data.confidence || 0.85
      };
    } catch (error) {
      console.error('Dappier assistance failed:', error);
      return this.getDemoResponse(request);
    }
  }

  // Smart Search for Story Elements
  public async searchStoryElements(request: DappierSearchRequest): Promise<any[]> {
    if (!this.isConfigured()) {
      return this.getDemoSearchResults(request);
    }

    try {
      console.log('🔍 Searching with Dappier:', request.search_type);
      
      const response = await fetch(`${this.baseURL}/search/elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: request.query,
          search_type: request.search_type,
          filters: request.filters || {},
          limit: 10
        }),
      });

      if (!response.ok) {
        throw new Error(`Dappier search error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Dappier search failed:', error);
      return this.getDemoSearchResults(request);
    }
  }

  // Story Rewriting with AI
  public async rewriteStorySection(
    originalText: string, 
    instructions: string,
    targetAudience?: string
  ): Promise<DappierResponse> {
    const request: DappierCopilotRequest = {
      query: `Rewrite this text: "${originalText}" with instructions: ${instructions}`,
      story_content: originalText,
      intent: 'rewrite'
    };

    if (!this.isConfigured()) {
      return this.getDemoRewrite(originalText, instructions);
    }

    try {
      const response = await fetch(`${this.baseURL}/copilot/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          original_text: originalText,
          instructions: instructions,
          target_audience: targetAudience || 'general',
          preserve_style: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Dappier rewrite error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.rewrite_id,
        response: data.rewritten_text,
        suggestions: data.improvement_suggestions || [],
        story_modifications: {
          original_text: originalText,
          modified_text: data.rewritten_text,
          changes_explanation: data.changes_explanation
        },
        confidence: data.confidence || 0.9
      };
    } catch (error) {
      console.error('Dappier rewrite failed:', error);
      return this.getDemoRewrite(originalText, instructions);
    }
  }

  // Character Enhancement Suggestions
  public async enhanceCharacter(character: any): Promise<any> {
    const request: DappierCopilotRequest = {
      query: `Enhance this character: ${character.name} - ${character.description}`,
      characters: [character],
      intent: 'enhance'
    };

    return this.getStoryAssistance(request);
  }

  // Plot Twist Suggestions
  public async suggestPlotTwists(storyContent: string, characters: any[]): Promise<string[]> {
    const response = await this.getStoryAssistance({
      query: 'Suggest exciting plot twists for this story',
      story_content: storyContent,
      characters: characters,
      intent: 'suggest'
    });

    return response.suggestions;
  }

  // Get remaining credits
  public getRemainingCredits(): number {
    return Math.max(0, this.credits);
  }

  // Demo responses for non-configured environments
  private getDemoResponse(request: DappierCopilotRequest): DappierResponse {
    const responses = {
      rewrite: {
        response: "Here's a rewritten version with enhanced storytelling and better flow...",
        suggestions: [
          "Add more sensory details",
          "Strengthen character motivations", 
          "Include more dialogue",
          "Build tension gradually"
        ]
      },
      enhance: {
        response: "This character has great potential! Consider adding backstory depth and unique traits...",
        suggestions: [
          "Add a distinctive speaking pattern",
          "Include a hidden fear or motivation",
          "Give them a unique skill or hobby",
          "Create connections to other characters"
        ]
      },
      suggest: {
        response: "Based on your story, here are some creative directions you could explore...",
        suggestions: [
          "Introduce an unexpected ally",
          "Add a time-sensitive challenge",
          "Reveal a character's secret",
          "Create a moral dilemma"
        ]
      },
      analyze: {
        response: "Your story has strong character development and good pacing. Areas for improvement include...",
        suggestions: [
          "Strengthen the opening hook",
          "Add more conflict resolution",
          "Enhance world-building details",
          "Improve dialogue authenticity"
        ]
      },
      search: {
        response: "Here are some relevant story elements and suggestions based on your search...",
        suggestions: [
          "Explore character archetypes",
          "Consider plot structure templates",
          "Review similar themes in literature",
          "Research writing techniques"
        ]
      }
    };

    const intent = request.intent || 'suggest';
    const defaultResponse = responses[intent] || responses.suggest;

    return {
      id: `demo-${Date.now()}`,
      response: defaultResponse.response,
      suggestions: defaultResponse.suggestions,
      confidence: 0.8
    };
  }

  private getDemoSearchResults(request: DappierSearchRequest): any[] {
    const searchResults = {
      characters: [
        { name: "The Reluctant Hero", description: "A character who doesn't want power but must accept it" },
        { name: "The Wise Mentor", description: "An experienced guide with a mysterious past" },
        { name: "The Shapeshifter", description: "A character whose loyalty is constantly in question" }
      ],
      plots: [
        { title: "The Hero's Journey", description: "Classic quest narrative with personal growth" },
        { title: "Fish Out of Water", description: "Character in unfamiliar environment" },
        { title: "David vs Goliath", description: "Underdog facing overwhelming odds" }
      ],
      themes: [
        { theme: "Redemption", description: "Character seeking to make amends for past mistakes" },
        { theme: "Coming of Age", description: "Young person learning about the adult world" },
        { theme: "Identity Crisis", description: "Character questioning who they really are" }
      ],
      writing_tips: [
        { tip: "Show Don't Tell", description: "Use actions and dialogue to reveal character traits" },
        { tip: "Start In Media Res", description: "Begin your story in the middle of action" },
        { tip: "Create Conflict", description: "Every scene should have some form of tension" }
      ],
      story_elements: [
        { element: "Setting", description: "Time and place where your story occurs" },
        { element: "Point of View", description: "The perspective from which the story is told" },
        { element: "Foreshadowing", description: "Hints about future events in the story" }
      ]
    };

    return searchResults[request.search_type] || [];
  }

  private getDemoRewrite(originalText: string, instructions: string): DappierResponse {
    const enhancedText = originalText + " [Enhanced with improved pacing and character depth...]";
    
    return {
      id: `demo-rewrite-${Date.now()}`,
      response: enhancedText,
      suggestions: [
        "Add more vivid descriptions",
        "Strengthen character dialogue",
        "Include emotional stakes",
        "Enhance scene transitions"
      ],
      story_modifications: {
        original_text: originalText,
        modified_text: enhancedText,
        changes_explanation: `Applied: ${instructions}. Enhanced narrative flow and character depth.`
      },
      confidence: 0.85
    };
  }
}

export const dappierService = DappierService.getInstance(); 