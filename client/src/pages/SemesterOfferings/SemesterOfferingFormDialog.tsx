import React, { useState, useEffect } from 'react';
import { type SemesterOffering, type Programme, type Department, type Session } from '../../types/models';
import { semesterOfferingService, type CreateSemesterOfferingRequest, type UpdateSemesterOfferingRequest } from '../../services/semesterOfferingService';
import { programmeService } from '../../services/programmeService';
import { departmentService } from '../../services/departmentService';
import { sessionService } from '../../services/sessionService';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';

interface SemesterOfferingFormDialogProps {
  open: boolean;
  offering: SemesterOffering | null;
  onClose: () => void;
  onSubmit: () => void;
}

const SemesterOfferingFormDialog: React.FC<SemesterOfferingFormDialogProps> = ({
  open,
  offering,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    programme_id: 0,
    department_id: 0,
    session_id: 0,
    semester_number: 1,
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
  });
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFormData();
      if (offering) {
        setFormData({
          programme_id: offering.programme_id,
          department_id: offering.department_id,
          session_id: offering.session_id,
          semester_number: offering.semester_number,
          status: offering.status,
        });
      } else {
        setFormData({
          programme_id: 0,
          department_id: 0,
          session_id: 0,
          semester_number: 1,
          status: 'DRAFT',
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [offering, open]);

  const fetchFormData = async () => {
    setLoadingData(true);
    try {
      const [programmesData, departmentsData, sessionsData] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
        sessionService.getAll(),
      ]);
      setProgrammes(programmesData);
      setDepartments(departmentsData);
      setSessions(sessionsData.sort((a, b) => b.academic_year.localeCompare(a.academic_year)));
    } catch (err) {
      setSubmitError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.programme_id) {
      newErrors.programme_id = 'Programme is required';
    }

    if (!formData.department_id) {
      newErrors.department_id = 'Department is required';
    }

    if (!formData.session_id) {
      newErrors.session_id = 'Session is required';
    }

    if (!formData.semester_number || formData.semester_number < 1 || formData.semester_number > 8) {
      newErrors.semester_number = 'Semester number must be between 1 and 8';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (offering) {
        const updateData: UpdateSemesterOfferingRequest = {
          status: formData.status,
        };
        await semesterOfferingService.update(offering.id, updateData);
      } else {
        const createData: CreateSemesterOfferingRequest = {
          programme_id: formData.programme_id,
          department_id: formData.department_id,
          session_id: formData.session_id,
          semester_number: formData.semester_number,
        };
        await semesterOfferingService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save semester offering');
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

  const getSessionParity = (sessionId: number): string => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.parity || '';
  };

  const getAvailableSemesters = (): number[] => {
    if (!formData.session_id) return [];
    const parity = getSessionParity(formData.session_id);
    if (parity === 'ODD') {
      return [1, 3, 5, 7];
    } else if (parity === 'EVEN') {
      return [2, 4, 6, 8];
    }
    return [];
  };

  const getSemesterLabel = (number: number): string => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${number}${suffixes[number - 1] || 'th'} Semester`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {offering ? 'Edit Semester Offering' : 'Add New Semester Offering'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="ml-2">{submitError}</span>
            </Alert>
          )}

          {!offering && (
            <>
              <div className="space-y-2">
                <Label htmlFor="programme">Programme</Label>
                <Select
                  value={formData.programme_id.toString()}
                  onValueChange={(value) => handleChange('programme_id', Number(value))}
                  disabled={loadingData}
                >
                  <SelectTrigger id="programme" className={errors.programme_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Programme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Programme</SelectItem>
                    {programmes.map(programme => (
                      <SelectItem key={programme.id} value={programme.id.toString()}>
                        {programme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programme_id && <p className="text-sm text-red-500">{errors.programme_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department_id.toString()}
                  onValueChange={(value) => handleChange('department_id', Number(value))}
                  disabled={loadingData}
                >
                  <SelectTrigger id="department" className={errors.department_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Department</SelectItem>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Select
                  value={formData.session_id.toString()}
                  onValueChange={(value) => {
                    const sessionId = Number(value);
                    handleChange('session_id', sessionId);
                    // Reset semester number when session changes
                    const availableSemesters = getAvailableSemesters();
                    if (availableSemesters.length > 0 && !availableSemesters.includes(formData.semester_number)) {
                      handleChange('semester_number', availableSemesters[0]);
                    }
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger id="session" className={errors.session_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Session</SelectItem>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{session.name} {session.academic_year}</span>
                          <Badge
                            variant="outline"
                            className={session.parity === 'ODD' ? 'border-orange-500 text-orange-600' : 'border-sky-500 text-sky-600'}
                          >
                            {session.parity}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.session_id && <p className="text-sm text-red-500">{errors.session_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester_number.toString()}
                  onValueChange={(value) => handleChange('semester_number', Number(value))}
                  disabled={!formData.session_id || loadingData}
                >
                  <SelectTrigger id="semester" className={errors.semester_number ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSemesters().map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {getSemesterLabel(num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.semester_number && <p className="text-sm text-red-500">{errors.semester_number}</p>}
                {formData.session_id && (
                  <p className="text-sm text-gray-500">
                    Only {getSessionParity(formData.session_id)} semesters are available for this session
                  </p>
                )}
              </div>
            </>
          )}

          {offering && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <div className="ml-2">
                  <p className="text-sm">
                    <strong>Programme:</strong> {offering.programme?.name}<br />
                    <strong>Department:</strong> {offering.department?.name}<br />
                    <strong>Session:</strong> {offering.session?.name} {offering.session?.academic_year}<br />
                    <strong>Semester:</strong> {getSemesterLabel(offering.semester_number)}
                  </p>
                </div>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingData}>
            {submitting ? 'Saving...' : (offering ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SemesterOfferingFormDialog;
