import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, Search, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Programme } from '../../types/models';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ProgrammeFormDialog from './ProgrammeFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tooltip } from '../../components/ui/tooltip';

const ProgrammeList: React.FC = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    programme: Programme | null;
  }>({ open: false, programme: null });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await programmeService.getAll();
      setProgrammes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch programmes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedProgramme(null);
    setOpenForm(true);
  };

  const handleEdit = (programme: Programme) => {
    setSelectedProgramme(programme);
    setOpenForm(true);
  };

  const handleView = (programme: Programme) => {
    navigate(`/programmes/${programme.id}`);
  };

  const handleDelete = async () => {
    if (!deleteDialog.programme) return;
    
    try {
      await programmeService.delete(deleteDialog.programme.id);
      await fetchProgrammes();
      setDeleteDialog({ open: false, programme: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete programme');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedProgramme(null);
  };

  const handleFormSubmit = async () => {
    await fetchProgrammes();
    handleFormClose();
  };

  const filteredProgrammes = programmes.filter(programme =>
    programme.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading programmes..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programmes</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic programmes and their configurations
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Programme
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programmes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Duration (Years)</TableHead>
              <TableHead className="text-center">Total Semesters</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProgrammes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No programmes found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProgrammes.map((programme) => (
                <TableRow key={programme.id} className="hover:bg-muted/50">
                  <TableCell>
                    <span className="font-medium">{programme.name}</span>
                  </TableCell>
                  <TableCell className="text-center">{programme.duration_years}</TableCell>
                  <TableCell className="text-center">{programme.total_semesters}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={programme.is_active ? "default" : "secondary"}>
                      {programme.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Tooltip content="View Details">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(programme)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(programme)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, programme })}
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

      <ProgrammeFormDialog
        open={openForm}
        programme={selectedProgramme}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Programme"
        message={`Are you sure you want to delete "${deleteDialog.programme?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, programme: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </div>
  );
};

export default ProgrammeList;