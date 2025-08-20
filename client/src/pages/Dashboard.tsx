import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  School,
  Business,
  Person,
  Book,
  MeetingRoom,
  Schedule,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';

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
      icon: <School />,
      color: '#2196f3',
    },
    {
      title: 'Departments',
      value: '12',
      icon: <Business />,
      color: '#4caf50',
    },
    {
      title: 'Total Teachers',
      value: '156',
      icon: <Person />,
      color: '#ff9800',
    },
    {
      title: 'Total Subjects',
      value: '342',
      icon: <Book />,
      color: '#9c27b0',
    },
    {
      title: 'Available Rooms',
      value: '48',
      icon: <MeetingRoom />,
      color: '#f44336',
    },
    {
      title: 'Generated Routines',
      value: '24',
      icon: <Schedule />,
      color: '#00bcd4',
    },
  ];

  const recentActivities = [
    { text: 'New routine generated for B.Tech CST Sem 5', time: '2 hours ago', status: 'success' },
    { text: 'Department "Electronics Engineering" updated', time: '5 hours ago', status: 'info' },
    { text: 'Teacher "Dr. Smith" added to Mathematics dept', time: '1 day ago', status: 'info' },
    { text: 'Routine committed for M.Sc Physics Sem 3', time: '2 days ago', status: 'success' },
    { text: 'New session "Fall 2025" created', time: '3 days ago', status: 'warning' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to ICRoGen - Manage your academic schedules efficiently
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                borderTop: `3px solid ${stat.color}`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      color: 'white',
                    }}
                  >
                    {React.cloneElement(stat.icon, { fontSize: 'small' })}
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Recent Activities
              </Typography>
            </Box>
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderLeft: `3px solid ${
                      activity.status === 'success'
                        ? '#4caf50'
                        : activity.status === 'warning'
                        ? '#ff9800'
                        : '#2196f3'
                    }`,
                    mb: 1,
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={activity.text}
                    secondary={activity.time}
                  />
                  <Chip
                    label={activity.status}
                    size="small"
                    color={
                      activity.status === 'success'
                        ? 'success'
                        : activity.status === 'warning'
                        ? 'warning'
                        : 'info'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Quick Actions
              </Typography>
            </Box>
            <List>
              <ListItem
                button
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary="Generate New Routine"
                  secondary="Create schedule for a semester"
                />
              </ListItem>
              <ListItem
                button
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary="Add Programme"
                  secondary="Create new academic programme"
                />
              </ListItem>
              <ListItem
                button
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary="Manage Teachers"
                  secondary="Add or update faculty members"
                />
              </ListItem>
              <ListItem
                button
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  primary="View Reports"
                  secondary="Check routine statistics"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;