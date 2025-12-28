
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const FAQ = () => {
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
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Everything you need to know about MailGenPro.
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-medium text-left">What is MailGenPro?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                MailGenPro is a specialized AI tool designed to write high-converting cold emails. It analyzes your company's value proposition and your prospect's needs to generate personalized outreach sequences that don't sound robotic.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg font-medium text-left">Is MailGenPro safe for cold email?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Yes. MailGenPro is built with spam-avoidance best practices in mind. We prioritize text-based formatting, minimize spam trigger words, and encourage personalization, which helps improve deliverability compared to generic, bulk automated emails.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg font-medium text-left">Who should use MailGenPro?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                MailGenPro is designed for founders, sales teams, recruiters, and freelancers who need to send effective cold outreach but don't have the time to write every email from scratch. It is best for those who value quality and conversion over mass volume.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-lg font-medium text-left">How is it different from ChatGPT?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Unlike ChatGPT, which is a general-purpose AI, MailGenPro is purpose-built for cold sales outreach. It includes specific personalization logic, spam-safe formatting checks, and sales frameworks (like AIDA or PAS) baked into the generation process to maximize reply rates.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger className="text-lg font-medium text-left">Does it help avoid spam?</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Yes. By helping you create relevant, non-salesy content and avoiding common spam words, MailGenPro reduces the likelihood of your emails triggering spam filters. However, reliable deliverability also depends on your technical setup (DKIM, SPF, DMARC) and sending volume.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
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

export default FAQ;
