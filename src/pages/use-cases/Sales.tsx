
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const UseCaseSales = () => {
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
                            Use Case: Sales Teams
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            Outreach for Sales Pros
                        </h1>
                        <p className="text-2xl font-medium text-foreground leading-tight max-w-2xl mx-auto">
                            Hit your quota without burning out on manual writing.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        {/* Who is this for? */}
                        <div className="bg-card glass-card p-8 rounded-2xl border border-border/50">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                Who is this for?
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                SDRs, BDRs, Account Executives, and Sales Leaders looking to scale their outbound efforts.
                            </p>
                        </div>

                        {/* The Problem */}
                        <div className="bg-card glass-card p-8 rounded-2xl border border-border/50">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                The Problem
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Personalization works, but it's unscalable. You spend hours researching and writing "perfect" emails only to get ghosted, or you blast generic templates that damage your brand.
                            </p>
                        </div>
                    </div>

                    {/* How MailGenPro Helps */}
                    <div className="bg-card/30 p-8 rounded-2xl border border-border space-y-6">
                        <h2 className="text-2xl font-bold">How MailGenPro Helps</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Scale Personalization</h3>
                                    <p className="text-muted-foreground text-sm">Automate the research and drafting process, allowing you to send personalized notes to 10x more prospects.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Proven Frameworks</h3>
                                    <p className="text-muted-foreground text-sm">Access built-in sales methodologies (PAS, AIDA) that are proven to drive conversions.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">The Result</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Higher reply rates, more pipeline generation, and more time spent closing deals instead of writing emails.
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

export default UseCaseSales;
