import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Mail, FileText, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";

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
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b border-border/40 glass-card">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <MobileSidebar />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <HelpCircle className="w-6 h-6 text-primary" />
                                    Help & Support
                                </h1>
                                <p className="text-sm text-muted-foreground">Get help with Mailgenpro</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate("/support")}>
                                <MessageCircle className="w-8 h-8 text-primary mb-3" />
                                <h3 className="font-semibold mb-2">Contact Support</h3>
                                <p className="text-sm text-muted-foreground">Get help from our team</p>
                            </Card>

                            <Card className="glass-card p-6 hover-lift cursor-pointer" onClick={() => window.open("mailto:teamMailgenpro@gmail.com")}>
                                <Mail className="w-8 h-8 text-primary mb-3" />
                                <h3 className="font-semibold mb-2">Email Us</h3>
                                <p className="text-sm text-muted-foreground">teamMailgenpro@gmail.com</p>
                            </Card>

                            <Card className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate("/updates")}>
                                <FileText className="w-8 h-8 text-primary mb-3" />
                                <h3 className="font-semibold mb-2">What's New</h3>
                                <p className="text-sm text-muted-foreground">View latest updates</p>
                            </Card>
                        </div>

                        {/* FAQs */}
                        <Card className="glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-6">
                                {faqs.map((faq, index) => (
                                    <div key={index} className="border-b border-border/50 last:border-0 pb-6 last:pb-0">
                                        <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                                        <p className="text-muted-foreground">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Getting Started */}
                        <Card className="glass-card p-8 border-primary/20">
                            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">1. Create Your First Campaign</h3>
                                    <p className="text-muted-foreground mb-3">
                                        Start by clicking "New Campaign" and entering your product URL. Our AI will analyze your page and generate a complete email sequence.
                                    </p>
                                    <Button onClick={() => navigate("/create-campaign")} className="btn-premium">
                                        Create Campaign
                                    </Button>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">2. Review & Customize</h3>
                                    <p className="text-muted-foreground">
                                        Once generated, review each email in your sequence. You can edit content, subject lines, and customize the CTA to match your brand.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">3. Export & Send</h3>
                                    <p className="text-muted-foreground">
                                        Export your emails as ESP-ready HTML files. Upload them to your email service provider (Mailchimp, SendGrid, etc.) and start sending!
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Help;
