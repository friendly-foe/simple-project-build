import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, Download } from 'lucide-react';

interface ResumeUploadProps {
  user: User;
}

const ResumeUpload = ({ user }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeResume = async () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add resume content to analyze",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { content }
      });

      if (error) throw error;

      setAnalysis(data);
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze resume",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResume = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide both title and content",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title,
          content,
          ai_analysis: analysis,
          skills_extracted: analysis?.skills || [],
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Resume saved successfully",
      });
      
      setTitle('');
      setContent('');
      setAnalysis(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save resume",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume for AI-powered analysis and optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resume-title">Resume Title</Label>
            <Input
              id="resume-title"
              placeholder="e.g., Software Engineer Resume 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="file-upload">Upload File</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.doc,.docx"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="resume-content">Resume Content</Label>
            <Textarea
              id="resume-content"
              placeholder="Paste your resume content here or upload a file above..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={analyzeResume} disabled={isAnalyzing || !content.trim()}>
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze with AI
            </Button>
            <Button variant="outline" onClick={saveResume} disabled={!title.trim() || !content.trim()}>
              Save Resume
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
            <CardDescription>
              Here's what our AI discovered about your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {"resumeScore" in analysis && typeof analysis.resumeScore === "number" && (
                <div>
                  <h4 className="font-semibold mb-2">Resume Score</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${analysis.resumeScore >= 80 ? "text-green-600" : analysis.resumeScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                      {analysis.resumeScore}/100
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    Score reflects overall resume quality, structure, and marketability.
                  </div>
                </div>
              )}

              {"topImprovement" in analysis && analysis.topImprovement && (
                <div>
                  <h4 className="font-semibold mb-2">#1 Improvement Suggestion</h4>
                  <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-yellow-900">
                    {analysis.topImprovement}
                  </div>
                </div>
              )}

              {analysis.summary && (
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-gray-600">{analysis.summary}</p>
                </div>
              )}
              
              {analysis.skills && analysis.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Improvement Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeUpload;
