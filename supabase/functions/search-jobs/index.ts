
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
    Generate 5 realistic job listings for the search query: "${query}"
    
    For each job, provide:
    1. Job title
    2. Company name (make it realistic but fictional)
    3. Location
    4. Salary range
    5. Job description (2-3 sentences)
    6. Match score (percentage based on how well it matches the query)
    7. Match reasons (why this job fits the search)
    
    Please respond in JSON format with this structure:
    {
      "jobs": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "City, State/Country",
          "salary": "$X,XXX - $X,XXX",
          "description": "Job description here...",
          "matchScore": 85,
          "matchReasons": ["reason1", "reason2", "reason3"],
          "url": "https://example.com/job-link"
        }
      ]
    }
    
    Make the jobs diverse in terms of experience levels and company sizes.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to search jobs');
    }

    const data = await response.json();
    const jobsText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON from the response
    const jsonMatch = jobsText.match(/\{[\s\S]*\}/);
    let jobs;
    
    if (jsonMatch) {
      try {
        jobs = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Fallback jobs
        jobs = {
          jobs: [
            {
              title: query.includes('Software') ? 'Software Engineer' : 'Professional',
              company: 'TechCorp Inc.',
              location: 'San Francisco, CA',
              salary: '$80,000 - $120,000',
              description: 'Join our team and work on exciting projects with cutting-edge technology.',
              matchScore: 75,
              matchReasons: ['Matches your search query', 'Good growth opportunities', 'Competitive salary'],
              url: 'https://example.com/job1'
            }
          ]
        };
      }
    } else {
      jobs = {
        jobs: [
          {
            title: `${query} Position`,
            company: 'Growing Startup',
            location: 'Remote',
            salary: '$60,000 - $90,000',
            description: 'Exciting opportunity to grow your career in a dynamic environment.',
            matchScore: 70,
            matchReasons: ['Relevant to your search', 'Remote flexibility'],
            url: 'https://example.com/job'
          }
        ]
      };
    }

    return new Response(JSON.stringify(jobs), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error searching jobs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
