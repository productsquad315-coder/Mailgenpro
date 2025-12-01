import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateListModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateListModal = ({ open, onClose, onSuccess }: CreateListModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a list name");
            return;
        }

        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("contact_lists").insert({
                user_id: user.id,
                name: name.trim(),
                description: description.trim() || null,
            });

            if (error) throw error;

            setName("");
            setDescription("");
            onSuccess();
        } catch (error) {
            console.error("Error creating list:", error);
            toast.error("Failed to create list");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Contact List</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">List Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Newsletter Subscribers"
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this list for?"
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={creating}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating} className="btn-premium">
                            {creating ? "Creating..." : "Create List"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateListModal;
