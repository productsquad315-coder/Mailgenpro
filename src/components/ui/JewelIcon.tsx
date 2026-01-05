
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface JewelIconProps {
    icon: LucideIcon;
    color?: "primary" | "purple" | "blue" | "orange" | "green";
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const JewelIcon = ({ icon: Icon, color = "primary", className, size = "md" }: JewelIconProps) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    const colorStyles = {
        primary: "from-primary/20 to-primary/5 border-primary/20 text-primary",
        purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400",
        blue: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
        orange: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
        green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400"
    };

    return (
        <div
            className={cn(
                "relative flex items-center justify-center rounded-xl border backdrop-blur-sm bg-gradient-to-br shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105",
                sizeClasses[size],
                colorStyles[color],
                className
            )}
        >
            <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className={cn(iconSizes[size], "relative z-10")} strokeWidth={2} />
        </div>
    );
};
