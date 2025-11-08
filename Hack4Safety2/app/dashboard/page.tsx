// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Search, Filter, Plus, Users, FileText, MapPin, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, Download, Eye, Shield,
  UserCheck, UserX, Database, X, User, Phone, Home,Mail
} from 'lucide-react';



interface DashboardStats {
  totalMissing: number;
  totalFound: number;
  monthlyMatches: number;
  pendingVerification: number;
  totalReports: number;
  aiEmbeddingsGenerated: number;
  matchAccuracy: number;
  avgResolutionTime: number;
}

interface MissingPerson {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  address?: string;
  contactNumber?: string;
  dateMissing: string;
  placeLastSeen?: string;
  clothingDescription?: string;
  physicalFeatures?: string;
  imageUrl: string;
  embedding: number[];
  status: "Missing" | "Found";
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: string;
}

interface DistrictCase {
  district: string;
  missingCases: number;
  foundCases: number;
  resolutionRate: number;
  avgEmbeddingConfidence: number;
}

interface MonthlyData {
  month: string;
  missingReported: number;
  foundResolved: number;
  aiMatches: number;
  embeddingQuality: number;
}

export default function PoliceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMissing: 0,
    totalFound: 0,
    monthlyMatches: 0,
    pendingVerification: 0,
    totalReports: 0,
    aiEmbeddingsGenerated: 0,
    matchAccuracy: 0,
    avgResolutionTime: 0
  });
  const [allPersons, setAllPersons] = useState<MissingPerson[]>([]);
  const [districtData, setDistrictData] = useState<DistrictCase[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [recentReports, setRecentReports] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [foundDate, setFoundDate] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [foundPolice, setFoundPolice] = useState('');

  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  

  const openModal = (person: MissingPerson) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  const openFoundModal = () => {
    setIsFoundModalOpen(true);
  };

  const closeFoundModal = () => {
    setIsFoundModalOpen(false);
    setFoundDate('');
    setFoundLocation('');
    setFoundPolice('');
    setContactType('email');
    setContactValue('');
  };

  const handleUpdateToFound = async () => {
    if (!selectedPerson || !foundDate || !foundLocation || !contactValue) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Add your API call here to update the person's status
      const response = await fetch(`/api/update-status/${selectedPerson._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Found',
          foundDate,
          foundLocation,
          foundPolice,
          contactType,
          contactValue,
        }),
      });

      if (response.ok) {
        alert('Status updated successfully!');
        closeFoundModal();
        closeModal();
        fetchDashboardData(); // Refresh the dashboard data
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('An error occurred while updating status');
    }
  };
  

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data from the new API route
      const response = await fetch('/api/fetch-all');
      const data = await response.json();

      if (data.error) {
        console.error('Error from API:', data.error);
        return;
      }

      setStats(data.stats);
      setAllPersons(data.allPersons);
      setDistrictData(data.districtData);
      setMonthlyTrends(data.monthlyTrends);
      setRecentReports(data.recentReports);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const statusDistributionData = [
    { name: 'Missing', value: stats.totalMissing, color: '#EF4444' },
    { name: 'Found', value: stats.totalFound, color: '#10B981' }
  ];

  const embeddingStatusData = [
    { name: 'Generated', value: stats.aiEmbeddingsGenerated, color: '#3B82F6' },
    { name: 'Pending', value: stats.totalReports - stats.aiEmbeddingsGenerated, color: '#6B7280' }
  ];

  const getReportStatusColor = (status: "Missing" | "Found") => {
    return status === "Found" 
      ? 'text-green-400 bg-green-400/10' 
      : 'text-red-400 bg-red-400/10';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter persons based on search query
  const filteredPersons = allPersons.filter(person => {
    const matchesSearch = searchQuery === '' || 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDistrict = selectedDistrict === 'all' || 
      person.address === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-300/60 rounded-full animate-pulse delay-200" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  Odisha Police Dashboard
                </span>
              </h1>
              <p className="text-slate-300">AI-Powered Missing Persons Identification System</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center space-x-2">
                <Plus size={20} />
                <a href="/report">New Report</a>
              </button>
              <button 
                onClick={fetchDashboardData}
                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-2xl hover:bg-slate-600/50 transition-all duration-300 flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Missing */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Currently Missing</p>
                <p className="text-3xl font-bold text-red-300">{stats.totalMissing}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <UserX className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="text-slate-400 text-sm mt-4">
              Active cases seeking matches
            </div>
          </div>

          {/* Total Found */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Successfully Found</p>
                <p className="text-3xl font-bold text-green-300">{stats.totalFound}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-slate-400 text-sm mt-4">
              {((stats.totalFound / (stats.totalMissing + stats.totalFound || 1)) * 100).toFixed(1)}% resolution rate
            </div>
          </div>

          {/* Match Accuracy */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">AI Match Accuracy</p>
                <p className="text-3xl font-bold text-blue-300">{stats.matchAccuracy}%</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="text-slate-400 text-sm mt-4">
              Avg {stats.avgResolutionTime} days to resolve
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends Chart */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Monthly Case Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '12px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="missingReported" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Missing Reported"
                />
                <Line 
                  type="monotone" 
                  dataKey="foundResolved" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Found Resolved"
                />
                <Line 
                  type="monotone" 
                  dataKey="aiMatches" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="AI Matches"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Case Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { name?: string; percent?: number }) => `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Cities</option>
              {districtData.map((district) => (
                <option key={district.district} value={district.district}>
                  {district.district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recent Activity & District Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* All Missing Person Reports */}
          <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">
                All Missing Person Reports ({filteredPersons.length})
              </h3>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredPersons.map((person) => (
                <div key={person._id} className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                  <div className="w-16 h-16 bg-slate-600 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={person.imageUrl} 
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="text-slate-200 font-semibold truncate">{person.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReportStatusColor(person.status)}`}>
                        {person.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {person.age && `${person.age} years • `}
                      {person.gender} 
                      {person.address && ` • ${person.address}`}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      Missing since {formatDate(person.dateMissing)}
                      {person.placeLastSeen && ` • Last seen: ${person.placeLastSeen}`}
                    </div>
                    {person.reportFiledBy?.policeStation && (
                      <div className="text-slate-500 text-xs mt-1">
                        Station: {person.reportFiledBy.policeStation}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${person.embedding?.length ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span 
                     onClick={() => openModal(person)} className="text-slate-400 text-sm cursor-pointer hover:text-cyan-400">
                      {person.embedding?.length ? 'Update Status' : 'Processing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District Performance */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-slate-200 mb-6">Performance By Locations</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {districtData.map((district, index) => (
                <div key={district.district} className="p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-slate-200 font-semibold">{district.district}</h4>
                    <span className="text-cyan-400 text-sm font-medium">
                      {district.avgEmbeddingConfidence}% AI
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-400">
                      <div>Missing: <span className="text-red-400">{district.missingCases}</span></div>
                    </div>
                    <div className="text-slate-400">
                      <div>Found: <span className="text-green-400">{district.foundCases}</span></div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${district.resolutionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-slate-400 text-xs mt-1 text-right">
                      {district.resolutionRate}% Resolution Rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-slate-200 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-cyan-500/30 group">
              <Plus className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
              <a href='/report' className="text-slate-200 font-medium">New Report</a>
              <div className="text-slate-400 text-sm">File missing person case</div>
            </button>
            <button className="p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-blue-500/30 group">
              <Database className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium">Run AI Match</div>
              <div className="text-slate-400 text-sm">Find matches in database</div>
            </button>
            <button className="p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-green-500/30 group">
              <TrendingUp className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium">Analytics</div>
              <div className="text-slate-400 text-sm">View detailed insights</div>
            </button>
            <button className="p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-purple-500/30 group">
              <MapPin className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium">City View</div>
              <div className="text-slate-400 text-sm">Regional analysis</div>
            </button>
          </div>
        </div>

        {/* Person Details Modal */}
        {isModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-600/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-200 mb-2">
                    {selectedPerson.name}
                  </h2>
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full">
                      {selectedPerson.status}
                    </span>
                    <span>Missing since {formatDate(selectedPerson.dateMissing)}</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image */}
                <div className="space-y-4">
                  <div className="relative h-80 bg-slate-700/50 rounded-2xl overflow-hidden">
                    <img
                      src={selectedPerson.imageUrl}
                      alt={selectedPerson.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPerson.age && (
                      <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <User className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                        <div className="text-slate-300 font-bold">{selectedPerson.age} years</div>
                        <div className="text-slate-400 text-sm">Age</div>
                      </div>
                    )}
                    
                    {selectedPerson.gender && (
                      <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <User className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-slate-300 font-bold">{selectedPerson.gender}</div>
                        <div className="text-slate-400 text-sm">Gender</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                      Personal Information
                    </h3>
                    
                    {selectedPerson.contactNumber && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-cyan-400" />
                        <div>
                          <div className="text-slate-300 font-medium">Contact Number</div>
                          <div className="text-slate-400">{selectedPerson.contactNumber}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedPerson.address && (
                      <div className="flex items-start space-x-3">
                        <Home className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <div className="text-slate-300 font-medium">Address</div>
                          <div className="text-slate-400">{selectedPerson.address}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Missing Details */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                      Missing Details
                    </h3>
                    
                    {selectedPerson.placeLastSeen && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <div className="text-slate-300 font-medium">Last Seen At</div>
                          <div className="text-slate-400">{selectedPerson.placeLastSeen}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedPerson.physicalFeatures && (
                      <div>
                        <div className="text-slate-300 font-medium mb-2">Physical Features</div>
                        <div className="text-slate-400 bg-slate-700/30 rounded-xl p-4">
                          {selectedPerson.physicalFeatures}
                        </div>
                      </div>
                    )}
                    
                    {selectedPerson.clothingDescription && (
                      <div>
                        <div className="text-slate-300 font-medium mb-2">Clothing Description</div>
                        <div className="text-slate-400 bg-slate-700/30 rounded-xl p-4">
                          {selectedPerson.clothingDescription}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Report Information */}
                  {selectedPerson.reportFiledBy && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                        Report Information
                      </h3>
                      
                      {selectedPerson.reportFiledBy.policeStation && (
                        <div>
                          <div className="text-slate-300 font-medium">Police Station</div>
                          <div className="text-slate-400">{selectedPerson.reportFiledBy.policeStation}</div>
                        </div>
                      )}
                      
                      {selectedPerson.reportFiledBy.name && (
                        <div>
                          <div className="text-slate-300 font-medium">Reported By</div>
                          <div className="text-slate-400">
                            {selectedPerson.reportFiledBy.name}
                            {selectedPerson.reportFiledBy.designation && ` • ${selectedPerson.reportFiledBy.designation}`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-600">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={openFoundModal}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300">
                  Update Status to Found
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Found Details Modal */}
      {isFoundModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-600/50 max-w-2xl w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">
                    Update Status to Found
                  </h2>
                  <p className="text-slate-400">
                    Updating status for {selectedPerson.name}
                  </p>
                </div>
                <button
                  onClick={closeFoundModal}
                  className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Found Date */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Found Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={foundDate}
                    onChange={(e) => setFoundDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Found Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="Enter the location where the person was found"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Contact Type Selection */}
                <div>
                  <label className="block text-slate-300 font-medium mb-3">
                    Contact Information <span className="text-red-400">*</span>
                  </label>
                  <div className="flex space-x-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setContactType('email');
                        setContactValue('');
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        contactType === 'email'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      <Mail/>
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactType('phone');
                        setContactValue('');
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        contactType === 'phone'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      <Phone/>
                      Phone Number
                    </button>
                  </div>

                  {/* Contact Input */}
                  {contactType === 'email' ? (
                    <input
                      type="email"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  ) : (
                    <input
                      type="tel"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  )}
                </div>
                 <div>
                  <label className="block text-slate-300 font-medium mb-2">
                    Police Station Name<span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={foundPolice}
                    onChange={(e) => setFoundPolice(e.target.value)}
                    placeholder="Enter the location where the person was found"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-600">
                <button
                  onClick={closeFoundModal}
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateToFound}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}