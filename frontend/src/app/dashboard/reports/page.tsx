'use client';

import { useState } from 'react';
import { useReportsStore } from '@/store';
import { ReportFilter } from '@/components/reports/ReportFilter';
import { ReportMetrics } from '@/components/reports/ReportMetrics';
import { ReportActions } from '@/components/reports/ReportActions';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const defaultFilter = {
  type: 'financial',
  format: 'monthly',
  groupBy: ['date'],
  metrics: ['revenue', 'orders', 'average_order_value'],
} as const;

export default function ReportsPage() {
  const {
    data,
    isLoading,
    error,
    currentFilter,
    getReport,
    exportReport,
    scheduleReport,
  } = useReportsStore();

  const [filter, setFilter] = useState(currentFilter || defaultFilter);

  const handleGenerateReport = () => {
    getReport(filter);
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and analyze detailed reports for your business
          </p>
        </div>
        {data && (
          <ReportActions
            filter={filter}
            onExport={exportReport}
            onSchedule={scheduleReport}
            isLoading={isLoading}
          />
        )}
      </div>

      <ReportFilter
        filter={filter}
        onFilterChange={setFilter}
        onGenerateReport={handleGenerateReport}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <ReportMetrics metrics={data.metrics} />

          <div className="grid gap-6 lg:grid-cols-2">
            {data.charts.map((chart, index) => (
              <AnalyticsChart
                key={index}
                title={chart.title}
                description={chart.description}
                type={chart.type}
                data={chart.data}
              />
            ))}
          </div>

          <div className="space-y-6">
            {data.tables.map((table, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{table.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {table.columns.map((column) => (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {table.columns.map((column) => (
                            <TableCell key={column.key}>
                              {row[column.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Select filters and generate a report to view data
        </div>
      )}
    </div>
  );
} 