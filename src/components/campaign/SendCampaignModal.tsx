import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, AlertCircle, Zap, Loader2, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ScheduleModal from "./ScheduleModal";

interface SendCampaignModalProps {
    campaign: {
        id: string;
        name: string;
        emails?: any[];
    };
    open: boolean;
    onClose: () => void;
}

const SendCampaignModal = ({ campaign, open, onClose }: SendCampaignModalProps) => {
    const navigate = useNavigate();
    const [lists, setLists] = useState<any[]>([]);
    const [selectedList, setSelectedList] = useState<any>(null);
    const [credits, setCredits] = useState({ free: 0, paid: 0, total: 0 });
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [emailCount, setEmailCount] = useState(0);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    useEffect(() => {
        // Fetch email count for campaign
        const fetchEmailCount = async () => {
            const { data } = await supabase
                .from('email_sequences')
                .select('id')
                .eq('campaign_id', campaign.id);

            setEmailCount(data?.length || campaign.emails?.length || 0);
        };

        if (campaign.id) {
            fetchEmailCount();
        }
    }, [campaign.id, campaign.emails]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch contact lists
            const { data: listsData } = await supabase
                .from('contact_lists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setLists(listsData || []);

            // Fetch email credits
            const { data: creditsData } = await supabase
                .from('email_credits')
                .select('credits_free, credits_paid, credits_total')
                .eq('user_id', user.id)
                .single();

            if (creditsData) {
                setCredits({
                    free: creditsData.credits_free || 0,
                    paid: creditsData.credits_paid || 0,
                    total: creditsData.credits_total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const emailsToSend = selectedList ? selectedList.total_contacts * emailCount : 0;
    const hasEnoughCredits = credits.total >= emailsToSend;
    const shortfall = Math.max(0, emailsToSend - credits.total);

    const handleSend = async (scheduledAt?: Date) => {
        if (!selectedList) {
            toast.error('Please select a contact list');
            return;
        }

        if (!hasEnoughCredits) {
            toast.error('Insufficient email credits');
            return;
        }

        setSending(true);

        try {
            const { data, error } = await supabase.functions.invoke('send-campaign', {
                body: {
                    campaignId: campaign.id,
                    listId: selectedList.id,
                    scheduledAt: scheduledAt?.toISOString()
                }
            });

            if (error) throw error;

            if (scheduledAt) {
                toast.success(`Campaign scheduled for ${scheduledAt.toLocaleString()}`);
            } else {
                toast.success(`Sending ${emailsToSend} emails!`);
            }
            navigate(`/campaign/${campaign.id}/sending?queue=${data.queueId}`);
            onClose();
        } catch (error: any) {
            console.error('Error sending campaign:', error);
            toast.error(error.message || 'Failed to send campaign');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Send Campaign: {campaign.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Select Contact List */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Select Contact List
                        </label>
                        {lists.length === 0 ? (
                            <Alert>
                                <Users className="w-4 h-4" />
                                <AlertDescription>
                                    No contact lists found.{' '}
                                    <a href="/contacts" className="text-primary underline">
                                        Create one first
                                    </a>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Select
                                value={selectedList?.id}
                                onValueChange={(id) => {
                                    setSelectedList(lists.find((l) => l.id === id));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a list..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {lists.map((list) => (
                                        <SelectItem key={list.id} value={list.id}>
                                            {list.name} ({list.total_contacts} contacts)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Sending Summary */}
                    {selectedList && (
                        <Card className="p-4 bg-muted/50">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Contacts:</span>
                                    <span className="font-semibold">{selectedList.total_contacts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Emails in sequence:</span>
                                    <span className="font-semibold">{emailCount}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base">
                                    <span className="font-medium">Total emails to send:</span>
                                    <span className="font-bold text-primary">{emailsToSend}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Credits Check */}
                    {selectedList && (
                        <Card
                            className="p-4 border-2"
                            style={{
                                borderColor: hasEnoughCredits
                                    ? 'hsl(var(--primary))'
                                    : 'hsl(var(--destructive))',
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <Zap
                                    className={`w-5 h-5 mt-0.5 ${hasEnoughCredits ? 'text-primary' : 'text-destructive'
                                        }`}
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Email Credits</span>
                                        <span className="font-semibold">{credits.total} available</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Free credits:</span>
                                            <span>{credits.free}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Paid credits:</span>
                                            <span>{credits.paid}</span>
                                        </div>
                                    </div>

                                    {!hasEnoughCredits && (
                                        <Alert variant="destructive" className="mt-3">
                                            <AlertCircle className="w-4 h-4" />
                                            <AlertDescription>
                                                You need {shortfall} more credits to send this campaign.
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto ml-1"
                                                    onClick={() => navigate('/billing')}
                                                >
                                                    Buy credits
                                                </Button>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={sending}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowScheduleModal(true)}
                            disabled={!selectedList || !hasEnoughCredits || sending || lists.length === 0}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Schedule
                        </Button>
                        <Button
                            onClick={() => handleSend()}
                            disabled={!selectedList || !hasEnoughCredits || sending || lists.length === 0}
                            className="btn-premium"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send {emailsToSend > 0 ? `${emailsToSend} Emails` : 'Campaign'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <ScheduleModal
                    open={showScheduleModal}
                    onClose={() => setShowScheduleModal(false)}
                    onSchedule={(scheduledAt) => handleSend(scheduledAt)}
                />
            </DialogContent>
        </Dialog>
    );
};

export default SendCampaignModal;
