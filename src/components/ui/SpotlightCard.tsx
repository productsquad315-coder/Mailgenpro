
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
                "relative rounded-xl border border-white/10 bg-card/40 text-card-foreground shadow-sm overflow-hidden backdrop-blur-xl transition-all duration-300 hover:bg-card/50",
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

            <div className="relative h-full z-10">{children}</div>
        </div>
    );
};
