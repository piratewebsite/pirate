import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const thumbnailUrl = url.searchParams.get('thumbnail');
  
  if (!thumbnailUrl) {
    return new Response('Missing thumbnail parameter', { status: 400 });
  }

  try {
    // Fetch the original thumbnail
    const thumbnailResponse = await fetch(thumbnailUrl);
    if (!thumbnailResponse.ok) {
      return new Response('Failed to fetch thumbnail', { status: 500 });
    }

    const imageBuffer = await thumbnailResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = thumbnailResponse.headers.get('content-type') || 'image/jpeg';

    // Create an SVG that includes the image and play button overlay
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
            <feOffset dx="0" dy="5" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background image -->
        <image href="data:${mimeType};base64,${base64Image}" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
        
        <!-- Semi-transparent overlay for better contrast -->
        <rect width="1200" height="630" fill="rgba(0,0,0,0.2)"/>
        
        <!-- Play button matching Bluesky's style -->
        <g filter="url(#shadow)" transform="translate(550, 265)">
          <!-- Play triangle with rounded edges like Bluesky -->
          <path fill="#1C2736" fill-rule="evenodd" clip-rule="evenodd" 
                d="M 10 3 A 2 2 0 0 0 8 5 L 8 95 A 2 2 0 0 0 11 96.5 L 91 51.5 A 2 2 0 0 0 91 48.5 L 11 3.5 Z" 
                transform="scale(1.2)"/>
        </g>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
};
