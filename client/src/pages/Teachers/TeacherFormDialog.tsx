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
import { type Teacher, type Department } from '../../types/models';
import { teacherService, type CreateTeacherRequest, type UpdateTeacherRequest } from '../../services/teacherService';

interface TeacherFormDialogProps {
  open: boolean;
  teacher: Teacher | null;
  departments: Department[];
  onClose: () => void;
  onSubmit: () => void;
}

const TeacherFormDialog: React.FC<TeacherFormDialogProps> = ({
  open,
  teacher,
  departments,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    initials: '',
    email: '',
    department_id: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        initials: teacher.initials,
        email: teacher.email,
        department_id: teacher.department_id,
        is_active: teacher.is_active,
      });
    } else {
      setFormData({
        name: '',
        initials: '',
        email: '',
        department_id: departments.length > 0 ? departments[0].id : 0,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [teacher, departments, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Teacher name is required';
    }

    if (!formData.initials.trim()) {
      newErrors.initials = 'Initials are required';
    } else if (formData.initials.length > 10) {
      newErrors.initials = 'Initials must be 10 characters or less';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!teacher && formData.department_id === 0) {
      newErrors.department_id = 'Department is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (teacher) {
        const updateData: UpdateTeacherRequest = {
          name: formData.name,
          initials: formData.initials,
          email: formData.email,
          department_id: teacher.department_id,
          is_active: formData.is_active,
        };
        await teacherService.update(teacher.id, updateData);
      } else {
        const createData: CreateTeacherRequest = {
          name: formData.name,
          initials: formData.initials,
          email: formData.email,
          department_id: formData.department_id,
        };
        await teacherService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save teacher');
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
        {teacher ? 'Edit Teacher' : 'Add New Teacher'}
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
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Initials"
              value={formData.initials}
              onChange={(e) => handleChange('initials', e.target.value.toUpperCase())}
              error={!!errors.initials}
              helperText={errors.initials || 'e.g., SMK, NG'}
              inputProps={{ maxLength: 10 }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>

          {!teacher && (
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.department_id}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department_id}
                  onChange={(e) => handleChange('department_id', e.target.value)}
                  label="Department"
                  required
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.programme?.name || 'Programme'})
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
          )}

          {teacher && (
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
          {submitting ? 'Saving...' : (teacher ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherFormDialog;