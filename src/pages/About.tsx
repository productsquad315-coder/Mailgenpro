
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const About = () => {
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
            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <div className="space-y-12">
                    {/* Hero / Definition */}
                    <div className="text-center space-y-6">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            About MailGenPro
                        </h1>
                        <p className="text-2xl md:text-3xl font-medium text-foreground leading-tight">
                            MailGenPro helps founders write high-converting cold emails in under 60 seconds—without sounding like AI.
                        </p>
                    </div>

                    {/* Why it exists */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Why It Exists</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            MailGenPro was built to solve one specific problem: <span className="text-foreground font-medium">most AI-written emails sound robotic and get ignored.</span>
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Generic tools create generic spam. We built an engine that understands personalization, formatting, and the nuances of human-to-human connection, giving you a distinct advantage in the inbox.
                        </p>
                    </section>

                    {/* Who Is It For */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Who It's For</h2>
                        <ul className="grid sm:grid-cols-2 gap-4">
                            <li className="bg-card/50 p-4 rounded-lg border border-border/50">
                                <span className="font-semibold block mb-1">Founders</span>
                                <span className="text-muted-foreground text-sm">Validating ideas and booking first meetings.</span>
                            </li>
                            <li className="bg-card/50 p-4 rounded-lg border border-border/50">
                                <span className="font-semibold block mb-1">Sales Teams</span>
                                <span className="text-muted-foreground text-sm">Scaling outreach without losing the personal touch.</span>
                            </li>
                            <li className="bg-card/50 p-4 rounded-lg border border-border/50">
                                <span className="font-semibold block mb-1">Recruiters</span>
                                <span className="text-muted-foreground text-sm">Connecting with top talent meaningfully.</span>
                            </li>
                            <li className="bg-card/50 p-4 rounded-lg border border-border/50">
                                <span className="font-semibold block mb-1">Freelancers</span>
                                <span className="text-muted-foreground text-sm">Winning clients with professional pitches.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Quick Facts */}
                    <section className="space-y-4 pt-8 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Launched</h3>
                                <p className="text-lg font-medium">2025</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Team</h3>
                                <p className="text-lg font-medium">Built by founders, for founders.</p>
                            </div>
                        </div>
                    </section>
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

export default About;
