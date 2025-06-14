
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
    const { currentRole, targetRole, timelineMonths } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
    Create a detailed career transition plan from "${currentRole}" to "${targetRole}" within ${timelineMonths} months.
    
    Provide a comprehensive roadmap including:
    1. Overview of the transition strategy
    2. Key skills to develop
    3. Specific milestones with timeframes
    4. Learning resources and recommendations
    5. Potential challenges and how to overcome them
    
    Please respond in JSON format with this structure:
    {
      "overview": "Strategic overview of the career transition",
      "skills": ["skill1", "skill2", "skill3"],
      "milestones": [
        {
          "title": "Milestone title",
          "description": "What to achieve",
          "timeframe": "Month 1-2"
        }
      ],
      "resources": "Recommended learning resources and platforms",
      "challenges": ["challenge1", "challenge2"],
      "successTips": ["tip1", "tip2"]
    }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
      throw new Error('Failed to generate career path');
    }

    const data = await response.json();
    const careerPathText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON from the response
    const jsonMatch = careerPathText.match(/\{[\s\S]*\}/);
    let careerPath;
    
    if (jsonMatch) {
      try {
        careerPath = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Fallback career path
        careerPath = {
          overview: `Transition from ${currentRole} to ${targetRole} requires strategic skill development and networking.`,
          skills: ["Leadership", "Technical expertise", "Communication", "Strategic thinking"],
          milestones: [
            {
              title: "Skill Assessment",
              description: "Evaluate current skills and identify gaps",
              timeframe: "Month 1"
            },
            {
              title: "Learning Phase",
              description: "Acquire new skills through courses and practice",
              timeframe: `Month 2-${Math.floor(timelineMonths/2)}`
            },
            {
              title: "Application Phase",
              description: "Apply new skills in projects and seek opportunities",
              timeframe: `Month ${Math.floor(timelineMonths/2)+1}-${timelineMonths}`
            }
          ],
          resources: "Online courses, industry certifications, professional networking events, mentorship programs",
          challenges: ["Time management", "Skill gaps", "Market competition"],
          successTips: ["Stay consistent with learning", "Build a strong network", "Showcase your progress"]
        };
      }
    } else {
      careerPath = {
        overview: careerPathText.substring(0, 300),
        skills: ["Adaptability", "Learning agility"],
        milestones: [],
        resources: "Professional development courses",
        challenges: ["Career transition complexity"],
        successTips: ["Stay persistent"]
      };
    }

    return new Response(JSON.stringify(careerPath), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating career path:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
