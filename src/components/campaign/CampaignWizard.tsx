import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    title: string;
    description: string;
}

interface CampaignWizardProps {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    canProceed: boolean;
    children: React.ReactNode;
}

const steps: Step[] = [
    { id: 1, title: "Basic Info", description: "Campaign name and URL" },
    { id: 2, title: "Sequence Type", description: "Choose your email flow" },
    { id: 3, title: "Configuration", description: "Duration and settings" },
    { id: 4, title: "Review", description: "Confirm and generate" },
];

export const CampaignWizard = ({
    currentStep,
    totalSteps,
    onNext,
    onPrev,
    canProceed,
    children,
}: CampaignWizardProps) => {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{
                                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Step Indicators */}
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = currentStep > stepNumber;
                        const isCurrent = currentStep === stepNumber;

                        return (
                            <div
                                key={step.id}
                                className="flex flex-col items-center relative bg-background px-2"
                            >
                                <motion.div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors",
                                        isCompleted && "bg-primary text-primary-foreground",
                                        isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                    )}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span>{stepNumber}</span>
                                    )}
                                </motion.div>
                                <div className="text-center">
                                    <p className={cn(
                                        "text-sm font-medium",
                                        isCurrent && "text-foreground",
                                        !isCurrent && "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground hidden sm:block">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px]"
                >
                    {children}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={onPrev}
                    disabled={currentStep === 1}
                    className="gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>

                <div className="flex gap-2">
                    <Button
                        onClick={onNext}
                        disabled={!canProceed}
                        className="gap-2"
                    >
                        {currentStep === totalSteps ? "Generate Campaign" : "Next"}
                        {currentStep < totalSteps && <ChevronRight className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
