import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Monitor, Smartphone, Mail, Sun, Moon, Download, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { generateESPReadyHTML } from "@/lib/emailUtils";

interface SmartPreviewProps {
  subject: string;
  content: string;
  htmlContent: string;
  ctaLink?: string | null;
  includeCTA?: boolean;
  templateStyle?: 'minimal' | 'bold' | 'tech' | 'corporate';
  brandName?: string;
}

const SmartPreview = ({
  subject,
  content,
  htmlContent,
  ctaLink,
  includeCTA = true,
  templateStyle = 'minimal',
  brandName = 'Your Brand'
}: SmartPreviewProps) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleDownload = () => {
    const fileName = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    const blob = new Blob([themedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate the themed HTML for preview using the same logic as the export
  const themedHtml = generateESPReadyHTML(
    { subject, content, html_content: htmlContent },
    brandName,
    ctaLink || null,
    includeCTA,
    false, // Don't include watermark in smart preview
    templateStyle
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Smart Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preview - See how it appears in the inbox
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device and Theme Toggles */}
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant={device === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={device === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>

            <Button onClick={handleDownload} className="glow ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </Button>
          </div>

          {/* Inbox Preview Wrapper */}
          <motion.div
            key={`${device}-${theme}-${templateStyle}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg border overflow-hidden ${theme === 'dark'
              ? 'border-gray-700 bg-gray-900'
              : 'border-border/50 bg-white'
              }`}
          >
            {/* Subject Line (Inbox Context) */}
            <div className={`p-4 border-b ${theme === 'dark'
              ? 'bg-gray-850 border-gray-700 text-gray-100'
              : 'bg-background border-border/50'
              }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {brandName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{brandName}</div>
                  <div className="text-xs text-muted-foreground">To: you@example.com</div>
                </div>
              </div>
              <h3 className="text-lg font-bold">{subject}</h3>
            </div>

            {/* The Actual Email Content (Themed) */}
            <div
              className={`transition-all ${device === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                } ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-transparent'
                }`}
              style={{ overflow: 'hidden' }}
            >
              <iframe
                srcDoc={themedHtml}
                title="Email Preview"
                style={{
                  width: '100%',
                  height: device === 'mobile' ? '600px' : '800px',
                  border: 'none',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </motion.div>

          {/* Preview Tips */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-semibold mb-2">Preview Tips:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Current Style: <span className="text-primary font-bold uppercase">{templateStyle}</span></li>
                <li>• Subject line length: {subject.length} characters (optimal: 40-60)</li>
                <li>• Switch between styles in the main view to see real-time updates</li>
              </ul>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">Deliverability Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">This email has been optimized for the **Primary Inbox**. Spam triggers have been removed to bypass promotion filters.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartPreview;