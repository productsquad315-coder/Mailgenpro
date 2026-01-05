
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
                "relative rounded-2xl border border-white/5 bg-zinc-900/40 text-card-foreground shadow-sm overflow-hidden backdrop-blur-2xl transition-all duration-700 group",
                className
            )}
            {...props}
        >
            {/* Layer 1: Base Subtle Glow (Static) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent opacity-20 pointer-events-none" />

            {/* Layer 2: Noise Texture (Material Depth) */}
            <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />

            {/* Layer 3: Edge Light (Precision Highlight) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-40" />

            {/* High-End Hover Sheen (Refined) */}
            <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-1/2 group-hover:translate-y-1/2 transition-all duration-1000 pointer-events-none" />

            <div className="relative h-full z-10">{children}</div>
        </div>
    );
};
