
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
                            <span className="font-heading font-bold text-lg">MailGenPro</span>
                        </div>
                        {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
                    </div>
                </div>

                {/* Desktop HUD Header */}
                {(headerTitle || headerDescription || actionSlot) && (
                    <div className="hidden lg:flex sticky top-6 z-30 px-8 pointer-events-none">
                        <div className="flex-1 max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">

                            {/* HUD Module: Primary Information */}
                            <div className="relative group">
                                <div className="absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col">
                                    {headerTitle && (
                                        <h1 className="text-4xl font-heading font-black tracking-tighter text-foreground drop-shadow-sm leading-none">
                                            {headerTitle}
                                        </h1>
                                    )}
                                    {headerDescription && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                                            <p className="text-muted-foreground/60 text-xs font-mono uppercase tracking-[0.2em]">{headerDescription}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* HUD Module: Actions & System Status */}
                            {actionSlot && (
                                <div className="flex items-center gap-2 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-1.5 rounded-full shadow-2xl relative overflow-hidden group/hud">
                                    {/* HUD Edge highlight */}
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                                    <div className="flex items-center gap-2 px-2">
                                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">System Live</span>
                                        </div>
                                        <div className="w-px h-4 bg-white/10 mx-1" />
                                        {actionSlot}
                                    </div>
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
