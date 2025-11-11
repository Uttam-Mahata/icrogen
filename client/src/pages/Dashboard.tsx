import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  DoorOpen,
  Calendar,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

const Dashboard: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: 'Active Programmes',
      value: '5',
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Departments',
      value: '12',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Teachers',
      value: '156',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-orange-500',
    },
    {
      title: 'Total Subjects',
      value: '342',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Available Rooms',
      value: '48',
      icon: <DoorOpen className="h-5 w-5" />,
      color: 'bg-red-500',
    },
    {
      title: 'Generated Routines',
      value: '24',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-cyan-500',
    },
  ];

  const recentActivities = [
    { text: 'New routine generated for B.Tech CST Sem 5', time: '2 hours ago', status: 'success' },
    { text: 'Department "Electronics Engineering" updated', time: '5 hours ago', status: 'info' },
    { text: 'Teacher "Dr. Smith" added to Mathematics dept', time: '1 day ago', status: 'info' },
    { text: 'Routine committed for M.Sc Physics Sem 3', time: '2 days ago', status: 'success' },
    { text: 'New session "Fall 2025" created', time: '3 days ago', status: 'warning' },
  ];

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500';
      case 'warning': return 'border-orange-500';
      default: return 'border-blue-500';
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Welcome to ICRoGen - Manage your academic schedules efficiently
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
              borderTop: `3px solid ${stat.color}`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-white ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-1">{stat.value}</h2>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentActivities.map((activity, index) => (
                  <li
                    key={index}
                    className={`border-l-4 ${getStatusBorderColor(activity.status)} pl-4 py-2 rounded bg-muted/50`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant={getStatusVariant(activity.status)} className="ml-2">
                        {activity.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="border border-border rounded p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium">Generate New Routine</p>
                  <p className="text-xs text-muted-foreground">Create schedule for a semester</p>
                </li>
                <li className="border border-border rounded p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium">Add Programme</p>
                  <p className="text-xs text-muted-foreground">Create new academic programme</p>
                </li>
                <li className="border border-border rounded p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium">Manage Teachers</p>
                  <p className="text-xs text-muted-foreground">Add or update faculty members</p>
                </li>
                <li className="border border-border rounded p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium">View Reports</p>
                  <p className="text-xs text-muted-foreground">Check routine statistics</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
