import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, Search, Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Department, Programme } from '../../types/models';
import { departmentService } from '../../services/departmentService';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import DepartmentFormDialog from './DepartmentFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tooltip } from '../../components/ui/tooltip';
import { cn } from '@/lib/utils';

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<number | ''>('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    department: Department | null;
  }>({ open: false, department: null });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deptData, progData] = await Promise.all([
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setDepartments(deptData);
      setProgrammes(progData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setOpenForm(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setOpenForm(true);
  };

  const handleView = (department: Department) => {
    navigate(`/departments/${department.id}`);
  };

  const handleDelete = async () => {
    if (!deleteDialog.department) return;
    
    try {
      await departmentService.delete(deleteDialog.department.id);
      await fetchData();
      setDeleteDialog({ open: false, department: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedDepartment(null);
  };

  const handleFormSubmit = async () => {
    await fetchData();
    handleFormClose();
  };

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgramme = selectedProgramme === '' || department.programme_id === selectedProgramme;
    return matchesSearch && matchesProgramme;
  });

  if (loading) return <LoadingSpinner message="Loading departments..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic departments across programmes
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-[200px]">
              <Select
                value={selectedProgramme === '' ? '' : String(selectedProgramme)}
                onChange={(e) => setSelectedProgramme(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">All Programmes</option>
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
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
              <TableHead>Department Name</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead className="text-center">Strength</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No departments found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((department) => (
                <TableRow key={department.id} className="hover:bg-muted/50">
                  <TableCell>
                    <span className="font-medium">{department.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {programmes.find(p => p.id === department.programme_id)?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{department.strength}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={department.is_active ? "default" : "secondary"}>
                      {department.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Tooltip content="View Details">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(department)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, department })}
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

      <DepartmentFormDialog
        open={openForm}
        department={selectedDepartment}
        programmes={programmes}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteDialog.department?.name}"? This will also affect associated teachers and subjects.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, department: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </div>
  );
};

export default DepartmentList;