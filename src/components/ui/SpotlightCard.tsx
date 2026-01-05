
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string; // Kept for backward compatibility but unused or repurposed
}

export const SpotlightCard = ({
    children,
    className,
    spotlightColor,
    ...props
}: SpotlightCardProps) => {
    return (
        <div
            className={cn(
                "relative rounded-2xl border border-white/5 bg-zinc-900/20 text-card-foreground shadow-sm overflow-hidden backdrop-blur-3xl transition-all duration-500 group hover:bg-zinc-900/40 hover:shadow-2xl hover:shadow-primary/5",
                className
            )}
            {...props}
        >
            {/* Stage 6: Internal Polish Layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            <div className="relative h-full z-10">{children}</div>
        </div>
    );
};
