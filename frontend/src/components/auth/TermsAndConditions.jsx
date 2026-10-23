import { useState } from 'react';
import './TermsAndConditions.css';

const TermsAndConditions = ({ onAccept, onDecline }) => {
  const [isChecked1, setIsChecked1] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);

  // The Accept button is only enabled if BOTH checkboxes are checked
  const isAcceptEnabled = isChecked1 && isChecked2;

  const handleAccept = () => {
    if (isAcceptEnabled) {
      onAccept();
    }
  };

  return (
    <div className="tc-page-container">
      <div className="tc-card">
        <h1 className="tc-title">TERMS & CONDITIONS</h1>
        
        <div className="tc-content-wrapper">
          <div className="tc-left-side">
            <div className="tc-text-box">

              <p><strong>1. Acceptance of Terms</strong></p>
              <p>
                By creating an account and accessing Game Trail, you agree to be bound by these
                Terms and Conditions. If you do not agree, please do not use this platform.
              </p>
              <br />

              <p><strong>2. About Game Trail</strong></p>
              <p>
                Game Trail is an interactive coding game platform designed to help users learn
                HTML, CSS, JavaScript, Python, and Java through AI-validated challenges, level
                progressions, and real-time multiplayer competition. All content is intended for
                educational and entertainment purposes.
              </p>
              <br />

              <p><strong>3. User Accounts</strong></p>
              <p>
                You are responsible for maintaining the confidentiality of your account
                credentials. You must not share your account with others or use another
                person&apos;s account. Any activity under your account is your responsibility.
                You must provide accurate information during registration.
              </p>
              <br />

              <p><strong>4. Acceptable Use</strong></p>
              <p>
                You agree to use Game Trail only for its intended purpose. You must not:
              </p>
              <p>— Attempt to exploit, hack, or disrupt the platform or its services.</p>
              <p>— Submit malicious code or content designed to harm other users or the system.</p>
              <p>— Use automated bots or scripts to gain unfair advantages in challenges or rankings.</p>
              <p>— Harass, impersonate, or harm other users in any way.</p>
              <br />

              <p><strong>5. AI-Powered Features</strong></p>
              <p>
                Game Trail uses AI (Groq API) to validate your code and generate challenges.
                AI responses are evaluated automatically and may not always be perfect.
                Results are intended for learning and may occasionally require manual review.
                We are not liable for any inaccuracies in AI-generated feedback.
              </p>
              <br />

              <p><strong>6. G-Thunder Points & Rewards</strong></p>
              <p>
                G-Thunder Points are virtual in-platform rewards with no real-world monetary
                value. They cannot be transferred, sold, or exchanged for real currency.
                We reserve the right to modify, suspend, or discontinue the rewards system
                at any time without prior notice.
              </p>
              <br />

              <p><strong>7. Multiplayer & Computer Mode</strong></p>
              <p>
                Computer Mode enables real-time multiplayer coding battles. You agree to
                compete fairly and honestly. Any attempt to manipulate room sessions,
                exploit game mechanics, or disrupt other players&apos; experience may result in
                account suspension.
              </p>
              <br />

              <p><strong>8. Intellectual Property</strong></p>
              <p>
                All platform content including challenges, UI, assets, and code is the
                intellectual property of Game Trail. You may not copy, redistribute, or
                reproduce any part of the platform without explicit written permission.
              </p>
              <br />

              <p><strong>9. Privacy</strong></p>
              <p>
                We collect minimal personal data (email, username, profile image) solely to
                operate the platform. We do not sell or share your data with third parties.
                Your progress and game data are stored securely in our database.
              </p>
              <br />

              <p><strong>10. Account Termination</strong></p>
              <p>
                We reserve the right to suspend or permanently ban accounts that violate
                these terms. Users found cheating, abusing the platform, or causing harm
                to others will be removed without refund of any earned points or progress.
              </p>
              <br />

              <p><strong>11. Changes to Terms</strong></p>
              <p>
                We may update these Terms and Conditions from time to time. Continued use
                of the platform after changes are posted constitutes your acceptance of the
                updated terms. We recommend reviewing this page periodically.
              </p>
              <br />

              <p><strong>12. Contact</strong></p>
              <p>
                For any questions, issues, or reports regarding these terms, reach out to us
                at: <strong>techinmystyle@gmail.com</strong>
              </p>

            </div>

            <div className="tc-checkbox-group">
              <label className="tc-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isChecked1} 
                  onChange={(e) => setIsChecked1(e.target.checked)} 
                />
                <span>I have read and agree to the Terms &amp; Conditions</span>
              </label>

              <label className="tc-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isChecked2} 
                  onChange={(e) => setIsChecked2(e.target.checked)} 
                />
                <span>I understand that Game Trail uses AI for code validation and challenges</span>
              </label>
            </div>

            <div className="tc-button-group">
              <button className="tc-btn-decline" onClick={onDecline}>
                ✕ NOT ACCEPT
              </button>
              <button 
                className={`tc-btn-accept ${isAcceptEnabled ? '' : 'disabled'}`} 
                disabled={!isAcceptEnabled}
                onClick={handleAccept}
              >
                O ACCEPT
              </button>
            </div>
          </div>

          <div className="tc-right-side">
            <img 
              src="/assets/TERMS-CONDITIONS.png" 
              alt="Terms and Conditions Illustration" 
              className="tc-image" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
