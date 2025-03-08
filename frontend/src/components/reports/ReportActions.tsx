import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ReportFilter } from '@/types/api';
import {
  Download,
  Clock,
  FileSpreadsheet,
  FileText,
  Table,
  ChartBar,
  Mail,
} from 'lucide-react';

interface ReportActionsProps {
  filter: ReportFilter;
  onExport: (options: {
    format: 'pdf' | 'excel' | 'csv';
    includeCharts?: boolean;
    includeTables?: boolean;
    selectedMetrics?: string[];
  }) => Promise<string>;
  onSchedule: (schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    emails: string[];
    format: 'pdf' | 'excel' | 'csv';
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ReportActions({
  filter,
  onExport,
  onSchedule,
  isLoading = false,
}: ReportActionsProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleEmails, setScheduleEmails] = useState('');
  const [scheduleFormat, setScheduleFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleExport = async () => {
    try {
      await onExport({
        format: exportFormat,
        includeCharts,
        includeTables,
        selectedMetrics: filter.metrics,
      });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleSchedule = async () => {
    try {
      await onSchedule({
        frequency: scheduleFrequency,
        emails: scheduleEmails.split(',').map((email) => email.trim()),
        format: scheduleFormat,
      });
      setShowScheduleDialog(false);
    } catch (error) {
      console.error('Failed to schedule report:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose your export format and options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <Table className="mr-2 h-4 w-4" />
                      CSV File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Include Content</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  />
                  <Label htmlFor="charts" className="flex items-center">
                    <ChartBar className="mr-2 h-4 w-4" />
                    Charts and Visualizations
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tables"
                    checked={includeTables}
                    onCheckedChange={(checked) => setIncludeTables(!!checked)}
                  />
                  <Label htmlFor="tables" className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    Data Tables
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={isLoading}>
            <Clock className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Set up automated report delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={scheduleFrequency}
                onValueChange={(v: any) => setScheduleFrequency(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter email addresses (comma-separated)"
                  value={scheduleEmails}
                  onChange={(e) => setScheduleEmails(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report Format</Label>
              <Select
                value={scheduleFormat}
                onValueChange={(v: any) => setScheduleFormat(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isLoading}>
              Schedule Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 