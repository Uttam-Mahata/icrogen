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
import { type Subject, type Department, type Programme, type SubjectType } from '../../types/models';
import { subjectService, type CreateSubjectRequest, type UpdateSubjectRequest } from '../../services/subjectService';

interface SubjectFormDialogProps {
  open: boolean;
  subject: Subject | null;
  departments: Department[];
  programmes: Programme[];
  subjectTypes: SubjectType[];
  onClose: () => void;
  onSubmit: () => void;
}

const SubjectFormDialog: React.FC<SubjectFormDialogProps> = ({
  open,
  subject,
  departments,
  programmes,
  subjectTypes,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credit: 3,
    class_load_per_week: 3,
    programme_id: 0,
    department_id: 0,
    subject_type_id: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        credit: subject.credit,
        class_load_per_week: subject.class_load_per_week,
        programme_id: subject.programme_id,
        department_id: subject.department_id,
        subject_type_id: subject.subject_type_id,
        is_active: subject.is_active,
      });
    } else {
      const firstProgramme = programmes.length > 0 ? programmes[0] : null;
      const firstDept = firstProgramme 
        ? departments.filter(d => d.programme_id === firstProgramme.id)[0]
        : departments[0];
      const firstType = subjectTypes.length > 0 ? subjectTypes[0] : null;
      
      setFormData({
        name: '',
        code: '',
        credit: 3,
        class_load_per_week: 3,
        programme_id: firstProgramme?.id || 0,
        department_id: firstDept?.id || 0,
        subject_type_id: firstType?.id || 0,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [subject, departments, programmes, subjectTypes, open]);

  useEffect(() => {
    if (formData.programme_id) {
      const filtered = departments.filter(d => d.programme_id === formData.programme_id);
      setFilteredDepartments(filtered);
      if (!subject && filtered.length > 0 && !filtered.find(d => d.id === formData.department_id)) {
        setFormData(prev => ({ ...prev, department_id: filtered[0].id }));
      }
    }
  }, [formData.programme_id, departments, subject]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required';
    } else if (formData.code.length > 20) {
      newErrors.code = 'Subject code must be 20 characters or less';
    }

    if (formData.credit < 1 || formData.credit > 10) {
      newErrors.credit = 'Credits must be between 1 and 10';
    }

    if (formData.class_load_per_week < 1 || formData.class_load_per_week > 20) {
      newErrors.class_load_per_week = 'Weekly load must be between 1 and 20 hours';
    }

    if (!subject) {
      if (formData.programme_id === 0) {
        newErrors.programme_id = 'Programme is required';
      }
      if (formData.department_id === 0) {
        newErrors.department_id = 'Department is required';
      }
      if (formData.subject_type_id === 0) {
        newErrors.subject_type_id = 'Subject type is required';
      }
    }

    // Check if it's a lab and validate accordingly
    const selectedType = subjectTypes.find(t => t.id === formData.subject_type_id);
    if (selectedType?.is_lab && formData.class_load_per_week !== 3) {
      newErrors.class_load_per_week = 'Lab subjects typically require 3 hours per week';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (subject) {
        const updateData: UpdateSubjectRequest = {
          name: formData.name,
          code: formData.code,
          credit: formData.credit,
          class_load_per_week: formData.class_load_per_week,
          is_active: formData.is_active,
        };
        await subjectService.update(subject.id, updateData);
      } else {
        const createData: CreateSubjectRequest = {
          name: formData.name,
          code: formData.code,
          credit: formData.credit,
          class_load_per_week: formData.class_load_per_week,
          programme_id: formData.programme_id,
          department_id: formData.department_id,
          subject_type_id: formData.subject_type_id,
        };
        await subjectService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save subject');
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {subject ? 'Edit Subject' : 'Add New Subject'}
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
          
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Subject Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Subject Code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              error={!!errors.code}
              helperText={errors.code}
              inputProps={{ maxLength: 20 }}
              required
            />
          </Grid>

          {!subject && (
            <>
              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.department_id}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department_id}
                    onChange={(e) => handleChange('department_id', e.target.value)}
                    label="Department"
                    required
                    disabled={!formData.programme_id}
                  >
                    {filteredDepartments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
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
                <FormControl fullWidth error={!!errors.subject_type_id}>
                  <InputLabel>Subject Type</InputLabel>
                  <Select
                    value={formData.subject_type_id}
                    onChange={(e) => handleChange('subject_type_id', e.target.value)}
                    label="Subject Type"
                    required
                  >
                    {subjectTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} {type.is_lab && '(Lab)'}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subject_type_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.subject_type_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Credits"
              value={formData.credit}
              onChange={(e) => handleChange('credit', parseInt(e.target.value))}
              error={!!errors.credit}
              helperText={errors.credit || 'Number of academic credits'}
              inputProps={{ min: 1, max: 10 }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Weekly Load (Hours)"
              value={formData.class_load_per_week}
              onChange={(e) => handleChange('class_load_per_week', parseInt(e.target.value))}
              error={!!errors.class_load_per_week}
              helperText={errors.class_load_per_week || 'Teaching hours per week'}
              inputProps={{ min: 1, max: 20 }}
              required
            />
          </Grid>

          {subject && (
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
          {submitting ? 'Saving...' : (subject ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectFormDialog;