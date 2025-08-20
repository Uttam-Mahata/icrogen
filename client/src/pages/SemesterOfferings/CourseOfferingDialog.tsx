import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Delete,
  Person,
  Room,
  School,
  Edit,
} from '@mui/icons-material';
import { type SemesterOffering, type CourseOffering, type Subject, type Teacher, type Room as RoomType } from '../../types/models';
import { semesterOfferingService, type CreateCourseOfferingRequest, type AssignTeacherRequest, type AssignRoomRequest } from '../../services/semesterOfferingService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { roomService } from '../../services/roomService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface CourseOfferingDialogProps {
  open: boolean;
  semesterOffering: SemesterOffering;
  onClose: () => void;
}

const CourseOfferingDialog: React.FC<CourseOfferingDialogProps> = ({
  open,
  semesterOffering,
  onClose,
}) => {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseOffering | null>(null);
  const [showAssignments, setShowAssignments] = useState(false);

  // Form data for adding course
  const [courseFormData, setCourseFormData] = useState({
    subject_id: 0,
    weekly_required_slots: 3,
    required_pattern: '',
    preferred_room_id: null as number | null,
    teacher_ids: [] as number[],
    notes: '',
  });

  // Form data for assignments
  const [teacherAssignment, setTeacherAssignment] = useState({
    teacher_id: 0,
    weight: 1.0,
  });

  const [roomAssignment, setRoomAssignment] = useState({
    room_id: 0,
    priority: 1,
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, semesterOffering.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, subjectsData, teachersData, roomsData] = await Promise.all([
        semesterOfferingService.getCourseOfferings(semesterOffering.id),
        subjectService.getByDepartment(semesterOffering.department_id),
        teacherService.getByDepartment(semesterOffering.department_id),
        roomService.getAll(),
      ]);
      setCourseOfferings(coursesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!courseFormData.subject_id) {
      setError('Please select a subject');
      return;
    }

    try {
      const data: CreateCourseOfferingRequest = {
        subject_id: courseFormData.subject_id,
        weekly_required_slots: courseFormData.weekly_required_slots,
        required_pattern: courseFormData.required_pattern || undefined,
        preferred_room_id: courseFormData.preferred_room_id,
        teacher_ids: courseFormData.teacher_ids,
        notes: courseFormData.notes || undefined,
      };
      await semesterOfferingService.addCourseOffering(semesterOffering.id, data);
      await fetchData();
      setShowAddCourse(false);
      setCourseFormData({
        subject_id: 0,
        weekly_required_slots: 3,
        required_pattern: '',
        preferred_room_id: null,
        teacher_ids: [],
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add course offering');
    }
  };

  const handleRemoveCourse = async (courseOfferingId: number) => {
    try {
      await semesterOfferingService.removeCourseOffering(semesterOffering.id, courseOfferingId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove course offering');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedCourse || !teacherAssignment.teacher_id) {
      setError('Please select a teacher');
      return;
    }

    try {
      const data: AssignTeacherRequest = {
        teacher_id: teacherAssignment.teacher_id,
        weight: teacherAssignment.weight,
      };
      await semesterOfferingService.assignTeacher(semesterOffering.id, selectedCourse.id, data);
      await fetchData();
      setTeacherAssignment({ teacher_id: 0, weight: 1.0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async (courseOfferingId: number, teacherId: number) => {
    try {
      await semesterOfferingService.removeTeacher(semesterOffering.id, courseOfferingId, teacherId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teacher');
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedCourse || !roomAssignment.room_id) {
      setError('Please select a room');
      return;
    }

    try {
      const data: AssignRoomRequest = {
        room_id: roomAssignment.room_id,
        priority: roomAssignment.priority,
      };
      await semesterOfferingService.assignRoom(semesterOffering.id, selectedCourse.id, data);
      await fetchData();
      setRoomAssignment({ room_id: 0, priority: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign room');
    }
  };

  const handleRemoveRoom = async (courseOfferingId: number, roomId: number) => {
    try {
      await semesterOfferingService.removeRoom(semesterOffering.id, courseOfferingId, roomId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove room');
    }
  };

  const getSemesterLabel = (number: number): string => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${number}${suffixes[number - 1] || 'th'} Semester`;
  };

  if (loading && open) return <LoadingSpinner />;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Manage Course Offerings
          </Typography>
          <Box>
            <Chip 
              label={`${semesterOffering.programme?.name}`} 
              size="small" 
              color="primary"
              sx={{ mr: 1 }}
            />
            <Chip 
              label={getSemesterLabel(semesterOffering.semester_number)} 
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!showAddCourse && !showAssignments && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Course Offerings ({courseOfferings.length})
              </Typography>
              <Button
                startIcon={<Add />}
                variant="contained"
                size="small"
                onClick={() => setShowAddCourse(true)}
              >
                Add Course
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Weekly Slots</TableCell>
                    <TableCell>Teachers</TableCell>
                    <TableCell>Rooms</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseOfferings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box py={3}>
                          <School sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No course offerings yet
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courseOfferings.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {course.subject?.code} - {course.subject?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={course.subject?.subject_type?.name || 'N/A'} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {course.weekly_required_slots}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {course.teacher_assignments?.map(ta => (
                              <Chip
                                key={ta.teacher_id}
                                label={ta.teacher?.name}
                                size="small"
                                icon={<Person fontSize="small" />}
                                onDelete={() => handleRemoveTeacher(course.id, ta.teacher_id)}
                              />
                            )) || <Typography variant="caption" color="text.secondary">No teachers assigned</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {course.room_assignments?.map(ra => (
                              <Chip
                                key={ra.room_id}
                                label={`${ra.room?.name} (${ra.room?.type})`}
                                size="small"
                                icon={<Room fontSize="small" />}
                                onDelete={() => handleRemoveRoom(course.id, ra.room_id)}
                              />
                            )) || <Typography variant="caption" color="text.secondary">No rooms assigned</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Manage Assignments">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowAssignments(true);
                              }}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Course">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveCourse(course.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {showAddCourse && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add Course Offering
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={courseFormData.subject_id || ''}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, subject_id: Number(e.target.value) }))}
                    label="Subject"
                    required
                  >
                    <MenuItem value="">Select Subject</MenuItem>
                    {subjects.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name} ({subject.subject_type?.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Weekly Required Slots"
                  type="number"
                  value={courseFormData.weekly_required_slots}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, weekly_required_slots: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Required Pattern (e.g., 2+1)"
                  value={courseFormData.required_pattern}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, required_pattern: e.target.value }))}
                  helperText="Optional: Specify slot pattern"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Room</InputLabel>
                  <Select
                    value={courseFormData.preferred_room_id || ''}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, preferred_room_id: e.target.value ? Number(e.target.value) : null }))}
                    label="Preferred Room"
                  >
                    <MenuItem value="">No Preference (Auto-assign)</MenuItem>
                    {rooms.map(room => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.name} ({room.type}, Capacity: {room.capacity})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Teachers</InputLabel>
                  <Select
                    multiple
                    value={courseFormData.teacher_ids}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, teacher_ids: e.target.value as number[] }))}
                    label="Assign Teachers"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const teacher = teachers.find(t => t.id === value);
                          return teacher ? (
                            <Chip key={value} label={teacher.name} size="small" />
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {teachers.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.initials})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={courseFormData.notes}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button onClick={() => setShowAddCourse(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleAddCourse}>
                    Add Course
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {showAssignments && selectedCourse && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Manage Assignments: {selectedCourse.subject?.name}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Teacher Assignments
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={teacherAssignment.teacher_id || ''}
                      onChange={(e) => setTeacherAssignment(prev => ({ ...prev, teacher_id: Number(e.target.value) }))}
                      displayEmpty
                    >
                      <MenuItem value="">Select Teacher</MenuItem>
                      {teachers.map(teacher => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Weight"
                    type="number"
                    value={teacherAssignment.weight}
                    onChange={(e) => setTeacherAssignment(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    inputProps={{ min: 0.1, max: 1, step: 0.1 }}
                    sx={{ width: 100 }}
                  />
                  <Button variant="contained" onClick={handleAssignTeacher}>
                    Assign
                  </Button>
                </Box>
                <List>
                  {selectedCourse.teacher_assignments?.map(ta => (
                    <ListItem key={ta.teacher_id}>
                      <ListItemText
                        primary={ta.teacher?.name}
                        secondary={`Weight: ${ta.weight}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveTeacher(selectedCourse.id, ta.teacher_id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Room Assignments
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={roomAssignment.room_id || ''}
                      onChange={(e) => setRoomAssignment(prev => ({ ...prev, room_id: Number(e.target.value) }))}
                      displayEmpty
                    >
                      <MenuItem value="">Select Room</MenuItem>
                      {rooms.map(room => (
                        <MenuItem key={room.id} value={room.id}>
                          {room.name} ({room.type})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Priority"
                    type="number"
                    value={roomAssignment.priority}
                    onChange={(e) => setRoomAssignment(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ width: 100 }}
                  />
                  <Button variant="contained" onClick={handleAssignRoom}>
                    Assign
                  </Button>
                </Box>
                <List>
                  {selectedCourse.room_assignments?.map(ra => (
                    <ListItem key={ra.room_id}>
                      <ListItemText
                        primary={`${ra.room?.name} (${ra.room?.type})`}
                        secondary={`Priority: ${ra.priority}, Capacity: ${ra.room?.capacity}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveRoom(selectedCourse.id, ra.room_id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button onClick={() => {
                setShowAssignments(false);
                setSelectedCourse(null);
              }}>
                Back to Courses
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseOfferingDialog;