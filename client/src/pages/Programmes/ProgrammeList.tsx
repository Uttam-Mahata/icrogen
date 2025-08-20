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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type Programme } from '../../types/models';
import { programmeService } from '../../services/programmeService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ProgrammeFormDialog from './ProgrammeFormDialog';

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Programmes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage academic programmes and their configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          size="large"
        >
          Add Programme
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search programmes..."
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
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Duration (Years)</TableCell>
              <TableCell align="center">Total Semesters</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProgrammes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box py={4}>
                    <School sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No programmes found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredProgrammes.map((programme) => (
                <TableRow key={programme.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {programme.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{programme.duration_years}</TableCell>
                  <TableCell align="center">{programme.total_semesters}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={programme.is_active ? 'Active' : 'Inactive'}
                      color={programme.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleView(programme)}
                        color="info"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(programme)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, programme })}
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
    </Box>
  );
};

export default ProgrammeList;