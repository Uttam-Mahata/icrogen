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
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  CalendarMonth,
  School,
  DateRange,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { type Session } from '../../types/models';
import { sessionService } from '../../services/sessionService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SessionFormDialog from './SessionFormDialog';

const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    session: Session | null;
  }>({ open: false, session: null });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionService.getAll();
      // Sort sessions by year and then by name (SPRING before FALL)
      const sortedData = data.sort((a, b) => {
        const yearDiff = b.academic_year.localeCompare(a.academic_year);
        if (yearDiff !== 0) return yearDiff;
        return a.name === 'SPRING' ? -1 : 1;
      });
      setSessions(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedSession(null);
    setOpenForm(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.session) return;
    
    try {
      await sessionService.delete(deleteDialog.session.id);
      await fetchSessions();
      setDeleteDialog({ open: false, session: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedSession(null);
  };

  const handleFormSubmit = async () => {
    setOpenForm(false);
    setSelectedSession(null);
    await fetchSessions();
  };

  const getSessionIcon = (name: string) => {
    return name === 'FALL' ? '🍂' : '🌸';
  };

  const getSessionColor = (name: string): "primary" | "secondary" => {
    return name === 'FALL' ? 'primary' : 'secondary';
  };

  const getParityLabel = (parity: string) => {
    return parity === 'ODD' ? 'Odd Semesters (1, 3, 5, 7)' : 'Even Semesters (2, 4, 6, 8)';
  };

  const filteredSessions = sessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    return session.academic_year.includes(searchTerm) ||
           session.name.toLowerCase().includes(searchLower) ||
           getParityLabel(session.parity).toLowerCase().includes(searchLower);
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Academic Sessions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Session
            </Button>
          </Box>

          <TextField
            placeholder="Search sessions by year, type, or parity..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
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
              <TableCell>Session</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Semester Parity</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No sessions found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
                const startDate = new Date(session.start_date);
                const endDate = new Date(session.end_date);
                const isActive = new Date() >= startDate && new Date() <= endDate;
                
                return (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: getSessionColor(session.name) === 'primary' ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                          <Typography fontSize="large">{getSessionIcon(session.name)}</Typography>
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {session.name} {session.academic_year}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {session.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.academic_year}
                        size="small"
                        variant="outlined"
                        icon={<School fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.name}
                        size="small"
                        color={getSessionColor(session.name)}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          label={session.parity}
                          size="small"
                          color={session.parity === 'ODD' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {getParityLabel(session.parity)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DateRange fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2">
                            {format(startDate, 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            to {format(endDate, 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={isActive ? 'Active' : 'Inactive'}
                        color={isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(session)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, session })}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SessionFormDialog
        open={openForm}
        session={selectedSession}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Session"
        message={`Are you sure you want to delete the ${deleteDialog.session?.name} ${deleteDialog.session?.academic_year} session? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, session: null })}
      />
    </Box>
  );
};

export default SessionList;