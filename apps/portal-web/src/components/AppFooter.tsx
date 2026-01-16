export const AppFooter = () => {
  return (
    <footer className="mt-auto px-4 py-3 border-top bg-light">
      <div className="d-flex align-items-center gap-3 flex-wrap justify-content-center text-sm">
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
    </footer>
  );
};
