import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Globe, FileText } from "lucide-react";

interface Step1Props {
    name: string;
    url: string;
    onNameChange: (value: string) => void;
    onUrlChange: (value: string) => void;
}

export const Step1BasicInfo = ({ name, url, onNameChange, onUrlChange }: Step1Props) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Let's start with the basics</h2>
                <p className="text-muted-foreground">
                    Give your campaign a name and provide the URL we'll analyze
                </p>
            </div>

            <Card className="p-6 space-y-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                    <Label htmlFor="campaign-name" className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Campaign Name
                    </Label>
                    <Input
                        id="campaign-name"
                        placeholder="e.g., Product Launch, Welcome Series, Newsletter"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="text-base"
                    />
                    <p className="text-sm text-muted-foreground">
                        Choose a descriptive name to help you identify this campaign later
                    </p>
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                    <Label htmlFor="website-url" className="text-base font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website URL
                    </Label>
                    <Input
                        id="website-url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        className="text-base"
                    />
                    <p className="text-sm text-muted-foreground">
                        We'll analyze this page to understand your brand and create personalized emails
                    </p>
                </div>
            </Card>

            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Pro tip:</strong> Use your homepage or product page for best results. We'll extract your brand voice, value proposition, and key messaging.
                </p>
            </div>
        </div>
    );
};
