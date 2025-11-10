import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  CheckCircle,
  X as XIcon,
  Eye,
  Calendar,
  DoorOpen,
  User,
  GraduationCap,
  Download,
  Printer,
  ChevronDown,
  AlertTriangle,
  Info,
  RefreshCw,
  Save,
  History,
  Loader2,
} from 'lucide-react';
import {
  type SemesterOffering,
  type ScheduleRun,
  type ScheduleEntry,
} from '../../types/models';
import { semesterOfferingService } from '../../services/semesterOfferingService';
import { routineService, type GenerateRoutineRequest } from '../../services/routineService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Alert } from '../../components/ui/alert';
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

const RoutineGenerator: React.FC = () => {
  const [semesterOfferings, setSemesterOfferings] = useState<SemesterOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<number | ''>('');
  const [selectedOfferingData, setSelectedOfferingData] = useState<SemesterOffering | null>(null);
  const [scheduleRuns, setScheduleRuns] = useState<ScheduleRun[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleRun | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(0); // 0: By Day, 1: By Room, 2: By Teacher
  const [commitDialog, setCommitDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedCourses, setExpandedCourses] = useState(false);

  useEffect(() => {
    fetchSemesterOfferings();
  }, []);

  useEffect(() => {
    if (selectedOffering) {
      fetchScheduleRuns(selectedOffering as number);
      fetchSelectedOfferingData(selectedOffering as number);
    }
  }, [selectedOffering]);

  const fetchSemesterOfferings = async () => {
    try {
      setLoading(true);
      const data = await semesterOfferingService.getAll();
      // Filter only active semester offerings with course offerings
      const activeOfferings = data.filter(o =>
        o.status === 'ACTIVE' &&
        o.course_offerings &&
        o.course_offerings.length > 0
      );
      setSemesterOfferings(activeOfferings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch semester offerings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedOfferingData = async (id: number) => {
    try {
      const data = await semesterOfferingService.getById(id);
      setSelectedOfferingData(data);
    } catch (err) {
      console.error('Failed to fetch offering details:', err);
    }
  };

  const fetchScheduleRuns = async (offeringId: number) => {
    try {
      const runs = await routineService.getScheduleRunsBySemesterOffering(offeringId);
      setScheduleRuns(runs.sort((a, b) =>
        new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      ));
    } catch (err) {
      // It's ok if no runs exist yet
      setScheduleRuns([]);
    }
  };

  const fetchScheduleEntries = async (scheduleRunId: number) => {
    try {
      const entries = await routineService.getScheduleEntries(scheduleRunId);
      setScheduleEntries(entries);
    } catch (err) {
      setError('Failed to fetch schedule entries');
    }
  };

  const handleGenerateRoutine = async () => {
    if (!selectedOffering) {
      setError('Please select a semester offering');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const request: GenerateRoutineRequest = {
        semester_offering_id: selectedOffering as number,
      };

      const result = await routineService.generateRoutine(request);
      setCurrentSchedule(result);
      if (result.schedule_entries) {
        setScheduleEntries(result.schedule_entries);
      } else {
        await fetchScheduleEntries(result.id);
      }
      await fetchScheduleRuns(selectedOffering as number);
      setSuccess('Routine generated successfully!');
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate routine');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSchedule = async (run: ScheduleRun) => {
    setCurrentSchedule(run);
    if (run.schedule_entries) {
      setScheduleEntries(run.schedule_entries);
    } else {
      await fetchScheduleEntries(run.id);
    }
    setActiveStep(1);
  };

  const handleCommitSchedule = async () => {
    if (!currentSchedule) return;

    try {
      await routineService.commitSchedule(currentSchedule.id);
      setCommitDialog(false);
      await fetchScheduleRuns(selectedOffering as number);
      setSuccess('Schedule committed successfully!');
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit schedule');
    }
  };

  const handleCancelSchedule = async (runId: number) => {
    if (confirm('Are you sure you want to cancel this schedule run?')) {
      try {
        await routineService.cancelSchedule(runId);
        await fetchScheduleRuns(selectedOffering as number);
        if (currentSchedule?.id === runId) {
          setCurrentSchedule(null);
          setScheduleEntries([]);
        }
        setSuccess('Schedule cancelled successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel schedule');
      }
    }
  };

  const handleExportCSV = () => {
    if (scheduleEntries.length === 0) return;

    const filename = `schedule_${selectedOfferingData?.programme?.name}_${selectedOfferingData?.department?.name}_Sem${selectedOfferingData?.semester_number}_${new Date().toISOString().split('T')[0]}.csv`;

    let csv = 'Day,Time Slot,Subject Code,Subject Name,Teacher,Room,Type\n';

    const sortedEntries = [...scheduleEntries].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return a.slot_number - b.slot_number;
    });

    sortedEntries.forEach(entry => {
      const timeSlot = routineService.formatTimeSlot(entry.day_of_week, entry.slot_number);
      const [day, time] = timeSlot.split(' ');
      const subjectCode = entry.course_offering?.subject?.code || 'N/A';
      const subjectName = entry.course_offering?.subject?.name || 'N/A';
      const teacher = entry.teacher?.name || 'N/A';
      const room = entry.room?.name || 'N/A';
      const type = entry.course_offering?.is_lab ? 'Lab' : 'Theory';

      csv += `"${day}","${time}","${subjectCode}","${subjectName}","${teacher}","${room}","${type}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderScheduleByDay = () => {
    const entriesByDay = routineService.groupEntriesByDay(scheduleEntries);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [1, 2, 3, 4, 'break', 5, 6, 7]; // Include break explicitly

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold min-w-[100px]">Time</TableHead>
              {days.map((day, index) => (
                <TableHead key={index} className="text-center font-bold">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((slot) => {
              if (slot === 'break') {
                return (
                  <TableRow key="break">
                    <TableCell className="bg-gray-100 font-bold">
                      12:40-13:50
                    </TableCell>
                    {days.map((_, index) => (
                      <TableCell key={index} className="text-center bg-gray-100">
                        <span className="text-xs text-gray-500">LUNCH BREAK</span>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              }

              const slotNum = slot as number;
              const timeRange = routineService.formatTimeSlot(1, slotNum).split(' ')[1];

              return (
                <TableRow key={slotNum}>
                  <TableCell className="font-medium">{timeRange}</TableCell>
                  {days.map((_, dayIndex) => {
                    const dayEntries = entriesByDay.get(dayIndex + 1) || [];
                    const entry = dayEntries.find(e => e.slot_number === slotNum);

                    if (!entry) {
                      return <TableCell key={dayIndex} className="text-center" />;
                    }

                    const isLab = entry.course_offering?.is_lab;
                    const bgColor = isLab ? 'bg-blue-100' : 'bg-purple-100';

                    return (
                      <TableCell key={dayIndex} className="text-center p-1">
                        <div className={cn('p-2 rounded min-h-[60px] flex flex-col justify-center', bgColor)}>
                          <p className="text-xs font-bold">
                            {entry.course_offering?.subject?.code}
                          </p>
                          <p className="text-xs">
                            {entry.room?.name}
                          </p>
                          <p className="text-xs">
                            {entry.teacher?.initials || entry.teacher?.name}
                          </p>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderScheduleByRoom = () => {
    const entriesByRoom = routineService.groupEntriesByRoom(scheduleEntries);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(entriesByRoom.entries()).map(([roomId, entries]) => {
          const room = entries[0]?.room;
          return (
            <Card key={roomId}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DoorOpen className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">
                    {room?.name} ({room?.type})
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Capacity: {room?.capacity || 'N/A'}
                </p>
                <hr className="my-2" />
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="border-b pb-2">
                      <p className="text-sm font-medium">
                        {routineService.formatTimeSlot(entry.day_of_week, entry.slot_number)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entry.course_offering?.subject?.code} - {entry.course_offering?.subject?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Teacher: {entry.teacher?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderScheduleByTeacher = () => {
    const entriesByTeacher = routineService.groupEntriesByTeacher(scheduleEntries);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(entriesByTeacher.entries()).map(([teacherId, entries]) => {
          const teacher = entries[0]?.teacher;
          const totalHours = entries.length;

          return (
            <Card key={teacherId}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">
                      {teacher?.name}
                    </h3>
                  </div>
                  <Badge className="bg-blue-500">
                    {totalHours} hours/week
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Department: {teacher?.department?.name || 'N/A'}
                </p>
                <hr className="my-2" />
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="border-b pb-2">
                      <p className="text-sm font-medium">
                        {routineService.formatTimeSlot(entry.day_of_week, entry.slot_number)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entry.course_offering?.subject?.code} - {entry.course_offering?.subject?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Room: {entry.room?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'COMMITTED': return 'default';
      case 'FAILED': return 'destructive';
      case 'CANCELLED': return 'secondary';
      default: return 'secondary';
    }
  };

  const steps = ['Select & Generate', 'Review Schedule', 'Commit'];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-6">Routine Generator</h2>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2',
                      activeStep >= index
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    )}
                  >
                    {activeStep > index ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <p className="text-xs mt-2">{label}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4',
                      activeStep > index ? 'bg-blue-500' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {activeStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Semester Offering</label>
                <Select
                  value={selectedOffering.toString()}
                  onValueChange={(value) => setSelectedOffering(value === '' ? '' : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an offering" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select an offering</SelectItem>
                    {semesterOfferings.map((offering) => (
                      <SelectItem key={offering.id} value={offering.id.toString()}>
                        {offering.programme?.name} - {offering.department?.name} -
                        Semester {offering.semester_number} ({offering.session?.name} {offering.session?.academic_year})
                        <Badge variant="outline" className="ml-2">
                          {offering.course_offerings?.length || 0} courses
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOfferingData && (
                <div>
                  <button
                    onClick={() => setExpandedCourses(!expandedCourses)}
                    className="flex items-center justify-between w-full p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-medium">Course Offerings Summary</span>
                    <ChevronDown className={cn('h-5 w-5 transition-transform', expandedCourses && 'transform rotate-180')} />
                  </button>
                  {expandedCourses && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedOfferingData.course_offerings?.map((course) => (
                        <div key={course.id} className="border rounded-lg p-4">
                          <p className="font-medium text-sm mb-2">
                            {course.subject?.code} - {course.subject?.name}
                          </p>
                          <p className="text-xs text-gray-600">Credits: {course.subject?.credit}</p>
                          <p className="text-xs text-gray-600">Weekly Slots: {course.weekly_required_slots}</p>
                          <p className="text-xs text-gray-600">Type: {course.is_lab ? 'Lab' : 'Theory'}</p>
                          {course.teacher_assignments && course.teacher_assignments.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Teachers: {course.teacher_assignments.map(ta => ta.teacher?.initials).join(', ')}
                            </p>
                          )}
                          {course.room_assignments && course.room_assignments.length > 0 && (
                            <p className="text-xs text-purple-600">
                              Rooms: {course.room_assignments.map(ra => ra.room?.name).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleGenerateRoutine}
                  disabled={!selectedOffering || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Generate Routine
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} />}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="ml-2 text-green-800">{success}</span>
        </Alert>
      )}

      {scheduleRuns.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Previous Schedule Runs</h3>
            </div>
            <div className="space-y-2">
              {scheduleRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      Run #{run.id} - {new Date(run.generated_at).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                      {run.committed_at && (
                        <span className="text-xs text-gray-500">
                          Committed: {new Date(run.committed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSchedule(run)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Schedule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {run.status === 'DRAFT' && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentSchedule(run);
                                  setCommitDialog(true);
                                }}
                              >
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Commit Schedule</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelSchedule(run.id)}
                              >
                                <XIcon className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel Schedule</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentSchedule && scheduleEntries.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Generated Schedule</h3>
                {currentSchedule.status === 'COMMITTED' && (
                  <Badge variant="default">COMMITTED</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                {currentSchedule.status === 'DRAFT' && (
                  <Button onClick={() => setCommitDialog(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Commit Schedule
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b mb-4">
              <button
                onClick={() => setViewMode(0)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
                  viewMode === 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <Calendar className="h-4 w-4" />
                By Day
              </button>
              <button
                onClick={() => setViewMode(1)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
                  viewMode === 1
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <DoorOpen className="h-4 w-4" />
                By Room
              </button>
              <button
                onClick={() => setViewMode(2)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
                  viewMode === 2
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <User className="h-4 w-4" />
                By Teacher
              </button>
            </div>

            <div className="mt-4">
              {viewMode === 0 && renderScheduleByDay()}
              {viewMode === 1 && renderScheduleByRoom()}
              {viewMode === 2 && renderScheduleByTeacher()}
            </div>

            {currentSchedule.meta && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <div className="ml-2">
                  <p className="font-medium text-sm mb-2">Generation Report</p>
                  {currentSchedule.meta.total_blocks && (
                    <p className="text-xs">Total Blocks: {currentSchedule.meta.total_blocks}</p>
                  )}
                  {currentSchedule.meta.placed_blocks && (
                    <p className="text-xs">Placed Blocks: {currentSchedule.meta.placed_blocks}</p>
                  )}
                  {currentSchedule.meta.unplaced_blocks > 0 && (
                    <p className="text-xs text-red-600">Unplaced Blocks: {currentSchedule.meta.unplaced_blocks}</p>
                  )}
                  {currentSchedule.meta.conflicts && currentSchedule.meta.conflicts.length > 0 && (
                    <>
                      <p className="text-xs text-red-600 mt-2">Conflicts:</p>
                      {currentSchedule.meta.conflicts.map((conflict: string, index: number) => (
                        <p key={index} className="text-xs pl-4">• {conflict}</p>
                      ))}
                    </>
                  )}
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commit Dialog */}
      <Dialog open={commitDialog} onOpenChange={setCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Schedule</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="ml-2">
              <p className="text-sm text-yellow-800">
                Once committed, this schedule will be finalized and cannot be modified.
                All assigned teachers and rooms will be permanently booked for these time slots.
              </p>
            </div>
          </Alert>
          <p className="text-sm">Are you sure you want to commit this schedule?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommitSchedule}>
              Commit Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutineGenerator;
