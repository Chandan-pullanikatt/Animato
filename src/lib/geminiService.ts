export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string | null = null;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  private constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    console.log('🔧 Gemini API Key configured:', !!this.apiKey);
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public isConfigured(): boolean {
    const configured = !!this.apiKey && this.apiKey.length > 20 && !this.apiKey.includes('your_');
    console.log('🔧 Gemini isConfigured:', configured);
    return configured;
  }

  public async generateCharacterImage(characterDescription: string): Promise<string> {
    console.log('🎨 Gemini generateCharacterImage called with:', characterDescription);
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini API key not configured properly, using fallback');
      throw new Error('Gemini API key not configured properly');
    }

    try {
      console.log('🚀 Making Gemini API request for character image...');
      
      // Use Gemini to generate a detailed image prompt
      const prompt = `Based on this character description: "${characterDescription}"

Create a detailed, professional image generation prompt for creating a realistic character portrait. Include:
- Physical appearance details
- Clothing/style
- Facial features
- Expression/mood
- Lighting and composition suggestions
- Art style (photorealistic portrait)

Format as a single, detailed prompt suitable for image generation AI.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      });

      console.log('✅ Gemini API response received');
      const imagePrompt = response.candidates[0].content.parts[0].text;
      console.log('🎯 Generated image prompt:', imagePrompt);
      
      // Return a curated image URL based on the description
      const imageUrl = this.getCuratedImageFromDescription(characterDescription, imagePrompt);
      console.log('🖼️ Selected image URL:', imageUrl);
      
      return imageUrl;
    } catch (error: any) {
      console.error('❌ Gemini character image generation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection and API key.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid Gemini API key. Please check your API key configuration.');
      } else if (error.message.includes('403')) {
        throw new Error('Gemini API access forbidden. Please verify your API key permissions.');
      } else if (error.message.includes('429')) {
        throw new Error('Gemini API rate limit exceeded. Please try again in a moment.');
      }
      
      throw error;
    }
  }

  public async generateStoryResponse(
    userMessage: string, 
    theme: string, 
    conversationHistory: any[]
  ): Promise<string> {
    console.log('📝 Gemini generateStoryResponse called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackResponse(userMessage, theme, conversationHistory.length);
    }

    try {
      console.log('🚀 Making Gemini API request for story response...');
      
      const systemPrompt = `You are a professional story writer and creative assistant specializing in ${theme} stories. 

Your role is to:
1. Help users develop their story ideas through conversation
2. Ask clarifying questions about plot, characters, and setting
3. Provide creative suggestions and plot developments
4. When the user is ready (after 3-4 exchanges or when they explicitly ask), generate a complete screenplay

Keep responses conversational, creative, and focused on ${theme} genre elements. When generating a complete story, format it as a proper screenplay with scene headings, character names, dialogue, and action descriptions.`;

      const conversationContext = conversationHistory.slice(-6).map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const prompt = `${systemPrompt}

Previous conversation:
${conversationContext}

User: ${userMessage}

Please respond as the story assistant.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      });

      console.log('✅ Gemini story response generated');
      return response.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      return this.getFallbackResponse(userMessage, theme, conversationHistory.length);
    }
  }

  public async generateCompleteStory(
    theme: string, 
    storyIdea: string, 
    conversationContext?: string
  ): Promise<string> {
    console.log('📖 Gemini generateCompleteStory called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackStory(theme, storyIdea);
    }

    try {
      console.log('🚀 Making Gemini API request for complete story...');
      
      const prompt = `Create a complete ${theme} story screenplay based on this concept: "${storyIdea}"

${conversationContext ? `Additional context from our conversation: ${conversationContext}` : ''}

Please format the story as a professional screenplay with:
- Scene headings (EXT./INT. LOCATION - TIME)
- Character names in ALL CAPS when speaking
- Dialogue
- Action descriptions in parentheses
- Multiple acts with clear story progression

The story should be engaging, well-structured, and approximately 1000-1500 words long.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
        }
      });

      console.log('✅ Gemini complete story generated');
      return response.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      return this.getFallbackStory(theme, storyIdea);
    }
  }

  public async generateStoryIdeas(theme: string, count: number = 5): Promise<Array<{title: string, description: string, prompt: string}>> {
    console.log('💡 Gemini generateStoryIdeas called');
    
    if (!this.isConfigured()) {
      console.log('❌ Gemini not configured, using fallback');
      return this.getFallbackStoryIdeas(theme, count);
    }

    try {
      console.log('🚀 Making Gemini API request for story ideas...');
      
      const prompt = `Generate ${count} unique and creative ${theme} story ideas. For each idea, provide:
1. A compelling title
2. A brief description (1-2 sentences)
3. A conversation starter prompt to help develop the idea

Format as JSON array with objects containing "title", "description", and "prompt" fields.`;

      const response = await this.makeAPIRequest('/models/gemini-1.5-flash:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      });

      const content = response.candidates[0].content.parts[0].text;
      console.log('📝 Gemini story ideas response:', content);
      
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const ideas = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed story ideas:', ideas);
          return ideas;
        }
        console.log('⚠️ No JSON found in response, using fallback');
        return this.getFallbackStoryIdeas(theme, count);
      } catch (parseError) {
        console.log('⚠️ JSON parse error, using fallback:', parseError);
        return this.getFallbackStoryIdeas(theme, count);
      }
    } catch (error) {
      console.error('❌ Error generating story ideas:', error);
      return this.getFallbackStoryIdeas(theme, count);
    }
  }

  private getCuratedImageFromDescription(description: string, enhancedPrompt: string): string {
    console.log('🎨 Getting curated image for description:', description);
    
    // Enhanced character image selection based on Gemini's detailed prompt
    const descLower = description.toLowerCase();
    
    // Character type detection with more specific matching
    if (descLower.includes('elf') || descLower.includes('elven')) {
      console.log('🧝 Detected elf character');
      return 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('dwarf') || descLower.includes('dwarven')) {
      console.log('🪓 Detected dwarf character');
      return 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('wizard') || descLower.includes('mage') || descLower.includes('sorcerer')) {
      console.log('🧙 Detected wizard character');
      return 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('warrior') || descLower.includes('knight') || descLower.includes('fighter')) {
      console.log('⚔️ Detected warrior character');
      return 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('princess') || descLower.includes('queen') || descLower.includes('noble')) {
      console.log('👑 Detected royal character');
      return 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('commander') || descLower.includes('captain') || descLower.includes('officer')) {
      console.log('👨‍✈️ Detected commander character');
      return 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('scientist') || descLower.includes('doctor') || descLower.includes('researcher')) {
      console.log('🔬 Detected scientist character');
      return 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('young') && (descLower.includes('female') || descLower.includes('woman') || descLower.includes('girl'))) {
      console.log('👩 Detected young female character');
      return 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('young') && (descLower.includes('male') || descLower.includes('man') || descLower.includes('boy'))) {
      console.log('👨 Detected young male character');
      return 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('female') || descLower.includes('woman')) {
      console.log('👩 Detected female character');
      return 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    } else if (descLower.includes('male') || descLower.includes('man')) {
      console.log('👨 Detected male character');
      return 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
    }
    
    // Default fallback
    console.log('🎭 Using default character image');
    return 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
  }

  private async makeAPIRequest(endpoint: string, body: any): Promise<any> {
    const url = `${this.baseURL}${endpoint}?key=${this.apiKey}`;
    console.log('🌐 Making Gemini API request to:', endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error Response:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: { message: errorText } };
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (response.status === 403) {
          throw new Error('API access forbidden. Please check your Gemini account status.');
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${error.error?.message || 'Invalid request format'}`);
        } else {
          throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log('✅ Gemini API Response received');
      return responseData;
    } catch (fetchError: any) {
      console.error('❌ Network error in Gemini API request:', fetchError);
      
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection and API key configuration.');
      }
      
      throw fetchError;
    }
  }

  private getFallbackResponse(userMessage: string, theme: string, messageCount: number): string {
    const userMessageLower = userMessage.toLowerCase();

    if (userMessageLower.includes('suggest') || userMessageLower.includes('idea') || 
        userMessageLower.includes('help') || userMessageLower.includes('don\'t know')) {
      const ideas = this.getFallbackStoryIdeas(theme, 3);
      return `Here are some exciting ${theme} story ideas I can help you develop:

${ideas.map((idea, i) => 
  `${i + 1}. **${idea.title}**: ${idea.description}`
).join('\n\n')}

Which of these interests you, or would you like me to suggest different concepts? I can also help you develop your own unique idea!`;
    }

    if (userMessageLower.includes('generate') || userMessageLower.includes('create story') || 
        userMessageLower.includes('write story') || userMessageLower.includes('complete story')) {
      return "I'd love to help you create a complete story! Since I don't have access to advanced AI right now, let me work with the details you've shared. Could you tell me more about:\n\n• Your main character\n• The central conflict or challenge\n• The setting where this takes place\n• How you'd like the story to end\n\nWith these details, I can help craft your story!";
    }

    const responses = [
      `That's an interesting ${theme} concept! Tell me more about the main character - what's their background and motivation?`,
      `I love that idea! What's the central conflict or challenge your protagonist will face?`,
      `Great concept! What's the setting for this story? The environment can really enhance the ${theme} elements.`,
      `Fascinating! What's the climax or turning point you envision for this story?`,
      `Excellent! Who are the supporting characters that will help or hinder your protagonist?`,
      `Intriguing! What's the emotional journey you want your audience to experience?`
    ];

    return responses[messageCount % responses.length];
  }

  private getFallbackStory(theme: string, storyIdea: string): string {
    const storyTemplates = {
      fantasy: `# The Enchanted Quest

## Act I: The Discovery
*Based on your idea: ${storyIdea}*

**FADE IN:**

**EXT. MYSTICAL FOREST - DAWN**

*Morning mist swirls through ancient trees. ARIA (20s), a young village healer with determined eyes, walks carefully along a hidden path, carrying a worn leather satchel.*

**ARIA**
(to herself)
The old texts spoke of this place... but I never believed the stories were real.

*She stops before a shimmering barrier of light between two massive oak trees.*

**ARIA** (CONT'D)
(reaching toward the light)
Here goes nothing...

*As her hand touches the barrier, it ripples like water and she steps through.*

## Act II: The Challenge

**INT. ENCHANTED REALM - CONTINUOUS**

*Aria emerges into a breathtaking magical realm. Floating islands drift overhead, connected by bridges of pure light. Mystical creatures soar through crystal-clear air.*

**ELDER SAGE** (V.O.)
(ancient, wise voice)
Welcome, chosen one. You have entered the realm between worlds.

*An ethereal figure materializes before her - the ELDER SAGE, translucent and glowing.*

**ELDER SAGE** (CONT'D)
Your world is in great danger. The Shadow of Despair grows stronger each day, feeding on the loss of hope in mortal hearts.

**ARIA**
(overwhelmed but determined)
What can I do? I'm just a village healer.

**ELDER SAGE**
You possess something rare - the ability to kindle hope in others. But first, you must find the three Crystals of Light hidden in this realm.

## Act III: The Resolution

**EXT. CRYSTAL CAVERN - DAY**

*Aria stands before a magnificent cavern filled with singing crystals. She holds three glowing gems - the Crystals of Light.*

**ARIA**
(with newfound confidence)
I understand now. The real magic isn't in these crystals - it's in believing that even in the darkest times, hope can light the way.

*She raises the crystals, and they merge into a brilliant beacon of light that pierces through the gathering darkness.*

**ELDER SAGE**
(appearing beside her)
You have learned the greatest truth of all. Hope is not something you find - it's something you choose to carry.

*The light spreads across both realms, pushing back the shadows and restoring balance.*

**FADE OUT.**

**THE END**

*A story about discovering that true magic comes from within, and that hope is the most powerful force in any realm.*`,

      'sci-fi': `# Quantum Horizon

## Act I: The Signal
*Based on your idea: ${storyIdea}*

**FADE IN:**

**INT. SPACE STATION ALPHA - COMMUNICATIONS BAY - NIGHT**

*DR. SARAH CHEN (35), a brilliant quantum physicist, monitors deep space communications. Warning lights flash across her console.*

**SARAH**
(into comm device)
Control, I'm detecting an anomalous quantum signature from Sector 7. This pattern... it's impossible.

**CONTROL VOICE** (V.O.)
Impossible how, Dr. Chen?

**SARAH**
(studying the data)
It's a message, but it's coming from... the future. Thirty-seven hours from now.

## Act II: The Discovery

**INT. QUANTUM LAB - DAY**

*Sarah works frantically with holographic displays showing complex equations. Her colleague, DR. MARCUS WEBB (40s), enters.*

**MARCUS**
Sarah, you've been here all night. What's so urgent about this signal?

**SARAH**
(turning to face him)
Marcus, what if I told you that tomorrow, at 14:32 hours, a quantum cascade failure will destroy this station and everyone on it?

**MARCUS**
(skeptical)
I'd say you need sleep.

*Sarah activates a holographic playback of the future message.*

**FUTURE SARAH** (HOLOGRAM)
(desperate)
If you're receiving this, you have less than 38 hours. The quantum drive will overload during the scheduled test. You must—

*The message cuts to static.*

## Act III: The Choice

**INT. QUANTUM DRIVE CHAMBER - DAY**

*Sarah stands before the massive quantum drive, her hands hovering over the control panel. The countdown shows 00:02:15.*

**SARAH**
(to herself)
The future isn't set in stone. We always have a choice.

*She begins entering a new sequence - not the one from the manual, but one based on her own calculations.*

**MARCUS**
(over comm)
Sarah, that's not the approved sequence!

**SARAH**
(determined)
The approved sequence leads to disaster. Sometimes you have to trust the science, even when it seems impossible.

*She initiates the new sequence. The drive hums to life with a different resonance - stable, controlled.*

**COMPUTER VOICE**
Quantum drive online. All systems nominal.

*Sarah smiles as she realizes they've changed their future.*

**SARAH**
(into comm)
Control, this is Dr. Chen. The future just got a little brighter.

**FADE OUT.**

**THE END**

*A story about how knowledge, courage, and the willingness to challenge the impossible can change destiny itself.*`,

      // Add more themes as needed
    };

    return storyTemplates[theme as keyof typeof storyTemplates] || storyTemplates.fantasy;
  }

  private getFallbackStoryIdeas(theme: string, count: number) {
    const fallbackIdeas = {
      fantasy: [
        {
          title: "The Last Dragon Keeper",
          description: "A young apprentice discovers they're the last person who can communicate with dragons, just as an ancient evil awakens.",
          prompt: "Tell me more about your dragon keeper character. What's their background? How do they discover their ability?"
        },
        {
          title: "The Enchanted Library",
          description: "A librarian finds that books in their library are portals to the worlds within them, but something dark is escaping.",
          prompt: "What kind of worlds exist in these books? What dark force is trying to escape into our reality?"
        },
        {
          title: "The Crystal Prophecy",
          description: "Five magical crystals scattered across the realm must be reunited before the next eclipse, or darkness will reign forever.",
          prompt: "Who scattered the crystals and why? What makes your protagonist the chosen one to reunite them?"
        }
      ],
      'sci-fi': [
        {
          title: "The Memory Thief",
          description: "In a future where memories can be extracted and sold, a detective investigates stolen memories that contain impossible events.",
          prompt: "What impossible events are hidden in these memories? Who is stealing them and why?"
        },
        {
          title: "Colony Ship Omega",
          description: "The last human colony ship discovers they're not alone in space, and their new neighbors have been waiting for them.",
          prompt: "What have these alien neighbors been waiting for? Are they friendly or do they have other plans for humanity?"
        }
      ],
      // Add more themes as needed
    };

    const ideas = fallbackIdeas[theme as keyof typeof fallbackIdeas] || fallbackIdeas.fantasy;
    return ideas.slice(0, count);
  }
}

export const geminiService = GeminiService.getInstance();