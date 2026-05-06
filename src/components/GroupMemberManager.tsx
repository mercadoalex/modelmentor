import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, X, Crown } from 'lucide-react';
import { groupMemberService, organizationService } from '@/services/organizationService';
import { ActivityLogTab } from '@/components/ActivityLogTab';
import { toast } from 'sonner';
import type { Profile, Group } from '@/types/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupMemberManagerProps {
  group: Group;
  organizationId: string;
  currentUserId: string;
  onMembersChanged?: () => void;
}

export function GroupMemberManager({ group, organizationId, currentUserId, onMembersChanged }: GroupMemberManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Array<Profile & { is_instructor: boolean }>>([]);
  const [availableStudents, setAvailableStudents] = useState<Profile[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Profile[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isAddTeachersOpen, setIsAddTeachersOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadAvailableUsers();
    }
  }, [isOpen, group.id]);

  useEffect(() => {
    loadMemberCount();
  }, [group.id]);

  const loadMemberCount = async () => {
    const count = await groupMemberService.getMemberCount(group.id);
    setMemberCount(count);
  };

  const loadMembers = async () => {
    const data = await groupMemberService.getGroupMembersWithDetails(group.id);
    setMembers(data);
  };

  const loadAvailableUsers = async () => {
    const [allStudents, allTeachers, currentMembers] = await Promise.all([
      organizationService.getMembersByRole(organizationId, 'student'),
      organizationService.getMembersByRole(organizationId, 'teacher'),
      groupMemberService.getGroupMembers(group.id)
    ]);

    const memberIds = new Set(currentMembers.map((m: any) => m.id));
    setAvailableStudents(allStudents.filter((s: any) => !memberIds.has(s.id)));
    setAvailableTeachers(allTeachers.filter((t: any) => !memberIds.has(t.id)));
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      const success = await groupMemberService.addMembers(
        group.id,
        selectedStudents
      );

      if (success) {
        toast.success(`${selectedStudents.length} student(s) added to group`);
        setSelectedStudents([]);
        setIsAddStudentsOpen(false);
        await loadMembers();
        await loadAvailableUsers();
        await loadMemberCount();
        onMembersChanged?.();
      } else {
        toast.error('Failed to add students');
      }
    } catch (error) {
      toast.error('Failed to add students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeachers = async () => {
    if (selectedTeachers.length === 0) {
      toast.error('Please select at least one teacher');
      return;
    }

    setLoading(true);
    try {
      const success = await groupMemberService.addMembers(
        group.id,
        selectedTeachers
      );

      if (success) {
        toast.success(`${selectedTeachers.length} instructor(s) added to group`);
        setSelectedTeachers([]);
        setIsAddTeachersOpen(false);
        await loadMembers();
        await loadAvailableUsers();
        await loadMemberCount();
        onMembersChanged?.();
      } else {
        toast.error('Failed to add instructors');
      }
    } catch (error) {
      toast.error('Failed to add instructors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this group?`)) {
      return;
    }

    const success = await groupMemberService.removeMember(group.id, userId);
    if (success) {
      toast.success('Member removed from group');
      await loadMembers();
      await loadAvailableUsers();
      await loadMemberCount();
      onMembersChanged?.();
    } else {
      toast.error('Failed to remove member');
    }
  };

  const handleToggleInstructor = async (userId: string, currentStatus: boolean) => {
    const success = await groupMemberService.setInstructor(group.id, userId, !currentStatus);
    if (success) {
      toast.success(currentStatus ? 'Instructor status removed' : 'Set as instructor');
      await loadMembers();
    } else {
      toast.error('Failed to update instructor status');
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const instructors = members.filter(m => m.is_instructor);
  const students = members.filter(m => !m.is_instructor);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Users className="h-4 w-4 mr-2" />
            Members
            {memberCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {memberCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{group.name} - Members</DialogTitle>
            <DialogDescription>
              Manage students and instructors for this group
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-6">
              {/* Instructors Section */}
              <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  Instructors ({instructors.length})
                </h3>
                <Popover open={isAddTeachersOpen} onOpenChange={setIsAddTeachersOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Instructor
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search teachers..." />
                      <CommandList>
                        <CommandEmpty>No teachers available</CommandEmpty>
                        <CommandGroup>
                          {availableTeachers.map((teacher) => (
                            <CommandItem
                              key={teacher.id}
                              onSelect={() => toggleTeacherSelection(teacher.id)}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={selectedTeachers.includes(teacher.id)}
                                onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {teacher.email}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {selectedTeachers.length > 0 && (
                      <div className="p-2 border-t">
                        <Button
                          onClick={handleAddTeachers}
                          disabled={loading}
                          className="w-full"
                          size="sm"
                        >
                          Add {selectedTeachers.length} Instructor(s)
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {instructors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No instructors assigned</p>
              ) : (
                <div className="space-y-2">
                  {instructors.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Instructor
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Students ({students.length})
                </h3>
                <Popover open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Students
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search students..." />
                      <CommandList>
                        <CommandEmpty>No students available</CommandEmpty>
                        <CommandGroup>
                          {availableStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              onSelect={() => toggleStudentSelection(student.id)}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudentSelection(student.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {selectedStudents.length > 0 && (
                      <div className="p-2 border-t">
                        <Button
                          onClick={handleAddStudents}
                          disabled={loading}
                          className="w-full"
                          size="sm"
                        >
                          Add {selectedStudents.length} Student(s)
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students in this group</p>
              ) : (
                <div className="space-y-2">
                  {students.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLogTab groupId={group.id} currentUserId={currentUserId} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
