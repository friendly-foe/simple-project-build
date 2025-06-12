
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Search, Loader2, ExternalLink, Heart, X } from 'lucide-react';

interface JobMatchingProps {
  user: User;
}

const JobMatching = ({ user }: JobMatchingProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    const { data } = await supabase
      .from('job_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setSavedJobs(data);
    }
  };

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a job title or keywords",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { query: searchQuery, userId: user.id }
      });

      if (error) throw error;

      setJobMatches(data.jobs || []);
      toast({
        title: "Jobs Found!",
        description: `Found ${data.jobs?.length || 0} job matches for you.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search jobs",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const saveJob = async (job: any) => {
    try {
      const { error } = await supabase
        .from('job_matches')
        .insert({
          user_id: user.id,
          job_title: job.title,
          company: job.company,
          job_description: job.description,
          match_score: job.matchScore,
          match_reasons: job.matchReasons,
          salary_range: job.salary,
          location: job.location,
          job_url: job.url,
          status: 'interested'
        });

      if (error) throw error;

      toast({
        title: "Job Saved!",
        description: "Job added to your saved list.",
      });
      
      fetchSavedJobs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save job",
      });
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_matches')
        .update({ status })
        .eq('id', jobId);

      if (error) throw error;

      fetchSavedJobs();
      toast({
        title: "Status Updated",
        description: `Job status updated to ${status}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Job Search
          </CardTitle>
          <CardDescription>
            Find jobs that match your skills and career goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Software Engineer, Data Scientist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchJobs()}
            />
            <Button onClick={searchJobs} disabled={isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {jobMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Job Matches</h3>
          {jobMatches.map((job, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{job.title}</h4>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getMatchScoreColor(job.matchScore)}>
                      {job.matchScore}% Match
                    </Badge>
                    <Button size="sm" onClick={() => saveJob(job)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                
                {job.salary && (
                  <p className="text-sm font-medium text-green-600 mb-2">{job.salary}</p>
                )}
                
                {job.matchReasons && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Why this matches you:</p>
                    <ul className="text-sm text-gray-600 list-disc pl-5">
                      {job.matchReasons.map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {job.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {savedJobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Saved Jobs</h3>
          {savedJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{job.job_title}</h4>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getMatchScoreColor(job.match_score)}>
                      {job.match_score}% Match
                    </Badge>
                    <Badge variant={job.status === 'applied' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateJobStatus(job.id, 'applied')}
                    disabled={job.status === 'applied'}
                  >
                    Mark Applied
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateJobStatus(job.id, 'dismissed')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                  {job.job_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Job
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobMatching;
