import { useState, useEffect } from 'react';
import type { LayoutProps } from 'react-admin';
import { useMsal } from '@azure/msal-react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppContent } from './AppContent';
import { AppFooter } from './AppFooter';
import { FloatingHelpButton } from './FloatingHelpButton';
import { HelpChatWidget } from '../widgets/HelpChatWidget';
import { SidebarProvider } from '../contexts/SidebarContext';

export const CustomLayout = ({ children }: LayoutProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [siteId, setSiteId] = useState<number | null>(null);
  const { instance } = useMsal();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Get auth token and user profile on mount
  useEffect(() => {
    const fetchTokenAndProfile = async () => {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0]
          });
          setAuthToken(tokenResponse.accessToken);

          // Fetch user profile
          const apiKey = import.meta.env.VITE_API_KEY;
          const headers: HeadersInit = {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          };
          if (apiKey) {
            headers['X-API-Key'] = apiKey;
          }

          const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, { headers });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setUserId(profileData.data.user.user_id);
            setSiteId(profileData.data.site.site_id);
          } else {
            // User not found or error - log for debugging
            console.error('[CustomLayout] Failed to fetch user profile:', profileResponse.status);
          }
        } catch (error) {
          console.error('Failed to acquire token or fetch profile:', error);
        }
      }
    };
    fetchTokenAndProfile();
  }, [instance, API_BASE_URL]);

  // Listen for custom event to open help chat from anywhere
  useEffect(() => {
    const handleOpenHelpChat = () => setIsChatOpen(true);
    window.addEventListener('openHelpChat', handleOpenHelpChat);
    return () => window.removeEventListener('openHelpChat', handleOpenHelpChat);
  }, []);

  return (
    <SidebarProvider>
      <div>
        <AppSidebar />
        <div className="wrapper d-flex flex-column min-vh-100">
          <AppHeader />
          <div className="body flex-grow-1">
            <AppContent>
              {children}
            </AppContent>
          </div>
          <AppFooter />
        </div>

        {/* Global Floating Help Button */}
        <FloatingHelpButton onClick={() => setIsChatOpen(true)} />

        {/* Global Help Chat Widget */}
        {userId && (
          <HelpChatWidget
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            authToken={authToken}
            apiBaseUrl={API_BASE_URL}
            userId={userId}
            siteId={siteId || undefined}
          />
        )}
      </div>
    </SidebarProvider>
  );
};
