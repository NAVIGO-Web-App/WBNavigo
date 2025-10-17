import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Play, X } from 'lucide-react';
import { useQuest } from '@/contexts/QuestContext';
import { useNavigate } from 'react-router-dom';

const ActiveQuestPanel: React.FC = () => {
  const { activeQuest, quests, setActiveQuest, userProgress } = useQuest();
  const navigate = useNavigate();
  
  if (!activeQuest) return null;
  
  const quest = quests.find(q => q.id === activeQuest.questId);
  if (!quest) return null;

  const calculateProgress = () => {
    if (quest.type === "Location") {
      return userProgress.inProgressQuests[quest.id] ? 50 : 0;
    }
    return 0; // For quiz quests, progress is binary
  };

  const handleContinueQuest = () => {
    navigate(`/quest/${quest.id}`);
  };

  const handleChangeQuest = () => {
    // This will trigger the switch quest flow in the parent component
    setActiveQuest(null);
  };

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Play className="w-3 h-3 text-white" />
            </div>
            <span>Active Quest</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleChangeQuest}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold text-base">{quest.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>{quest.location}</span>
          </div>
          <Badge variant="secondary" className={`
            ${quest.difficulty === "Easy" ? "bg-green-100 text-green-800" : ""}
            ${quest.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" : ""}
            ${quest.difficulty === "Hard" ? "bg-red-100 text-red-800" : ""}
          `}>
            {quest.difficulty}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        <Button onClick={handleContinueQuest} className="w-full" size="sm">
          <Play className="w-4 h-4 mr-2" />
          Continue Quest
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActiveQuestPanel;