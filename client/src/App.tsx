import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClubProvider } from './context/ClubContext';
import { RefreshProvider } from './context/RefreshContext';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage      = lazy(() => import('./pages/LandingPage'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const RegisterClub     = lazy(() => import('./pages/RegisterClub'));
const VerifyEmail      = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword'));
const SubscribePage    = lazy(() => import('./pages/SubscribePage'));
const SubscribeSuccess = lazy(() => import('./pages/SubscribeSuccess'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Messages         = lazy(() => import('./pages/Messages'));

const UserManagement   = lazy(() => import('./pages/admin/UserManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const CoachList        = lazy(() => import('./pages/admin/CoachList'));
const LicenseManagement = lazy(() => import('./pages/admin/LicenseManagement'));
const StageManagement  = lazy(() => import('./pages/admin/StageManagement'));
const ClubSettingsPage = lazy(() => import('./pages/admin/ClubSettingsPage'));

const CoachDashboard   = lazy(() => import('./pages/coach/CoachDashboard'));
const CoachProfile     = lazy(() => import('./pages/coach/CoachProfile'));
const SportifList      = lazy(() => import('./pages/coach/SportifList'));
const SportifDetails   = lazy(() => import('./pages/coach/SportifDetails'));
const EventsPage       = lazy(() => import('./pages/coach/EventsPage'));
const AttendancePage   = lazy(() => import('./pages/coach/AttendancePage'));
const CoachTeam        = lazy(() => import('./pages/coach/CoachTeam'));
const MessagesPage     = lazy(() => import('./pages/coach/MessagesPage'));

const SportifDashboard = lazy(() => import('./pages/sportif/SportifDashboard'));
const SportifEvents    = lazy(() => import('./pages/sportif/SportifEvents'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ClubProvider>
            <RefreshProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-club" element={<RegisterClub />} />
              <Route path="/subscribe" element={<SubscribePage />} />
              <Route path="/subscribe/success" element={<SubscribeSuccess />} />

              {/* Routes accessibles à tous les rôles authentifiés */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/messages" element={<Messages />} />
              </Route>

              {/* Routes Admin uniquement */}
              <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/categories" element={<CategoryManagement />} />
                <Route path="/admin/coaches" element={<CoachList />} />
                <Route path="/admin/licences" element={<LicenseManagement />} />
                <Route path="/admin/stages" element={<StageManagement />} />
                <Route path="/admin/club" element={<ClubSettingsPage />} />
              </Route>

              {/* Routes Coach + Admin */}
              <Route element={<ProtectedRoute roles={['ADMIN', 'COACH']} />}>
                <Route path="/coach" element={<CoachDashboard />} />
                <Route path="/coach/profile" element={<CoachProfile />} />
                <Route path="/coach/sportifs" element={<SportifList />} />
                <Route path="/coach/sportifs/:id" element={<SportifDetails />} />
                <Route path="/coach/trainings" element={<Navigate to="/coach/events" replace />} />
                <Route path="/coach/events" element={<EventsPage />} />
                <Route path="/coach/trainings/:id/attendance" element={<AttendancePage />} />
                <Route path="/coach/team" element={<CoachTeam />} />
                <Route path="/coach/messages" element={<MessagesPage />} />
              </Route>

              {/* Routes Sportif uniquement */}
              <Route element={<ProtectedRoute roles={['SPORTIF']} />}>
                <Route path="/sportif" element={<SportifDashboard />} />
                <Route path="/sportif/events" element={<SportifEvents />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
            </Suspense>
            </RefreshProvider>
          </ClubProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
