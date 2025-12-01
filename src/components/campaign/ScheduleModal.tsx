import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface ScheduleModalProps {
    open: boolean;
    onClose: () => void;
    onSchedule: (scheduledAt: Date) => void;
}

const ScheduleModal = ({ open, onClose, onSchedule }: ScheduleModalProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedHour, setSelectedHour] = useState("09");
    const [selectedMinute, setSelectedMinute] = useState("00");

    const handleSchedule = () => {
        if (!selectedDate) return;

        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

        onSchedule(scheduledDateTime);
        onClose();
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Schedule Campaign
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div>
                        <Label className="mb-2 block">Select Date</Label>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            className="rounded-md border"
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Select Time
                        </Label>
                        <div className="flex gap-2">
                            <Select value={selectedHour} onValueChange={setSelectedHour}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hours.map((hour) => (
                                        <SelectItem key={hour} value={hour}>
                                            {hour}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span className="flex items-center text-2xl">:</span>

                            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent>
                                    {minutes.map((minute) => (
                                        <SelectItem key={minute} value={minute}>
                                            {minute}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Scheduled for:</p>
                            <p className="text-lg font-semibold">
                                {format(new Date(selectedDate.setHours(parseInt(selectedHour), parseInt(selectedMinute))), "PPP 'at' p")}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSchedule} disabled={!selectedDate}>
                        Schedule Send
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleModal;
