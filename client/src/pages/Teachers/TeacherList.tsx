import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User, Mail, Building2 } from 'lucide-react';
import { type Teacher, type Department } from '../../types/models';
import { teacherService } from '../../services/teacherService';
import { departmentService } from '../../services/departmentService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import TeacherFormDialog from './TeacherFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tooltip } from '../../components/ui/tooltip';
import { Avatar } from '../../components/ui/avatar';

const TeacherList: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    teacher: Teacher | null;
  }>({ open: false, teacher: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teacherData, deptData] = await Promise.all([
        teacherService.getAll(),
        departmentService.getAll(),
      ]);
      setTeachers(teacherData);
      setDepartments(deptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setOpenForm(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.teacher) return;
    
    try {
      await teacherService.delete(deleteDialog.teacher.id);
      await fetchData();
      setDeleteDialog({ open: false, teacher: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete teacher');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedTeacher(null);
  };

  const handleFormSubmit = async () => {
    await fetchData();
    handleFormClose();
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.initials.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || teacher.department_id === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) return <LoadingSpinner message="Loading teachers..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage faculty members across departments
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or initials..."
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
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Initials</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No teachers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {getInitials(teacher.name)}
                      </Avatar>
                      <span className="font-medium">{teacher.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary text-primary">
                      {teacher.initials}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{teacher.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {departments.find(d => d.id === teacher.department_id)?.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={teacher.is_active ? "default" : "secondary"}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Tooltip content="Edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, teacher })}
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

      <TeacherFormDialog
        open={openForm}
        teacher={selectedTeacher}
        departments={departments}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteDialog.teacher?.name}"? This may affect course assignments and schedules.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, teacher: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </div>
  );
};

export default TeacherList;