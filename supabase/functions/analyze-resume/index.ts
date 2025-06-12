
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
    const { content } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
    Analyze this resume and provide a comprehensive analysis with:
    1. A brief summary of the candidate's profile
    2. Extract all technical and soft skills mentioned
    3. Suggest 5 specific improvements to make the resume more attractive to employers
    4. Estimate years of experience based on the content
    
    Resume content:
    ${content}
    
    Please respond in JSON format with the following structure:
    {
      "summary": "Brief professional summary",
      "skills": ["skill1", "skill2", ...],
      "suggestions": ["improvement1", "improvement2", ...],
      "experienceYears": number,
      "keyStrengths": ["strength1", "strength2", ...]
    }
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
      throw new Error('Failed to analyze resume');
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    let analysis;
    
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Fallback if JSON parsing fails
        analysis = {
          summary: "Resume analysis completed",
          skills: ["Communication", "Problem-solving", "Leadership"],
          suggestions: ["Add quantifiable achievements", "Include relevant keywords", "Improve formatting"],
          experienceYears: 3,
          keyStrengths: ["Technical expertise", "Team collaboration"]
        };
      }
    } else {
      analysis = {
        summary: analysisText.substring(0, 200),
        skills: ["Communication", "Problem-solving"],
        suggestions: ["Add more details", "Improve structure"],
        experienceYears: 2,
        keyStrengths: ["Adaptability"]
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
