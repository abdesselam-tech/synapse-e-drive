export default function NotFoundPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/app/not-found.tsx:4',message:'not-found rendered (server)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">The requested page could not be found.</p>
      </div>
    </div>
  );
}
