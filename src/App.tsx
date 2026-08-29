import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Views
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Patients } from './views/Patients';
import { PatientDetails } from './views/PatientDetails';
import { Treatments } from './views/Treatments';
import { TreatmentDetails } from './views/TreatmentDetails';
import { Medications } from './views/Medications';
import { Schedules } from './views/Schedules';
import { Doses } from './views/Doses';
import { Adherence } from './views/Adherence';
import { Progress } from './views/Progress';
import { FollowUps } from './views/FollowUps';
import { Reminders } from './views/Reminders';
import { Notes } from './views/Notes';
import { Reports } from './views/Reports';
import { Analytics } from './views/Analytics';
import { Notifications } from './views/Notifications';
import { ActivityLogView } from './views/ActivityLog';
import { Settings } from './views/Settings';
import { DataManagement } from './views/DataManagement';
import { NotFound } from './views/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />
              
              {/* Dashboard Layout and Protected Pages */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Patient Management */}
                <Route path="patients" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Patients />
                  </ProtectedRoute>
                } />
                <Route path="patients/:id" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <PatientDetails />
                  </ProtectedRoute>
                } />

                {/* Treatment Plans */}
                <Route path="treatments" element={<Treatments />} />
                <Route path="treatments/:id" element={<TreatmentDetails />} />

                {/* Medication cataloguing (Admin/Patient only) */}
                <Route path="medications" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PATIENT']}>
                    <Medications />
                  </ProtectedRoute>
                } />

                {/* Medication Scheduling */}
                <Route path="schedules" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PATIENT']}>
                    <Schedules />
                  </ProtectedRoute>
                } />

                {/* Daily Dose tracking */}
                <Route path="doses" element={<Doses />} />

                {/* Adherence Engine statistics */}
                <Route path="adherence" element={<Adherence />} />

                {/* Progress Indicators */}
                <Route path="progress" element={<Progress />} />

                {/* Follow-up checkins */}
                <Route path="follow-ups" element={<FollowUps />} />

                {/* Reminders list */}
                <Route path="reminders" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PATIENT']}>
                    <Reminders />
                  </ProtectedRoute>
                } />

                {/* Clinical Notes (Admin/Staff only) */}
                <Route path="notes" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Notes />
                  </ProtectedRoute>
                } />

                {/* Print-friendly Reports */}
                <Route path="reports" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* Clinical Analytics charts */}
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Analytics />
                  </ProtectedRoute>
                } />

                {/* Notifications Center */}
                <Route path="notifications" element={<Notifications />} />

                {/* System Audit logs (Admin only) */}
                <Route path="activity" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ActivityLogView />
                  </ProtectedRoute>
                } />

                {/* Local data import/export (Admin only) */}
                <Route path="data-management" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DataManagement />
                  </ProtectedRoute>
                } />

                {/* Local user settings */}
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
