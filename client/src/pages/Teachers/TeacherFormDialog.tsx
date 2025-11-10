import React, { useState, useEffect } from 'react';
import { type Teacher, type Department } from '../../types/models';
import { teacherService, type CreateTeacherRequest, type UpdateTeacherRequest } from '../../services/teacherService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Alert } from '../../components/ui/alert';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {teacher ? 'Edit Teacher' : 'Add New Teacher'}
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
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="initials">
              Initials <span className="text-destructive">*</span>
            </Label>
            <Input
              id="initials"
              value={formData.initials}
              onChange={(e) => handleChange('initials', e.target.value.toUpperCase())}
              maxLength={10}
              className={cn(errors.initials && "border-destructive")}
            />
            {errors.initials ? (
              <p className="text-sm text-destructive">{errors.initials}</p>
            ) : (
              <p className="text-sm text-muted-foreground">e.g., SMK, NG</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {!teacher && (
            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                id="department"
                value={String(formData.department_id)}
                onChange={(e) => handleChange('department_id', Number(e.target.value))}
                className={cn(errors.department_id && "border-destructive")}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.programme?.name || 'Programme'})
                  </option>
                ))}
              </Select>
              {errors.department_id && (
                <p className="text-sm text-destructive">{errors.department_id}</p>
              )}
            </div>
          )}

          {teacher && (
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : (teacher ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherFormDialog;