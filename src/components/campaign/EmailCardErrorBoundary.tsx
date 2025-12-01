import { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class EmailCardErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('EmailCard Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="glass-card p-6 border-destructive/50">
                    <div className="flex items-start gap-3 text-destructive">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Email Preview Error</h3>
                            <p className="text-sm text-muted-foreground">
                                Unable to display this email. The content may contain invalid HTML or formatting issues.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Error: {this.state.error?.message || 'Unknown error'}
                            </p>
                        </div>
                    </div>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default EmailCardErrorBoundary;
