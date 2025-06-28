import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Edit3, Lightbulb, RefreshCw, MessageCircle, BookOpen, Users, Zap, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { dappierService } from '../../lib/dappierService';
import toast from 'react-hot-toast';

interface AICopilotProps {
  storyContent?: string;
  characters?: any[];
  onStoryUpdate?: (updatedContent: string) => void;
  onSuggestionApplied?: (suggestion: string) => void;
}

interface CopilotMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  intent?: string;
  suggestions?: string[];
  story_modifications?: {
    original_text: string;
    modified_text: string;
    changes_explanation: string;
  };
  timestamp: Date;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  storyContent = '',
  characters = [],
  onStoryUpdate,
  onSuggestionApplied
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `🧠 **AI Story Copilot Activated!**

I'm your ${dappierService.isConfigured() ? 'premium Dappier-powered' : 'intelligent'} writing assistant. I can help you:

✨ **Rewrite & Enhance** - "Rewrite this for 8-year-olds"
🎭 **Character Development** - "Make this character more mysterious"  
🔄 **Plot Twists** - "Suggest exciting plot twists"
📝 **Story Analysis** - "How can I improve this story?"
🔍 **Creative Search** - "Find similar themes in fantasy"

What would you like me to help you with?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState(dappierService.getRemainingCredits());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    {
      icon: Edit3,
      label: 'Rewrite',
      action: 'Can you rewrite this story section to be more engaging?',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      label: 'Characters',
      action: 'Help me develop my characters better',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Lightbulb,
      label: 'Plot Ideas',
      action: 'Suggest some plot twists and story improvements',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Search,
      label: 'Research',
      action: 'Search for similar themes and story elements',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const detectIntent = (query: string): 'rewrite' | 'enhance' | 'suggest' | 'analyze' | 'search' => {
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('rewrite') || lowercaseQuery.includes('rephrase') || lowercaseQuery.includes('change')) {
      return 'rewrite';
    } else if (lowercaseQuery.includes('enhance') || lowercaseQuery.includes('improve') || lowercaseQuery.includes('better')) {
      return 'enhance';
    } else if (lowercaseQuery.includes('search') || lowercaseQuery.includes('find') || lowercaseQuery.includes('look for')) {
      return 'search';
    } else if (lowercaseQuery.includes('analyze') || lowercaseQuery.includes('review') || lowercaseQuery.includes('feedback')) {
      return 'analyze';
    } else {
      return 'suggest';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const intent = detectIntent(userMessage.content);
      
      if (intent === 'rewrite' && storyContent) {
        // Use Dappier's rewriting capability
        const rewriteResponse = await dappierService.rewriteStorySection(
          storyContent,
          userMessage.content
        );
        
        const assistantMessage: CopilotMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `✍️ **Story Rewritten Successfully!**

${rewriteResponse.response}

**Changes Made:** ${rewriteResponse.story_modifications?.changes_explanation || 'Enhanced narrative flow and readability.'}`,
          intent: 'rewrite',
          suggestions: rewriteResponse.suggestions,
          story_modifications: rewriteResponse.story_modifications,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (onStoryUpdate && rewriteResponse.story_modifications) {
          onStoryUpdate(rewriteResponse.story_modifications.modified_text);
        }
        
      } else {
        // Use general AI assistance
        const response = await dappierService.getStoryAssistance({
          query: userMessage.content,
          story_content: storyContent,
          characters: characters,
          intent: intent
        });

        const assistantMessage: CopilotMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `${getIntentIcon(intent)} **${getIntentTitle(intent)}**

${response.response}`,
          intent: intent,
          suggestions: response.suggestions,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      // Update remaining credits
      setRemainingCredits(dappierService.getRemainingCredits());
      
    } catch (error: any) {
      console.error('AI Copilot error:', error);
      toast.error('AI assistance temporarily unavailable');
      
      const errorMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ I apologize, but I\'m having trouble processing your request right now. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'rewrite': return '✍️';
      case 'enhance': return '✨';
      case 'suggest': return '💡';
      case 'analyze': return '🔍';
      case 'search': return '🔎';
      default: return '🤖';
    }
  };

  const getIntentTitle = (intent: string) => {
    switch (intent) {
      case 'rewrite': return 'Rewriting Assistant';
      case 'enhance': return 'Enhancement Suggestions';
      case 'suggest': return 'Creative Suggestions';
      case 'analyze': return 'Story Analysis';
      case 'search': return 'Research Results';
      default: return 'AI Assistant';
    }
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  const applySuggestion = (suggestion: string) => {
    if (onSuggestionApplied) {
      onSuggestionApplied(suggestion);
      toast.success('Suggestion applied to your story!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Story Copilot
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dappierService.isConfigured() 
                ? `Powered by Dappier AI • ${remainingCredits} credits remaining`
                : 'Smart writing assistant for creative storytelling'
              }
            </p>
          </div>
        </div>
        
        {dappierService.isConfigured() && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 dark:text-green-400 font-medium">Premium Active</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showSuggestions && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={() => handleQuickAction(action.action)}
              className={`p-3 rounded-lg bg-gradient-to-r ${action.color} text-white text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <action.icon className="w-4 h-4 mx-auto mb-1" />
              {action.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Chat Interface */}
      <Card className="min-h-[400px] max-h-[600px] flex flex-col">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Assistant Chat</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([messages[0]]);
                setShowSuggestions(true);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium opacity-75">Suggestions:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => applySuggestion(suggestion)}
                        className="block w-full text-left text-sm p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        💡 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Story Modifications */}
                {message.story_modifications && onStoryUpdate && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => onStoryUpdate!(message.story_modifications!.modified_text)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Apply Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">AI thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>
        
        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your story..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              isLoading={isLoading}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Try: "Rewrite this for kids", "Make it more dramatic", "Suggest plot twists"
          </p>
        </div>
      </Card>
    </div>
  );
}; 