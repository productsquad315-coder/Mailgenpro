import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MessageCircle, Mail, FileText, HelpCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Help = () => {
    const navigate = useNavigate();

    const faqs = [
        {
            question: "How do I create my first campaign?",
            answer: "Click 'New Campaign' from the sidebar or dashboard. Enter your product URL, choose your sequence type, and we'll generate a complete email sequence for you in seconds."
        },
        {
            question: "What is a CTA (Call-to-Action)?",
            answer: "A CTA is a button or link in your emails that directs recipients to take action, like visiting your website or making a purchase. You can add CTAs when creating a campaign."
        },
        {
            question: "How do I export my emails?",
            answer: "Once your campaign is generated, click the 'Export HTML' button. You'll get a ZIP file with ESP-ready HTML files that you can upload to any email service provider."
        },
        {
            question: "What are bonus credits?",
            answer: "Bonus credits are additional campaign generations that never expire. They're used before your monthly plan credits and can be purchased or added by admins."
        },
        {
            question: "Can I edit the generated emails?",
            answer: "Yes! Click on any email in your campaign to view and edit the content, subject line, and other details before exporting."
        },
        {
            question: "How do I upgrade my plan?",
            answer: "Go to Billing from the sidebar and choose a plan that fits your needs. You can upgrade, downgrade, or purchase credit packs anytime."
        }
    ];

    return (
        <DashboardLayout
            headerTitle="Help & Support"
            headerDescription="Get help with Mailgenpro"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto space-y-12"
            >
                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                    <SpotlightCard className="p-8 hover:translate-y-[-4px] transition-all cursor-pointer" onClick={() => navigate("/support")}>
                        <MessageCircle className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Contact Support</h3>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed">Get dedicated help from our technical success team</p>
                    </SpotlightCard>

                    <SpotlightCard className="p-8 hover:translate-y-[-4px] transition-all cursor-pointer" onClick={() => window.open("mailto:teamMailgenpro@gmail.com")}>
                        <Mail className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Email Us</h3>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed">teamMailgenpro@gmail.com</p>
                    </SpotlightCard>

                    <SpotlightCard className="p-8 hover:translate-y-[-4px] transition-all cursor-pointer" onClick={() => navigate("/updates")}>
                        <FileText className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">What's New</h3>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed">View latest updates and feature releases</p>
                    </SpotlightCard>
                </div>

                {/* FAQs */}
                <SpotlightCard className="p-10">
                    <h2 className="text-3xl font-heading font-black tracking-tighter mb-8">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                        {faqs.map((faq, index) => (
                            <div key={index} className="space-y-3">
                                <h3 className="font-bold text-lg text-foreground/90">{faq.question}</h3>
                                <p className="text-muted-foreground/70 text-sm leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </SpotlightCard>

                {/* Getting Started Guide */}
                <SpotlightCard className="p-10 border-primary/20">
                    <h2 className="text-3xl font-heading font-black tracking-tighter mb-8">Getting Started</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                            <h3 className="font-bold text-lg">Create Campaign</h3>
                            <p className="text-muted-foreground/60 text-sm leading-relaxed">
                                Start by clicking "New Campaign" and entering your product URL. Our AI will analyze your page.
                            </p>
                            <Button onClick={() => navigate("/create-campaign")} className="btn-premium w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Start Now
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                            <h3 className="font-bold text-lg">Review & Customize</h3>
                            <p className="text-muted-foreground/60 text-sm leading-relaxed">
                                Review each email in your sequence. You can edit content, subject lines, and customize the CTA.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                            <h3 className="font-bold text-lg">Export & Send</h3>
                            <p className="text-muted-foreground/60 text-sm leading-relaxed">
                                Export your emails as ESP-ready HTML files. Upload them to your email service provider and start sending!
                            </p>
                        </div>
                    </div>
                </SpotlightCard>
            </motion.div>
        </DashboardLayout>
    );
};
    );
};

export default Help;
