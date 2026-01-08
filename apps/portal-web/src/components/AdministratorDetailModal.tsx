import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';

interface AdministratorDetailModalProps {
  administrator: any;
  onClose: () => void;
}

export const AdministratorDetailModal = ({ administrator, onClose }: AdministratorDetailModalProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!administrator) return null;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {administrator.name || 'Administrator Details'}
          </Typography>
          {administrator.status && (
            <Chip
              label={administrator.status}
              color={getStatusColor(administrator.status) as any}
              size="small"
            />
          )}
        </Box>
        {administrator.job_title && (
          <Typography variant="subtitle2" color="text.secondary">
            {administrator.job_title}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="h6" gutterBottom>Administrator Information</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body2">{administrator.name || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2">{administrator.email || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Job Title</Typography>
              <Typography variant="body2">{administrator.job_title || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Role</Typography>
              <Typography variant="body2">
                {administrator.role ? administrator.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Site Admin'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Site</Typography>
              <Typography variant="body2">
                {administrator.site_name ? `${administrator.site_name} (${administrator.site_number})` : 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="body2">
                <Chip
                  label={administrator.status || 'Unknown'}
                  color={getStatusColor(administrator.status) as any}
                  size="small"
                />
              </Typography>
            </Box>

            {administrator.created_at && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {new Date(administrator.created_at).toLocaleString()}
                </Typography>
              </Box>
            )}

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" color="text.secondary">
                Record Hash (21 CFR Part 11 Compliance)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  color: 'text.secondary',
                  mt: 0.5
                }}
              >
                {administrator.record_hash || 'Not available'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
