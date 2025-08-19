import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  School,
  Book,
  Settings,
  Assignment,
} from '@mui/icons-material';
import { type SemesterOffering, type Session } from '../../types/models';
import { semesterOfferingService } from '../../services/semesterOfferingService';
import { sessionService } from '../../services/sessionService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SemesterOfferingFormDialog from './SemesterOfferingFormDialog';
import CourseOfferingDialog from './CourseOfferingDialog';

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

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'ACTIVE': return 'success';
      case 'ARCHIVED': return 'warning';
      default: return 'default';
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
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Semester Offerings
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Semester Offering
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                placeholder="Search by programme or department..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Session</InputLabel>
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value as number | '')}
                  label="Filter by Session"
                >
                  <MenuItem value="">All Sessions</MenuItem>
                  {sessions.map(session => (
                    <MenuItem key={session.id} value={session.id}>
                      {session.name} {session.academic_year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Programme</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Session</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell align="center">Course Count</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOfferings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <School sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No semester offerings found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredOfferings.map((offering) => (
                <TableRow key={offering.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <School fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {offering.programme?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {offering.department?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${offering.session?.name} ${offering.session?.academic_year}`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSemesterLabel(offering.semester_number)}
                      size="small"
                      color={offering.semester_number % 2 === 0 ? 'secondary' : 'primary'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Book fontSize="small" color="action" />
                      <Typography variant="body2">
                        {offering.course_offerings?.length || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={offering.status}
                      size="small"
                      color={getStatusColor(offering.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Manage Courses">
                      <IconButton
                        size="small"
                        onClick={() => handleManageCourses(offering)}
                        color="secondary"
                      >
                        <Assignment />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(offering)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, offering })}
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
    </Box>
  );
};

export default SemesterOfferingList;