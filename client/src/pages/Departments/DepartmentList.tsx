import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Business,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Department, Programme } from '../../types/models';
import { departmentService } from '../../services/departmentService';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import DepartmentFormDialog from './DepartmentFormDialog';

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Departments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage academic departments across programmes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          size="large"
        >
          Add Department
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Programme</InputLabel>
              <Select
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value as number | '')}
                label="Programme"
              >
                <MenuItem value="">All Programmes</MenuItem>
                {programmes.map((prog) => (
                  <MenuItem key={prog.id} value={prog.id}>
                    {prog.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department Name</TableCell>
              <TableCell>Programme</TableCell>
              <TableCell align="center">Strength</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box py={4}>
                    <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No departments found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {department.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={programmes.find(p => p.id === department.programme_id)?.name || 'Unknown'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2">{department.strength}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={department.is_active ? 'Active' : 'Inactive'}
                      color={department.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleView(department)}
                        color="info"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(department)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, department })}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};

export default DepartmentList;