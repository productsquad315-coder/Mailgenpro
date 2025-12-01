import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Plus, Search, User, Gem } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";

interface UserData {
    id: string;
    email: string;
    full_name: string | null;
    generations_used: number;
    generations_limit: number;
    topup_credits: number;
    plan: string;
}

const Admin = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [creditAmount, setCreditAmount] = useState("");
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate("/auth");
                return;
            }

            // Check if user has admin role
            const { data: profile } = await supabase
                .from("profiles")
                .select("app_role")
                .eq("id", session.user.id)
                .single();

            if (profile?.app_role !== "admin") {
                toast.error("Access denied. Admin privileges required.");
                navigate("/dashboard");
                return;
            }

            setIsAdmin(true);
            setLoading(false);
        };

        checkAdmin();
    }, [navigate]);

    const handleSearchUser = async () => {
        if (!searchEmail) {
            toast.error("Please enter an email address");
            return;
        }

        setSearching(true);
        try {
            // First, find the user by email in auth.users (via profiles)
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .eq("email", searchEmail.toLowerCase())
                .single();

            if (profileError || !profile) {
                toast.error("User not found");
                setSelectedUser(null);
                setSearching(false);
                return;
            }

            // Then get their usage data
            const { data: usage, error: usageError } = await supabase
                .from("user_usage")
                .select("*")
                .eq("user_id", profile.id)
                .single();

            if (usageError || !usage) {
                toast.error("User usage data not found");
                setSelectedUser(null);
                setSearching(false);
                return;
            }

            setSelectedUser({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                generations_used: usage.generations_used,
                generations_limit: usage.generations_limit,
                topup_credits: usage.topup_credits || 0,
                plan: usage.plan,
            });

            toast.success("User found!");
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to search user");
        } finally {
            setSearching(false);
        }
    };

    const handleAddCredits = async () => {
        if (!selectedUser) {
            toast.error("Please select a user first");
            return;
        }

        const credits = parseInt(creditAmount);
        if (isNaN(credits) || credits <= 0) {
            toast.error("Please enter a valid credit amount");
            return;
        }

        setAdding(true);
        try {
            const { error } = await supabase.rpc("add_topup_credits", {
                p_user_id: selectedUser.id,
                p_credits: credits,
            });

            if (error) throw error;

            toast.success(`Successfully added ${credits} credits to ${selectedUser.email}`);

            // Refresh user data
            const { data: usage } = await supabase
                .from("user_usage")
                .select("*")
                .eq("user_id", selectedUser.id)
                .single();

            if (usage) {
                setSelectedUser({
                    ...selectedUser,
                    topup_credits: usage.topup_credits || 0,
                });
            }

            setCreditAmount("");
        } catch (error) {
            console.error("Add credits error:", error);
            toast.error("Failed to add credits");
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b border-border/40 glass-card">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-primary" />
                                    Admin Panel
                                </h1>
                                <p className="text-sm text-muted-foreground">Manage user credits and accounts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        {/* Search User */}
                        <Card className="glass-card p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Search User
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="search-email">User Email</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            id="search-email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={searchEmail}
                                            onChange={(e) => setSearchEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                                            className="h-12"
                                        />
                                        <Button
                                            onClick={handleSearchUser}
                                            disabled={searching}
                                            className="btn-premium"
                                        >
                                            {searching ? "Searching..." : "Search"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* User Details */}
                        {selectedUser && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="glass-card p-8 border-primary/20">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" />
                                        User Details
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                                            <p className="font-medium">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Name</p>
                                            <p className="font-medium">{selectedUser.full_name || "Not set"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Plan</p>
                                            <p className="font-medium capitalize">{selectedUser.plan}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">User ID</p>
                                            <p className="font-mono text-xs">{selectedUser.id}</p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-6 mb-6">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <Gem className="w-4 h-4 text-primary" />
                                            Credit Balance
                                        </h3>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground mb-1">Monthly Limit</p>
                                                <p className="text-2xl font-bold">{selectedUser.generations_limit}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground mb-1">Used</p>
                                                <p className="text-2xl font-bold">{selectedUser.generations_used}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground mb-1">Bonus Credits</p>
                                                <p className="text-2xl font-bold text-primary">{selectedUser.topup_credits}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <p className="text-sm text-muted-foreground">Total Available</p>
                                            <p className="text-3xl font-bold">
                                                {selectedUser.generations_limit + selectedUser.topup_credits - selectedUser.generations_used}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Add Credits */}
                                    <div className="space-y-4">
                                        <Label htmlFor="credit-amount">Add Bonus Credits</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="credit-amount"
                                                type="number"
                                                min="1"
                                                placeholder="Enter credit amount"
                                                value={creditAmount}
                                                onChange={(e) => setCreditAmount(e.target.value)}
                                                className="h-12"
                                            />
                                            <Button
                                                onClick={handleAddCredits}
                                                disabled={adding}
                                                className="btn-premium"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {adding ? "Adding..." : "Add Credits"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Bonus credits are added on top of the user's monthly plan limit and never expire.
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
