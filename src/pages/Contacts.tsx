import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import ContactListCard from "@/components/contacts/ContactListCard";
import CreateListModal from "@/components/contacts/CreateListModal";
import ImportCSVModal from "@/components/contacts/ImportCSVModal";

const Contacts = () => {
    const navigate = useNavigate();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("contact_lists")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLists(data || []);
        } catch (error) {
            console.error("Error fetching lists:", error);
            toast.error("Failed to load contact lists");
        } finally {
            setLoading(false);
        }
    };

    const handleListCreated = () => {
        fetchLists();
        setShowCreateModal(false);
        toast.success("Contact list created!");
    };

    const handleImportComplete = () => {
        fetchLists();
        setShowImportModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            <DashboardSidebar />

            <div className="flex-1 lg:ml-64">
                {/* Header */}
                <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <MobileSidebar />
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate">
                                        Contact Lists
                                    </h1>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                                        Manage your email contacts and lists
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowImportModal(true)}
                                    size="sm"
                                >
                                    <Upload className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Import CSV</span>
                                </Button>

                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-premium"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">New List</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {lists.length === 0 ? (
                        <EmptyState onImport={() => setShowImportModal(true)} />
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map((list) => (
                                <ContactListCard
                                    key={list.id}
                                    list={list}
                                    onUpdate={fetchLists}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateListModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleListCreated}
            />

            <ImportCSVModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={handleImportComplete}
            />
        </div>
    );
};

const EmptyState = ({ onImport }) => (
    <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No contact lists yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Import your contacts to start sending campaigns. You can upload a CSV file
            or create a list manually.
        </p>
        <Button onClick={onImport} className="btn-premium">
            <Upload className="w-4 h-4 mr-2" />
            Import Your First List
        </Button>
    </div>
);

export default Contacts;
