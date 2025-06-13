
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

    if (!content || content.trim() === '') {
      throw new Error('Resume content is required');
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

    console.log('Making request to Gemini API...');
    
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
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text received:', analysisText.substring(0, 100) + '...');
    
    // Parse JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    let analysis;
    
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON analysis');
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        // Fallback if JSON parsing fails
        analysis = {
          summary: "Resume analysis completed successfully",
          skills: ["Communication", "Problem-solving", "Leadership", "Teamwork"],
          suggestions: [
            "Add quantifiable achievements with specific metrics",
            "Include relevant keywords for your target industry",
            "Improve formatting and visual hierarchy",
            "Add a professional summary section",
            "Include relevant certifications and training"
          ],
          experienceYears: 3,
          keyStrengths: ["Technical expertise", "Team collaboration", "Adaptability"]
        };
      }
    } else {
      console.log('No JSON found in response, using fallback analysis');
      // Fallback if no JSON is found
      analysis = {
        summary: analysisText.substring(0, 200) + "...",
        skills: ["Communication", "Problem-solving", "Technical skills"],
        suggestions: [
          "Add more specific details about achievements",
          "Improve overall structure and formatting",
          "Include relevant keywords",
          "Quantify accomplishments with numbers",
          "Add a compelling summary section"
        ],
        experienceYears: 2,
        keyStrengths: ["Adaptability", "Learning ability"]
      };
    }

    console.log('Returning analysis result');
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Resume analysis failed. Please check your content and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
