import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, DoorOpen, GraduationCap, Pencil, X } from 'lucide-react';
import { type SemesterOffering, type CourseOffering, type Subject, type Teacher, type Room as RoomType } from '../../types/models';
import { semesterOfferingService, type CreateCourseOfferingRequest, type AssignTeacherRequest, type AssignRoomRequest } from '../../services/semesterOfferingService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { roomService } from '../../services/roomService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface CourseOfferingDialogProps {
  open: boolean;
  semesterOffering: SemesterOffering;
  onClose: () => void;
}

const CourseOfferingDialog: React.FC<CourseOfferingDialogProps> = ({
  open,
  semesterOffering,
  onClose,
}) => {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseOffering | null>(null);
  const [showAssignments, setShowAssignments] = useState(false);

  // Form data for adding course
  const [courseFormData, setCourseFormData] = useState({
    subject_id: 0,
    weekly_required_slots: 3,
    required_pattern: '',
    preferred_room_id: null as number | null,
    teacher_ids: [] as number[],
    notes: '',
  });

  // Form data for assignments
  const [teacherAssignment, setTeacherAssignment] = useState({
    teacher_id: 0,
    weight: 1.0,
  });

  const [roomAssignment, setRoomAssignment] = useState({
    room_id: 0,
    priority: 1,
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, semesterOffering.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, subjectsData, teachersData, roomsData] = await Promise.all([
        semesterOfferingService.getCourseOfferings(semesterOffering.id),
        subjectService.getByDepartment(semesterOffering.department_id),
        teacherService.getByDepartment(semesterOffering.department_id),
        roomService.getAll(),
      ]);
      setCourseOfferings(coursesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!courseFormData.subject_id) {
      setError('Please select a subject');
      return;
    }

    try {
      const data: CreateCourseOfferingRequest = {
        subject_id: courseFormData.subject_id,
        weekly_required_slots: courseFormData.weekly_required_slots,
        required_pattern: courseFormData.required_pattern || undefined,
        preferred_room_id: courseFormData.preferred_room_id,
        teacher_ids: courseFormData.teacher_ids,
        notes: courseFormData.notes || undefined,
      };
      await semesterOfferingService.addCourseOffering(semesterOffering.id, data);
      await fetchData();
      setShowAddCourse(false);
      setCourseFormData({
        subject_id: 0,
        weekly_required_slots: 3,
        required_pattern: '',
        preferred_room_id: null,
        teacher_ids: [],
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add course offering');
    }
  };

  const handleRemoveCourse = async (courseOfferingId: number) => {
    try {
      await semesterOfferingService.removeCourseOffering(semesterOffering.id, courseOfferingId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove course offering');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedCourse || !teacherAssignment.teacher_id) {
      setError('Please select a teacher');
      return;
    }

    try {
      const data: AssignTeacherRequest = {
        teacher_id: teacherAssignment.teacher_id,
        weight: teacherAssignment.weight,
      };
      await semesterOfferingService.assignTeacher(semesterOffering.id, selectedCourse.id, data);
      await fetchData();
      setTeacherAssignment({ teacher_id: 0, weight: 1.0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async (courseOfferingId: number, teacherId: number) => {
    try {
      await semesterOfferingService.removeTeacher(semesterOffering.id, courseOfferingId, teacherId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teacher');
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedCourse || !roomAssignment.room_id) {
      setError('Please select a room');
      return;
    }

    try {
      const data: AssignRoomRequest = {
        room_id: roomAssignment.room_id,
        priority: roomAssignment.priority,
      };
      await semesterOfferingService.assignRoom(semesterOffering.id, selectedCourse.id, data);
      await fetchData();
      setRoomAssignment({ room_id: 0, priority: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign room');
    }
  };

  const handleRemoveRoom = async (courseOfferingId: number, roomId: number) => {
    try {
      await semesterOfferingService.removeRoom(semesterOffering.id, courseOfferingId, roomId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove room');
    }
  };

  const getSemesterLabel = (number: number): string => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${number}${suffixes[number - 1] || 'th'} Semester`;
  };

  if (loading && open) return <LoadingSpinner />;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Manage Course Offerings</DialogTitle>
            <div className="flex gap-2">
              <Badge className="bg-blue-500">
                {semesterOffering.programme?.name}
              </Badge>
              <Badge variant="outline">
                {getSemesterLabel(semesterOffering.semester_number)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="ml-2">{error}</span>
            </Alert>
          )}

          {!showAddCourse && !showAssignments && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Course Offerings ({courseOfferings.length})
                </h3>
                <Button size="sm" onClick={() => setShowAddCourse(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Weekly Slots</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseOfferings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <GraduationCap className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No course offerings yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      courseOfferings.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <p className="font-medium text-sm">
                              {course.subject?.code} - {course.subject?.name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {course.subject?.subject_type?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">{course.weekly_required_slots}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {course.teacher_assignments && course.teacher_assignments.length > 0 ? (
                                course.teacher_assignments.map(ta => (
                                  <Badge key={ta.teacher_id} variant="secondary" className="gap-1">
                                    <User className="h-3 w-3" />
                                    {ta.teacher?.name}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                                      onClick={() => handleRemoveTeacher(course.id, ta.teacher_id)}
                                    />
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No teachers assigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {course.room_assignments && course.room_assignments.length > 0 ? (
                                course.room_assignments.map(ra => (
                                  <Badge key={ra.room_id} variant="secondary" className="gap-1">
                                    <DoorOpen className="h-3 w-3" />
                                    {ra.room?.name} ({ra.room?.type})
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                                      onClick={() => handleRemoveRoom(course.id, ra.room_id)}
                                    />
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No rooms assigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCourse(course);
                                        setShowAssignments(true);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Manage Assignments</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveCourse(course.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove Course</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {showAddCourse && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add Course Offering</h3>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={courseFormData.subject_id.toString()}
                  onValueChange={(value) => setCourseFormData(prev => ({ ...prev, subject_id: Number(value) }))}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Subject</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.code} - {subject.name} ({subject.subject_type?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slots">Weekly Required Slots</Label>
                  <Input
                    id="slots"
                    type="number"
                    min={1}
                    max={10}
                    value={courseFormData.weekly_required_slots}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, weekly_required_slots: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pattern">Required Pattern (e.g., 2+1)</Label>
                  <Input
                    id="pattern"
                    value={courseFormData.required_pattern}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, required_pattern: e.target.value }))}
                    placeholder="Optional: Specify slot pattern"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-room">Preferred Room</Label>
                <Select
                  value={courseFormData.preferred_room_id?.toString() || '0'}
                  onValueChange={(value) => setCourseFormData(prev => ({ ...prev, preferred_room_id: value === '0' ? null : Number(value) }))}
                >
                  <SelectTrigger id="preferred-room">
                    <SelectValue placeholder="No Preference (Auto-assign)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Preference (Auto-assign)</SelectItem>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name} ({room.type}, Capacity: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Teachers (Select multiple)</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {teachers.map(teacher => (
                    <label key={teacher.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={courseFormData.teacher_ids.includes(teacher.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCourseFormData(prev => ({ ...prev, teacher_ids: [...prev.teacher_ids, teacher.id] }));
                          } else {
                            setCourseFormData(prev => ({ ...prev, teacher_ids: prev.teacher_ids.filter(id => id !== teacher.id) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{teacher.name} ({teacher.initials})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={2}
                  value={courseFormData.notes}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddCourse(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCourse}>
                  Add Course
                </Button>
              </div>
            </div>
          )}

          {showAssignments && selectedCourse && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Manage Assignments: {selectedCourse.subject?.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Teacher Assignments</h4>
                  <div className="flex gap-2">
                    <Select
                      value={teacherAssignment.teacher_id.toString()}
                      onValueChange={(value) => setTeacherAssignment(prev => ({ ...prev, teacher_id: Number(value) }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Select Teacher</SelectItem>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={teacherAssignment.weight}
                      onChange={(e) => setTeacherAssignment(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-24"
                      placeholder="Weight"
                    />
                    <Button onClick={handleAssignTeacher}>
                      Assign
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedCourse.teacher_assignments?.map(ta => (
                      <div key={ta.teacher_id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{ta.teacher?.name}</p>
                          <p className="text-xs text-gray-500">Weight: {ta.weight}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeacher(selectedCourse.id, ta.teacher_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Room Assignments</h4>
                  <div className="flex gap-2">
                    <Select
                      value={roomAssignment.room_id.toString()}
                      onValueChange={(value) => setRoomAssignment(prev => ({ ...prev, room_id: Number(value) }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Select Room</SelectItem>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name} ({room.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={roomAssignment.priority}
                      onChange={(e) => setRoomAssignment(prev => ({ ...prev, priority: Number(e.target.value) }))}
                      className="w-24"
                      placeholder="Priority"
                    />
                    <Button onClick={handleAssignRoom}>
                      Assign
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedCourse.room_assignments?.map(ra => (
                      <div key={ra.room_id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{ra.room?.name} ({ra.room?.type})</p>
                          <p className="text-xs text-gray-500">Priority: {ra.priority}, Capacity: {ra.room?.capacity}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoom(selectedCourse.id, ra.room_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => {
                setShowAssignments(false);
                setSelectedCourse(null);
              }}>
                Back to Courses
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseOfferingDialog;
