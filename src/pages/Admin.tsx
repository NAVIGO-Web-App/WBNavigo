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

//
// ──────────────────────────────── QUESTS ────────────────────────────────
//
const questSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  points: z.coerce.number().min(1, "Points must be greater than 0"),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const QuestForm = ({
  onSubmit,
  editingQuest,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm({
    resolver: zodResolver(questSchema),
    defaultValues: {
      title: "",
      description: "",
      points: 10,
      difficulty: "easy",
    },
  });

  useEffect(() => {
    if (editingQuest) {
      form.reset(editingQuest);
    } else {
      form.reset({
        title: "",
        description: "",
        points: 10,
        difficulty: "easy",
      });
    }
  }, [editingQuest, form]);

  const handleSubmit = async (data) => {
    const success = await onSubmit(data);
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

const QuestCard = ({ quest, onEdit, onDelete }) => (
  <Card className="hover:shadow-lg transition bg-gradient-to-br from-card to-card/80 border border-blue-500/20">
    <CardHeader>
      <CardTitle>{quest.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        {quest.description}
      </p>
      <p className="mt-2 text-sm">Points: {quest.points}</p>
      <p className="text-xs text-muted-foreground">
        Difficulty: {quest.difficulty}
      </p>
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
});

const CollectibleForm = ({
  onSubmit,
  editingCollectible,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm({
    resolver: zodResolver(collectibleSchema),
    defaultValues: {
      name: "",
      description: "",
      iconUrl: "",
      rarity: "common",
    },
  });

  useEffect(() => {
    if (editingCollectible) {
      form.reset(editingCollectible);
    } else {
      form.reset({
        name: "",
        description: "",
        iconUrl: "",
        rarity: "common",
      });
    }
  }, [editingCollectible, form]);

  const handleSubmit = async (data) => {
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

const CollectibleCard = ({ collectible, onEdit, onDelete }) => (
  <Card className="hover:shadow-lg transition bg-gradient-to-br from-card to-card/80 border border-purple-500/20">
    <CardHeader className="flex items-center gap-3">
      <img
        src={collectible.iconUrl}
        alt={collectible.title}
        className="w-12 h-12 rounded"
      />
      <div>
        <h3 className="font-bold">{collectible.title}</h3>
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
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "quests"), (snapshot) => {
      setQuests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addQuest = async (data) => {
    await addDoc(collection(db, "quests"), {
      ...data,
      createdAt: new Date(),
    });
    return true;
  };

  const updateQuest = async (id, data) => {
    await updateDoc(doc(db, "quests", id), data);
    return true;
  };

  const deleteQuest = async (id) => {
    await deleteDoc(doc(db, "quests", id));
    return true;
  };

  return { quests, loading, addQuest, updateQuest, deleteQuest };
};

const useCollectibles = () => {
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "collectibles"),
      (snapshot) => {
        setCollectibles(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const addCollectible = async (data) => {
    await addDoc(collection(db, "collectibles"), {
      ...data,
      createdAt: new Date(),
    });
    return true;
  };

  const updateCollectible = async (id, data) => {
    await updateDoc(doc(db, "collectibles", id), data);
    return true;
  };

  const deleteCollectible = async (id) => {
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
  const [editingQuest, setEditingQuest] = useState(null);

  // collectibles
  const {
    collectibles,
    loading: collectiblesLoading,
    addCollectible,
    updateCollectible,
    deleteCollectible,
  } = useCollectibles();
  const [editingCollectible, setEditingCollectible] = useState(null);

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
