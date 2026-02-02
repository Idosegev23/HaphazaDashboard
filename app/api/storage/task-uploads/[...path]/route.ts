import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const supabase = await createClient();
  const { path } = await params;
  const filePath = path.join('/');

  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('task-uploads')
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Get file content type
    const contentType = data.type || 'application/octet-stream';

    // Return file
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
