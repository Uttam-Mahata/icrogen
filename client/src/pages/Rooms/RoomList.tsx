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
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  MeetingRoom,
  Group,
  Science,
  School,
  Category,
} from '@mui/icons-material';
import { type Room, type Department } from '../../types/models';
import { roomService } from '../../services/roomService';
import { departmentService } from '../../services/departmentService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import RoomFormDialog from './RoomFormDialog';

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    room: Room | null;
  }>({ open: false, room: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomData, deptData] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
      ]);
      setRooms(roomData);
      setDepartments(deptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedRoom(null);
    setOpenForm(true);
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.room) return;
    
    try {
      await roomService.delete(deleteDialog.room.id);
      await fetchData();
      setDeleteDialog({ open: false, room: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedRoom(null);
  };

  const handleFormSubmit = async () => {
    setOpenForm(false);
    setSelectedRoom(null);
    await fetchData();
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'LAB':
        return <Science fontSize="small" />;
      case 'THEORY':
        return <School fontSize="small" />;
      default:
        return <Category fontSize="small" />;
    }
  };

  const getRoomTypeColor = (type: string): "primary" | "secondary" | "default" => {
    switch (type) {
      case 'LAB':
        return 'secondary';
      case 'THEORY':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'THEORY':
        return 'Theory';
      case 'LAB':
        return 'Lab';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || room.type === selectedType;
    const matchesDepartment = !selectedDepartment || room.department_id === selectedDepartment;
    return matchesSearch && matchesType && matchesDepartment;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Room Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Room
            </Button>
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search rooms..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Room Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="THEORY">Theory</MenuItem>
                <MenuItem value="LAB">Laboratory</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as number | '')}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value={0}>
                  <em>Shared Rooms</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
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
              <TableCell>Room</TableCell>
              <TableCell>Room Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="center">Capacity</TableCell>
              <TableCell>Owner Department</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <MeetingRoom sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No rooms found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: getRoomTypeColor(room.type) === 'primary' ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                        {getRoomTypeIcon(room.type)}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {room.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={room.room_number} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoomTypeIcon(room.type)}
                      label={getRoomTypeLabel(room.type)}
                      size="small"
                      color={getRoomTypeColor(room.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <Group fontSize="small" color="action" />
                      <Typography variant="body2">{room.capacity}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {room.department_id ? (
                      <Typography variant="body2">
                        {departments.find(d => d.id === room.department_id)?.name || 'Unknown'}
                      </Typography>
                    ) : (
                      <Chip
                        label="Shared"
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={room.is_active ? 'Active' : 'Inactive'}
                      color={room.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(room)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, room })}
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

      <RoomFormDialog
        open={openForm}
        room={selectedRoom}
        departments={departments}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Room"
        message={`Are you sure you want to delete "${deleteDialog.room?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, room: null })}
      />
    </Box>
  );
};

export default RoomList;