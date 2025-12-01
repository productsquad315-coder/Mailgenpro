import { ExternalLink } from "lucide-react";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

interface MailgenproWatermarkProps {
  className?: string;
}

const MailgenproWatermark = ({ className = "" }: MailgenproWatermarkProps) => {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
      <p className="text-xs text-gray-400 font-medium">
        Powered by <span className="text-gray-600 font-semibold">Mailgenpro</span>
      </p>
    </div>
  );
};

export default MailgenproWatermark;
