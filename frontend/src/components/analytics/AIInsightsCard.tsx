import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIRecommendations } from '@/types/api';
import {
  Brain,
  Users,
  MessageSquare,
  DollarSign,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AIInsightsCardProps {
  data: AIRecommendations;
  onApply: (action: string, data: any) => Promise<void>;
}

export function AIInsightsCard({ data, onApply }: AIInsightsCardProps) {
  const [activeTab, setActiveTab] = useState('segments');
  const [loading, setLoading] = useState<string | null>(null);

  const handleApply = async (action: string, data: any) => {
    try {
      setLoading(action);
      await onApply(action, data);
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    } finally {
      setLoading(null);
    }
  };

  const renderSegmentation = () => (
    <div className="space-y-4">
      {data.userSegmentation.map((segment, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{segment.segment}</CardTitle>
                <CardDescription>
                  Predicted LTV: ${segment.predictedLTV.toFixed(2)}
                </CardDescription>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Characteristics</h4>
                <div className="flex flex-wrap gap-2">
                  {segment.characteristics.map((char, i) => (
                    <Badge key={i} variant="secondary">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Recommended Plans</h4>
                <div className="flex flex-wrap gap-2">
                  {segment.recommendedPlans.map((plan, i) => (
                    <Badge key={i} variant="outline">
                      {plan}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Marketing Messages</h4>
                <ul className="list-inside list-disc space-y-1">
                  {segment.marketingMessages.map((msg, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={() => handleApply('segment', segment)}
                disabled={loading === 'segment'}
              >
                {loading === 'segment' ? (
                  'Applying...'
                ) : (
                  <>
                    Apply Recommendations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-4">
      {data.contentSuggestions.map((suggestion, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold">{suggestion.topic}</h4>
                <p className="text-sm text-muted-foreground">
                  Type: {suggestion.type} • Best Time: {new Date(suggestion.bestTime).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestion.targetAudience.map((audience, i) => (
                    <Badge key={i} variant="secondary">
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge variant="outline" className="ml-2">
                {suggestion.predictedEngagement.toFixed(1)}% Engagement
              </Badge>
            </div>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => handleApply('content', suggestion)}
              disabled={loading === 'content'}
            >
              {loading === 'content' ? (
                'Generating...'
              ) : (
                <>
                  Generate Content
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPricing = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Current Price</TableHead>
          <TableHead>Recommended</TableHead>
          <TableHead>Potential Lift</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.pricingOptimization.map((plan) => (
          <TableRow key={plan.planId}>
            <TableCell className="font-medium">{plan.planId}</TableCell>
            <TableCell>${plan.currentPrice}</TableCell>
            <TableCell className="text-green-600">${plan.recommendedPrice}</TableCell>
            <TableCell>+{plan.potentialRevenueLift}%</TableCell>
            <TableCell>
              <Button
                size="sm"
                onClick={() => handleApply('pricing', plan)}
                disabled={loading === `pricing-${plan.planId}`}
              >
                {loading === `pricing-${plan.planId}` ? 'Updating...' : 'Update Price'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderRetention = () => (
    <div className="space-y-4">
      {data.retentionStrategies.map((strategy, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{strategy.riskSegment}</CardTitle>
                <CardDescription>
                  Churn Probability: {(strategy.churnProbability * 100).toFixed(1)}%
                </CardDescription>
              </div>
              <Shield
                className={`h-8 w-8 ${
                  strategy.churnProbability > 0.7
                    ? 'text-red-500'
                    : strategy.churnProbability > 0.3
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategy.recommendedActions.map((action, i) => (
                  <TableRow key={i}>
                    <TableCell>{action.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          action.priority === 'high'
                            ? 'destructive'
                            : action.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {action.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>+{action.expectedImpact}%</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApply('retention', { segment: strategy.riskSegment, action })
                        }
                        disabled={loading === `retention-${i}`}
                      >
                        {loading === `retention-${i}` ? 'Applying...' : 'Apply'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Insights & Recommendations</CardTitle>
        </div>
        <CardDescription>
          Data-driven recommendations to optimize your business performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="segments">
              <Users className="mr-2 h-4 w-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="content">
              <MessageSquare className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="mr-2 h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="retention">
              <Shield className="mr-2 h-4 w-4" />
              Retention
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="segments">{renderSegmentation()}</TabsContent>
            <TabsContent value="content">{renderContent()}</TabsContent>
            <TabsContent value="pricing">{renderPricing()}</TabsContent>
            <TabsContent value="retention">{renderRetention()}</TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 