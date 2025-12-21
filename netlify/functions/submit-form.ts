import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const body = event.body || '';
    const params = new URLSearchParams(body);
    const formData: Record<string, any> = {};
    
    for (const [key, value] of params.entries()) {
      formData[key] = value;
    }
    
    const formName = formData['form-name'];
    delete formData['form-name'];
    delete formData['bot-field']; // Remove honeypot
    
    console.log('Form submission received:', formData);
    
    // Submit directly to Netlify's API using the internal endpoint
    const submissionPayload = {
      form_name: formName,
      data: formData,
    };
    
    // Use Netlify's internal submission endpoint
    const siteId = process.env.SITE_ID;
    if (siteId) {
      const apiUrl = `https://api.netlify.com/api/v1/sites/${siteId}/submissions`;
      console.log('Submitting to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NETLIFY_API_TOKEN || ''}`,
        },
        body: JSON.stringify(submissionPayload),
      });
      
      console.log('API response:', response.status, await response.text());
    } else {
      console.log('No SITE_ID available, form data logged only');
    }

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
