
import { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import { User } from "lucide-react";

interface DashboardLayoutProps {
    children: ReactNode;
    headerTitle?: string;
    headerDescription?: string;
    actionSlot?: ReactNode;
}

const DashboardLayout = ({ children, headerTitle, headerDescription, actionSlot }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen flex bg-background relative overflow-x-hidden">
            {/* Texture Overlay (Global) */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-overlay bg-noise" />

            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 lg:ml-80 transition-all duration-300 relative z-10">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-40 border-b border-border/40 glass-card">
                    <div className="flex items-center justify-between px-4 py-4">
                        <div className="flex items-center gap-3">
                            <MobileSidebar />
                            <span className="font-heading font-bold text-lg">Mailgenpro</span>
                        </div>
                        {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
                    </div>
                </div>

                {/* Desktop Header (Standard) */}
                {(headerTitle || headerDescription || actionSlot) && (
                    <div className="hidden lg:block sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5">
                        <div className="px-8 py-6 flex items-center justify-between">
                            <div>
                                {headerTitle && <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">{headerTitle}</h1>}
                                {headerDescription && <p className="text-muted-foreground mt-1 text-sm">{headerDescription}</p>}
                            </div>
                            {actionSlot && (
                                <div className="flex items-center gap-3">
                                    {actionSlot}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 lg:p-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
