import { CFooter } from '@coreui/react';

export const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div className="d-flex align-items-center gap-3 flex-wrap text-xs">
        <span>&copy; {new Date().getFullYear()} Protocol Sync LLC.</span>
        <span className="text-muted">|</span>
        <a 
          href={`${import.meta.env.VITE_WEBSITE_URL}/terms`}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-decoration-none"
        >
          Terms of Service
        </a>
        <span className="text-muted">|</span>
        <a 
          href={`${import.meta.env.VITE_WEBSITE_URL}/privacy`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-decoration-none"
        >
          Privacy Policy
        </a>
      </div>
    </CFooter>
  );
};
