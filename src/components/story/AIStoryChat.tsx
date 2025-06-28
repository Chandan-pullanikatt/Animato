import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, RefreshCw, Lightbulb, Wand2, AlertCircle, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { aiService } from '../../lib/aiService';
import { geminiService } from '../../lib/geminiService';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface StoryTemplate {
  title: string;
  description: string;
  prompt: string;
}

interface AIStoryChatProps {
  theme: string;
  onStoryGenerated: (story: string) => void;
  isGenerating: boolean;
}

export const AIStoryChat: React.FC<AIStoryChatProps> = ({ 
  theme, 
  onStoryGenerated, 
  isGenerating 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI story assistant powered by ${geminiService.isConfigured() ? 'Gemini AI' : 'advanced AI'}. I'll help you create an amazing ${theme} story. 

You can either:
🎯 Tell me your own story idea
💡 Ask me to suggest some ${theme} story concepts
✨ Let me create a complete story for you

What would you like to do?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [storyTemplates, setStoryTemplates] = useState<StoryTemplate[]>([]);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [storyGenerated, setStoryGenerated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setApiConfigured(aiService.isConfigured());
    generateStoryTemplates();
  }, [theme]);

  const generateStoryTemplates = async () => {
    try {
      const templates = await aiService.generateStoryIdeas(theme, 3);
      setStoryTemplates(templates);
    } catch (error) {
      console.error('Error generating templates:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || isLoadingStory) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      let aiResponse: string;

      // Check if user wants to generate a complete story
      const userMessageLower = userMessage.content.toLowerCase();
      const shouldGenerateStory = userMessageLower.includes('generate') || 
                                  userMessageLower.includes('create story') || 
                                  userMessageLower.includes('write story') || 
                                  userMessageLower.includes('complete story') ||
                                  userMessageLower.includes('full story') ||
                                  messages.filter(m => m.type === 'user').length >= 2; // Auto-generate after 2 user messages

      if (shouldGenerateStory) {
        // Show loading state for story generation
        setIsLoadingStory(true);
        setIsTyping(false);
        
        const loadingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '🎬 Perfect! I have enough information to create your story. Let me generate a complete screenplay for you...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);

        // Generate complete story directly
        const conversationContext = messages
          .filter(m => m.type === 'user')
          .map(m => m.content)
          .join(' ');
        
        const story = await aiService.generateCompleteStory(theme, userMessage.content, conversationContext);
        
        setIsLoadingStory(false);
        setStoryGenerated(true);
        
        const completionMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: '✅ Your complete story has been generated! Click "Continue" to review and edit it.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, completionMessage]);
        
        onStoryGenerated(story);
        return;
      }

      if (apiConfigured) {
        aiResponse = await aiService.generateStoryResponse(userMessage.content, theme, messages);
      } else {
        aiResponse = await generateFallbackResponse(userMessage.content, messages.length);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if we should offer to generate the full story
      if (messages.filter(m => m.type === 'user').length >= 1) {
        setTimeout(() => {
          const offerMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: "I have enough information now! Would you like me to generate your complete story based on our conversation? Just say 'generate my story' or click Continue when ready!",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, offerMessage]);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: apiConfigured 
          ? `I apologize, but I'm having trouble connecting to the AI service: ${error.message}. Please try again or check your API configuration.`
          : "I apologize, but I'm having trouble right now. Please add your Gemini or OpenAI API key to get full AI responses, or I can help with some story suggestions!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoadingStory(false);
    }
  };

  const generateFallbackResponse = async (userMessage: string, messageCount: number): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userMessageLower = userMessage.toLowerCase();

    if (userMessageLower.includes('suggest') || userMessageLower.includes('idea') || 
        userMessageLower.includes('help') || userMessageLower.includes('don\'t know')) {
      return `Here are some exciting ${theme} story ideas I can help you develop:

${storyTemplates.slice(0, 3).map((template, i) => 
  `${i + 1}. **${template.title}**: ${template.description}`
).join('\n\n')}

Which of these interests you, or would you like me to suggest different concepts? I can also help you develop your own unique idea!`;
    }

    const responses = [
      `That's an interesting ${theme} concept! Tell me more about the main character - what's their background and motivation?`,
      `I love that idea! What's the central conflict or challenge your protagonist will face?`,
      `Great concept! What's the setting for this story? The environment can really enhance the ${theme} elements.`,
      `Fascinating! What's the climax or turning point you envision for this story?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleTemplateSelect = async (template: StoryTemplate) => {
    setIsTyping(true);
    setShowSuggestions(false);
    setIsLoadingStory(true);

    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `I'd like to create a story based on: ${template.title}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Perfect! I'll create a complete story based on "${template.title}". Let me generate your screenplay now...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Generate complete story directly from template
      const story = await aiService.generateCompleteStory(theme, `${template.title}: ${template.description}`);
      
      setStoryGenerated(true);
      
      const completionMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: '✅ Your complete story has been generated! Click "Continue" to review and edit it.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, completionMessage]);

      // Generate the story
      onStoryGenerated(story);
    } catch (error: any) {
      console.error('Error generating story from template:', error);
      toast.error(apiConfigured ? 'Failed to generate story. Please try again.' : 'Please add your Gemini or OpenAI API key for story generation.');
      
      // Fallback to chat mode
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `I'd like to develop this story idea: ${template.title} - ${template.description}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: template.prompt,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
      setIsLoadingStory(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    let message = '';
    switch (action) {
      case 'suggest':
        message = 'Can you suggest some story ideas for me?';
        break;
      case 'generate':
        message = 'Please generate a complete story for me';
        break;
      case 'help':
        message = 'I need help developing my story idea';
        break;
    }
    
    setInputValue(message);
    setTimeout(() => handleSendMessage(), 100);
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: `Let's start fresh! I'm here to help you create an amazing ${theme} story. What's your idea?`,
        timestamp: new Date(),
      }
    ]);
    setShowSuggestions(true);
    setIsLoadingStory(false);
    setStoryGenerated(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading screen when generating story
  if (isLoadingStory) {
    return (
      <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary-500 mx-auto animate-spin" />
              <Sparkles className="w-8 h-8 text-secondary-500 absolute top-2 right-2 animate-pulse" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🎬 Creating Your Story
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI is crafting your complete {theme} screenplay...
              </p>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" />
                  <span>Analyzing your story concept...</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span>Creating characters and plot...</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span>Writing screenplay format...</span>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-sm text-primary-800 dark:text-primary-200">
                <div className="font-medium mb-2">✨ What's happening:</div>
                <div className="space-y-1 text-xs">
                  <div>• AI analyzes your {theme} story concept</div>
                  <div>• Creates compelling characters and plot</div>
                  <div>• Formats as professional screenplay</div>
                  <div>• Optimizes for video generation</div>
                </div>
              </div>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full animate-pulse w-3/4" />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Almost ready... Creating your masterpiece!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header with AI Story Ideas prominently displayed */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        {/* AI Story Ideas Section - Always visible and prominent */}
        {storyTemplates.length > 0 && !storyGenerated && (
          <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ✨ AI-Generated {theme.charAt(0).toUpperCase() + theme.slice(1)} Story Ideas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose from these creative concepts or describe your own idea below
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {storyTemplates.slice(0, 3).map((template, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {template.description}
                  </div>
                  <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    Click to generate complete story →
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* API Configuration Warning */}
        {!apiConfigured && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span>Add VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY to your .env file for full AI capabilities</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {showSuggestions && !storyGenerated && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('suggest')}
                className="text-xs"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Get Story Ideas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('generate')}
                className="text-xs"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Generate Story
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('help')}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Need Help
              </Button>
            </div>
          </div>
        )}

        {/* Story Generated Success Banner */}
        {storyGenerated && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Story Generated Successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Your {theme} story is ready for review and editing
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-green-600 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              AI Story Assistant
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <span>{theme.charAt(0).toUpperCase() + theme.slice(1)} Story Creator</span>
              {!apiConfigured && (
                <AlertCircle className="w-3 h-3 text-yellow-500" title="API key not configured" />
              )}
              {geminiService.isConfigured() && (
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                  Gemini AI
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {storyGenerated && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Story Ready</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={resetChat}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-primary-500' 
                    : 'bg-gradient-to-r from-secondary-500 to-accent-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' 
                      ? 'text-primary-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary-500 to-accent-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={storyGenerated ? "Story is ready! Click Continue to proceed..." : "Describe your story idea or ask for suggestions..."}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isTyping || isGenerating || isLoadingStory || storyGenerated}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || isGenerating || isLoadingStory || storyGenerated}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Status */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {storyGenerated ? '✅ Story ready for review' :
             geminiService.isConfigured() ? '🤖 Gemini AI enabled' : 
             aiService.isConfigured() ? '🤖 AI responses enabled' : 
             '💡 Add API key for full AI features'}
          </span>
          <span>{storyGenerated ? 'Click Continue to proceed' : 'Press Enter to send'}</span>
        </div>
      </div>
    </div>
  );
};