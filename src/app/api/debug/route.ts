import { NextResponse } from 'next/server';

export async function GET() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/80792507-1eff-4280-8fa6-0125782b29a0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/app/api/debug/route.ts:4',message:'debug api hit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion

  return NextResponse.json({ ok: true });
}
