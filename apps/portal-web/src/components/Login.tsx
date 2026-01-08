import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
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
import { useUser } from '../contexts/UserContext';

export const Login = () => {
  const { instance } = useMsal();
  const { error } = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      console.log('🔄 Starting Azure AD login...');
      
      const response = await instance.loginPopup(loginRequest);
      console.log('✅ Azure AD login successful:', response);
      
      // Set the active account
      if (response.account) {
        instance.setActiveAccount(response.account);
        console.log('✅ Active account set:', response.account.username);
      }

      // Don't reload - MSAL will handle the state update
      // The ProtectedRoute component will automatically re-render when authentication state changes
      console.log('✅ Login complete - authentication state updated');
      
      // Small delay to ensure MSAL state is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setIsLoggingIn(false);
      
      // Only show alert if it's not a user cancellation
      if (error && typeof error === 'object' && 'errorCode' in error) {
        const msalError = error as any;
        if (msalError.errorCode !== 'user_cancelled') {
          alert('Login failed. Please try again.');
        }
      }
    }
  };

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
                        style={{ height: '2.5rem' }}
                      />
                      <h2 className="text-uppercase fw-bold mb-0" style={{ color: '#005C4D' }}>
                        Protocol Sync
                      </h2>
                    </div>
                  </div>
                  <h1>Login</h1>
                  <p className="text-body-secondary mb-4">Sign in to your compliance portal</p>

                  {error && (
                    <CAlert color="danger" className="mb-4">
                      <strong>Access Denied:</strong>{' '}
                      {error.includes('support@protocolsync.org') ? (
                        <>
                          {error.split('support@protocolsync.org')[0]}
                          <a href="mailto:support@protocolsync.org" className="text-danger text-decoration-underline">
                            support@protocolsync.org
                          </a>
                          {error.split('support@protocolsync.org')[1]}
                        </>
                      ) : (
                        error
                      )}
                    </CAlert>
                  )}
                  
                  <CButton 
                    color="primary" 
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    style={{ backgroundColor: '#005C4D', borderColor: '#005C4D' }}
                  >
                    {isLoggingIn ? (
                      <>
                        <CSpinner size="sm" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                          <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                          <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                          <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
                        </svg>
                        Sign in with Microsoft
                      </>
                    )}
                  </CButton>
                  
                  <div className="mt-4 text-center">
                    <p className="text-body-secondary mb-1" style={{ fontSize: '0.875rem' }}>
                      For site users only
                    </p>
                    <p className="text-body-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                      Protected by Microsoft Entra ID
                    </p>
                  </div>
                </CCardBody>
              </CCard>
              <CCard className="text-white py-5" style={{ width: '44%', backgroundColor: '#005C4D' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      Access your clinical trial protocols, delegation logs, and compliance documentation in one secure location.
                    </p>
                    <p className="mt-4">
                      Streamlined protocol management for research sites and sponsors.
                    </p>
                    <a href={`${import.meta.env.VITE_WEBSITE_URL}/register`} target="_blank" rel="noopener noreferrer">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
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
