import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Eye, EyeOff, FileText, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface StoryEditorProps {
  initialStory: string;
  onStoryChange: (story: string) => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({ 
  initialStory, 
  onStoryChange 
}) => {
  const [story, setStory] = useState(initialStory);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  useEffect(() => {
    const words = story.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setEstimatedReadTime(Math.ceil(words.length / 200)); // Average reading speed
  }, [story]);

  const handleStoryChange = (newStory: string) => {
    setStory(newStory);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onStoryChange(story);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setStory(initialStory);
    setHasUnsavedChanges(false);
  };

  const renderPreview = () => {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {story.split('\n').map((paragraph, index) => {
          if (paragraph.trim().startsWith('#')) {
            const level = paragraph.match(/^#+/)?.[0].length || 1;
            const text = paragraph.replace(/^#+\s*/, '');
            const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag key={index} className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                {text}
              </HeadingTag>
            );
          } else if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
            return (
              <div key={index} className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">
                {paragraph.replace(/\*\*/g, '')}
              </div>
            );
          } else if (paragraph.trim().startsWith('*') && paragraph.trim().endsWith('*')) {
            return (
              <div key={index} className="italic text-gray-600 dark:text-gray-400 mb-2 text-center">
                {paragraph.replace(/\*/g, '')}
              </div>
            );
          } else if (paragraph.trim()) {
            return (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            );
          } else {
            return <br key={index} />;
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Story Editor
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and edit your AI-generated story
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          
          {hasUnsavedChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {wordCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Words
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {estimatedReadTime}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Min Read
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`w-6 h-6 mx-auto mb-2 rounded-full ${
              hasUnsavedChanges ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hasUnsavedChanges ? 'Draft' : 'Saved'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Status
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor/Preview */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPreviewMode ? 'bg-blue-500' : 'bg-green-500'}`} />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {isPreviewMode ? 'Preview Mode' : 'Edit Mode'}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {isPreviewMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-h-[600px] overflow-y-auto"
            >
              {renderPreview()}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <textarea
                value={story}
                onChange={(e) => handleStoryChange(e.target.value)}
                placeholder="Your story will appear here..."
                className="w-full h-[600px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-mono text-sm leading-relaxed"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Editing Tips:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded"># Heading</code> for scene titles</li>
            <li>• Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">**CHARACTER NAME**</code> for character names</li>
            <li>• Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">*stage directions*</code> for actions</li>
            <li>• Keep dialogue clear and character names consistent for better character extraction</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};