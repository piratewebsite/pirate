import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Parse the form data
    const body = event.body || '';
    const params = new URLSearchParams(body);
    const formData: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      formData[key] = value;
    }
    
    console.log('Form submission received:', formData);
    
    // Submit to Netlify Forms
    // Use the Netlify-internal submission endpoint
    const response = await fetch(`${event.headers.origin || process.env.URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });
    
    console.log('Netlify Forms response:', response.status);

    return {
      statusCode: 303,
      headers: {
        'Location': '/thanks/',
      },
      body: '',
    };
  } catch (error) {
    console.error('Form submission error:', error);
    return {
      statusCode: 303,
      headers: {
        'Location': '/thanks/',
      },
      body: '',
    };
  }
};
