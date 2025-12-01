import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, AlertCircle, Zap, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickSendModalProps {
    campaign: {
        id: string;
        name: string;
        emails?: any[];
    };
    open: boolean;
    onClose: () => void;
}

interface Recipient {
    email: string;
    firstName?: string;
    lastName?: string;
}

const QuickSendModal = ({ campaign, open, onClose }: QuickSendModalProps) => {
    const navigate = useNavigate();
    const [recipients, setRecipients] = useState<Recipient[]>([{ email: "", firstName: "", lastName: "" }]);
    const [credits, setCredits] = useState({ free: 0, paid: 0, total: 0 });
    const [sending, setSending] = useState(false);
    const [emailCount, setEmailCount] = useState(0);

    useState(() => {
        if (open) {
            fetchCredits();
            fetchEmailCount();
        }
    });

    const fetchCredits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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
            console.error('Error fetching credits:', error);
        }
    };

    const fetchEmailCount = async () => {
        const { data } = await supabase
            .from('email_sequences')
            .select('id')
            .eq('campaign_id', campaign.id);

        setEmailCount(data?.length || campaign.emails?.length || 0);
    };

    const addRecipient = () => {
        setRecipients([...recipients, { email: "", firstName: "", lastName: "" }]);
    };

    const removeRecipient = (index: number) => {
        if (recipients.length > 1) {
            setRecipients(recipients.filter((_, i) => i !== index));
        }
    };

    const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
        const updated = [...recipients];
        updated[index][field] = value;
        setRecipients(updated);
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validRecipients = recipients.filter(r => validateEmail(r.email));
    const emailsToSend = validRecipients.length * emailCount;
    const hasEnoughCredits = credits.total >= emailsToSend;
    const shortfall = Math.max(0, emailsToSend - credits.total);

    const handleSend = async () => {
        if (validRecipients.length === 0) {
            toast.error('Please enter at least one valid email address');
            return;
        }

        if (!hasEnoughCredits) {
            toast.error('Insufficient email credits');
            return;
        }

        setSending(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create a temporary contact list for quick send
            const { data: tempList, error: listError } = await supabase
                .from('contact_lists')
                .insert({
                    user_id: user.id,
                    name: `Quick Send - ${new Date().toLocaleString()}`,
                    description: 'Temporary list for quick send',
                })
                .select()
                .single();

            if (listError) throw listError;

            // Insert contacts
            const contactsToInsert = validRecipients.map(r => ({
                list_id: tempList.id,
                email: r.email,
                first_name: r.firstName || '',
                last_name: r.lastName || '',
                status: 'active' as const,
            }));

            const { error: contactsError } = await supabase
                .from('contacts')
                .insert(contactsToInsert);

            if (contactsError) throw contactsError;

            // Send campaign
            const { data, error } = await supabase.functions.invoke('send-campaign', {
                body: {
                    campaignId: campaign.id,
                    listId: tempList.id
                }
            });

            if (error) throw error;

            toast.success(`Sending ${emailsToSend} emails!`);
            navigate(`/campaign/${campaign.id}/sending?queue=${data.queueId}`);
            onClose();
        } catch (error: any) {
            console.error('Error sending campaign:', error);
            toast.error(error.message || 'Failed to send campaign');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Quick Send: {campaign.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Recipients */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">
                            Recipients
                        </Label>
                        <div className="space-y-3">
                            {recipients.map((recipient, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex gap-3">
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <div className="col-span-3 sm:col-span-1">
                                                <Label className="text-xs">Email *</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    value={recipient.email}
                                                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                                    className={!validateEmail(recipient.email) && recipient.email ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">First Name</Label>
                                                <Input
                                                    placeholder="John"
                                                    value={recipient.firstName}
                                                    onChange={(e) => updateRecipient(index, 'firstName', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Last Name</Label>
                                                <Input
                                                    placeholder="Doe"
                                                    value={recipient.lastName}
                                                    onChange={(e) => updateRecipient(index, 'lastName', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {recipients.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRecipient(index)}
                                                className="mt-5"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={addRecipient}
                            className="mt-3 w-full"
                            disabled={recipients.length >= 10}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Recipient {recipients.length >= 10 && "(Max 10)"}
                        </Button>
                    </div>

                    {/* Sending Summary */}
                    {validRecipients.length > 0 && (
                        <Card className="p-4 bg-muted/50">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valid recipients:</span>
                                    <span className="font-semibold">{validRecipients.length}</span>
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
                    {validRecipients.length > 0 && (
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
                            onClick={handleSend}
                            disabled={validRecipients.length === 0 || !hasEnoughCredits || sending}
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
                                    Send to {validRecipients.length} {validRecipients.length === 1 ? 'Recipient' : 'Recipients'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuickSendModal;
