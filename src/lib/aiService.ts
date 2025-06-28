import { geminiService } from './geminiService';

export class AIService {
  private static instance: AIService;
  private openaiApiKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1';

  private constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public isConfigured(): boolean {
    return geminiService.isConfigured() || (!!this.openaiApiKey && this.openaiApiKey.length > 20);
  }

  public async generateStoryResponse(
    userMessage: string, 
    theme: string, 
    conversationHistory: any[]
  ): Promise<string> {
    // Try Gemini first, then fallback to OpenAI
    if (geminiService.isConfigured()) {
      try {
        return await geminiService.generateStoryResponse(userMessage, theme, conversationHistory);
      } catch (error) {
        console.error('Gemini failed, trying OpenAI:', error);
      }
    }

    if (this.openaiApiKey) {
      try {
        return await this.generateWithOpenAI(userMessage, theme, conversationHistory);
      } catch (error) {
        console.error('OpenAI failed:', error);
      }
    }

    return this.getFallbackResponse(userMessage, theme, conversationHistory.length);
  }

  public async generateCompleteStory(
    theme: string, 
    storyIdea: string, 
    conversationContext?: string
  ): Promise<string> {
    // Try Gemini first, then fallback to OpenAI
    if (geminiService.isConfigured()) {
      try {
        return await geminiService.generateCompleteStory(theme, storyIdea, conversationContext);
      } catch (error) {
        console.error('Gemini failed, trying OpenAI:', error);
      }
    }

    if (this.openaiApiKey) {
      try {
        return await this.generateCompleteStoryWithOpenAI(theme, storyIdea, conversationContext);
      } catch (error) {
        console.error('OpenAI failed:', error);
      }
    }

    return this.getFallbackStory(theme, storyIdea);
  }

  public async generateStoryIdeas(theme: string, count: number = 5): Promise<Array<{title: string, description: string, prompt: string}>> {
    // Try Gemini first, then fallback to OpenAI
    if (geminiService.isConfigured()) {
      try {
        return await geminiService.generateStoryIdeas(theme, count);
      } catch (error) {
        console.error('Gemini failed, trying OpenAI:', error);
      }
    }

    if (this.openaiApiKey) {
      try {
        return await this.generateStoryIdeasWithOpenAI(theme, count);
      } catch (error) {
        console.error('OpenAI failed:', error);
      }
    }

    return this.getFallbackStoryIdeas(theme, count);
  }

  private async generateWithOpenAI(
    userMessage: string, 
    theme: string, 
    conversationHistory: any[]
  ): Promise<string> {
    const systemPrompt = `You are a professional story writer and creative assistant specializing in ${theme} stories. 

Your role is to:
1. Help users develop their story ideas through conversation
2. Ask clarifying questions about plot, characters, and setting
3. Provide creative suggestions and plot developments
4. When the user is ready (after 3-4 exchanges or when they explicitly ask), generate a complete screenplay

Keep responses conversational, creative, and focused on ${theme} genre elements. When generating a complete story, format it as a proper screenplay with scene headings, character names, dialogue, and action descriptions.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await this.makeOpenAIRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 1500,
      temperature: 0.8,
    });

    return response.choices[0].message.content;
  }

  private async generateCompleteStoryWithOpenAI(
    theme: string, 
    storyIdea: string, 
    conversationContext?: string
  ): Promise<string> {
    const prompt = `Create a complete ${theme} story screenplay based on this concept: "${storyIdea}"

${conversationContext ? `Additional context from our conversation: ${conversationContext}` : ''}

Please format the story as a professional screenplay with:
- Scene headings (EXT./INT. LOCATION - TIME)
- Character names in ALL CAPS when speaking
- Dialogue
- Action descriptions in parentheses
- Multiple acts with clear story progression

The story should be engaging, well-structured, and approximately 1000-1500 words long.`;

    const response = await this.makeOpenAIRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are a professional screenplay writer specializing in ${theme} stories. Create engaging, well-structured stories with compelling characters and clear narrative arcs.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    return response.choices[0].message.content;
  }

  private async generateStoryIdeasWithOpenAI(theme: string, count: number): Promise<Array<{title: string, description: string, prompt: string}>> {
    const prompt = `Generate ${count} unique and creative ${theme} story ideas. For each idea, provide:
1. A compelling title
2. A brief description (1-2 sentences)
3. A conversation starter prompt to help develop the idea

Format as JSON array with objects containing "title", "description", and "prompt" fields.`;

    const response = await this.makeOpenAIRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are a creative story consultant specializing in ${theme} genre. Generate original, engaging story concepts.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.9,
    });

    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return this.getFallbackStoryIdeas(theme, count);
    }
  }

  private async makeOpenAIRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (response.status === 403) {
        throw new Error('API access forbidden. Please check your OpenAI account status.');
      } else {
        throw new Error(error.error?.message || `API request failed with status ${response.status}`);
      }
    }

    return response.json();
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
        },
        {
          title: "The Time Weaver",
          description: "A young mage discovers they can weave time itself, but each change creates dangerous ripples in reality.",
          prompt: "What event first triggers their time-weaving ability? What unintended consequences do they face?"
        },
        {
          title: "The Shadow Realm",
          description: "When shadows start disappearing from the world, a shadow-walker must journey to the realm of darkness to restore balance.",
          prompt: "What happens to people when their shadows disappear? What caused this phenomenon?"
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
        },
        {
          title: "The Quantum Mirror",
          description: "A scientist creates a device that shows alternate versions of reality, but something from another dimension is trying to cross over.",
          prompt: "What alternate realities does the mirror reveal? What entity is trying to cross dimensions and why?"
        },
        {
          title: "Neural Network",
          description: "When humanity's collective consciousness is connected through neural implants, one person discovers they can access everyone's thoughts.",
          prompt: "How does this person discover their unique ability? What dark secrets do they uncover in the collective mind?"
        },
        {
          title: "The Last Earth",
          description: "After Earth becomes uninhabitable, the final evacuation ship discovers that their destination planet is already occupied by future humans.",
          prompt: "How did future humans get there first? What conflict arises between the two groups of humanity?"
        }
      ],
      romance: [
        {
          title: "Love in Translation",
          description: "A translator working for the UN falls in love with someone who speaks a language that doesn't exist in any database.",
          prompt: "Where is this mysterious person from? What secrets are hidden in their unknown language?"
        },
        {
          title: "The Time Traveler's Heart",
          description: "A person keeps meeting the same stranger at different points in their life, but the stranger never ages.",
          prompt: "Who is this mysterious stranger? Are they time traveling, immortal, or something else entirely?"
        },
        {
          title: "Digital Hearts",
          description: "Two people fall in love through an AI dating app, not knowing they're actually talking to each other through AI translations.",
          prompt: "What happens when they discover the truth? How has the AI been translating their personalities?"
        }
      ],
      adventure: [
        {
          title: "The Lost City Expedition",
          description: "An archaeologist discovers a map to a city that appears in different locations throughout history.",
          prompt: "Why does this city move through time and space? What ancient secret does it protect?"
        },
        {
          title: "The Storm Chaser",
          description: "A meteorologist discovers that certain storms are actually gateways to other worlds.",
          prompt: "What worlds exist beyond these storm gateways? What happens when someone gets caught in one?"
        },
        {
          title: "The Deep Sea Mystery",
          description: "A marine biologist finds evidence of an advanced civilization living in the deepest parts of the ocean.",
          prompt: "How long has this civilization existed? Why have they remained hidden until now?"
        }
      ],
      mystery: [
        {
          title: "The Memory Detective",
          description: "A detective who can read the last memories of murder victims discovers that all recent cases are connected by impossible coincidences.",
          prompt: "What pattern connects these seemingly unrelated murders? What dark conspiracy is behind them?"
        },
        {
          title: "The Vanishing Town",
          description: "A journalist investigates a town where people keep disappearing, but no one seems to remember they ever existed.",
          prompt: "What's causing people to vanish from memory as well as physically? Who or what is behind this phenomenon?"
        },
        {
          title: "The Parallel Case",
          description: "A detective realizes they're investigating the same murder case as their counterpart in a parallel universe.",
          prompt: "How are these parallel detectives communicating? What happens when their cases start affecting each other's reality?"
        }
      ],
      comedy: [
        {
          title: "The Accidental Superhero",
          description: "A clumsy office worker gains superpowers but can only use them when they're embarrassed or awkward.",
          prompt: "What superpowers do they have? What hilarious situations arise from this unusual trigger?"
        },
        {
          title: "The Time Loop Café",
          description: "A barista gets stuck in a time loop, but only during their worst shift ever, and must figure out how to make it perfect.",
          prompt: "What makes this shift so terrible? What creative solutions do they try to break the loop?"
        },
        {
          title: "The Alien Exchange Student",
          description: "An alien exchange student tries to blend in at a human high school but keeps misunderstanding Earth customs.",
          prompt: "What Earth customs do they misunderstand most hilariously? How do they try to fit in?"
        }
      ],
      drama: [
        {
          title: "The Last Letter",
          description: "A postal worker discovers a bag of undelivered letters from 30 years ago and decides to deliver them, changing lives in unexpected ways.",
          prompt: "What secrets and stories are revealed in these old letters? How do they impact the recipients today?"
        },
        {
          title: "The Reunion",
          description: "Five childhood friends reunite for their friend's funeral, only to discover they each received a different version of a final message.",
          prompt: "What did their deceased friend want to tell each of them? What truth about their friendship is revealed?"
        },
        {
          title: "The Inheritance",
          description: "Siblings who haven't spoken in years must work together to solve puzzles left by their eccentric grandmother to claim their inheritance.",
          prompt: "What family secrets do the puzzles reveal? How does working together change their relationship?"
        }
      ],
      horror: [
        {
          title: "The Night Shift",
          description: "A security guard at a museum discovers that the exhibits come to life after midnight, and they're not all friendly.",
          prompt: "Which exhibits are dangerous? What ancient curse or power animates them?"
        },
        {
          title: "The Digital Ghost",
          description: "A programmer discovers that a deceased colleague's consciousness is trapped in the company's computer system, and it's not happy.",
          prompt: "How did the colleague's consciousness get trapped? What does this digital ghost want?"
        },
        {
          title: "The Inherited House",
          description: "A person inherits a house where every room exists in a different time period, and something evil is moving between them.",
          prompt: "What time periods do the rooms represent? What evil entity is using the house to travel through time?"
        }
      ]
    };

    const ideas = fallbackIdeas[theme as keyof typeof fallbackIdeas] || fallbackIdeas.fantasy;
    return ideas.slice(0, count);
  }
}

export const aiService = AIService.getInstance();