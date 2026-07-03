// app/api/health/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test Supabase connection
    const { error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    const responseTime = Date.now() - startTime;
    
    return Response.json({
      status: 'operational',
      services: {
        supabase: { status: 'up', responseTime },
        vercel: { status: 'up', region: process.env.VERCEL_REGION },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}