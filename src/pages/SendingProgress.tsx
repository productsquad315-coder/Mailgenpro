
const SendingProgress = () => {
    const { id } = useParams(); // campaign ID
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queueId = searchParams.get("queue");

    const [queue, setQueue] = useState<any>(null);
    const [stats, setStats] = useState({ sent: 0, failed: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!queueId) {
            navigate(`/campaign/${id}`);
            return;
        }

        fetchQueue();

        // Poll for updates every 2 seconds
        const interval = setInterval(fetchQueue, 2000);

        return () => clearInterval(interval);
    }, [queueId]);

    const fetchQueue = async () => {
        try {
            const { data, error } = await supabase
                .from("email_send_queue")
                .select("*")
                .eq("id", queueId)
                .single();

            if (error) throw error;

            setQueue(data);
            setStats({
                sent: data.emails_sent || 0,
                failed: data.emails_failed || 0,
                total: data.total_emails || 0,
            });
            setLoading(false);

            // Stop polling if completed
            if (data.status === "completed" || data.status === "failed") {
                // Don't clear interval here, let useEffect cleanup handle it
            }
        } catch (error) {
            console.error("Error fetching queue:", error);
            setLoading(false);
        }
    };

    const progress =
        stats.total > 0 ? ((stats.sent + stats.failed) / stats.total) * 100 : 0;
    const isComplete = queue?.status === "completed";
    const isFailed = queue?.status === "failed";

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleRetry = async () => {
        try {
            setLoading(true);
            toast.info("Retrying send worker...");

            const { data, error } = await supabase.functions.invoke('send-worker', {
                body: { queueId }
            });

            if (error) {
                console.error("Worker error:", error);
                toast.error(`Worker failed: ${error.message}`);

                // If it's a 500, it might return more details in the body
                if (error instanceof Error && 'context' in error) {
                    // @ts-ignore
                    const context = error.context;
                    if (context && typeof context === 'object' && 'json' in context) {
                        const body = await context.json();
                        toast.error(`Details: ${body.error || JSON.stringify(body)}`);
                    }
                }
            } else {
                toast.success("Worker triggered successfully!");
                fetchQueue();
            }
        } catch (err: any) {
            console.error("Retry error:", err);
            toast.error(`Retry failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isStuck = !isComplete && !isFailed && stats.total > 0 && stats.sent === 0 && stats.failed === 0;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    {isComplete ? (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                    ) : isFailed ? (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <X className="w-10 h-10 text-red-500" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    <h1 className="text-2xl font-bold mb-2">
                        {isComplete
                            ? "Campaign Sent!"
                            : isFailed
                                ? "Sending Failed"
                                : "Sending Campaign..."}
                    </h1>
                    <p className="text-muted-foreground">
                        {isComplete
                            ? `Successfully sent ${stats.sent} emails`
                            : isFailed
                                ? "An error occurred while sending"
                                : `Sending ${stats.total} emails to your contacts`}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="p-4 text-center">
                        <Mail className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </Card>

                    <Card className="p-4 text-center border-green-500/50 bg-green-500/5">
                        <Check className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-green-500">{stats.sent}</div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                    </Card>

                    <Card className="p-4 text-center border-red-500/50 bg-red-500/5">
                        <X className="w-6 h-6 mx-auto mb-2 text-red-500" />
                        <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                    </Card>
                </div>

                {/* Status Message */}
                {!isComplete && !isFailed && (
                    <div className="text-center text-sm text-muted-foreground mb-8">
                        <p>This may take a few minutes. You can safely close this page.</p>
                        <p className="mt-1">We'll continue sending in the background.</p>

                        {isStuck && (
                            <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                <p className="text-yellow-600 mb-2">Seems stuck? Try triggering the worker manually.</p>
                                <Button onClick={handleRetry} variant="secondary" size="sm">
                                    <Loader2 className="w-3 h-3 mr-2" />
                                    Retry / Debug Worker
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                {(isComplete || isFailed) && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/campaign/${id}`)}
                            className="flex-1"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            View Campaign
                        </Button>
                        <Button onClick={() => navigate("/dashboard")} className="flex-1 btn-premium">
                            Back to Campaigns
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SendingProgress;
