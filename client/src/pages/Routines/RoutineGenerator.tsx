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
  FormControlLabel,
  Switch,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
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
  Settings,
  Download,
  Print,
} from '@mui/icons-material';
import { type SemesterOffering, type ScheduleRun, type ScheduleSlot } from '../../types/models';
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
  const [scheduleRuns, setScheduleRuns] = useState<ScheduleRun[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleRun | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [viewMode, setViewMode] = useState(0); // 0: By Day, 1: By Room, 2: By Teacher
  const [commitDialog, setCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // Generation settings
  const [generationSettings, setGenerationSettings] = useState({
    respect_teacher_preferences: true,
    respect_room_preferences: true,
    max_iterations: 1000,
    temperature: 0.8,
  });

  useEffect(() => {
    fetchSemesterOfferings();
  }, []);

  useEffect(() => {
    if (selectedOffering) {
      fetchScheduleRuns(selectedOffering as number);
    }
  }, [selectedOffering]);

  const fetchSemesterOfferings = async () => {
    try {
      setLoading(true);
      const data = await semesterOfferingService.getAll();
      // Filter only active semester offerings
      const activeOfferings = data.filter(o => o.status === 'ACTIVE');
      setSemesterOfferings(activeOfferings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch semester offerings');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleRuns = async (offeringId: number) => {
    try {
      const runs = await routineService.getScheduleRunsBySemesterOffering(offeringId);
      setScheduleRuns(runs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      // It's ok if no runs exist yet
      setScheduleRuns([]);
    }
  };

  const fetchScheduleSlots = async (scheduleRunId: number) => {
    try {
      const slots = await routineService.getScheduleSlots(scheduleRunId);
      setScheduleSlots(slots);
    } catch (err) {
      setError('Failed to fetch schedule slots');
    }
  };

  const handleGenerateRoutine = async () => {
    if (!selectedOffering) {
      setError('Please select a semester offering');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const request: GenerateRoutineRequest = {
        semester_offering_id: selectedOffering as number,
        config: generationSettings,
      };

      const result = await routineService.generateRoutine(request);
      setCurrentSchedule(result);
      await fetchScheduleSlots(result.id);
      await fetchScheduleRuns(selectedOffering as number);
      setOpenSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate routine');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSchedule = async (run: ScheduleRun) => {
    setCurrentSchedule(run);
    await fetchScheduleSlots(run.id);
  };

  const handleCommitSchedule = async () => {
    if (!currentSchedule) return;

    try {
      await routineService.commitSchedule(currentSchedule.id, {
        message: commitMessage || 'Committed schedule',
      });
      setCommitDialog(false);
      setCommitMessage('');
      await fetchScheduleRuns(selectedOffering as number);
      setError(null);
      // Show success message
      alert('Schedule committed successfully!');
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
          setScheduleSlots([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel schedule');
      }
    }
  };

  const renderScheduleByDay = () => {
    const slotsByDay = routineService.groupSlotsByDay(scheduleSlots);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = Array.from({ length: 8 }, (_, i) => i + 1);

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map((day, index) => (
                <TableCell key={index} align="center">
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slotNum) => (
              <TableRow key={slotNum}>
                <TableCell>{routineService.formatTimeSlot(1, slotNum).split(' ')[1]}</TableCell>
                {days.map((_, dayIndex) => {
                  const daySlots = slotsByDay.get(dayIndex + 1) || [];
                  const slot = daySlots.find(s => s.slot_number === slotNum);
                  return (
                    <TableCell key={dayIndex} align="center">
                      {slot && (
                        <Paper elevation={2} sx={{ p: 1, bgcolor: 'primary.light', color: 'white' }}>
                          <Typography variant="caption" display="block" fontWeight="bold">
                            {slot.course_offering?.subject?.code}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {slot.room?.name}
                          </Typography>
                          <Typography variant="caption">
                            {slot.teacher?.name}
                          </Typography>
                        </Paper>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderScheduleByRoom = () => {
    const slotsByRoom = routineService.groupSlotsByRoom(scheduleSlots);

    return (
      <Grid container spacing={2}>
        {Array.from(slotsByRoom.entries()).map(([roomId, slots]) => {
          const room = slots[0]?.room;
          return (
            <Grid item xs={12} md={6} key={roomId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Room fontSize="small" sx={{ mr: 1 }} />
                    {room?.name} ({room?.room_type})
                  </Typography>
                  <List dense>
                    {slots.map((slot, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${routineService.formatTimeSlot(slot.day_of_week, slot.slot_number)}`}
                          secondary={`${slot.course_offering?.subject?.code} - ${slot.course_offering?.subject?.name} (${slot.teacher?.name})`}
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
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Routine Generator
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
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
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Settings />}
                  onClick={() => setOpenSettings(true)}
                  disabled={!selectedOffering || generating}
                >
                  Configure
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={generating ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleGenerateRoutine}
                  disabled={!selectedOffering || generating}
                >
                  {generating ? 'Generating...' : 'Generate Routine'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} />}

      {scheduleRuns.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Previous Schedule Runs
            </Typography>
            <List>
              {scheduleRuns.map((run) => (
                <ListItem
                  key={run.id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        onClick={() => handleViewSchedule(run)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      {run.status === 'COMPLETED' && !run.is_committed && (
                        <IconButton
                          onClick={() => {
                            setCurrentSchedule(run);
                            setCommitDialog(true);
                          }}
                          color="success"
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                      {run.status === 'PENDING' && (
                        <IconButton
                          onClick={() => handleCancelSchedule(run.id)}
                          color="error"
                        >
                          <Cancel />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`Run #${run.id} - ${new Date(run.created_at).toLocaleString()}`}
                    secondary={
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={run.status}
                          size="small"
                          color={getStatusColor(run.status)}
                        />
                        {run.is_committed && (
                          <Chip
                            label="COMMITTED"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        <Typography variant="caption">
                          Score: {run.final_score?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {currentSchedule && scheduleSlots.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Generated Schedule
              </Typography>
              <Box display="flex" gap={1}>
                <Button startIcon={<Download />} variant="outlined">
                  Export
                </Button>
                <Button startIcon={<Print />} variant="outlined">
                  Print
                </Button>
              </Box>
            </Box>

            <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)}>
              <Tab label="By Day" />
              <Tab label="By Room" />
            </Tabs>

            <TabPanel value={viewMode} index={0}>
              {renderScheduleByDay()}
            </TabPanel>
            <TabPanel value={viewMode} index={1}>
              {renderScheduleByRoom()}
            </TabPanel>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generation Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={generationSettings.respect_teacher_preferences}
                  onChange={(e) => setGenerationSettings(prev => ({
                    ...prev,
                    respect_teacher_preferences: e.target.checked
                  }))}
                />
              }
              label="Respect Teacher Preferences"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={generationSettings.respect_room_preferences}
                  onChange={(e) => setGenerationSettings(prev => ({
                    ...prev,
                    respect_room_preferences: e.target.checked
                  }))}
                />
              }
              label="Respect Room Preferences"
            />
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Max Iterations: {generationSettings.max_iterations}
              </Typography>
              <Slider
                value={generationSettings.max_iterations}
                onChange={(_, value) => setGenerationSettings(prev => ({
                  ...prev,
                  max_iterations: value as number
                }))}
                min={100}
                max={5000}
                step={100}
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Temperature: {generationSettings.temperature}
              </Typography>
              <Slider
                value={generationSettings.temperature}
                onChange={(_, value) => setGenerationSettings(prev => ({
                  ...prev,
                  temperature: value as number
                }))}
                min={0.1}
                max={2.0}
                step={0.1}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
          <Button onClick={() => setOpenSettings(false)} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Commit Dialog */}
      <Dialog open={commitDialog} onClose={() => setCommitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Commit Schedule</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Once committed, this schedule will be finalized and cannot be modified.
          </Alert>
          <TextField
            fullWidth
            label="Commit Message"
            multiline
            rows={3}
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Add a message describing this schedule..."
          />
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