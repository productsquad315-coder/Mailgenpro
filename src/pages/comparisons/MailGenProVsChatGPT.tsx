
import { ArrowLeft, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const MailGenProVsChatGPT = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={mailgenproIcon} alt="Mailgenpro" className="w-8 h-8" />
                        <span className="font-bold text-xl">Mailgenpro</span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="space-y-12">
                    {/* Hero */}
                    <div className="text-center space-y-6">
                        <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
                            Comparison
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            MailGenPro vs ChatGPT
                        </h1>
                        <p className="text-2xl font-medium text-muted-foreground leading-tight max-w-2xl mx-auto">
                            Which tool is right for your cold outreach?
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h3 className="text-xl font-bold mb-4">MailGenPro</h3>
                            <p className="text-muted-foreground mb-4">Best for: Founders and Sales teams focused on booking meetings.</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Purpose-built for cold email outreach</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Includes spam-safe formatting logic</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Analyzes website to extract specific value props</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h3 className="text-xl font-bold mb-4">ChatGPT</h3>
                            <p className="text-muted-foreground mb-4">Best for: General writing, coding, and brainstorming.</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Extremely versatile for any topic</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-500 shrink-0" />
                                    <span>Often sounds robotic ("I hope this emails finds you well")</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-500 shrink-0" />
                                    <span>Requires complex prompting to get good sales copy</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <h3>The Verdict</h3>
                        <p className="text-muted-foreground text-lg">
                            ChatGPT is an incredible general-purpose tool. If you need to write a poem, debug code, or brainstorm ideas, it's unbeatable.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            However, for <strong>cold outreach</strong>, ChatGPT often falls short. It tends to use "marketing speak," generic openers, and repetitive structures that trigger spam filters and get ignored by busy prospects.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            <strong>MailGenPro</strong> is built specifically to solve this. It's trained on high-converting cold email data, uses proven sales frameworks, and automatically extracts the right information from your website to create messages that sound like they were written by a top-tier sales rep, not a bot.
                        </p>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-card/30 backdrop-blur-lg mt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            &copy; 2025 MailGenPro. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MailGenProVsChatGPT;
