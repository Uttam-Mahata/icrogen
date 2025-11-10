import React, { useState, useEffect } from 'react';
import { type Room, type Department } from '../../types/models';
import { roomService, type CreateRoomRequest, type UpdateRoomRequest } from '../../services/roomService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Alert } from '../../components/ui/alert';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {room ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submitError && (
            <Alert variant="destructive">
              {submitError}
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Room Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">e.g., Computer Lab, Room 101</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_number">
                Room Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => handleChange('room_number', e.target.value)}
                className={cn(errors.room_number && "border-destructive")}
              />
              {errors.room_number ? (
                <p className="text-sm text-destructive">{errors.room_number}</p>
              ) : (
                <p className="text-sm text-muted-foreground">e.g., 101, L201</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                min={1}
                max={500}
                className={cn(errors.capacity && "border-destructive")}
              />
              {errors.capacity ? (
                <p className="text-sm text-destructive">{errors.capacity}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Number of students</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Room Type <span className="text-destructive">*</span>
            </Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className={cn(errors.type && "border-destructive")}
            >
              <option value="THEORY">{getRoomTypeLabel('THEORY')}</option>
              <option value="LAB">{getRoomTypeLabel('LAB')}</option>
              <option value="OTHER">{getRoomTypeLabel('OTHER')}</option>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Owner Department (Optional)</Label>
            <Select
              id="department"
              value={formData.department_id === null ? '' : String(formData.department_id)}
              onChange={(e) => handleChange('department_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">None (Shared Room)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.programme?.name || 'Programme'})
                </option>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              Leave empty for shared rooms that can be used by any department
            </p>
          </div>

          {room && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Inactive rooms won't be available for scheduling
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : (room ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormDialog;
