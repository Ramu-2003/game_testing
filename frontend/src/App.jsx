import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Eagerly loaded — tiny files needed immediately
import AuthFlow from './pages/AuthFlow';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy-loaded — split into separate chunks, only downloaded when navigated to
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RulesPage = lazy(() => import('./components/landing/RulesPage'));
const TriModePage = lazy(() => import('./pages/TriModePage'));
const LevelsModePage = lazy(() => import('./pages/LevelsModePage'));
const PhasesModePage = lazy(() => import('./pages/PhasesModePage'));
const GenericPhaseLevelsPage = lazy(() => import('./pages/GenericPhaseLevelsPage'));
const GenericPlayLevelPage = lazy(() => import('./pages/GenericPlayLevelPage'));
const SpecialsModePage = lazy(() => import('./pages/SpecialsModePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const TournamentPage = lazy(() => import('./pages/TournamentPage'));
const BugHunterPage = lazy(() => import('./pages/BugHunterPage'));
const ComputerModePage = lazy(() => import('./pages/ComputerModePage'));
const ComputerModeRoomCreationPage = lazy(() => import('./pages/ComputerModeRoomCreationPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const JoinRoomPage = lazy(() => import('./pages/JoinRoomPage'));
const ComputerModeGamePage = lazy(() => import('./pages/ComputerModeGamePage'));
const ComputerModeResultsPage = lazy(() => import('./pages/ComputerModeResultsPage'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const CustomModePage = lazy(() => import('./pages/CustomModePage'));
const CustomModeRoomCreationPage = lazy(() => import('./pages/CustomModeRoomCreationPage'));
const CustomModeJoinPage = lazy(() => import('./pages/CustomModeJoinPage'));
const CustomModeLobbyPage = lazy(() => import('./pages/CustomModeLobbyPage'));
const CustomModeGamePage = lazy(() => import('./pages/CustomModeGamePage'));
const CustomModeResultsPage = lazy(() => import('./pages/CustomModeResultsPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));

// Lightweight loading spinner shown during lazy-load
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000005',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        width: 48,
        height: 48,
        border: '4px solid #a855f740',
        borderTopColor: '#a855f7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 12,
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#a855f7', fontFamily: 'Rajdhani, sans-serif', margin: 0 }}>Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/learn" element={<LearnPage />} />
          {/* Auth Flow */}
          <Route path="/" element={<AuthFlow />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Main Pages */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
          <Route path="/tri-mode" element={<ProtectedRoute><TriModePage /></ProtectedRoute>} />
          <Route path="/levels-mode" element={<ProtectedRoute><LevelsModePage /></ProtectedRoute>} />
          <Route path="/phases/:courseId" element={<ProtectedRoute><PhasesModePage /></ProtectedRoute>} />
          <Route path="/specials-mode" element={<ProtectedRoute><SpecialsModePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/tournament" element={<ProtectedRoute><TournamentPage /></ProtectedRoute>} />
          <Route path="/bug-hunter" element={<ProtectedRoute><BugHunterPage /></ProtectedRoute>} />
          <Route path="/computer-mode" element={<ProtectedRoute><ComputerModePage /></ProtectedRoute>} />
          <Route path="/computer-mode/create-room" element={<ProtectedRoute><ComputerModeRoomCreationPage /></ProtectedRoute>} />
          <Route path="/computer-mode/join-room" element={<ProtectedRoute><JoinRoomPage /></ProtectedRoute>} />
          <Route path="/computer-mode/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
          <Route path="/computer-mode/game" element={<ProtectedRoute><ComputerModeGamePage /></ProtectedRoute>} />
          <Route path="/computer-mode/results" element={<ProtectedRoute><ComputerModeResultsPage /></ProtectedRoute>} />

          {/* Custom Mode Routes */}
          <Route path="/custom-mode" element={<ProtectedRoute><CustomModePage /></ProtectedRoute>} />
          <Route path="/custom-mode/create-room" element={<ProtectedRoute><CustomModeRoomCreationPage /></ProtectedRoute>} />
          <Route path="/custom-mode/join-room" element={<ProtectedRoute><CustomModeJoinPage /></ProtectedRoute>} />
          <Route path="/custom-mode/lobby" element={<ProtectedRoute><CustomModeLobbyPage /></ProtectedRoute>} />
          <Route path="/custom-mode/game" element={<ProtectedRoute><CustomModeGamePage /></ProtectedRoute>} />
          <Route path="/custom-mode/results" element={<ProtectedRoute><CustomModeResultsPage /></ProtectedRoute>} />

          {/* Dynamic Course Routes */}
          <Route path="/levels/:courseId/:phaseId" element={<ProtectedRoute><GenericPhaseLevelsPage /></ProtectedRoute>} />
          <Route path="/levels/:courseId/:phaseId/:levelId" element={<ProtectedRoute><GenericPlayLevelPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
