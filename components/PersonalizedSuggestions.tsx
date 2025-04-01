import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/PersonalizedSuggestions.module.css';

interface PersonalizedSuggestionsProps {
  onSuggestionSelect: (suggestion: string) => void;
  messageHistory: Array<{
    role: string;
    content: string;
  }>;
  currentChatMode: string;
  isVisible: boolean;
}

const PersonalizedSuggestions: React.FC<PersonalizedSuggestionsProps> = ({ 
  onSuggestionSelect, 
  messageHistory,
  currentChatMode,
  isVisible
}) => {
  const { t } = useTranslation('common');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Generate suggestions based on chat history and current mode
  useEffect(() => {
    if (!isVisible) return;
    
    const generateSuggestions = async () => {
      setLoading(true);
      try {
        // In a real app, we might call an API to get personalized suggestions
        // For now, we'll use predefined suggestions based on chat mode
        const modeSuggestions = getModeBasedSuggestions(currentChatMode);
        
        // Add some contextual suggestions if we have message history
        let contextualSuggestions: string[] = [];
        if (messageHistory.length > 1) {
          contextualSuggestions = getContextualSuggestions(messageHistory);
        }
        
        // Combine and shuffle suggestions
        const allSuggestions = [...modeSuggestions, ...contextualSuggestions];
        const shuffled = shuffleArray(allSuggestions);
        
        // Select a subset of suggestions to display
        setSuggestions(shuffled.slice(0, 4));
      } catch (error) {
        console.error("Error generating suggestions:", error);
        setSuggestions(getDefaultSuggestions());
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [messageHistory.length, currentChatMode, isVisible]);

  const getModeBasedSuggestions = (mode: string): string[] => {
    switch (mode) {
      case 'coding':
        return [
          "Can you explain how async/await works?",
          "How do I optimize this function for better performance?",
          "What are the best practices for error handling?",
          "Compare TypeScript vs JavaScript for large projects"
        ];
      case 'creative':
        return [
          "Write a short poem about technology",
          "Suggest some creative names for my tech project",
          "Tell me a story about AI in the future",
          "Create a metaphor that explains blockchain technology"
        ];
      case 'learning':
        return [
          "Explain quantum computing like I'm 10",
          "What are the key concepts of machine learning?",
          "Help me understand the basics of relativity",
          "Create a study guide for learning React"
        ];
      case 'precise':
        return [
          "What are the exact dimensions of the Webb telescope?",
          "What is the current global climate agreement?",
          "Define the key principles of object-oriented programming",
          "What's the difference between HTTP and HTTPS protocols?"
        ];
      case 'concise':
        return [
          "Summarize the concept of blockchain",
          "Quick tips for improving code readability",
          "Key differences between REST and GraphQL",
          "Main benefits of serverless architecture"
        ];
      default:
        return getDefaultSuggestions();
    }
  };

  const getContextualSuggestions = (messages: Array<{ role: string, content: string }>): string[] => {
    // Simple contextual suggestion generation - in a real app, this would be more sophisticated
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    if (lastMessage.includes("javascript") || lastMessage.includes("js")) {
      return [
        "What are JavaScript closures?",
        "Explain the event loop in JavaScript",
        "What's new in the latest ECMAScript?",
        "How do JS promises work?"
      ];
    }
    
    if (lastMessage.includes("react") || lastMessage.includes("component")) {
      return [
        "How do React hooks work?",
        "What's the Context API in React?",
        "React performance optimization techniques",
        "When should I use Redux with React?"
      ];
    }
    
    if (lastMessage.includes("python") || lastMessage.includes("django") || lastMessage.includes("flask")) {
      return [
        "Best Python libraries for data science",
        "How to structure a large Python project",
        "Compare Django vs Flask",
        "Python best practices for clean code"
      ];
    }
    
    // Default contextual suggestions
    return [
      "Can you elaborate more on that?",
      "What are the best resources to learn this?",
      "What are common misconceptions about this topic?",
      "How would you apply this in a real-world scenario?"
    ];
  };

  const getDefaultSuggestions = (): string[] => {
    return [
      "How does AI actually work?",
      "What are the latest trends in web development?",
      "Explain the concept of cloud computing",
      "What is the future of remote work?"
    ];
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: string[]): string[] => {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.suggestionsWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={`${styles.suggestionButton} ${index === 0 ? styles.trendingSuggestion : ''}`}
              onClick={() => onSuggestionSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PersonalizedSuggestions;
