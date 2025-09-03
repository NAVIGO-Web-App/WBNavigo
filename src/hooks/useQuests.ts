import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase'; // Update this path to match your firebase file
import { Quest, QuestFormData } from '../types/quest';
import { useToast } from './use-toast';

export const useQuests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Real-time listener for quests
  useEffect(() => {
    const questsRef = collection(db, 'quests');
    const q = query(questsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const questsData: Quest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          questsData.push({
            id: doc.id,
            title: data.title || data.name || '', // Handle legacy field name
            description: data.description || '',
            building: data.building || 'Unknown',
            rewardPoints: data.rewardPoints || data.points || 0,
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        setQuests(questsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching quests:', err);
        setError('Failed to fetch quests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add new quest
  const addQuest = async (questData: QuestFormData): Promise<boolean> => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, 'quests'), {
        ...questData,
        createdAt: now,
        updatedAt: now,
      });
      
      toast({
        title: "Quest Created! 🎉",
        description: `"${questData.title}" is now ready for adventurers!`,
      });
      
      return true;
    } catch (err) {
      console.error('Error adding quest:', err);
      toast({
        title: "Quest Creation Failed",
        description: "Unable to create quest. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update existing quest
  const updateQuest = async (questId: string, questData: QuestFormData): Promise<boolean> => {
    try {
      const questRef = doc(db, 'quests', questId);
      await updateDoc(questRef, {
        ...questData,
        updatedAt: Timestamp.now(),
      });
      
      toast({
        title: "Quest Updated! ⚡",
        description: `"${questData.title}" has been successfully updated.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error updating quest:', err);
      toast({
        title: "Update Failed",
        description: "Unable to update quest. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete quest
  const deleteQuest = async (questId: string, questTitle: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'quests', questId));
      
      toast({
        title: "Quest Deleted 🗑️",
        description: `"${questTitle}" has been removed from the campus.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting quest:', err);
      toast({
        title: "Deletion Failed",
        description: "Unable to delete quest. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    quests,
    loading,
    error,
    addQuest,
    updateQuest,
    deleteQuest,
  };
};