import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ProgrammeList from './pages/Programmes/ProgrammeList';
import DepartmentList from './pages/Departments/DepartmentList';
import TeacherList from './pages/Teachers/TeacherList';
import SubjectList from './pages/Subjects/SubjectList';
import RoomList from './pages/Rooms/RoomList';
import SessionList from './pages/Sessions/SessionList';
import SemesterOfferingList from './pages/SemesterOfferings/SemesterOfferingList';
import RoutineGenerator from './pages/Routines/RoutineGenerator';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="programmes" element={<ProgrammeList />} />
            <Route path="departments" element={<DepartmentList />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="subjects" element={<SubjectList />} />
            <Route path="rooms" element={<RoomList />} />
            <Route path="sessions" element={<SessionList />} />
            <Route path="semester-offerings" element={<SemesterOfferingList />} />
            <Route path="routines" element={<RoutineGenerator />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;