import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  BarChart2,
  MessageSquarePlus,
  MoreHorizontal,
  Trash,
  Calendar,
} from 'lucide-react';
import { TelegramChannel } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface ChannelTableProps {
  channels: TelegramChannel[];
  onViewStats: (channelId: string) => void;
  onGenerateContent: (channelId: string) => void;
  onSchedulePosts: (channelId: string) => void;
  onRemove: (channelId: string) => void;
}

export function ChannelTable({
  channels,
  onViewStats,
  onGenerateContent,
  onSchedulePosts,
  onRemove,
}: ChannelTableProps) {
  const formatMembersCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Channel</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added On</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {channels.map((channel) => (
          <TableRow key={channel.id}>
            <TableCell>
              <div>
                <p className="font-medium">@{channel.username}</p>
                <p className="text-sm text-gray-500">{channel.title}</p>
              </div>
            </TableCell>
            <TableCell>{formatMembersCount(channel.membersCount)}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  channel.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
              </span>
            </TableCell>
            <TableCell>{formatDate(channel.createdAt)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewStats(channel.id)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View Statistics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateContent(channel.id)}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Generate Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSchedulePosts(channel.id)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Posts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRemove(channel.id)}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Remove Channel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 