import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { type Session } from '../../types/models';
import { sessionService, type CreateSessionRequest, type UpdateSessionRequest } from '../../services/sessionService';
import { format } from 'date-fns';

interface SessionFormDialogProps {
  open: boolean;
  session: Session | null;
  onClose: () => void;
  onSubmit: () => void;
}

const SessionFormDialog: React.FC<SessionFormDialogProps> = ({
  open,
  session,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: 'FALL' as 'SPRING' | 'FALL',
    academic_year: new Date().getFullYear().toString(),
    start_date: new Date(),
    end_date: new Date(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name,
        academic_year: session.academic_year,
        start_date: new Date(session.start_date),
        end_date: new Date(session.end_date),
      });
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Default to FALL if current month is June or later, else SPRING
      const defaultSession = currentMonth >= 5 ? 'FALL' : 'SPRING';
      
      setFormData({
        name: defaultSession as 'SPRING' | 'FALL',
        academic_year: currentYear.toString(),
        start_date: defaultSession === 'FALL' 
          ? new Date(currentYear, 7, 1) // August 1
          : new Date(currentYear, 0, 1), // January 1
        end_date: defaultSession === 'FALL'
          ? new Date(currentYear, 11, 31) // December 31
          : new Date(currentYear, 4, 31), // May 31
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [session, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Session name is required';
    }

    if (!formData.academic_year.trim()) {
      newErrors.academic_year = 'Academic year is required';
    } else if (!/^\d{4}$/.test(formData.academic_year)) {
      newErrors.academic_year = 'Academic year must be a 4-digit year';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (session) {
        const updateData: UpdateSessionRequest = {
          name: formData.name,
          start_date: format(formData.start_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
          end_date: format(formData.end_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        };
        await sessionService.update(session.id, updateData);
      } else {
        const createData: CreateSessionRequest = {
          name: formData.name,
          academic_year: formData.academic_year,
          start_date: format(formData.start_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
          end_date: format(formData.end_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        };
        await sessionService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save session');
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

  const getSessionParity = (name: string) => {
    return name === 'FALL' ? 'ODD' : 'EVEN';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {session ? 'Edit Session' : 'Add New Academic Session'}
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
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.name}>
                <InputLabel>Session Type</InputLabel>
                <Select
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  label="Session Type"
                  required
                >
                  <MenuItem value="SPRING">Spring (Even Semester)</MenuItem>
                  <MenuItem value="FALL">Fall (Odd Semester)</MenuItem>
                </Select>
                {errors.name && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.name}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academic_year}
                onChange={(e) => handleChange('academic_year', e.target.value)}
                error={!!errors.academic_year}
                helperText={errors.academic_year || 'e.g., 2024'}
                required
                disabled={!!session} // Don't allow changing year on edit
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  <strong>Semester Parity:</strong> {getSessionParity(formData.name)} semesters 
                  {formData.name === 'FALL' ? ' (1st, 3rd, 5th, 7th)' : ' (2nd, 4th, 6th, 8th)'}
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(newValue) => newValue && handleChange('start_date', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.start_date,
                    helperText: errors.start_date,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(newValue) => newValue && handleChange('end_date', newValue)}
                minDate={formData.start_date}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.end_date,
                    helperText: errors.end_date,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning" icon={false}>
                <Typography variant="caption">
                  <strong>Note:</strong> Once created, sessions cannot be deleted if they have semester offerings. 
                  The academic year cannot be changed after creation.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (session ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SessionFormDialog;