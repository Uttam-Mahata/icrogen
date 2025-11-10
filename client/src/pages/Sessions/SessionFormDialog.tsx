import React, { useState, useEffect } from 'react';
import { type Session } from '../../types/models';
import { sessionService, type CreateSessionRequest, type UpdateSessionRequest } from '../../services/sessionService';
import { format } from 'date-fns';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

interface SessionFormDialogProps {
  open: boolean;
  session: Session | null;
  onClose: () => void;
  onSubmit: () => void;
}

const SessionFormDialog: React.FC<SessionFormDialogProps> = ({
  open,
  session,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: 'FALL' as 'SPRING' | 'FALL',
    academic_year: new Date().getFullYear().toString(),
    start_date: new Date(),
    end_date: new Date(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name,
        academic_year: session.academic_year,
        start_date: new Date(session.start_date),
        end_date: new Date(session.end_date),
      });
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      // Default to FALL if current month is June or later, else SPRING
      const defaultSession = currentMonth >= 5 ? 'FALL' : 'SPRING';

      setFormData({
        name: defaultSession as 'SPRING' | 'FALL',
        academic_year: currentYear.toString(),
        start_date: defaultSession === 'FALL'
          ? new Date(currentYear, 7, 1) // August 1
          : new Date(currentYear, 0, 1), // January 1
        end_date: defaultSession === 'FALL'
          ? new Date(currentYear, 11, 31) // December 31
          : new Date(currentYear, 4, 31), // May 31
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [session, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Session name is required';
    }

    if (!formData.academic_year.trim()) {
      newErrors.academic_year = 'Academic year is required';
    } else if (!/^\d{4}$/.test(formData.academic_year)) {
      newErrors.academic_year = 'Academic year must be a 4-digit year';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (session) {
        const updateData: UpdateSessionRequest = {
          name: formData.name,
          start_date: format(formData.start_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
          end_date: format(formData.end_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        };
        await sessionService.update(session.id, updateData);
      } else {
        const createData: CreateSessionRequest = {
          name: formData.name,
          academic_year: formData.academic_year,
          start_date: format(formData.start_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
          end_date: format(formData.end_date, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
        };
        await sessionService.create(createData);
      }
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save session');
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

  const getSessionParity = (name: string) => {
    return name === 'FALL' ? 'ODD' : 'EVEN';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {session ? 'Edit Session' : 'Add New Academic Session'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="ml-2">{submitError}</span>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => handleChange('name', value)}
              >
                <SelectTrigger id="session-type" className={errors.name ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPRING">Spring (Even Semester)</SelectItem>
                  <SelectItem value="FALL">Fall (Odd Semester)</SelectItem>
                </SelectContent>
              </Select>
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Input
                id="academic-year"
                value={formData.academic_year}
                onChange={(e) => handleChange('academic_year', e.target.value)}
                disabled={!!session}
                placeholder="e.g., 2024"
                className={errors.academic_year ? 'border-red-500' : ''}
              />
              {errors.academic_year && <p className="text-sm text-red-500">{errors.academic_year}</p>}
              {!errors.academic_year && <p className="text-sm text-gray-500">e.g., 2024</p>}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <div className="ml-2">
              <p className="text-sm font-medium">
                Semester Parity: {getSessionParity(formData.name)} semesters
                {formData.name === 'FALL' ? ' (1st, 3rd, 5th, 7th)' : ' (2nd, 4th, 6th, 8th)'}
              </p>
            </div>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={format(formData.start_date, 'yyyy-MM-dd')}
                onChange={(e) => handleChange('start_date', new Date(e.target.value))}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={format(formData.end_date, 'yyyy-MM-dd')}
                onChange={(e) => handleChange('end_date', new Date(e.target.value))}
                min={format(formData.start_date, 'yyyy-MM-dd')}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
            </div>
          </div>

          <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="ml-2">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Once created, sessions cannot be deleted if they have semester offerings.
                The academic year cannot be changed after creation.
              </p>
            </div>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : (session ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionFormDialog;
