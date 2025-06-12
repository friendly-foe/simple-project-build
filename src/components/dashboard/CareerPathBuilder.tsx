
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Target, Loader2, TrendingUp } from 'lucide-react';

interface CareerPathBuilderProps {
  user: User;
}

const CareerPathBuilder = ({ user }: CareerPathBuilderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState('');
  const [careerPath, setCareerPath] = useState<any>(null);
  const { toast } = useToast();

  const generateCareerPath = async () => {
    if (!currentRole.trim() || !targetRole.trim() || !timeline) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-career-path', {
        body: {
          currentRole,
          targetRole,
          timelineMonths: parseInt(timeline)
        }
      });

      if (error) throw error;

      setCareerPath(data);
      
      // Save to database
      await supabase
        .from('career_paths')
        .insert({
          user_id: user.id,
          current_role: currentRole,
          target_role: targetRole,
          timeline_months: parseInt(timeline),
          required_skills: data.skills || [],
          learning_resources: data.resources || {},
          milestones: data.milestones || [],
          ai_recommendations: data
        });

      toast({
        title: "Career Path Generated!",
        description: "Your personalized career path is ready.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate career path",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Career Path Builder
          </CardTitle>
          <CardDescription>
            Let AI create a personalized roadmap to your dream career
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-role">Current Role</Label>
            <Input
              id="current-role"
              placeholder="e.g., Junior Software Developer"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="target-role">Target Role</Label>
            <Input
              id="target-role"
              placeholder="e.g., Senior Full Stack Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="timeline">Timeline</Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">1 year</SelectItem>
                <SelectItem value="18">1.5 years</SelectItem>
                <SelectItem value="24">2 years</SelectItem>
                <SelectItem value="36">3 years</SelectItem>
                <SelectItem value="60">5 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateCareerPath} disabled={isGenerating} className="w-full">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Career Path
          </Button>
        </CardContent>
      </Card>

      {careerPath && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Your Career Roadmap
            </CardTitle>
            <CardDescription>
              From {currentRole} to {targetRole} in {timeline} months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {careerPath.overview && (
                <div>
                  <h4 className="font-semibold mb-2">Overview</h4>
                  <p className="text-gray-600">{careerPath.overview}</p>
                </div>
              )}

              {careerPath.skills && careerPath.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Skills to Develop</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {careerPath.skills.map((skill: string, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <Target className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {careerPath.milestones && careerPath.milestones.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Key Milestones</h4>
                  <div className="space-y-3">
                    {careerPath.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{milestone.title}</div>
                          <div className="text-sm text-gray-600">{milestone.description}</div>
                          {milestone.timeframe && (
                            <div className="text-xs text-blue-600 mt-1">{milestone.timeframe}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {careerPath.resources && (
                <div>
                  <h4 className="font-semibold mb-2">Learning Resources</h4>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{careerPath.resources}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerPathBuilder;
