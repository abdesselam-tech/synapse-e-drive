import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Synapse E-Drive',
  description: 'Driving school management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/app/layout.tsx:12',message:'layout render',data:{hasChildren:Boolean(children)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
