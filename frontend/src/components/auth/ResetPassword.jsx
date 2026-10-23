import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI } from "../../utils/api";
import "./AuthPage.css";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Check token validity on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsChecking(true);
        const response = await authAPI.validateResetToken(token);
        
        if (response.data.valid) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
        setIsChecking(false);
      } catch {
        // Token is invalid or expired
        setIsTokenValid(false);
        setIsChecking(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitMessage('');
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    const passwordBytes = new TextEncoder().encode(password).length;
    if (passwordBytes < 8 || passwordBytes > 72) {
      setSubmitError('Choose a password that is at least 8 characters and no more than 72 UTF-8 bytes.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await authAPI.resetPassword(token, { password });
      // Token is now invalidated on the backend, link cannot be reused
      setSubmitMessage('Password updated. Taking you to sign in…');
      window.setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
      const errorMessage = err.response?.data?.message || "Error resetting password";
      
      // Check if token is expired or invalid
      if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
        setIsTokenValid(false);
      } else {
        setSubmitError(errorMessage);
      }
    }
  };

  return (
    <>
      <div className="auth-body forgot-bg">
        <div
          className="container"
          id="container"
          style={{ width: "900px", minHeight: "520px" }}
        >
          {/* ── Left: form panel ── */}
          <div
            className="form-container"
            style={{ width: "50%", position: "relative", opacity: 1 }}
          >
            {isChecking ? (
              <div style={{ marginTop: "60px", textAlign: "center", padding: "40px" }}>
                <div className="spinner" style={{ margin: "0 auto 20px" }}></div>
                <p style={{ color: "#888", fontFamily: "'Nunito', sans-serif" }}>
                  Validating reset link...
                </p>
              </div>
            ) : !isTokenValid ? (
              <div style={{ marginTop: "60px", textAlign: "center", padding: "40px" }}>
                <div style={{ 
                  fontSize: "60px", 
                  marginBottom: "20px",
                  filter: "grayscale(1)"
                }}>
                  ⏰
                </div>
                <h1 
                  style={{ 
                    color: "#dc2626",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    fontSize: "24px",
                    letterSpacing: "3px",
                    marginBottom: "15px"
                  }}
                >
                  LINK EXPIRED
                </h1>
                <p
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "20px",
                    lineHeight: 1.6,
                  }}
                >
                  This password reset link has expired or is invalid.
                  <br />
                  Reset links are only valid for 15 minutes.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="btn-blue"
                  style={{ marginTop: "20px" }}
                >
                  BACK TO LOGIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: "60px" }}>
                {/* Thick green horizontal title */}
                <h1 
                  style={{ 
                    color: "#16a34a",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    fontSize: "28px",
                    letterSpacing: "4px",
                    marginTop: "30px",
                    marginBottom: "15px",
                    textAlign: "center",
                    whiteSpace: "nowrap"
                  }}
                >
                  CONFIRM PASSWORD
                </h1>

                <p
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 400,
                    fontSize: "13.5px",
                    color: "#888",
                    marginBottom: "8px",
                    lineHeight: 1.6,
                    textAlign: "center",
                  }}
                >
                  Enter and confirm your new password below.
                </p>
                {submitError && <div className="error-msg" role="alert">{submitError}</div>}
                {submitMessage && <div className="success-msg" role="status">{submitMessage}</div>}

                {/* New password */}
                <div className="input-group">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="New Password"
                    className="input-blue"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                  <button
                    type="button"
                    className="eye-icon"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    aria-pressed={showPass}
                    onClick={() => setShowPass((visible) => !visible)}
                  >
                    {showPass ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>

                {/* Confirm password */}
                <div className="input-group">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="input-blue"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-blue"
                  style={{ marginTop: "20px" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                </button>
              </form>
            )}
          </div>

          {/* ── Right: decorative image panel ── */}
          <div
            className="overlay-container"
            style={{ left: "50%", width: "50%" }}
          >
            <div
              className="image-content"
              style={{
                backgroundImage: "url('/assets/GRIM-REAPER.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
