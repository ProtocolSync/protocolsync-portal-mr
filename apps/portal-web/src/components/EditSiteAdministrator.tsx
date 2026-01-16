import { 
  Edit, 
  SimpleForm, 
  TextInput, 
  SelectInput, 
  required,
  useNotify,
  useRefresh,
  useRedirect,
  useGetList
} from 'react-admin';
import { useAuth } from '../contexts/AuthContext';

export const EditSiteAdministrator = () => {
  const { user } = useAuth();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  // Fetch available sites for this company
  const { data: sites, isLoading: sitesLoading } = useGetList(
    'sites',
    {
      pagination: { page: 1, perPage: 100 },
      filter: {},
      meta: { companyId: user?.company?.id }
    },
    { enabled: !!user?.company?.id }
  );

  const handleSuccess = () => {
    notify('Site administrator updated successfully', { type: 'success' });
    refresh();
    redirect('list', 'site-administrators');
  };

  if (sitesLoading) {
    return <div>Loading...</div>;
  }

  const siteChoices = (sites || []).map(site => ({
    id: site.site_id,
    name: `${site.site_name} (${site.site_number})`
  }));

  return (
    <Edit
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: handleSuccess,
        onError: (error: any) => {
          notify(`Error: ${error.message}`, { type: 'error' });
        }
      }}
    >
      <SimpleForm>
        <TextInput source="full_name" label="Full Name" validate={required()} fullWidth />
        <TextInput source="email" label="Email" validate={required()} fullWidth disabled />
        <TextInput source="job_title" label="Job Title" fullWidth />
        <TextInput source="department" label="Department" fullWidth />
        <TextInput source="professional_credentials" label="Professional Credentials" fullWidth />
        <TextInput source="phone" label="Phone" fullWidth />
        
        <SelectInput 
          source="status" 
          label="Status"
          choices={[
            { id: 'active', name: 'Active' },
            { id: 'revoked', name: 'Revoked' },
            { id: 'pending', name: 'Pending' }
          ]}
          validate={required()}
          fullWidth
        />
        
        <SelectInput
          source="site_id"
          label="Assigned Site"
          choices={siteChoices}
          validate={required()}
          fullWidth
        />
      </SimpleForm>
    </Edit>
  );
};
