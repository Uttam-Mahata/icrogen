import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, GraduationCap, BookOpen, ClipboardList } from 'lucide-react';
import { type SemesterOffering, type Session } from '../../types/models';
import { semesterOfferingService } from '../../services/semesterOfferingService';
import { sessionService } from '../../services/sessionService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SemesterOfferingFormDialog from './SemesterOfferingFormDialog';
import CourseOfferingDialog from './CourseOfferingDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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

const SemesterOfferingList: React.FC = () => {
  const [offerings, setOfferings] = useState<SemesterOffering[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<number | ''>('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<SemesterOffering | null>(null);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [courseDialogOffering, setCourseDialogOffering] = useState<SemesterOffering | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    offering: SemesterOffering | null;
  }>({ open: false, offering: null });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchOfferingsBySession(selectedSession as number);
    } else {
      fetchOfferings();
    }
  }, [selectedSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [offeringsData, sessionsData] = await Promise.all([
        semesterOfferingService.getAll(),
        sessionService.getAll(),
      ]);
      setOfferings(offeringsData);
      setSessions(sessionsData.sort((a, b) => b.academic_year.localeCompare(a.academic_year)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await semesterOfferingService.getAll();
      setOfferings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch semester offerings');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferingsBySession = async (sessionId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await semesterOfferingService.getBySession(sessionId);
      setOfferings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch semester offerings');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedOffering(null);
    setOpenForm(true);
  };

  const handleEdit = (offering: SemesterOffering) => {
    setSelectedOffering(offering);
    setOpenForm(true);
  };

  const handleManageCourses = (offering: SemesterOffering) => {
    setCourseDialogOffering(offering);
    setOpenCourseDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.offering) return;

    try {
      await semesterOfferingService.delete(deleteDialog.offering.id);
      if (selectedSession) {
        await fetchOfferingsBySession(selectedSession as number);
      } else {
        await fetchOfferings();
      }
      setDeleteDialog({ open: false, offering: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete semester offering');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedOffering(null);
  };

  const handleFormSubmit = async () => {
    setOpenForm(false);
    setSelectedOffering(null);
    if (selectedSession) {
      await fetchOfferingsBySession(selectedSession as number);
    } else {
      await fetchOfferings();
    }
  };

  const handleCourseDialogClose = () => {
    setOpenCourseDialog(false);
    setCourseDialogOffering(null);
    if (selectedSession) {
      fetchOfferingsBySession(selectedSession as number);
    } else {
      fetchOfferings();
    }
  };

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'ACTIVE': return 'default';
      case 'ARCHIVED': return 'outline';
      default: return 'secondary';
    }
  };

  const getSemesterLabel = (number: number): string => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${number}${suffixes[number - 1] || 'th'} Semester`;
  };

  const filteredOfferings = offerings.filter(offering => {
    const searchLower = searchTerm.toLowerCase();
    const programmeMatch = offering.programme?.name?.toLowerCase().includes(searchLower) || false;
    const departmentMatch = offering.department?.name?.toLowerCase().includes(searchLower) || false;
    const semesterMatch = getSemesterLabel(offering.semester_number).toLowerCase().includes(searchLower);
    return programmeMatch || departmentMatch || semesterMatch;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Semester Offerings</h2>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Semester Offering
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by programme or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              <Select
                value={selectedSession.toString()}
                onValueChange={(value) => setSelectedSession(value === '' ? '' : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sessions</SelectItem>
                  {sessions.map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.name} {session.academic_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Programme</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="text-center">Course Count</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOfferings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No semester offerings found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOfferings.map((offering) => (
                <TableRow key={offering.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        {offering.programme?.name || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {offering.department?.name || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {offering.session?.name} {offering.session?.academic_year}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={offering.semester_number % 2 === 0 ? 'bg-purple-500' : 'bg-blue-500'}>
                      {getSemesterLabel(offering.semester_number)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {offering.course_offerings?.length || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusColor(offering.status)}>
                      {offering.status}
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
                              onClick={() => handleManageCourses(offering)}
                            >
                              <ClipboardList className="h-4 w-4 text-purple-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage Courses</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(offering)}
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
                              onClick={() => setDeleteDialog({ open: true, offering })}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SemesterOfferingFormDialog
        open={openForm}
        offering={selectedOffering}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      {courseDialogOffering && (
        <CourseOfferingDialog
          open={openCourseDialog}
          semesterOffering={courseDialogOffering}
          onClose={handleCourseDialogClose}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Semester Offering"
        message={`Are you sure you want to delete this semester offering? This will also delete all associated course offerings and cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, offering: null })}
      />
    </div>
  );
};

export default SemesterOfferingList;
