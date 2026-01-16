import { AppBar } from 'react-admin';
import { UserProfileDisplay } from './UserProfileDisplay';

export const CustomAppBar = () => (
  <AppBar 
    sx={{ 
      '& .RaAppBar-title': { 
        display: 'none' 
      },
      '& .RaAppBar-toolbar': {
        justifyContent: 'flex-end',
        paddingRight: '1.5rem'
      }
    }}
    userMenu={false}
    toolbar={<></>}
  >
    <div className="flex items-center gap-2 sm:gap-4 uppercase mr-auto ml-2">
      <img 
        src="/protocolsync-logo.png" 
        alt="GCP Tracker Logo" 
        className="h-logo"
      />
      <span className="text-s sm:text-l font-bold text-text-inverse">
        <span className="hidden sm:inline">GCP Tracker</span>
        <span className="sm:hidden">GCP Tracker</span>
      </span>
    </div>
    <UserProfileDisplay />
  </AppBar>
);
