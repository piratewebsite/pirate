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
            <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
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
        <rect width="1200" height="630" fill="rgba(0,0,0,0.15)"/>
        
        <!-- Play button -->
        <g filter="url(#shadow)" transform="translate(600, 315)">
          <!-- White circle background -->
          <circle cx="0" cy="0" r="60" fill="rgba(255, 255, 255, 0.95)"/>
          <!-- Black play triangle -->
          <polygon points="-20,-30 -20,30 35,0" fill="#000" opacity="0.9"/>
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
