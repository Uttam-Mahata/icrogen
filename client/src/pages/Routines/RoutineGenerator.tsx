import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Schedule,
  CheckCircle,
  Cancel,
  Visibility,
  CalendarMonth,
  Room,
  Person,
  School,
  Download,
  Print,
  ExpandMore,
  Warning,
  Info,
  Refresh,
  Save,
  History,
} from '@mui/icons-material';
import { 
  type SemesterOffering, 
  type ScheduleRun, 
  type ScheduleEntry,
  type CourseOffering,
} from '../../types/models';
import { semesterOfferingService } from '../../services/semesterOfferingService';
import { routineService, type GenerateRoutineRequest } from '../../services/routineService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

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
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Time</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slot) => {
              if (slot === 'break') {
                return (
                  <TableRow key="break">
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                      12:40-13:50
                    </TableCell>
                    {days.map((_, index) => (
                      <TableCell key={index} align="center" sx={{ bgcolor: 'grey.100' }}>
                        <Typography variant="caption" color="text.secondary">
                          LUNCH BREAK
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              }
              
              const slotNum = slot as number;
              const timeRange = routineService.formatTimeSlot(1, slotNum).split(' ')[1];

              return (
                <TableRow key={slotNum}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{timeRange}</TableCell>
                  {days.map((_, dayIndex) => {
                    const dayEntries = entriesByDay.get(dayIndex + 1) || [];
                    const entry = dayEntries.find(e => e.slot_number === slotNum);
                    
                    if (!entry) {
                      return <TableCell key={dayIndex} align="center" />;
                    }

                    const isLab = entry.course_offering?.is_lab;
                    const bgColor = isLab ? 'info.light' : 'primary.light';
                    
                    return (
                      <TableCell key={dayIndex} align="center" sx={{ p: 0.5 }}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 1, 
                            bgcolor: bgColor, 
                            color: 'white',
                            minHeight: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" display="block" fontWeight="bold">
                            {entry.course_offering?.subject?.code}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {entry.room?.name}
                          </Typography>
                          <Typography variant="caption">
                            {entry.teacher?.initials || entry.teacher?.name}
                          </Typography>
                        </Paper>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderScheduleByRoom = () => {
    const entriesByRoom = routineService.groupEntriesByRoom(scheduleEntries);

    return (
      <Grid container spacing={2}>
        {Array.from(entriesByRoom.entries()).map(([roomId, entries]) => {
          const room = entries[0]?.room;
          return (
            <Grid item xs={12} md={6} key={roomId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Room fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {room?.name} ({room?.type})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Capacity: {room?.capacity || 'N/A'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <List dense>
                    {entries.map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${routineService.formatTimeSlot(entry.day_of_week, entry.slot_number)}`}
                          secondary={
                            <React.Fragment>
                              <Typography variant="caption" component="span">
                                {entry.course_offering?.subject?.code} - {entry.course_offering?.subject?.name}
                              </Typography>
                              <br />
                              <Typography variant="caption" component="span">
                                Teacher: {entry.teacher?.name}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderScheduleByTeacher = () => {
    const entriesByTeacher = routineService.groupEntriesByTeacher(scheduleEntries);

    return (
      <Grid container spacing={2}>
        {Array.from(entriesByTeacher.entries()).map(([teacherId, entries]) => {
          const teacher = entries[0]?.teacher;
          const totalHours = entries.length;
          
          return (
            <Grid item xs={12} md={6} key={teacherId}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" gutterBottom>
                      <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {teacher?.name}
                    </Typography>
                    <Chip 
                      label={`${totalHours} hours/week`} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Department: {teacher?.department?.name || 'N/A'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <List dense>
                    {entries.map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${routineService.formatTimeSlot(entry.day_of_week, entry.slot_number)}`}
                          secondary={
                            <React.Fragment>
                              <Typography variant="caption" component="span">
                                {entry.course_offering?.subject?.code} - {entry.course_offering?.subject?.name}
                              </Typography>
                              <br />
                              <Typography variant="caption" component="span">
                                Room: {entry.room?.name}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'warning';
      case 'COMMITTED': return 'success';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const steps = ['Select & Generate', 'Review Schedule', 'Commit'];

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Routine Generator
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Semester Offering</InputLabel>
                  <Select
                    value={selectedOffering}
                    onChange={(e) => setSelectedOffering(e.target.value as number | '')}
                    label="Select Semester Offering"
                  >
                    <MenuItem value="">Select an offering</MenuItem>
                    {semesterOfferings.map((offering) => (
                      <MenuItem key={offering.id} value={offering.id}>
                        {offering.programme?.name} - {offering.department?.name} - 
                        Semester {offering.semester_number} ({offering.session?.name} {offering.session?.academic_year})
                        <Chip 
                          label={`${offering.course_offerings?.length || 0} courses`}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedOfferingData && (
                <Grid item xs={12}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Course Offerings Summary</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {selectedOfferingData.course_offerings?.map((course) => (
                          <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {course.subject?.code} - {course.subject?.name}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Credits: {course.subject?.credit}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Weekly Slots: {course.weekly_required_slots}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Type: {course.is_lab ? 'Lab' : 'Theory'}
                              </Typography>
                              {course.teacher_assignments && course.teacher_assignments.length > 0 && (
                                <Typography variant="caption" display="block" color="primary">
                                  Teachers: {course.teacher_assignments.map(ta => ta.teacher?.initials).join(', ')}
                                </Typography>
                              )}
                              {course.room_assignments && course.room_assignments.length > 0 && (
                                <Typography variant="caption" display="block" color="secondary">
                                  Rooms: {course.room_assignments.map(ra => ra.room?.name).join(', ')}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={handleGenerateRoutine}
                    disabled={!selectedOffering || generating}
                  >
                    {generating ? 'Generating...' : 'Generate Routine'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} />}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {scheduleRuns.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <History sx={{ mr: 1, verticalAlign: 'middle' }} />
              Previous Schedule Runs
            </Typography>
            <List>
              {scheduleRuns.slice(0, 5).map((run) => (
                <ListItem
                  key={run.id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="View Schedule">
                        <IconButton
                          onClick={() => handleViewSchedule(run)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {run.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Commit Schedule">
                            <IconButton
                              onClick={() => {
                                setCurrentSchedule(run);
                                setCommitDialog(true);
                              }}
                              color="success"
                            >
                              <Save />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Schedule">
                            <IconButton
                              onClick={() => handleCancelSchedule(run.id)}
                              color="error"
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`Run #${run.id} - ${new Date(run.generated_at).toLocaleString()}`}
                    secondary={
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={run.status}
                          size="small"
                          color={getStatusColor(run.status)}
                        />
                        {run.committed_at && (
                          <Typography variant="caption">
                            Committed: {new Date(run.committed_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {currentSchedule && scheduleEntries.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Generated Schedule
                {currentSchedule.status === 'COMMITTED' && (
                  <Chip 
                    label="COMMITTED" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Box display="flex" gap={1}>
                <Button 
                  startIcon={<Download />} 
                  variant="outlined"
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>
                <Button 
                  startIcon={<Print />} 
                  variant="outlined"
                  onClick={handlePrint}
                >
                  Print
                </Button>
                {currentSchedule.status === 'DRAFT' && (
                  <Button
                    startIcon={<CheckCircle />}
                    variant="contained"
                    color="success"
                    onClick={() => setCommitDialog(true)}
                  >
                    Commit Schedule
                  </Button>
                )}
              </Box>
            </Box>

            <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)}>
              <Tab label="By Day" icon={<CalendarMonth />} iconPosition="start" />
              <Tab label="By Room" icon={<Room />} iconPosition="start" />
              <Tab label="By Teacher" icon={<Person />} iconPosition="start" />
            </Tabs>

            <TabPanel value={viewMode} index={0}>
              {renderScheduleByDay()}
            </TabPanel>
            <TabPanel value={viewMode} index={1}>
              {renderScheduleByRoom()}
            </TabPanel>
            <TabPanel value={viewMode} index={2}>
              {renderScheduleByTeacher()}
            </TabPanel>

            {currentSchedule.meta && (
              <Box mt={3}>
                <Alert severity="info" icon={<Info />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Generation Report
                  </Typography>
                  {currentSchedule.meta.total_blocks && (
                    <Typography variant="caption" display="block">
                      Total Blocks: {currentSchedule.meta.total_blocks}
                    </Typography>
                  )}
                  {currentSchedule.meta.placed_blocks && (
                    <Typography variant="caption" display="block">
                      Placed Blocks: {currentSchedule.meta.placed_blocks}
                    </Typography>
                  )}
                  {currentSchedule.meta.unplaced_blocks > 0 && (
                    <Typography variant="caption" display="block" color="error">
                      Unplaced Blocks: {currentSchedule.meta.unplaced_blocks}
                    </Typography>
                  )}
                  {currentSchedule.meta.conflicts && currentSchedule.meta.conflicts.length > 0 && (
                    <>
                      <Typography variant="caption" display="block" color="error">
                        Conflicts:
                      </Typography>
                      {currentSchedule.meta.conflicts.map((conflict: string, index: number) => (
                        <Typography key={index} variant="caption" display="block" sx={{ pl: 2 }}>
                          • {conflict}
                        </Typography>
                      ))}
                    </>
                  )}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commit Dialog */}
      <Dialog open={commitDialog} onClose={() => setCommitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Commit Schedule</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Once committed, this schedule will be finalized and cannot be modified.
            All assigned teachers and rooms will be permanently booked for these time slots.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to commit this schedule?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommitDialog(false)}>Cancel</Button>
          <Button onClick={handleCommitSchedule} variant="contained" color="success">
            Commit Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoutineGenerator;