import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Calendar, GraduationCap, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { type Session } from '../../types/models';
import { sessionService } from '../../services/sessionService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SessionFormDialog from './SessionFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { cn } from '../../lib/utils';

const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    session: Session | null;
  }>({ open: false, session: null });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionService.getAll();
      // Sort sessions by year and then by name (SPRING before FALL)
      const sortedData = data.sort((a, b) => {
        const yearDiff = b.academic_year.localeCompare(a.academic_year);
        if (yearDiff !== 0) return yearDiff;
        return a.name === 'SPRING' ? -1 : 1;
      });
      setSessions(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedSession(null);
    setOpenForm(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.session) return;

    try {
      await sessionService.delete(deleteDialog.session.id);
      await fetchSessions();
      setDeleteDialog({ open: false, session: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedSession(null);
  };

  const handleFormSubmit = async () => {
    setOpenForm(false);
    setSelectedSession(null);
    await fetchSessions();
  };

  const getSessionColor = (name: string) => {
    return name === 'FALL' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getParityLabel = (parity: string) => {
    return parity === 'ODD' ? 'Odd Semesters (1, 3, 5, 7)' : 'Even Semesters (2, 4, 6, 8)';
  };

  const filteredSessions = sessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    return session.academic_year.includes(searchTerm) ||
           session.name.toLowerCase().includes(searchLower) ||
           getParityLabel(session.parity).toLowerCase().includes(searchLower);
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Academic Sessions</h2>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sessions by year, type, or parity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Semester Parity</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No sessions found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
                const startDate = new Date(session.start_date);
                const endDate = new Date(session.end_date);
                const isActive = new Date() >= startDate && new Date() <= endDate;

                return (
                  <TableRow key={session.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={cn('h-9 w-9', getSessionColor(session.name))}>
                          <span className="text-white text-lg">
                            {session.name === 'FALL' ? 'F' : 'S'}
                          </span>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.name} {session.academic_year}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {session.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {session.academic_year}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={session.name === 'FALL' ? 'bg-blue-500' : 'bg-purple-500'}>
                        {session.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge
                          variant="outline"
                          className={session.parity === 'ODD' ? 'border-orange-500 text-orange-600' : 'border-sky-500 text-sky-600'}
                        >
                          {session.parity}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {getParityLabel(session.parity)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm">
                            {format(startDate, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            to {format(endDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(session)}
                              >
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, session })}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SessionFormDialog
        open={openForm}
        session={selectedSession}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Session"
        message={`Are you sure you want to delete the ${deleteDialog.session?.name} ${deleteDialog.session?.academic_year} session? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, session: null })}
      />
    </div>
  );
};

export default SessionList;
