import { useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { login, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    try {
      await login();
    } catch (err: unknown) {
      // Error handling is done in AuthContext, but catch any unexpected errors
      const msalError = err as { errorCode?: string };
      if (msalError?.errorCode !== 'user_cancelled') {
        setLocalError('Login failed. Please try again.');
      }
    }
  };

  const displayError = error || localError;

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                      <img
                        src="/protocolsync-logo.png"
                        alt="Protocol Sync Logo"
                        className="login-logo"
                      />
                      <h2 className="text-uppercase fw-bold mb-0 login-brand-title">
                        GCP<br />Tracker
                      </h2>
                    </div>
                  </div>
                  <h1>Login</h1>
                  <p className="text-body-secondary mb-4">Sign in to your compliance portal</p>

                  {displayError && (
                    <CAlert color="danger" className="mb-4">
                      <strong>Access Denied:</strong>{' '}
                      {displayError.includes('support@protocolsync.org') ? (
                        <>
                          {displayError.split('support@protocolsync.org')[0]}
                          <a href="mailto:support@protocolsync.org" className="text-danger text-decoration-underline">
                            support@protocolsync.org
                          </a>
                          {displayError.split('support@protocolsync.org')[1]}
                        </>
                      ) : (
                        displayError
                      )}
                    </CAlert>
                  )}

                  <CButton
                    color="primary"
                    className="w-100 d-flex align-items-center justify-content-center gap-2 login-btn-microsoft"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <MicrosoftIcon />
                        Sign in with Microsoft
                      </>
                    )}
                  </CButton>

                  <div className="mt-4 text-center">
                    <p className="text-body-secondary mb-1 login-footer-text">
                      For site users only
                    </p>
                    <p className="text-body-secondary mb-0 login-footer-text">
                      Protected by Microsoft Entra ID
                    </p>
                  </div>
                </CCardBody>
              </CCard>
              <CCard className="text-white py-5 login-signup-card">
                <CCardBody className="text-center d-flex flex-column justify-content-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      The GCP Tracker is a field tool for clinical research organizations to manage clinical trial sites.
                    </p>
                    <p className="mt-4">
                      Interested in using the GCP Tracker for your organization? Register now to get started!
                    </p>
                    <a href={`${import.meta.env.VITE_WEBSITE_URL}/register`} target="_blank" rel="noopener noreferrer">
                      <CButton color="primary" className="mt-3 login-btn-register" tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </a>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
    <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
    <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
    <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
  </svg>
);
