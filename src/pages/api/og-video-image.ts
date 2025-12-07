import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const thumbnailUrl = url.searchParams.get('thumbnail');
  
  if (!thumbnailUrl) {
    return new Response('Missing thumbnail parameter', { status: 400 });
  }

  // Fetch the original thumbnail
  const thumbnailResponse = await fetch(thumbnailUrl);
  if (!thumbnailResponse.ok) {
    return new Response('Failed to fetch thumbnail', { status: 500 });
  }

  const thumbnailBuffer = await thumbnailResponse.arrayBuffer();

  // Create SVG overlay with play button
  const svgOverlay = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- Play button circle -->
      <circle cx="640" cy="360" r="80" fill="rgba(255, 255, 255, 0.95)" filter="url(#shadow)"/>
      <!-- Play triangle -->
      <polygon points="600,320 600,400 700,360" fill="#000" opacity="0.9"/>
    </svg>
  `;

  // For now, we'll return the SVG as a data URL overlay instruction
  // In production, you'd use a library like @vercel/og or sharp to composite images
  
  // Simple approach: Return HTML that composites the image and SVG
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; width: 1280px; height: 720px; position: relative; }
          img { width: 100%; height: 100%; object-fit: cover; }
          svg { position: absolute; top: 0; left: 0; }
        </style>
      </head>
      <body>
        <img src="${thumbnailUrl}" alt="Video thumbnail">
        ${svgOverlay}
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
};
