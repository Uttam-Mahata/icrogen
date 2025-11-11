import React, { useState, useEffect } from 'react';
import { type Programme } from '../../types/models';
import { programmeService, type CreateProgrammeRequest, type UpdateProgrammeRequest } from '../../services/programmeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Alert } from '../../components/ui/alert';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {programme ? 'Edit Programme' : 'Add New Programme'}
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
              Programme Name <span className="text-destructive">*</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (Years) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_years}
                onChange={(e) => handleChange('duration_years', parseInt(e.target.value))}
                min={1}
                max={10}
                className={cn(errors.duration_years && "border-destructive")}
              />
              {errors.duration_years && (
                <p className="text-sm text-destructive">{errors.duration_years}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesters">
                Total Semesters <span className="text-destructive">*</span>
              </Label>
              <Input
                id="semesters"
                type="number"
                value={formData.total_semesters}
                onChange={(e) => handleChange('total_semesters', parseInt(e.target.value))}
                min={1}
                max={20}
                className={cn(errors.total_semesters && "border-destructive")}
              />
              {errors.total_semesters && (
                <p className="text-sm text-destructive">{errors.total_semesters}</p>
              )}
            </div>
          </div>

          {programme && (
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
            {submitting ? 'Saving...' : (programme ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgrammeFormDialog;