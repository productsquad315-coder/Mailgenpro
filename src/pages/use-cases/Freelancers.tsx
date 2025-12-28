
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const UseCaseFreelancers = () => {
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
                            Use Case: Freelancers
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            Outreach for Freelancers
                        </h1>
                        <p className="text-2xl font-medium text-foreground leading-tight max-w-2xl mx-auto">
                            Stop the feast or famine cycle. Win clients on demand.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        {/* Who is this for? */}
                        <div className="bg-card glass-card p-8 rounded-2xl border border-border/50">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                Who is this for?
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Consultants, Agency Owners, and Solopreneurs offering professional services.
                            </p>
                        </div>

                        {/* The Problem */}
                        <div className="bg-card glass-card p-8 rounded-2xl border border-border/50">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                The Problem
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You're great at what you do, but finding new clients is a struggle. You rely on referrals (which are unpredictable) because you hate "pitching" yourself.
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
                                    <h3 className="font-semibold mb-2">Professional Positioning</h3>
                                    <p className="text-muted-foreground text-sm">Creates pitches that position you as a strategic partner and expert problem solver, not just another vendor.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Consistency</h3>
                                    <p className="text-muted-foreground text-sm">Makes it easy to send a few high-quality emails every week, keeping your pipeline full without taking focus away from client work.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">The Result</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            A consistent stream of predictable leads and the ability to charge higher rates due to premium positioning.
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

export default UseCaseFreelancers;
