import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Trash2, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactListCardProps {
    list: {
        id: string;
        name: string;
        description?: string;
        total_contacts: number;
        created_at: string;
    };
    onUpdate: () => void;
}

const ContactListCard = ({ list, onUpdate }: ContactListCardProps) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from("contact_lists")
                .delete()
                .eq("id", list.id);

            if (error) throw error;

            toast.success("Contact list deleted");
            onUpdate();
        } catch (error) {
            console.error("Error deleting list:", error);
            toast.error("Failed to delete list");
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <>
            <Card className="glass-card p-6 hover-lift group">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete List
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <h3 className="font-semibold text-lg mb-1 truncate">{list.name}</h3>
                {list.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {list.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{list.total_contacts} contacts</span>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Created {formatDate(list.created_at)}
                </div>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact List?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{list.name}" and all {list.total_contacts} contacts in it.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ContactListCard;
