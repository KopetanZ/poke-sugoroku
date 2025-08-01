import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {
    // PokeAPIの画像URLを検証
    const url = new URL(imageUrl);
    const allowedHosts = ['raw.githubusercontent.com', 'pokeapi.co'];
    
    if (!allowedHosts.includes(url.hostname)) {
      return new NextResponse('Invalid image source', { status: 403 });
    }

    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying Pokemon image:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}