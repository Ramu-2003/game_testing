import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import { authAPI } from "../../utils/api";
import "./AuthPage.css";

const AuthPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'signup');
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPass(false);
    clearInputs();
  };

  const handleForgotPassView = (e) => {
    e.preventDefault();
    setIsForgotPass(true);
    setIsSignUp(false);
  };

  const goBackToLogin = () => {
    setIsForgotPass(false);
    setIsSignUp(false);
  };

  const clearInputs = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  // API Handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (password !== confirmPassword) {
      return setErrorMsg("Passwords do not match!");
    }
    try {
      await authAPI.register({
        name,
        email,
        password,
      });
      setIsSignUp(false);
      clearInputs();
      setSuccessMsg("Registration successful! Please sign in.");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "We couldn’t create your account. Please check your details and try again.",
      );
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await authAPI.login({
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      onLoginSuccess();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "We couldn’t sign you in. Check your email and password, then try again.",
      );
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await authAPI.forgotPassword({ email });
      setSuccessMsg(response.data.message || "Reset link sent!");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to send reset email. Please try again later.",
      );
    }
  };

  const EyeIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  // Main Auth Forms
  return (
    <div
      className={`auth-body ${isSignUp ? "signup-bg" : isForgotPass ? "forgot-bg" : "signin-bg"}`}
    >
      <div
        className={`container ${isSignUp ? "right-panel-active" : ""} ${isForgotPass ? "forgot-active" : ""}`}
        id="container"
      >
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1 className="title-red">CREATE ACCOUNT</h1>
            {errorMsg && <div className="error-msg">{errorMsg}</div>}
            {successMsg && <div className="success-msg">{successMsg}</div>}
            <input
              type="text"
              placeholder="Name"
              aria-label="Name"
              autoComplete="name"
              className="input-red"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              className="input-red"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="input-group">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                aria-label="Password"
                autoComplete="new-password"
                className="input-red"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
              <button type="button" className="eye-icon" aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass} onClick={() => setShowPass(!showPass)}>
                {showPass ? EyeIcon : EyeOffIcon}
              </button>
            </div>
            <div className="input-group">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirm Password"
                aria-label="Confirm password"
                autoComplete="new-password"
                className="input-red"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
            </div>
            <button type="submit" className="btn-red">
              SIGN UP
            </button>
            <button type="button" className="auth-mobile-toggle" onClick={toggleForm}>
              Already have an account? Sign in
            </button>
            <Link className="auth-mobile-learn-link" to="/learn">Explore the courses</Link>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1 className="title-blue">SIGN IN</h1>
            {errorMsg && <div className="error-msg">{errorMsg}</div>}
            {successMsg && <div className="success-msg">{successMsg}</div>}
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              className="input-blue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="input-group">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                className="input-blue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="eye-icon" aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass} onClick={() => setShowPass(!showPass)}>
                {showPass ? EyeIcon : EyeOffIcon}
              </button>
            </div>
            <a href="#" className="forgot-link" onClick={handleForgotPassView}>
              Forgot Your Password?
            </a>
            <button type="submit" className="btn-blue">
              SIGN IN
            </button>
            <button type="button" className="auth-mobile-toggle" onClick={toggleForm}>
              New here? Create an account
            </button>
            <Link className="auth-mobile-learn-link" to="/learn">Explore the courses</Link>
          </form>
        </div>

        {/* Forgot Password Form */}
        <div className="form-container forgot-container">
          <form onSubmit={handleForgotSubmit}>
            <h1 className="title-green">Forgot Your Password?</h1>
            <p className="forgot-text">
              No worries. We&apos;ll help you recover your account quickly.
            </p>
            {errorMsg && <div className="error-msg">{errorMsg}</div>}
            {successMsg && <div className="success-msg">{successMsg}</div>}
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              className="input-green"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-green">
              ENTER
            </button>
            <button
              type="button"
              className="btn-back-login"
              onClick={goBackToLogin}
            >
              <span className="back-arrow">←</span> BACK TO LOGIN
            </button>
          </form>
        </div>

        {/* Overlay Panels */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <div className="image-content lightning-img">
                <div className="overlay-text">
                  <h3>Welcome Back!</h3>
                  <p>Already have an account? Sign in to continue.</p>
                  <button className="ghost-btn blue" onClick={toggleForm}>
                    SIGN IN
                  </button>
                  <Link className="auth-learn-link" to="/learn">Explore the courses</Link>
                </div>
              </div>
            </div>

            <div className="overlay-panel overlay-right">
              {isForgotPass ? (
                <div className="image-content forgot-img">
                  <div className="overlay-text">
                    <h3>Need Help Signing In?</h3>
                    <p>Reset your password and regain access in seconds.</p>
                  </div>
                </div>
              ) : (
                <div className="image-content robot-img">
                  <div className="overlay-text">
                    <h3>Hello, Friend!</h3>
                    <p>
                      Don&apos;t have an account? Sign up and unlock amazing
                      features.
                    </p>
                    <button className="ghost-btn red" onClick={toggleForm}>
                      SIGN UP
                    </button>
                    <Link className="auth-learn-link" to="/learn">See what you can build</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .error-msg {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 6px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-family: monospace;
          font-size: 13px;
          margin-bottom: 15px;
          width: 100%;
          text-align: center;
        }
        .success-msg {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 10px 14px;
          border-radius: 6px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-family: monospace;
          font-size: 13px;
          margin-bottom: 15px;
          width: 100%;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;

AuthPage.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
