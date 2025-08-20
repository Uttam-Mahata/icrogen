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
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Book,
  Science,
  School,
  Business,
} from '@mui/icons-material';
import { type Subject, type Department, type Programme, type SubjectType } from '../../types/models';
import { subjectService } from '../../services/subjectService';
import { departmentService } from '../../services/departmentService';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SubjectFormDialog from './SubjectFormDialog';

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Subjects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage course subjects across departments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          size="large"
        >
          Add Subject
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name or code..."
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
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as number | '')}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as number | '')}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {subjectTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
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
              <TableCell>Code</TableCell>
              <TableCell>Subject Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="center">Credits</TableCell>
              <TableCell align="center">Weekly Load</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box py={4}>
                    <Book sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No subjects found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      {subject.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isLab(subject.subject_type_id) ? (
                        <Science fontSize="small" color="action" />
                      ) : (
                        <Book fontSize="small" color="action" />
                      )}
                      <Typography variant="subtitle2">
                        {subject.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSubjectTypeName(subject.subject_type_id)}
                      size="small"
                      color={isLab(subject.subject_type_id) ? 'secondary' : 'default'}
                      variant={isLab(subject.subject_type_id) ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Business fontSize="small" color="action" />
                      <Typography variant="body2">
                        {departments.find(d => d.id === subject.department_id)?.name || 'Unknown'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {subject.credit}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {subject.class_load_per_week} hrs/week
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={subject.is_active ? 'Active' : 'Inactive'}
                      color={subject.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(subject)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, subject })}
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
    </Box>
  );
};

export default SubjectList;