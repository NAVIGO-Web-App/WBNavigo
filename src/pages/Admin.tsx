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
import { MapPin } from "lucide-react";

// 🚨 ADDED: TypeScript interfaces for better type safety
interface QuestFormData {
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  lat: number;
  lng: number;
  type: "qr" | "location" | "quiz";
  location?: string;
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
  difficulty: string; // 🚨 FIXED: This can be string from Firestore
  type: string;
  location?: string;
  position?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
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
const questSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  points: z.coerce.number().min(1, "Points must be greater than 0"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  lat: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  type: z.enum(["qr", "location", "quiz"]).default("location"),
});

// 🚨 ADDED: Proper TypeScript props interface
interface QuestFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  editingQuest: Quest | null;
  onCancel: () => void;
  isSubmitting?: boolean;
}

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
      lat: -26.1915, // Default to your campus center
      lng: 28.0309,
      type: "location",
    },
  });

  useEffect(() => {
    if (editingQuest) {
      // 🚨 FIXED: Handle both nested position object and flat lat/lng fields consistently
      // 🚨 FIXED: Type conversion for difficulty field
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
          type: (editingQuest.type as "qr" | "location" | "quiz") || "location",
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
          type: (editingQuest.type as "qr" | "location" | "quiz") || "location",
        };
      }
      
      form.reset(questData);
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
      });
    }
  }, [editingQuest, form]);

  // Function to handle coordinate picking from Google Maps
  const handlePickCoordinates = () => {
    // Open Google Maps in a new tab
    window.open('https://www.google.com/maps', '_blank');
    
    // Show instructions to the user
    alert(`How to get coordinates:
1. Google Maps will open in a new tab
2. Right-click on any location on the map
3. Select "What's here?" from the menu
4. Copy the coordinates from the info box
5. Paste them in the latitude and longitude fields below

Format: latitude,longitude (e.g., -26.19045,28.02629)`);
  };

  // Function to handle coordinate string input (e.g., "-26.19045,28.02629")
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

  const handleSubmit = async (data: QuestFormData) => {
    // 🚨 FIXED: Always use nested position structure for consistency
    const questData = {
      title: data.title,
      description: data.description,
      points: data.points,
      difficulty: data.difficulty,
      location: data.location || "Campus Location",
      type: data.type,
      position: { // ✅ Always use nested position for consistency
        lat: data.lat,
        lng: data.lng,
      },
      estimatedTime: "30 min",
      requirements: [],
      status: "active", // This is important for initial status
      createdAt: new Date(),
    };

    const success = await onSubmit(questData);
    if (success && !editingQuest) {
      form.reset();
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg bg-gradient-to-br from-card to-card/80 border border-primary/20">
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enhanced Coordinates Section with Google Maps Picker */}
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
  // 🚨 FIXED: Handle both nested position and flat position data consistently
  const position = quest.position || { lat: quest.lat, lng: quest.lng };
  const location = quest.location || "No location set";
  
  return (
    <Card className="hover:shadow-lg transition bg-gradient-to-br from-card to-card/80 border border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{quest.title}</span>
          <span className="text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
            {quest.type || "location"}
          </span>
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