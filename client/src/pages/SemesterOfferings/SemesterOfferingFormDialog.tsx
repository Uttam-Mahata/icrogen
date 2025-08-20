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
  Chip,
  TextField,
} from '@mui/material';
import { type SemesterOffering, type Programme, type Department, type Session } from '../../types/models';
import { semesterOfferingService, type CreateSemesterOfferingRequest, type UpdateSemesterOfferingRequest } from '../../services/semesterOfferingService';
import { programmeService } from '../../services/programmeService';
import { departmentService } from '../../services/departmentService';
import { sessionService } from '../../services/sessionService';

interface SemesterOfferingFormDialogProps {
  open: boolean;
  offering: SemesterOffering | null;
  onClose: () => void;
  onSubmit: () => void;
}

const SemesterOfferingFormDialog: React.FC<SemesterOfferingFormDialogProps> = ({
  open,
  offering,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    programme_id: 0,
    department_id: 0,
    session_id: 0,
    semester_number: 1,
    total_students: 0,
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
  });
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFormData();
      if (offering) {
        setFormData({
          programme_id: offering.programme_id,
          department_id: offering.department_id,
          session_id: offering.session_id,
          semester_number: offering.semester_number,
          total_students: offering.total_students || 0,
          status: offering.status,
        });
      } else {
        setFormData({
          programme_id: 0,
          department_id: 0,
          session_id: 0,
          semester_number: 1,
          total_students: 0,
          status: 'DRAFT',
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [offering, open]);

  const fetchFormData = async () => {
    setLoadingData(true);
    try {
      const [programmesData, departmentsData, sessionsData] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
        sessionService.getAll(),
      ]);
      setProgrammes(programmesData);
      setDepartments(departmentsData);
      setSessions(sessionsData.sort((a, b) => b.academic_year.localeCompare(a.academic_year)));
    } catch (err) {
      setSubmitError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.programme_id) {
      newErrors.programme_id = 'Programme is required';
    }

    if (!formData.department_id) {
      newErrors.department_id = 'Department is required';
    }

    if (!formData.session_id) {
      newErrors.session_id = 'Session is required';
    }

    if (!formData.semester_number || formData.semester_number < 1 || formData.semester_number > 8) {
      newErrors.semester_number = 'Semester number must be between 1 and 8';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (offering) {
        const updateData: UpdateSemesterOfferingRequest = {
          status: formData.status,
        };
        await semesterOfferingService.update(offering.id, updateData);
      } else {
        const createData: CreateSemesterOfferingRequest = {
          programme_id: formData.programme_id,
          department_id: formData.department_id,
          session_id: formData.session_id,
          semester_number: formData.semester_number,
        };
        await semesterOfferingService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save semester offering');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getSessionParity = (sessionId: number): string => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.parity || '';
  };

  const getAvailableSemesters = (): number[] => {
    if (!formData.session_id) return [];
    const parity = getSessionParity(formData.session_id);
    if (parity === 'ODD') {
      return [1, 3, 5, 7];
    } else if (parity === 'EVEN') {
      return [2, 4, 6, 8];
    }
    return [];
  };

  const getSemesterLabel = (number: number): string => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${number}${suffixes[number - 1] || 'th'} Semester`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {offering ? 'Edit Semester Offering' : 'Add New Semester Offering'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            </Grid>
          )}
          
          {!offering && (
            <>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.programme_id}>
                  <InputLabel>Programme</InputLabel>
                  <Select
                    value={formData.programme_id || ''}
                    onChange={(e) => handleChange('programme_id', Number(e.target.value))}
                    label="Programme"
                    required
                    disabled={loadingData}
                  >
                    <MenuItem value="">Select Programme</MenuItem>
                    {programmes.map(programme => (
                      <MenuItem key={programme.id} value={programme.id}>
                        {programme.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.programme_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.programme_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.department_id}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department_id || ''}
                    onChange={(e) => handleChange('department_id', Number(e.target.value))}
                    label="Department"
                    required
                    disabled={loadingData}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(department => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.department_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.session_id}>
                  <InputLabel>Session</InputLabel>
                  <Select
                    value={formData.session_id || ''}
                    onChange={(e) => {
                      const sessionId = Number(e.target.value);
                      handleChange('session_id', sessionId);
                      // Reset semester number when session changes
                      const availableSemesters = getAvailableSemesters();
                      if (availableSemesters.length > 0 && !availableSemesters.includes(formData.semester_number)) {
                        handleChange('semester_number', availableSemesters[0]);
                      }
                    }}
                    label="Session"
                    required
                    disabled={loadingData}
                  >
                    <MenuItem value="">Select Session</MenuItem>
                    {sessions.map(session => (
                      <MenuItem key={session.id} value={session.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{session.name} {session.academic_year}</span>
                          <Chip 
                            label={session.parity} 
                            size="small" 
                            color={session.parity === 'ODD' ? 'warning' : 'info'}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.session_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.session_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.semester_number}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester_number}
                    onChange={(e) => handleChange('semester_number', Number(e.target.value))}
                    label="Semester"
                    required
                    disabled={!formData.session_id || loadingData}
                  >
                    {getAvailableSemesters().map(num => (
                      <MenuItem key={num} value={num}>
                        {getSemesterLabel(num)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.semester_number && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.semester_number}
                    </Typography>
                  )}
                  {formData.session_id && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      Only {getSessionParity(formData.session_id)} semesters are available for this session
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Total Students"
                  type="number"
                  value={formData.total_students}
                  onChange={(e) => handleChange('total_students', Number(e.target.value))}
                  error={!!errors.total_students}
                  helperText={errors.total_students || 'Number of students enrolled (used for lab group division)'}
                  inputProps={{ min: 0, max: 500 }}
                />
              </Grid>
            </>
          )}

          {offering && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {offering && (
            <Grid item xs={12}>
              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  <strong>Programme:</strong> {offering.programme?.name}<br />
                  <strong>Department:</strong> {offering.department?.name}<br />
                  <strong>Session:</strong> {offering.session?.name} {offering.session?.academic_year}<br />
                  <strong>Semester:</strong> {getSemesterLabel(offering.semester_number)}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loadingData}
        >
          {submitting ? 'Saving...' : (offering ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SemesterOfferingFormDialog;