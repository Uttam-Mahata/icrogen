import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, BookOpen, FlaskConical, Building2 } from 'lucide-react';
import { type Subject, type Department, type Programme, type SubjectType } from '../../types/models';
import { subjectService } from '../../services/subjectService';
import { departmentService } from '../../services/departmentService';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SubjectFormDialog from './SubjectFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tooltip } from '../../components/ui/tooltip';

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<number | ''>('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    subject: Subject | null;
  }>({ open: false, subject: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subjectData, typeData, deptData, progData] = await Promise.all([
        subjectService.getAll(),
        subjectService.getSubjectTypes(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setSubjects(subjectData);
      setSubjectTypes(typeData);
      setDepartments(deptData);
      setProgrammes(progData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedSubject(null);
    setOpenForm(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.subject) return;
    
    try {
      await subjectService.delete(deleteDialog.subject.id);
      await fetchData();
      setDeleteDialog({ open: false, subject: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedSubject(null);
  };

  const handleFormSubmit = async () => {
    await fetchData();
    handleFormClose();
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || subject.department_id === selectedDepartment;
    const matchesType = selectedType === '' || subject.subject_type_id === selectedType;
    return matchesSearch && matchesDepartment && matchesType;
  });

  const getSubjectTypeName = (typeId: number) => {
    return subjectTypes.find(t => t.id === typeId)?.name || 'Unknown';
  };

  const isLab = (typeId: number) => {
    return subjectTypes.find(t => t.id === typeId)?.is_lab || false;
  };

  if (loading) return <LoadingSpinner message="Loading subjects..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">
            Manage course subjects across departments
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-[200px]">
              <Select
                value={selectedDepartment === '' ? '' : String(selectedDepartment)}
                onChange={(e) => setSelectedDepartment(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-[150px]">
              <Select
                value={selectedType === '' ? '' : String(selectedType)}
                onChange={(e) => setSelectedType(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">All Types</option>
                {subjectTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Credits</TableHead>
              <TableHead className="text-center">Weekly Load</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No subjects found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id} className="hover:bg-muted/50">
                  <TableCell>
                    <span className="font-bold text-primary">{subject.code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isLab(subject.subject_type_id) ? (
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{subject.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isLab(subject.subject_type_id) ? "default" : "outline"}>
                      {getSubjectTypeName(subject.subject_type_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {departments.find(d => d.id === subject.department_id)?.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{subject.credit}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{subject.class_load_per_week} hrs/week</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={subject.is_active ? "default" : "secondary"}>
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Tooltip content="Edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, subject })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubjectFormDialog
        open={openForm}
        subject={selectedSubject}
        departments={departments}
        programmes={programmes}
        subjectTypes={subjectTypes}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteDialog.subject?.name}" (${deleteDialog.subject?.code})? This may affect course offerings and schedules.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, subject: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </div>
  );
};

export default SubjectList;