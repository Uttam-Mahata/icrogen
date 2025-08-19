import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { type Programme } from '../../types/models';
import { programmeService, type CreateProgrammeRequest, type UpdateProgrammeRequest } from '../../services/programmeService';

interface ProgrammeFormDialogProps {
  open: boolean;
  programme: Programme | null;
  onClose: () => void;
  onSubmit: () => void;
}

const ProgrammeFormDialog: React.FC<ProgrammeFormDialogProps> = ({
  open,
  programme,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    duration_years: 4,
    total_semesters: 8,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (programme) {
      setFormData({
        name: programme.name,
        duration_years: programme.duration_years,
        total_semesters: programme.total_semesters,
        is_active: programme.is_active,
      });
    } else {
      setFormData({
        name: '',
        duration_years: 4,
        total_semesters: 8,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [programme, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Programme name is required';
    }

    if (formData.duration_years < 1 || formData.duration_years > 10) {
      newErrors.duration_years = 'Duration must be between 1 and 10 years';
    }

    if (formData.total_semesters < 1 || formData.total_semesters > 20) {
      newErrors.total_semesters = 'Total semesters must be between 1 and 20';
    }

    if (formData.total_semesters !== formData.duration_years * 2) {
      newErrors.total_semesters = `Total semesters should typically be ${formData.duration_years * 2} for ${formData.duration_years} years`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (programme) {
        const updateData: UpdateProgrammeRequest = {
          name: formData.name,
          duration_years: formData.duration_years,
          total_semesters: formData.total_semesters,
          is_active: formData.is_active,
        };
        await programmeService.update(programme.id, updateData);
      } else {
        const createData: CreateProgrammeRequest = {
          name: formData.name,
          duration_years: formData.duration_years,
          total_semesters: formData.total_semesters,
        };
        await programmeService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save programme');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {programme ? 'Edit Programme' : 'Add New Programme'}
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
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Programme Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Duration (Years)"
              value={formData.duration_years}
              onChange={(e) => handleChange('duration_years', parseInt(e.target.value))}
              error={!!errors.duration_years}
              helperText={errors.duration_years}
              inputProps={{ min: 1, max: 10 }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Total Semesters"
              value={formData.total_semesters}
              onChange={(e) => handleChange('total_semesters', parseInt(e.target.value))}
              error={!!errors.total_semesters}
              helperText={errors.total_semesters}
              inputProps={{ min: 1, max: 20 }}
              required
            />
          </Grid>

          {programme && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
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
          disabled={submitting}
        >
          {submitting ? 'Saving...' : (programme ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProgrammeFormDialog;