import React, { useState, useEffect } from 'react';
import { type Department, type Programme } from '../../types/models';
import { departmentService, type CreateDepartmentRequest, type UpdateDepartmentRequest } from '../../services/departmentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Alert } from '../../components/ui/alert';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Add New Department'}
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
              Department Name <span className="text-destructive">*</span>
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

          {!department && (
            <div className="space-y-2">
              <Label htmlFor="programme">
                Programme <span className="text-destructive">*</span>
              </Label>
              <Select
                id="programme"
                value={String(formData.programme_id)}
                onChange={(e) => handleChange('programme_id', Number(e.target.value))}
                className={cn(errors.programme_id && "border-destructive")}
              >
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </Select>
              {errors.programme_id && (
                <p className="text-sm text-destructive">{errors.programme_id}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="strength">
              Student Strength <span className="text-destructive">*</span>
            </Label>
            <Input
              id="strength"
              type="number"
              value={formData.strength}
              onChange={(e) => handleChange('strength', parseInt(e.target.value))}
              min={1}
              max={500}
              className={cn(errors.strength && "border-destructive")}
            />
            {errors.strength ? (
              <p className="text-sm text-destructive">{errors.strength}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Number of students in the department
              </p>
            )}
          </div>

          {department && (
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
            {submitting ? 'Saving...' : (department ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentFormDialog;