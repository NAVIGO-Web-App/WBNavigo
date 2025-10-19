import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Info, MapPin, Star, HelpCircle } from 'lucide-react';

interface UserGuideAlertProps {
  type: 'welcome' | 'location' | 'quiz' | 'completion';
  title: string;
  description: string;
  onDismiss: () => void;
}

const UserGuideAlert: React.FC<UserGuideAlertProps> = ({ 
  type, 
  title, 
  description, 
  onDismiss 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'welcome':
        return <Info className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'completion':
        return <Star className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStyle = () => {
    switch (type) {
      case 'welcome':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'location':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'quiz':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'completion':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <Alert className={`${getStyle()} mb-4 pr-12`}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-8 w-8 p-0"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

export default UserGuideAlert;