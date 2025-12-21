import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const formName = formData.get('form-name');
    
    // Forward to Netlify Forms
    const netlifyResponse = await fetch('https://api.netlify.com/api/v1/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(formData as any).toString(),
    });

    if (netlifyResponse.ok) {
      return redirect('/thanks/', 303);
    } else {
      console.error('Netlify form submission failed:', await netlifyResponse.text());
      return new Response(JSON.stringify({ success: false, error: 'Form submission failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
