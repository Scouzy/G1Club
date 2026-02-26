import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClubProvider } from './context/ClubContext';
import ClubSettingsPage from './pages/admin/ClubSettingsPage';
import RegisterClub from './pages/RegisterClub';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import LicenseManagement from './pages/admin/LicenseManagement';
import StageManagement from './pages/admin/StageManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CoachList from './pages/admin/CoachList';
import CoachDashboard from './pages/coach/CoachDashboard';
import SportifList from './pages/coach/SportifList';
import SportifDetails from './pages/coach/SportifDetails';
import CoachProfile from './pages/coach/CoachProfile';
import EventsPage from './pages/coach/EventsPage';
import AttendancePage from './pages/coach/AttendancePage';
import CoachTeam from './pages/coach/CoachTeam';
import MessagesPage from './pages/coach/MessagesPage';
import SportifDashboard from './pages/sportif/SportifDashboard';
import SportifEvents from './pages/sportif/SportifEvents';
import Messages from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import VerifyEmail from './pages/VerifyEmail';
import { RefreshProvider } from './context/RefreshContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ClubProvider>
            <RefreshProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-club" element={<RegisterClub />} />

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
            </RefreshProvider>
          </ClubProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
