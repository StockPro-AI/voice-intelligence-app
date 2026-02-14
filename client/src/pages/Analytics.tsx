import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Lightbulb, TrendingUp, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export function Analytics() {
  const { t } = useTranslation();
  const [selectedWeek, setSelectedWeek] = useState<Date | undefined>();

  // Fetch latest analysis
  const { data: analysisData, isLoading: analysisLoading } = trpc.analytics.getLatestAnalysis.useQuery();

  // Fetch trends
  const { data: trendsData, isLoading: trendsLoading } = trpc.analytics.getTrends.useQuery({ weeks: 4 });

  // Generate weekly analysis mutation
  const generateAnalysisMutation = trpc.analytics.generateWeeklyAnalysis.useMutation({
    onSuccess: (data) => {
      toast.success(t('analytics.analysisGenerated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Generate project ideas mutation
  const generateIdeasMutation = trpc.analytics.generateProjectIdeas.useMutation({
    onSuccess: (data) => {
      toast.success(t('analytics.ideasGenerated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const analysis = analysisData?.analysis;
  const trends = trendsData?.trends || [];

  // Prepare chart data
  const trendChartData = trends.map((trend) => ({
    week: new Date(trend.week).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
    recordings: trend.recordingCount,
  }));

  const topThemesData = analysis?.topThemes
    ? Object.entries(analysis.topThemes)
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('analytics.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('analytics.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateAnalysisMutation.mutate({ weekStartDate: selectedWeek })}
            disabled={generateAnalysisMutation.isPending}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('analytics.generateAnalysis')}
          </Button>
          <Button
            onClick={() => generateIdeasMutation.mutate({ weekStartDate: selectedWeek })}
            disabled={generateIdeasMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            {t('analytics.generateIdeas')}
          </Button>
        </div>
      </div>

      {/* Latest Analysis Summary */}
      {analysis && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              {t('analytics.weekSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{analysis.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.recordingCount')}</p>
                <p className="text-2xl font-bold">{analysis.recordingCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.completedTasks')}</p>
                <p className="text-2xl font-bold">{analysis.recordingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('analytics.totalRecordings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis?.recordingCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{t('analytics.thisWeek')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('analytics.topTheme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {topThemesData.length > 0 ? topThemesData[0].name : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {topThemesData.length > 0 ? `${topThemesData[0].value} mentions` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('analytics.productivityTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">↑ 12%</div>
            <p className="text-xs text-gray-500 mt-1">{t('analytics.weekOverWeek')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Trends */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.recordingTrends')}</CardTitle>
            <CardDescription>{t('analytics.last4Weeks')}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('common.loading')}...
              </div>
            ) : trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="recordings"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('analytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Themes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topThemes')}</CardTitle>
            <CardDescription>{t('analytics.mostDiscussedTopics')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topThemesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topThemesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topThemesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('analytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.insights')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.summary || t('analytics.noInsights')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.recommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.recommendations || t('analytics.noRecommendations')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Ideas */}
      {generateIdeasMutation.data?.ideas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              {t('analytics.projectIdeas')}
            </CardTitle>
            <CardDescription>{t('analytics.suggestedProjects')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generateIdeasMutation.data.ideas.map((idea: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{idea.title}</h3>
                    <div className="flex gap-2">
                      <Badge className={
                        idea.effort_level === 'low' ? 'bg-green-100 text-green-800' :
                        idea.effort_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {idea.effort_level}
                      </Badge>
                      <Badge className={
                        idea.potential_impact === 'low' ? 'bg-blue-100 text-blue-800' :
                        idea.potential_impact === 'medium' ? 'bg-purple-100 text-purple-800' :
                        'bg-pink-100 text-pink-800'
                      }>
                        {idea.potential_impact}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{idea.description}</p>
                  {idea.skills_needed && (
                    <div className="flex gap-2 flex-wrap">
                      {idea.skills_needed.map((skill: string, i: number) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  )}
                  {idea.estimated_timeline && (
                    <p className="text-sm text-gray-500 mt-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {idea.estimated_timeline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
