
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
                            Which tool is right for your e-commerce store?
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h3 className="text-xl font-bold mb-4">Mailgenpro</h3>
                            <p className="text-muted-foreground mb-4">Best for: E-commerce founders and agencies focused on ROI flows.</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Instantly generates cart-recovery & lifecycle flows</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Analyzes product URLs to extract high-ROI features</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Outputs ESP-ready HTML for Klaviyo & Shopify</span>
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
                            ChatGPT and Copy.ai are great for general drafts—but you still need to brief them, paste product info, write complex prompts, and structure each flow step by step.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            <strong>Mailgenpro is purpose-built for e-commerce:</strong> it reads your product page and instantly outputs complete abandoned-cart, welcome, and post-purchase flows, already structured, timed, and ready to paste into your ESP.
                        </p>
                        <p className="text-muted-foreground text-lg">
                            While ChatGPT requires you to be a "prompt engineer," Mailgenpro handles the entire workflow from URL to Klaviyo-ready HTML in under 60 seconds.
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
