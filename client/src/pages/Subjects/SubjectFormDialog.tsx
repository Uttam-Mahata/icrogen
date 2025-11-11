import React, { useState, useEffect } from 'react';
import { type Subject, type Department, type Programme, type SubjectType } from '../../types/models';
import { subjectService, type CreateSubjectRequest, type UpdateSubjectRequest } from '../../services/subjectService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Alert } from '../../components/ui/alert';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Edit Subject' : 'Add New Subject'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submitError && (
            <Alert variant="destructive">
              {submitError}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">
                Subject Name <span className="text-destructive">*</span>
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
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                maxLength={20}
                className={cn(errors.code && "border-destructive")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>
          </div>

          {!subject && (
            <>
              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="department"
                    value={String(formData.department_id)}
                    onChange={(e) => handleChange('department_id', Number(e.target.value))}
                    disabled={!formData.programme_id}
                    className={cn(errors.department_id && "border-destructive")}
                  >
                    {filteredDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                  {errors.department_id && (
                    <p className="text-sm text-destructive">{errors.department_id}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Subject Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="type"
                  value={String(formData.subject_type_id)}
                  onChange={(e) => handleChange('subject_type_id', Number(e.target.value))}
                  className={cn(errors.subject_type_id && "border-destructive")}
                >
                  {subjectTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.is_lab && '(Lab)'}
                    </option>
                  ))}
                </Select>
                {errors.subject_type_id && (
                  <p className="text-sm text-destructive">{errors.subject_type_id}</p>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">
                Credits <span className="text-destructive">*</span>
              </Label>
              <Input
                id="credits"
                type="number"
                value={formData.credit}
                onChange={(e) => handleChange('credit', parseInt(e.target.value))}
                min={1}
                max={10}
                className={cn(errors.credit && "border-destructive")}
              />
              {errors.credit ? (
                <p className="text-sm text-destructive">{errors.credit}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Number of academic credits</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="load">
                Weekly Load (Hours) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="load"
                type="number"
                value={formData.class_load_per_week}
                onChange={(e) => handleChange('class_load_per_week', parseInt(e.target.value))}
                min={1}
                max={20}
                className={cn(errors.class_load_per_week && "border-destructive")}
              />
              {errors.class_load_per_week ? (
                <p className="text-sm text-destructive">{errors.class_load_per_week}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Teaching hours per week</p>
              )}
            </div>
          </div>

          {subject && (
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
            {submitting ? 'Saving...' : (subject ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectFormDialog;