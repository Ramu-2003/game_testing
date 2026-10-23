import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthPage from "../components/auth/AuthPage";
import LoadingScreen from "../components/auth/LoadingScreen";
import TermsAndConditions from "../components/auth/TermsAndConditions";
import { profileAPI } from "../utils/api";

const AuthFlow = () => {
  const [currentStep, setCurrentStep] = useState("auth"); // 'auth', 'terms', 'loading'
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Validate token by making an API call
        await profileAPI.getProfile();
        // User is authenticated, redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch {
        // Token is invalid, remove it and show auth page
        localStorage.removeItem('token');
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLoginSuccess = () => {
    setCurrentStep("terms");
  };

  const handleAcceptTerms = () => {
    setCurrentStep("loading");
  };

  const handleDeclineTerms = () => {
    localStorage.removeItem("token");
    setCurrentStep("auth");
  };

  const handleLoadingComplete = () => {
    navigate("/dashboard");
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#04020a',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(168, 85, 247, 0.2)',
          borderTopColor: '#a855f7',
          animation: 'spin 1s ease-in-out infinite'
        }} />
        <span style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#a855f7',
          letterSpacing: '0.2em',
          textTransform: 'uppercase'
        }}>
          Authenticating...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (currentStep === "loading") {
    return (
      <LoadingScreen onComplete={handleLoadingComplete} duration={30000} />
    );
  }

  if (currentStep === "terms") {
    return (
      <TermsAndConditions
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    );
  }

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
};

export default AuthFlow;
