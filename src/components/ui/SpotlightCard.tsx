
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
                "relative rounded-xl border border-white/5 bg-card/30 text-card-foreground shadow-sm overflow-hidden backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:bg-card/40 hover:border-white/10 group",
                className
            )}
            {...props}
        >
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />

            {/* Top Highlight (Static) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Gradient Sheen (Hover Only - Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative h-full z-10">{children}</div>
        </div>
    );
};
