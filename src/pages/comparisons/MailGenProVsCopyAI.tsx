
import { ArrowLeft, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const MailGenProVsCopyAI = () => {
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
                            MailGenPro vs Copy.ai
                        </h1>
                        <p className="text-2xl font-medium text-muted-foreground leading-tight max-w-2xl mx-auto">
                            Comparing tools for marketing vs. sales.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h3 className="text-xl font-bold mb-4">MailGenPro</h3>
                            <p className="text-muted-foreground mb-4">Best for: Direct 1-to-1 Cold Outreach.</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Focus on "plain text" personal emails</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Optimized for reply rates</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Simple workflow for founders</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h3 className="text-xl font-bold mb-4">Copy.ai</h3>
                            <p className="text-muted-foreground mb-4">Best for: Marketing Copy (Blogs, Ads, Social).</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Excellent for blog posts and ad copy</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Brand voice features for marketing teams</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-500 shrink-0" />
                                    <span>Can be "too creative" for cold sales emails</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <h3>The Verdict</h3>
                        <p className="text-muted-foreground text-lg">
                            <strong>Copy.ai</strong> is a powerhouse for marketing teams. If you need to generate blog posts, Instagram captions, or Facebook ad copy, it is one of the best tools available.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            However, cold email is distinct from marketing. It requires a more subtle, personal touch that marketing tools often miss.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            <strong>MailGenPro</strong> is focused entirely on that 1-to-1 connection. We don't try to write your blog posts. We focus on one thing: helping you write personal emails that get meetings. If your goal is to start conversations with prospects, MailGenPro is the specialized tool for the job.
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

export default MailGenProVsCopyAI;
