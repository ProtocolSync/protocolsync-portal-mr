import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title } from 'react-admin';
import { Card, CardContent, CardHeader } from './Card';

interface Site {
  id: string;
  siteNumber: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  adminCount: number;
  protocolCount: number;
  lastActivity: string;
}

interface SiteAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

// Mock data
const mockSite: Site = {
  id: '1',
  siteNumber: 'SITE-001',
  siteName: 'Memorial Research Center',
  address: '123 Medical Plaza',
  city: 'Boston',
  state: 'MA',
  zipCode: '02101',
  country: 'USA',
  status: 'active',
  adminCount: 3,
  protocolCount: 5,
  lastActivity: '2024-11-30'
};

const mockAdmins: SiteAdmin[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sjohnson@memorial.org',
    role: 'Site Administrator',
    status: 'active',
    lastLogin: '2024-11-30'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@memorial.org',
    role: 'Site Administrator',
    status: 'active',
    lastLogin: '2024-11-29'
  }
];

export const SiteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site] = useState<Site>(mockSite);
  const [admins] = useState<SiteAdmin[]>(mockAdmins);
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'protocols'>('overview');

  // TODO: Use id to fetch actual site data from API
  console.log('Site ID:', id);

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <Title title={`${site.siteName} - Site Details`} />
      
      <div className="mb-6">
        <button
          onClick={() => navigate('/sites')}
          className="bg-transparent border-none text-emerald-500 text-sm cursor-pointer mb-4 flex items-center gap-2"
        >
          ← Back to Sites
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[32px] font-bold mb-2">
              {site.siteName}
            </h1>
            <p className="text-gray-600 text-base mb-2">
              {site.siteNumber}
            </p>
            <span
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize inline-block ${
                site.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                site.status === 'inactive' ? 'bg-red-100 text-red-800' :
                'bg-amber-100 text-amber-800'
              }`}
            >
              {site.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {['overview', 'admins', 'protocols'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`py-3 px-4 border-none bg-transparent text-base cursor-pointer capitalize ${
                activeTab === tab 
                  ? 'text-emerald-500 font-semibold border-b-2 border-emerald-500' 
                  : 'text-gray-500 font-normal border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold m-0">
                Site Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Address</p>
                  <p className="text-sm text-gray-700 m-0">{site.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">City</p>
                  <p className="text-sm text-gray-700 m-0">{site.city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">State</p>
                  <p className="text-sm text-gray-700 m-0">{site.state}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Zip Code</p>
                  <p className="text-sm text-gray-700 m-0">{site.zipCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Country</p>
                  <p className="text-sm text-gray-700 m-0">{site.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-5">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">Administrators</p>
                <p className="text-[32px] font-bold m-0">{site.adminCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">Active Protocols</p>
                <p className="text-[32px] font-bold m-0">{site.protocolCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">Last Activity</p>
                <p className="text-base font-bold m-0">
                  {new Date(site.lastActivity).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div>
          <div className="mb-5 flex justify-between items-center">
            <h2 className="text-xl font-semibold m-0">
              Site Administrators
            </h2>
            <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-md border-none text-sm font-semibold cursor-pointer">
              + Add Administrator
            </button>
          </div>

          <Card>
            <CardContent>
              <div className="grid gap-4">
                {admins.map(admin => (
                  <div
                    key={admin.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="text-base font-semibold my-0 mb-1">
                        {admin.name}
                      </p>
                      <p className="text-sm text-gray-500 my-0 mb-1">
                        {admin.email}
                      </p>
                      <p className="text-xs text-gray-400 m-0">
                        Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize ${
                          admin.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {admin.status}
                      </span>
                      <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Protocols Tab */}
      {activeTab === 'protocols' && (
        <Card>
          <CardContent>
            <div className="text-center py-10 px-5">
              <p className="text-lg text-gray-400 mb-4">
                Protocol management view
              </p>
              <p className="text-sm text-gray-500">
                This will show the same protocol versions and delegation logs that site administrators see.
              </p>
              <button
                onClick={() => navigate('/protocols')}
                className="mt-5 bg-emerald-500 text-white px-5 py-2.5 rounded-md border-none text-sm font-semibold cursor-pointer"
              >
                View Protocols
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
