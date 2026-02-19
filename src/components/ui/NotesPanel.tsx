import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StickyNote, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTimeToEST } from "@/utils/timezone";

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  priority: "low" | "medium" | "high";
}

interface NotesPanelProps {
  entityType: string;
  entityId: string;
  title?: string;
  className?: string;
}

// Mock notes data
const mockNotes: Note[] = [
  {
    id: "1",
    content:
      "Customer requested expedited shipping for anniversary surprise. Please prioritize this order.",
    author: "Sarah Johnson",
    timestamp: "2024-01-15T10:30:00Z",
    priority: "high",
  },
  {
    id: "2",
    content: "Ring size verified with customer - confirmed 6.5",
    author: "Mike Chen",
    timestamp: "2024-01-15T09:15:00Z",
    priority: "medium",
  },
];

const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning" },
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
};

export function NotesPanel({
  entityType,
  entityId,
  title = "Notes",
  className,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      author: "Current User", // Replace with actual user
      timestamp: new Date().toISOString(),
      priority: "medium",
    };

    setNotes((prev) => [note, ...prev]);
    setNewNote("");
    setIsAdding(false);

    toast({
      title: "Note added",
      description: "Your note has been added successfully",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    toast({
      title: "Note deleted",
      description: "The note has been removed successfully",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDateTimeToEST(timestamp);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Section */}
        {isAdding ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}

        <Separator />

        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length > 0 ? (
            notes
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
              .map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={priorityConfig[note.priority].className}
                      >
                        {priorityConfig[note.priority].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {note.author}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm mb-2">{note.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(note.timestamp)}
                  </p>
                </div>
              ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <StickyNote className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No notes yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
