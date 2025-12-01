import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportCSVModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportCSVModal = ({ open, onClose, onSuccess }: ImportCSVModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [listName, setListName] = useState("");
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ success: boolean; total: number; listName: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setListName(selectedFile.name.replace(".csv", ""));
            setError(null);
        }
    };

    const parseCSV = (text: string) => {
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length === 0) throw new Error("CSV file is empty");

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        if (!headers.includes("email")) {
            throw new Error("CSV must have an 'email' column");
        }

        const contacts = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",");
            if (values.length < headers.length) continue;

            const contact: any = {};
            headers.forEach((header, index) => {
                contact[header] = values[index]?.trim();
            });

            if (contact.email && contact.email.includes("@")) {
                contacts.push({
                    email: contact.email.toLowerCase(),
                    first_name: contact.first_name || contact.firstname || "",
                    last_name: contact.last_name || contact.lastname || "",
                });
            }

            setProgress((i / lines.length) * 100);
        }

        return contacts;
    };

    const handleImport = async () => {
        if (!file || !listName.trim()) {
            toast.error("Please select a file and enter a list name");
            return;
        }

        setImporting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Parse CSV
            const text = await file.text();
            const contacts = parseCSV(text);

            if (contacts.length === 0) {
                throw new Error("No valid contacts found in CSV");
            }

            // Create list
            const { data: list, error: listError } = await supabase
                .from("contact_lists")
                .insert({
                    user_id: user.id,
                    name: listName.trim(),
                    total_contacts: contacts.length,
                })
                .select()
                .single();

            if (listError) throw listError;

            // Insert contacts in batches
            const batchSize = 100;
            for (let i = 0; i < contacts.length; i += batchSize) {
                const batch = contacts.slice(i, i + batchSize);
                const contactsWithListId = batch.map((c) => ({ ...c, list_id: list.id }));

                const { error: contactError } = await supabase
                    .from("contacts")
                    .insert(contactsWithListId);

                if (contactError) {
                    console.error("Error inserting batch:", contactError);
                    // Continue with next batch
                }
            }

            setResult({
                success: true,
                total: contacts.length,
                listName: listName.trim(),
            });
        } catch (error: any) {
            console.error("Error importing CSV:", error);
            setError(error.message || "Failed to import CSV");
            toast.error(error.message || "Failed to import CSV");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setListName("");
        setProgress(0);
        setResult(null);
        setError(null);
        onClose();
    };

    const handleDone = () => {
        onSuccess();
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Contacts from CSV</DialogTitle>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-6">
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-upload"
                                    disabled={importing}
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-8 h-8 text-primary" />
                                            <div className="text-left">
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                CSV file with email, first_name, last_name columns
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* List Name */}
                        {file && (
                            <div>
                                <label className="block text-sm font-medium mb-2">List Name</label>
                                <Input
                                    value={listName}
                                    onChange={(e) => setListName(e.target.value)}
                                    placeholder="e.g., Newsletter Subscribers"
                                    disabled={importing}
                                />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Progress */}
                        {importing && (
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Importing contacts...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleClose} disabled={importing}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || !listName || importing}
                                className="btn-premium"
                            >
                                {importing ? "Importing..." : "Import Contacts"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Import Successful!</h3>
                        <p className="text-muted-foreground mb-6">
                            Imported {result.total} contacts to "{result.listName}"
                        </p>
                        <Button onClick={handleDone} className="btn-premium">
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ImportCSVModal;
