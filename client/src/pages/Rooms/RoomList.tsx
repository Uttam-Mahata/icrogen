import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, DoorOpen, Users, FlaskConical, BookOpen, Tag } from 'lucide-react';
import { type Room, type Department } from '../../types/models';
import { roomService } from '../../services/roomService';
import { departmentService } from '../../services/departmentService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorAlert from '../../components/Common/ErrorAlert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import RoomFormDialog from './RoomFormDialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tooltip } from '../../components/ui/tooltip';
import { Avatar } from '../../components/ui/avatar';

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
        return <FlaskConical className="h-4 w-4" />;
      case 'THEORY':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
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

  if (loading) return <LoadingSpinner message="Loading rooms..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage classroom and laboratory spaces
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-[150px]">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="THEORY">Theory</option>
                <option value="LAB">Laboratory</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select
                value={selectedDepartment === '' ? '' : String(selectedDepartment)}
                onChange={(e) => setSelectedDepartment(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">All Departments</option>
                <option value="0">Shared Rooms</option>
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
              <TableHead>Room</TableHead>
              <TableHead>Room Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead>Owner Department</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <DoorOpen className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No rooms found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className={room.type === 'LAB' ? 'bg-secondary' : ''}>
                        {getRoomTypeIcon(room.type)}
                      </Avatar>
                      <span className="font-medium">{room.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{room.room_number}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoomTypeIcon(room.type)}
                      <span className="text-sm">{getRoomTypeLabel(room.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{room.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {room.department_id ? (
                      <span className="text-sm">
                        {departments.find(d => d.id === room.department_id)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <Badge variant="secondary">Shared</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={room.is_active ? "default" : "secondary"}>
                      {room.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Tooltip content="Edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, room })}
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
        confirmText="Delete"
        confirmColor="error"
      />
    </div>
  );
};

export default RoomList;
