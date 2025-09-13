import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Quest, QuestFormData, QuestFilters } from "../types/quest";
import { useQuests } from "../hooks/useQuests";
import { 
  Crown, 
  Zap, 
  MapPin, 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Search, 
  Filter, 
  Map, 
  Target,
  AlertCircle // Added AlertCircle import
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

// Form validation schema
const questSchema = z.object({
  title: z.string().min(1, "Quest title is required").max(100, "Title must be under 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be under 500 characters"),
  building: z.string().min(1, "Building/location is required"),
  rewardPoints: z.number().min(1, "Reward points must be at least 1").max(10000, "Reward points must be under 10,000"),
  status: z.enum(["active", "inactive"]),
});

// Quest Form Component
const QuestForm = ({ onSubmit, editingQuest, onCancel, isSubmitting = false }: {
  onSubmit: (data: QuestFormData) => Promise<boolean>;
  editingQuest?: Quest | null;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) => {
  const form = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      title: "",
      description: "",
      building: "",
      rewardPoints: 100,
      status: "active",
    },
  });

  // Reset form when editing quest changes
  useEffect(() => {
    if (editingQuest) {
      form.reset({
        title: editingQuest.title,
        description: editingQuest.description,
        building: editingQuest.building,
        rewardPoints: editingQuest.rewardPoints,
        status: editingQuest.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        building: "",
        rewardPoints: 100,
        status: "active",
      });
    }
  }, [editingQuest, form]);

  const handleSubmit = async (data: QuestFormData) => {
    const success = await onSubmit(data);
    if (success && !editingQuest) {
      form.reset(); // Only reset form if it's a new quest creation
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg bg-gradient-to-br from-card to-card/80 border border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          {editingQuest ? (
            <>
              <Edit className="h-5 w-5" />
              Edit Quest
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Create New Quest
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Quest Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter an epic quest name..." 
                      {...field}
                      className="bg-background/50 border-primary/30 focus:border-primary transition-all duration-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the quest objectives and requirements..."
                      className="bg-background/50 border-primary/30 focus:border-primary transition-all duration-300 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Building/Location
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Library, Student Union..."
                        {...field}
                        className="bg-background/50 border-primary/30 focus:border-primary transition-all duration-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rewardPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Reward Points
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="10000"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="bg-background/50 border-primary/30 focus:border-primary transition-all duration-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Quest Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary transition-all duration-300">
                        <SelectValue placeholder="Select quest status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">🟢 Active</SelectItem>
                      <SelectItem value="inactive">🔴 Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : editingQuest ? (
                  "Update Quest"
                ) : (
                  "Create Quest"
                )}
              </Button>
              
              {editingQuest && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  className="px-6 border-primary/30 hover:border-primary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Quest Card Component
const QuestCard = ({ quest, onEdit, onDelete }: {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
}) => {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${quest.title}"? This action cannot be undone.`)) {
      onDelete(quest);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-card/80 border border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate mb-2">
              {quest.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{quest.building}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-500">{quest.rewardPoints}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge 
              variant={quest.status === 'active' ? 'default' : 'secondary'}
              className={
                quest.status === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-200'
              }
            >
              {quest.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {quest.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Created {formatDistanceToNow(quest.createdAt, { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(quest)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Admin Component
const Admin = () => {
  const { user } = useAuth();
  const { quests, loading, addQuest, updateQuest, deleteQuest } = useQuests();
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<QuestFilters>({
    searchQuery: "",
    statusFilter: "all",
    buildingFilter: "all",
  });

  // If not an admin, show access denied
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
                <p className="text-muted-foreground mt-2">
                  Administrator privileges required to access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract unique buildings for filter dropdown
  const uniqueBuildings = useMemo(() => {
    const buildings = [...new Set(quests.map(quest => quest.building))];
    return buildings.sort();
  }, [quests]);

  // Filter quests based on current filters
  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      const matchesSearch = quest.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                           quest.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                           quest.building.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      const matchesStatus = filters.statusFilter === "all" || quest.status === filters.statusFilter;
      
      const matchesBuilding = filters.buildingFilter === "all" || quest.building === filters.buildingFilter;
      
      return matchesSearch && matchesStatus && matchesBuilding;
    });
  }, [quests, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = quests.length;
    const active = quests.filter(q => q.status === 'active').length;
    const inactive = quests.filter(q => q.status === 'inactive').length;
    const totalPoints = quests.reduce((sum, q) => sum + q.rewardPoints, 0);
    
    return { total, active, inactive, totalPoints };
  }, [quests]);

  const handleCreateQuest = async (questData: QuestFormData) => {
    setIsSubmitting(true);
    const success = await addQuest(questData);
    setIsSubmitting(false);
    return success;
  };

  const handleUpdateQuest = async (questData: QuestFormData) => {
    if (!editingQuest) return false;
    
    setIsSubmitting(true);
    const success = await updateQuest(editingQuest.id, questData);
    if (success) {
      setEditingQuest(null);
    }
    setIsSubmitting(false);
    return success;
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
  };

  const handleCancelEdit = () => {
    setEditingQuest(null);
  };

  const handleDeleteQuest = async (quest: Quest) => {
    await deleteQuest(quest.id, quest.title);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Header />
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardHeader className="text-center py-8">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl md:text-4xl font-bold">
              <Crown className="h-10 w-10" />
              Campus Quest Admin
              <Zap className="h-10 w-10" />
            </CardTitle>
            <p className="text-primary-foreground/90 text-lg mt-2">
              Manage campus adventures and student quests
            </p>
          </CardHeader>
        </Card>

        {/* Quest Form */}
        <div className="flex justify-center">
          <QuestForm
            onSubmit={editingQuest ? handleUpdateQuest : handleCreateQuest}
            editingQuest={editingQuest}
            onCancel={handleCancelEdit}
            isSubmitting={isSubmitting}
          />
        </div>

        <Separator className="my-8" />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quests</p>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Badge className="bg-green-600 text-white">🟢</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
                <Badge variant="secondary">🔴</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.totalPoints.toLocaleString()}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quest Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quests..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10 bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>
              
              <Select 
                value={filters.statusFilter} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, statusFilter: value as any }))}
              >
                <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">🟢 Active Only</SelectItem>
                  <SelectItem value="inactive">🔴 Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.buildingFilter} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, buildingFilter: value }))}
              >
                <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Filter by building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      All Buildings
                    </div>
                  </SelectItem>
                  {uniqueBuildings.map(building => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(filters.searchQuery || filters.statusFilter !== 'all' || filters.buildingFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {filteredQuests.length} of {quests.length} quests</span>
                {filters.searchQuery && <Badge variant="outline">Search: "{filters.searchQuery}"</Badge>}
                {filters.statusFilter !== 'all' && <Badge variant="outline">Status: {filters.statusFilter}</Badge>}
                {filters.buildingFilter !== 'all' && <Badge variant="outline">Building: {filters.buildingFilter}</Badge>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quest Grid */}
        {filteredQuests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Target className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {quests.length === 0 ? 'No Quests Yet' : 'No Matching Quests'}
                  </h3>
                  <p className="text-muted-foreground">
                    {quests.length === 0 
                      ? 'Create your first quest to get started!' 
                      : 'Try adjusting your filters to find quests.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuests.map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onEdit={handleEditQuest}
                onDelete={handleDeleteQuest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;