import { useState, useEffect } from "react";
import { db } from "../firebase";
import Header from "@/components/Header";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Trash2, HelpCircle } from "lucide-react";

// 🚨 ENHANCED: Updated interfaces for Quiz Quests
interface QuestFormData {
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  lat: number;
  lng: number;
  type: "qr" | "location" | "quiz" | "timed" | "multiplayer";
  location?: string;
  // NEW: Quiz-specific fields
  passingScore?: number;
  allowRetries?: boolean;
  shuffleQuestions?: boolean;
  quizQuestions?: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
}

interface CollectibleFormData {
  name: string;
  description: string;
  iconUrl: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  difficulty: "easy" | "medium" | "hard";
}

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: string;
  type: string;
  location?: string;
  position?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
  // NEW: Quiz fields
  passingScore?: number;
  allowRetries?: boolean;
  shuffleQuestions?: boolean;
  quizQuestions?: QuizQuestion[];
}

interface Collectible {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  difficulty: string;
}

//
// ──────────────────────────────── QUESTS ────────────────────────────────
//
// 🚨 ENHANCED: Updated schema for Quiz Quests
const questSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  points: z.coerce.number().min(1, "Points must be greater than 0"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  lat: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  type: z.enum(["qr", "location", "quiz", "timed", "multiplayer"]).default("location"),
  // NEW: Quiz validation
  passingScore: z.coerce.number().min(0).max(100).optional().default(70),
  allowRetries: z.boolean().optional().default(true),
  shuffleQuestions: z.boolean().optional().default(false),
  quizQuestions: z.array(z.object({
    id: z.string(),
    question: z.string().min(1, "Question is required"),
    options: z.array(z.string().min(1, "Option cannot be empty")).length(4, "Exactly 4 options required"),
    correctAnswer: z.coerce.number().min(0).max(3, "Correct answer must be between 0-3"),
    explanation: z.string().optional(),
    points: z.coerce.number().min(1).optional().default(1)
  })).optional().default([])
});

// 🚨 ADDED: Proper TypeScript props interface
interface QuestFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  editingQuest: Quest | null;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 🚨 NEW: Quiz Question Component
const QuizQuestionForm: React.FC<{
  question: QuizQuestion;
  index: number;
  onUpdate: (index: number, question: QuizQuestion) => void;
  onRemove: (index: number) => void;
}> = ({ question, index, onUpdate, onRemove }) => {
  const updateField = (field: keyof QuizQuestion, value: any) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateField('options', newOptions);
  };

  return (
    <Card className="p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Question {index + 1}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Question</label>
          <Input
            value={question.question}
            onChange={(e) => updateField('question', e.target.value)}
            placeholder="Enter the question..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Options</label>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  className={optionIndex === question.correctAnswer ? "border-green-500" : ""}
                />
                <Button
                  type="button"
                  variant={optionIndex === question.correctAnswer ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateField('correctAnswer', optionIndex)}
                >
                  Correct
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Explanation (Optional)</label>
          <Input
            value={question.explanation || ""}
            onChange={(e) => updateField('explanation', e.target.value)}
            placeholder="Explanation shown after answering..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Points for this question</label>
          <Input
            type="number"
            value={question.points || 1}
            onChange={(e) => updateField('points', parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
      </div>
    </Card>
  );
};

const QuestForm: React.FC<QuestFormProps> = ({
  onSubmit,
  editingQuest,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      title: "",
      description: "",
      points: 10,
      difficulty: "easy",
      location: "",
      lat: -26.1915,
      lng: 28.0309,
      type: "location",
      passingScore: 70,
      allowRetries: true,
      shuffleQuestions: false,
      quizQuestions: []
    },
  });

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (editingQuest) {
      // Handle both nested position object and flat lat/lng fields consistently
      let questData: QuestFormData;
      
      // Convert string difficulty to the specific union type
      const difficulty = (editingQuest.difficulty.toLowerCase() as "easy" | "medium" | "hard") || "easy";
      
      if (editingQuest.position) {
        // Has nested position
        questData = {
          title: editingQuest.title,
          description: editingQuest.description,
          points: editingQuest.points,
          difficulty: difficulty,
          location: editingQuest.location || "",
          lat: editingQuest.position.lat,
          lng: editingQuest.position.lng,
          type: (editingQuest.type as "qr" | "location" | "quiz" | "timed" | "multiplayer") || "location",
          passingScore: editingQuest.passingScore || 70,
          allowRetries: editingQuest.allowRetries !== undefined ? editingQuest.allowRetries : true,
          shuffleQuestions: editingQuest.shuffleQuestions !== undefined ? editingQuest.shuffleQuestions : false,
          quizQuestions: editingQuest.quizQuestions || []
        };
      } else {
        // Has flat lat/lng
        questData = {
          title: editingQuest.title,
          description: editingQuest.description,
          points: editingQuest.points,
          difficulty: difficulty,
          location: editingQuest.location || "",
          lat: editingQuest.lat || -26.1915,
          lng: editingQuest.lng || 28.0309,
          type: (editingQuest.type as "qr" | "location" | "quiz" | "timed" | "multiplayer") || "location",
          passingScore: editingQuest.passingScore || 70,
          allowRetries: editingQuest.allowRetries !== undefined ? editingQuest.allowRetries : true,
          shuffleQuestions: editingQuest.shuffleQuestions !== undefined ? editingQuest.shuffleQuestions : false,
          quizQuestions: editingQuest.quizQuestions || []
        };
      }
      
      form.reset(questData);
      setQuizQuestions(editingQuest.quizQuestions || []);
    } else {
      form.reset({
        title: "",
        description: "",
        points: 10,
        difficulty: "easy",
        location: "",
        lat: -26.1915,
        lng: 28.0309,
        type: "location",
        passingScore: 70,
        allowRetries: true,
        shuffleQuestions: false,
        quizQuestions: []
      });
      setQuizQuestions([]);
    }
  }, [editingQuest, form]);

  // Function to handle coordinate picking from Google Maps
  const handlePickCoordinates = () => {
    window.open('https://www.google.com/maps', '_blank');
    alert(`How to get coordinates:
1. Google Maps will open in a new tab
2. Right-click on any location on the map
3. Select "What's here?" from the menu
4. Copy the coordinates from the info box
5. Paste them in the latitude and longitude fields below

Format: latitude,longitude (e.g., -26.19045,28.02629)`);
  };

  // Function to handle coordinate string input
  const handleCoordinateInput = (coordinateString: string) => {
    if (!coordinateString) return;
    
    try {
      const [latStr, lngStr] = coordinateString.split(',');
      const lat = parseFloat(latStr.trim());
      const lng = parseFloat(lngStr.trim());
      
      if (!isNaN(lat) && !isNaN(lng)) {
        form.setValue('lat', lat);
        form.setValue('lng', lng);
      }
    } catch (error) {
      console.error('Invalid coordinate format:', error);
    }
  };

  // NEW: Quiz Question Management
  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      points: 1
    };
    setQuizQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuizQuestion = (index: number, question: QuizQuestion) => {
    setQuizQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[index] = question;
      return newQuestions;
    });
  };

  const removeQuizQuestion = (index: number) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: QuestFormData) => {
    // Prepare quest data with quiz questions
    const questData = {
      title: data.title,
      description: data.description,
      points: data.points,
      difficulty: data.difficulty,
      location: data.location || "Campus Location",
      type: data.type,
      position: {
        lat: data.lat,
        lng: data.lng,
      },
      estimatedTime: "30 min",
      requirements: [],
      status: "active",
      createdAt: new Date(),
      // 🚨 FIX: Use 'quizQuestions' for Firestore compatibility
      quizQuestions: data.type === "quiz" ? quizQuestions : [],
      passingScore: data.passingScore,
      allowRetries: data.allowRetries,
      shuffleQuestions: data.shuffleQuestions,
    };

    const success = await onSubmit(questData);
    if (success && !editingQuest) {
      form.reset();
      setQuizQuestions([]);
    }
  };

  const questType = form.watch("type");

  return (
    <Card className="w-full max-w-4xl shadow-lg bg-gradient-to-br from-card to-card/80 border border-primary/20">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle>
          {editingQuest ? "Edit Quest" : "Create Quest"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Quest title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the quest..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="points"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="difficulty"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quest type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="timed">Timed</SelectItem>
                      <SelectItem value="multiplayer">Multiplayer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quiz Settings - Only show for quiz type */}
            {questType === "quiz" && (
              <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                <h3 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Quiz Settings
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    name="passingScore"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="allowRetries"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allow Retries</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Allow retries" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="shuffleQuestions"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shuffle Questions</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Shuffle questions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Quiz Questions Management */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Quiz Questions</h4>
                    <Button
                      type="button"
                      onClick={addQuizQuestion}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </Button>
                  </div>

                  {quizQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions added yet. Click "Add Question" to start.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quizQuestions.map((question, index) => (
                        <QuizQuestionForm
                          key={question.id}
                          question={question}
                          index={index}
                          onUpdate={updateQuizQuestion}
                          onRemove={removeQuizQuestion}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Coordinates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Location Coordinates</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePickCoordinates}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Pick on Google Maps
                </Button>
              </div>

              {/* Quick Coordinate Input */}
              <div className="space-y-2">
                <FormLabel className="text-sm">Quick Coordinate Input</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste coordinates: -26.19045,28.02629"
                    onChange={(e) => handleCoordinateInput(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Paste coordinates"]') as HTMLInputElement;
                      if (input) handleCoordinateInput(input.value);
                    }}
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste coordinates in "lat,lng" format from Google Maps
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="lat"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="-26.1915" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="lng"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="28.0309" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Instructions Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                How to get coordinates from Google Maps:
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Click "Pick on Google Maps" to open Google Maps in a new tab</li>
                <li>Right-click any location and select "What's here?"</li>
                <li>Copy the coordinates (latitude,longitude) from the info box</li>
                <li>Paste them in the "Quick Coordinate Input" field or enter manually below</li>
                <li>Coordinates will auto-populate in the latitude and longitude fields</li>
              </ol>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                <strong>Format:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">-26.19045,28.02629</code>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingQuest
                  ? "Update Quest"
                  : "Create Quest"}
              </Button>
              {editingQuest && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
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

// 🚨 ADDED: Proper TypeScript props interface
interface QuestCardProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onEdit, onDelete }) => {
  // Handle both nested position and flat position data consistently
  const position = quest.position || { lat: quest.lat, lng: quest.lng };
  const location = quest.location || "No location set";
  
  return (
    <Card className="hover:shadow-lg transition bg-gradient-to-br from-card to-card/80 border border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{quest.title}</span>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
              {quest.type || "location"}
            </span>
            {quest.type === "quiz" && quest.quizQuestions && (
              <span className="text-xs text-muted-foreground">
                {quest.quizQuestions.length} questions
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {quest.description}
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <p><strong>Points:</strong> {quest.points}</p>
          <p><strong>Difficulty:</strong> {quest.difficulty}</p>
          <p><strong>Location:</strong> {location}</p>
          {quest.type === "quiz" && (
            <p><strong>Passing Score:</strong> {quest.passingScore || 70}%</p>
          )}
          {position && position.lat && (
            <p className="text-xs text-muted-foreground">
              <strong>Coordinates:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => onEdit(quest)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(quest)}
            className="text-destructive"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ... [Rest of the file remains the same - Collectibles section and hooks]

//
// ──────────────────────────────── COLLECTIBLES ────────────────────────────────
//
const collectibleSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  iconUrl: z.string().url("Must be a valid URL"),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

// 🚨 ADDED: Proper TypeScript props interface
interface CollectibleFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  editingCollectible: Collectible | null;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CollectibleForm: React.FC<CollectibleFormProps> = ({
  onSubmit,
  editingCollectible,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm<CollectibleFormData>({
    resolver: zodResolver(collectibleSchema),
    defaultValues: {
      name: "",
      description: "",
      iconUrl: "",
      rarity: "common",
      difficulty: "easy",
    },
  });

  useEffect(() => {
    if (editingCollectible) {
      // 🚨 FIXED: Type conversion for rarity field
      const formData: CollectibleFormData = {
        name: editingCollectible.name,
        description: editingCollectible.description,
        iconUrl: editingCollectible.iconUrl,
        rarity: (editingCollectible.rarity.toLowerCase() as "common" | "rare" | "epic" | "legendary") || "common",
        difficulty: (editingCollectible.difficulty.toLowerCase() as "easy" | "medium" | "hard") || "easy",
      };
      form.reset(formData);
    } else {
      form.reset({
        name: "",
        description: "",
        iconUrl: "",
        rarity: "common",
        difficulty: "easy",
      });
    }
  }, [editingCollectible, form]);

  const handleSubmit = async (data: CollectibleFormData) => {
    const success = await onSubmit(data);
    if (success && !editingCollectible) {
      form.reset();
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg bg-gradient-to-br from-card to-card/80 border border-primary/20">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle>
          {editingCollectible ? "Edit Collectible" : "Create Collectible"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Golden Sword" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this collectible..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/icon.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="rarity"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rarity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rarity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                name="difficulty"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingCollectible
                  ? "Update Collectible"
                  : "Create Collectible"}
              </Button>
              {editingCollectible && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
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

// 🚨 ADDED: Proper TypeScript props interface
interface CollectibleCardProps {
  collectible: Collectible;
  onEdit: (collectible: Collectible) => void;
  onDelete: (collectible: Collectible) => void;
}

const CollectibleCard: React.FC<CollectibleCardProps> = ({ collectible, onEdit, onDelete }) => (
  <Card className="hover:shadow-lg transition bg-gradient-to-br from-card to-card/80 border border-purple-500/20">
    <CardHeader className="flex items-center gap-3">
      <img
        src={collectible.iconUrl}
        alt={collectible.name}
        className="w-12 h-12 rounded"
      />
      <div>
        <h3 className="font-bold">{collectible.name}</h3>
        <p className="text-xs text-muted-foreground">
          {collectible.rarity}
        </p>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        {collectible.description}
      </p>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(collectible)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(collectible)}
          className="text-destructive"
        >
          Delete
        </Button>
      </div>
    </CardContent>
  </Card>
);

//
// ──────────────────────────────── HOOKS ────────────────────────────────
//
const useQuests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "quests"), (snapshot) => {
      setQuests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Quest))
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addQuest = async (data: any) => {
    await addDoc(collection(db, "quests"), {
      ...data,
      createdAt: new Date(),
    });
    return true;
  };

  const updateQuest = async (id: string, data: any) => {
    await updateDoc(doc(db, "quests", id), data);
    return true;
  };

  const deleteQuest = async (id: string) => {
    await deleteDoc(doc(db, "quests", id));
    return true;
  };

  return { quests, loading, addQuest, updateQuest, deleteQuest };
};

const useCollectibles = () => {
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "collectibles"),
      (snapshot) => {
        setCollectibles(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Collectible))
        );
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const addCollectible = async (data: any) => {
    await addDoc(collection(db, "collectibles"), {
      ...data,
      createdAt: new Date(),
    });
    return true;
  };

  const updateCollectible = async (id: string, data: any) => {
    await updateDoc(doc(db, "collectibles", id), data);
    return true;
  };

  const deleteCollectible = async (id: string) => {
    await deleteDoc(doc(db, "collectibles", id));
    return true;
  };

  return {
    collectibles,
    loading,
    addCollectible,
    updateCollectible,
    deleteCollectible,
  };
};

//
// ──────────────────────────────── ADMIN DASHBOARD ────────────────────────────────
//
export default function Admin() {
  // quests
  const {
    quests,
    loading: questsLoading,
    addQuest,
    updateQuest,
    deleteQuest,
  } = useQuests();
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // collectibles
  const {
    collectibles,
    loading: collectiblesLoading,
    addCollectible,
    updateCollectible,
    deleteCollectible,
  } = useCollectibles();
  const [editingCollectible, setEditingCollectible] = useState<Collectible | null>(null);

  return (
    <div className="container mx-auto py-10 space-y-10">
      {/* Quests Section */}
      <Header/>
      <h2 className="text-2xl font-bold mb-4">Quests</h2>
      <QuestForm
        onSubmit={
          editingQuest
            ? (data) => updateQuest(editingQuest.id, data)
            : addQuest
        }
        editingQuest={editingQuest}
        onCancel={() => setEditingQuest(null)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onEdit={setEditingQuest}
            onDelete={(q) => deleteQuest(q.id)}
          />
        ))}
      </div>

      <Separator className="my-8" />

      {/* Collectibles Section */}
      <h2 className="text-2xl font-bold mb-4">Collectibles</h2>
      <CollectibleForm
        onSubmit={
          editingCollectible
            ? (data) => updateCollectible(editingCollectible.id, data)
            : addCollectible
        }
        editingCollectible={editingCollectible}
        onCancel={() => setEditingCollectible(null)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {collectibles.map((c) => (
          <CollectibleCard
            key={c.id}
            collectible={c}
            onEdit={setEditingCollectible}
            onDelete={(c) => deleteCollectible(c.id)}
          />
        ))}
      </div>
    </div>
  );
}