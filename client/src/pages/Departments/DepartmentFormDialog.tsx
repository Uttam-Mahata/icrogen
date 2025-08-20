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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { type Department, type Programme } from '../../types/models';
import { departmentService, type CreateDepartmentRequest, type UpdateDepartmentRequest } from '../../services/departmentService';

interface DepartmentFormDialogProps {
  open: boolean;
  department: Department | null;
  programmes: Programme[];
  onClose: () => void;
  onSubmit: () => void;
}

const DepartmentFormDialog: React.FC<DepartmentFormDialogProps> = ({
  open,
  department,
  programmes,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    strength: 60,
    programme_id: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        strength: department.strength,
        programme_id: department.programme_id,
        is_active: department.is_active,
      });
    } else {
      setFormData({
        name: '',
        strength: 60,
        programme_id: programmes.length > 0 ? programmes[0].id : 0,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [department, programmes, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }

    if (formData.strength < 1 || formData.strength > 500) {
      newErrors.strength = 'Strength must be between 1 and 500';
    }

    if (!department && formData.programme_id === 0) {
      newErrors.programme_id = 'Programme is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (department) {
        const updateData: UpdateDepartmentRequest = {
          name: formData.name,
          strength: formData.strength,
          is_active: formData.is_active,
        };
        await departmentService.update(department.id, updateData);
      } else {
        const createData: CreateDepartmentRequest = {
          name: formData.name,
          strength: formData.strength,
          programme_id: formData.programme_id,
        };
        await departmentService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save department');
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
        {department ? 'Edit Department' : 'Add New Department'}
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
              label="Department Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          {!department && (
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.programme_id}>
                <InputLabel>Programme</InputLabel>
                <Select
                  value={formData.programme_id}
                  onChange={(e) => handleChange('programme_id', e.target.value)}
                  label="Programme"
                  required
                >
                  {programmes.map((prog) => (
                    <MenuItem key={prog.id} value={prog.id}>
                      {prog.name}
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
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Student Strength"
              value={formData.strength}
              onChange={(e) => handleChange('strength', parseInt(e.target.value))}
              error={!!errors.strength}
              helperText={errors.strength || 'Number of students in the department'}
              inputProps={{ min: 1, max: 500 }}
              required
            />
          </Grid>

          {department && (
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
          {submitting ? 'Saving...' : (department ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentFormDialog;