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
import { type Room, type Department } from '../../types/models';
import { roomService, type CreateRoomRequest, type UpdateRoomRequest } from '../../services/roomService';

interface RoomFormDialogProps {
  open: boolean;
  room: Room | null;
  departments: Department[];
  onClose: () => void;
  onSubmit: () => void;
}

const RoomFormDialog: React.FC<RoomFormDialogProps> = ({
  open,
  room,
  departments,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    capacity: 30,
    type: 'THEORY' as 'THEORY' | 'LAB' | 'OTHER',
    department_id: null as number | null,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        room_number: room.room_number,
        capacity: room.capacity,
        type: room.type,
        department_id: room.department_id || null,
        is_active: room.is_active,
      });
    } else {
      setFormData({
        name: '',
        room_number: '',
        capacity: 30,
        type: 'THEORY',
        department_id: null,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [room, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (!formData.room_number.trim()) {
      newErrors.room_number = 'Room number is required';
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    if (!formData.type) {
      newErrors.type = 'Room type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (room) {
        const updateData: UpdateRoomRequest = {
          name: formData.name,
          room_number: formData.room_number,
          capacity: formData.capacity,
          type: formData.type,
          department_id: formData.department_id,
          is_active: formData.is_active,
        };
        await roomService.update(room.id, updateData);
      } else {
        const createData: CreateRoomRequest = {
          name: formData.name,
          room_number: formData.room_number,
          capacity: formData.capacity,
          type: formData.type,
          department_id: formData.department_id,
        };
        await roomService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save room');
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

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'THEORY':
        return 'Theory/Lecture Hall';
      case 'LAB':
        return 'Laboratory';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {room ? 'Edit Room' : 'Add New Room'}
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
              label="Room Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name || 'e.g., Computer Lab, Room 101'}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => handleChange('room_number', e.target.value)}
              error={!!errors.room_number}
              helperText={errors.room_number || 'e.g., 101, L201'}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Capacity"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
              error={!!errors.capacity}
              helperText={errors.capacity || 'Number of students'}
              inputProps={{ min: 1, max: 500 }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Room Type"
                required
              >
                <MenuItem value="THEORY">{getRoomTypeLabel('THEORY')}</MenuItem>
                <MenuItem value="LAB">{getRoomTypeLabel('LAB')}</MenuItem>
                <MenuItem value="OTHER">{getRoomTypeLabel('OTHER')}</MenuItem>
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.type}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Owner Department (Optional)</InputLabel>
              <Select
                value={formData.department_id || ''}
                onChange={(e) => handleChange('department_id', e.target.value || null)}
                label="Owner Department (Optional)"
              >
                <MenuItem value="">
                  <em>None (Shared Room)</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.programme?.name || 'Programme'})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Leave empty for shared rooms that can be used by any department
              </Typography>
            </FormControl>
          </Grid>

          {room && (
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
              <Typography variant="caption" color="text.secondary" display="block">
                Inactive rooms won't be available for scheduling
              </Typography>
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
          {submitting ? 'Saving...' : (room ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomFormDialog;