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

interface UserDetailModalProps {
  user: any;
  onClose: () => void;
}

export const UserDetailModal = ({ user, onClose }: UserDetailModalProps) => {
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

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'error';
      case 'site_admin':
      case 'site administrator':
        return 'warning';
      case 'trial_lead':
      case 'trial lead':
        return 'primary';
      case 'site_user':
      case 'site user':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatRole = (role: string) => {
    if (!role) return 'N/A';

    // Map organizational roles to display names
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'site_admin': 'Site Administrator',
      'trial_lead': 'Trial Lead',
      'site_user': 'Site User'
    };

    return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  if (!user) return null;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {user.name || 'User Details'}
          </Typography>
          {user.status && (
            <Chip
              label={user.status}
              color={getStatusColor(user.status) as any}
              size="small"
            />
          )}
        </Box>
        {user.email && (
          <Typography variant="subtitle2" color="text.secondary">
            {user.email}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="h6" gutterBottom>User Information</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body2">{user.name || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2">{user.email || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Job Title</Typography>
              <Typography variant="body2">{user.job_title || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Role</Typography>
              <Typography variant="body2">
                <Chip
                  label={formatRole(user.role)}
                  color={getRoleColor(user.role) as any}
                  size="small"
                />
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="body2">
                <Chip
                  label={user.status || 'Unknown'}
                  color={getStatusColor(user.status) as any}
                  size="small"
                />
              </Typography>
            </Box>

            {user.assigned_sites && (
              <Box>
                <Typography variant="caption" color="text.secondary">Assigned Sites</Typography>
                <Typography variant="body2">
                  {user.assigned_sites || 'No sites assigned'}
                </Typography>
              </Box>
            )}

            {user.last_login_at && (
              <Box>
                <Typography variant="caption" color="text.secondary">Last Login</Typography>
                <Typography variant="body2">
                  {new Date(user.last_login_at).toLocaleString()}
                </Typography>
              </Box>
            )}

            {user.created_at && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {new Date(user.created_at).toLocaleString()}
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
                {user.record_hash || 'Not available'}
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
