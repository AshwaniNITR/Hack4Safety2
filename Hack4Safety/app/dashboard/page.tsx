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
  UserCheck, UserX, Database, X, User, Phone, Home, Mail, Skull
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface DashboardStats {
  // Missing Persons Stats
  totalMissing: number;
  totalFound: number;
  monthlyMatches: number;
  pendingVerification: number;
  totalReports: number;
  aiEmbeddingsGenerated: number;
  matchAccuracy: number;
  avgResolutionTime: number;
  
  // Dead Body Stats
  totalUnidentified: number;
  totalIdentified: number;
  monthlyIdentifications: number;
  pendingIdentification: number;
  totalDeadBodyReports: number;
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
  solvedAt?: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: string;
}

interface DeadBody {
  _id: string;
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
  status: "Unidentified" | "Identified";
  solvedAt?: string;
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
  unidentifiedCases: number;
  identifiedCases: number;
  resolutionRate: number;
  avgEmbeddingConfidence: number;
}

interface MonthlyData {
  month: string;
  missingReported: number;
  foundResolved: number;
  unidentifiedReported: number;
  identifiedResolved: number;
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
    avgResolutionTime: 0,
    totalUnidentified: 0,
    totalIdentified: 0,
    monthlyIdentifications: 0,
    pendingIdentification: 0,
    totalDeadBodyReports: 0
  });
  
  const [allPersons, setAllPersons] = useState<MissingPerson[]>([]);
  const [allDeadBodies, setAllDeadBodies] = useState<DeadBody[]>([]);
  const [districtData, setDistrictData] = useState<DistrictCase[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | DeadBody | null>(null);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [foundDate, setFoundDate] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [foundPolice, setFoundPolice] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [activeTab, setActiveTab] = useState<'missing' | 'dead'>('missing');

  const openModal = (person: MissingPerson | DeadBody) => {
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
    if (!selectedPerson || !foundDate || !foundLocation || !contactValue || !foundPolice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const endpoint = 'name' in selectedPerson 
        ? `/api/update-status/${selectedPerson._id}`
        : `/api/update-dead-status/${selectedPerson._id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'name' in selectedPerson ? 'Found' : 'Identified',
          solvedAt: foundDate,
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
        fetchDashboardData();
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
      
      // Fetch data from both APIs in parallel
      const [missingResponse, deadResponse] = await Promise.all([
        fetch('/api/unidentified'),
        fetch('/api/findalldead')
      ]);

      if (!missingResponse.ok || !deadResponse.ok) {
        throw new Error('Failed to fetch data from one or more APIs');
      }

      const missingData = await missingResponse.json();
      const deadData = await deadResponse.json();

      const missingPersons = missingData.data || missingData;
      const deadBodies =  deadData ;

      setAllPersons(missingPersons);
      setAllDeadBodies(deadBodies);

      // Calculate stats
      const totalMissing =missingPersons.filter((p: MissingPerson) => p.status === 'Missing').length;
      const totalFound = missingPersons.filter((p: MissingPerson) => p.status === "Found").length+1;
      const totalUnidentified = deadBodies.filter((d: DeadBody) => d.status === 'Unidentified').length;
      const totalIdentified = deadBodies.filter((d: DeadBody) => d.status === 'Identified').length;

      setStats({
        totalMissing,
        totalFound,
        monthlyMatches: Math.floor(totalFound * 0.3), // Example calculation
        pendingVerification: Math.floor(totalMissing * 0.2),
        totalReports: missingPersons.length,
        aiEmbeddingsGenerated: missingPersons.filter((p: MissingPerson) => p.embedding?.length > 0).length,
        matchAccuracy: 94.2,
        avgResolutionTime: 14.5,
        totalUnidentified,
        totalIdentified,
        monthlyIdentifications: Math.floor(totalIdentified * 0.4),
        pendingIdentification: Math.floor(totalUnidentified * 0.6),
        totalDeadBodyReports: deadBodies.length
      });

      // Generate district data (example)
      const districts = generateDistrictData(missingPersons, deadBodies);
      setDistrictData(districts);

      // Generate monthly trends (example)
      const trends = generateMonthlyTrends();
      setMonthlyTrends(trends);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate district data
  const generateDistrictData = (missingPersons: MissingPerson[], deadBodies: DeadBody[]): DistrictCase[] => {
    const districts = ['Bhubaneswar', 'Cuttack', 'Puri', 'Sambalpur', 'Rourkela', 'Berhampur'];
    
    return districts.map(district => {
      const missingCases = missingPersons.filter(p => 
        p.address?.includes(district) && p.status === 'Missing'
      ).length;
      
      const foundCases = missingPersons.filter(p => 
        p.address?.includes(district) && p.status === 'Found'
      ).length;
      
      const unidentifiedCases = deadBodies.filter(d => 
        d.address?.includes(district) && d.status === 'Unidentified'
      ).length;
      
      const identifiedCases = deadBodies.filter(d => 
        d.address?.includes(district) && d.status === 'Identified'
      ).length;

      const totalCases = missingCases + foundCases + unidentifiedCases + identifiedCases;
      const resolvedCases = foundCases + identifiedCases;
      const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

      return {
        district,
        missingCases,
        foundCases,
        unidentifiedCases,
        identifiedCases,
        resolutionRate,
        avgEmbeddingConfidence: 85 + Math.random() * 15 // Example data
      };
    });
  };

  // Helper function to generate monthly trends
  const generateMonthlyTrends = (): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      missingReported: Math.floor(Math.random() * 50) + 20,
      foundResolved: Math.floor(Math.random() * 30) + 10,
      unidentifiedReported: Math.floor(Math.random() * 20) + 5,
      identifiedResolved: Math.floor(Math.random() * 15) + 5,
      aiMatches: Math.floor(Math.random() * 25) + 10,
      embeddingQuality: 80 + Math.random() * 20
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const statusDistributionData = [
    { name: 'Missing', value: stats.totalMissing, color: '#EF4444' },
    { name: 'Found', value: stats.totalFound, color: '#10B981' },
    { name: 'Unidentified', value: stats.totalUnidentified, color: '#F59E0B' },
    { name: 'Identified', value: stats.totalIdentified, color: '#8B5CF6' }
  ];

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case "Found":
        return 'text-green-400 bg-green-400/10';
      case "Identified":
        return 'text-purple-400 bg-purple-400/10';
      case "Unidentified":
        return 'text-yellow-400 bg-yellow-400/10';
      default: // Missing
        return 'text-red-400 bg-red-400/10';
    }
  };

  const getReportTypeIcon = (person: MissingPerson | DeadBody) => {
    if ('name' in person) {
      return <User className="w-4 h-4 text-blue-400" />;
    } else {
      return <Skull className="w-4 h-4 text-orange-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter data based on active tab and search query
  const filteredData = activeTab === 'missing' 
    ? allPersons.filter(person => {
        const matchesSearch = searchQuery === '' || 
          person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          person.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          person.placeLastSeen?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDistrict = selectedDistrict === 'all' || 
          person.address?.includes(selectedDistrict);
        
        return matchesSearch && matchesDistrict;
      })
    : allDeadBodies.filter(body => {
        const matchesSearch = searchQuery === '' || 
          body.physicalFeatures?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          body.placeLastSeen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          body.address?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDistrict = selectedDistrict === 'all' || 
          body.address?.includes(selectedDistrict);
        
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
      <Navbar/>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-300/60 rounded-full animate-pulse delay-200" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  Odisha Police Dashboard
                </span>
              </h1>
              <p className="text-slate-300">AI-Powered Identification System</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center space-x-2">
                <Plus size={20} />
                <a href="/report">New Report</a>
              </button>
              <button 
                onClick={fetchDashboardData}
                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-2xl hover:bg-slate-600/50 transition-all duration-300 flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total Missing */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Missing Persons</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-300">{stats.totalMissing}</p>
              </div>
              <div className="p-2 lg:p-3 bg-red-500/20 rounded-xl">
                <UserX className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
              </div>
            </div>
            <div className="text-slate-400 text-xs lg:text-sm mt-2 lg:mt-4">
              Active missing cases
            </div>
          </div>

          {/* Total Found */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Found Persons</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-300">{stats.totalFound}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-500/20 rounded-xl">
                <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
              </div>
            </div>
            <div className="text-slate-400 text-xs lg:text-sm mt-2 lg:mt-4">
              {((stats.totalFound / (stats.totalMissing + stats.totalFound || 1)) * 100).toFixed(1)}% resolved
            </div>
          </div>

          {/* Unidentified Bodies */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Unidentified Bodies</p>
                <p className="text-2xl lg:text-3xl font-bold text-yellow-300">{stats.totalUnidentified}</p>
              </div>
              <div className="p-2 lg:p-3 bg-yellow-500/20 rounded-xl">
                <Skull className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
              </div>
            </div>
            <div className="text-slate-400 text-xs lg:text-sm mt-2 lg:mt-4">
              Awaiting identification
            </div>
          </div>

          {/* Identified Bodies */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Identified Bodies</p>
                <p className="text-2xl lg:text-3xl font-bold text-purple-300">{stats.totalIdentified}</p>
              </div>
              <div className="p-2 lg:p-3 bg-purple-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-slate-400 text-xs lg:text-sm mt-2 lg:mt-4">
              {((stats.totalIdentified / (stats.totalUnidentified + stats.totalIdentified || 1)) * 100).toFixed(1)}% identified
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Monthly Trends Chart */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-bold text-slate-200 mb-4 lg:mb-6">Monthly Trends</h3>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '12px',
                      fontSize: '12px'
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
                    dataKey="unidentifiedReported" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Unidentified Reported"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="identifiedResolved" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Identified Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-bold text-slate-200 mb-4 lg:mb-6">Status Distribution</h3>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
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
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Tab Navigation */}
            <div className="flex bg-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('missing')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'missing'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Missing Persons
              </button>
              <button
                onClick={() => setActiveTab('dead')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'dead'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Unidentified Bodies
              </button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
              <input
                type="text"
                placeholder={activeTab === 'missing' ? "Search by name, address, or location..." : "Search by features, location, or address..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
              />
            </div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
            >
              <option value="all">All Locations</option>
              {districtData.map((district) => (
                <option key={district.district} value={district.district}>
                  {district.district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Main Data Table */}
          <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-bold text-slate-200">
                {activeTab === 'missing' ? 'Missing Persons' : 'Unidentified Bodies'} ({filteredData.length})
              </h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p>No {activeTab === 'missing' ? 'missing persons' : 'unidentified bodies'} found</p>
                  <p className="text-sm mt-1">Try adjusting your search criteria</p>
                </div>
              ) : (
                filteredData.map((item) => (
                  <div key={item._id} className="flex items-center space-x-3 p-3 lg:p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-600 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={item.imageUrl} 
                        alt={'name' in item ? item.name : 'Unidentified body'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getReportTypeIcon(item)}
                        <h4 className="text-slate-200 font-semibold truncate text-sm lg:text-base">
                          {'name' in item ? item.name : 'Unidentified Body'}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReportStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs lg:text-sm">
                        {item.age && `${item.age} years • `}
                        {item.gender} 
                        {item.address && ` • ${item.address.substring(0, 30)}${item.address.length > 30 ? '...' : ''}`}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        Reported {formatDate(item.createdAt)}
                        {item.placeLastSeen && ` • ${item.placeLastSeen.substring(0, 40)}${item.placeLastSeen.length > 40 ? '...' : ''}`}
                      </div>
                      {item.reportFiledBy?.policeStation && (
                        <div className="text-slate-500 text-xs mt-1">
                          Station: {item.reportFiledBy.policeStation}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button 
                        onClick={() => openModal(item)}
                        className="text-slate-400 text-xs lg:text-sm cursor-pointer hover:text-cyan-400 px-2 py-1 bg-slate-600/50 rounded-lg"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* District Performance */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-bold text-slate-200 mb-4 lg:mb-6">Performance By Locations</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {districtData.map((district, index) => (
                <div key={district.district} className="p-3 lg:p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-slate-200 font-semibold text-sm lg:text-base">{district.district}</h4>
                    <span className="text-cyan-400 text-xs lg:text-sm font-medium">
                      {district.avgEmbeddingConfidence}% AI
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs lg:text-sm">
                    <div className="text-slate-400">
                      <div>Missing: <span className="text-red-400">{district.missingCases}</span></div>
                      <div>Found: <span className="text-green-400">{district.foundCases}</span></div>
                    </div>
                    <div className="text-slate-400">
                      <div>Unidentified: <span className="text-yellow-400">{district.unidentifiedCases}</span></div>
                      <div>Identified: <span className="text-purple-400">{district.identifiedCases}</span></div>
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
                      {district.resolutionRate}% Resolution
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 lg:p-6">
          <h3 className="text-lg lg:text-xl font-bold text-slate-200 mb-4 lg:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <button className="p-3 lg:p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-cyan-500/30 group text-center">
              <Plus className="w-6 h-6 lg:w-8 lg:h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <a href='/report' className="text-slate-200 font-medium text-sm lg:text-base">New Report</a>
              <div className="text-slate-400 text-xs lg:text-sm">File missing person case</div>
            </button>
            <button className="p-3 lg:p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-blue-500/30 group text-center">
              <Database className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium text-sm lg:text-base">Run AI Match</div>
              <div className="text-slate-400 text-xs lg:text-sm">Find matches in database</div>
            </button>
            <button className="p-3 lg:p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-green-500/30 group text-center">
              <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium text-sm lg:text-base">Analytics</div>
              <div className="text-slate-400 text-xs lg:text-sm">View detailed insights</div>
            </button>
            <button className="p-3 lg:p-4 bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 hover:border-purple-500/30 group text-center">
              <MapPin className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-slate-200 font-medium text-sm lg:text-base">City View</div>
              <div className="text-slate-400 text-xs lg:text-sm">Regional analysis</div>
            </button>
          </div>
        </div>

        {/* Person Details Modal */}
        {isModalOpen && selectedPerson && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-600/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 lg:mb-6">
                  <div>
                    <h2 className="text-xl lg:text-3xl font-bold text-slate-200 mb-2">
                      {'name' in selectedPerson ? selectedPerson.name : 'Unidentified Body'}
                    </h2>
                    <div className="flex items-center space-x-2 lg:space-x-4 text-slate-400 text-sm lg:text-base">
                      <span className="px-2 lg:px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs lg:text-sm font-bold rounded-full">
                        {selectedPerson.status}
                      </span>
                      <span>Reported on {formatDate(selectedPerson.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                  {/* Image */}
                  <div className="space-y-4">
                    <div className="relative h-48 lg:h-80 bg-slate-700/50 rounded-2xl overflow-hidden">
                      <img
                        src={selectedPerson.imageUrl}
                        alt={'name' in selectedPerson ? selectedPerson.name : 'Unidentified body'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      {selectedPerson.age && (
                        <div className="bg-slate-700/50 rounded-xl p-3 lg:p-4 text-center">
                          <User className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400 mx-auto mb-2" />
                          <div className="text-slate-300 font-bold text-sm lg:text-base">{selectedPerson.age} years</div>
                          <div className="text-slate-400 text-xs lg:text-sm">Age</div>
                        </div>
                      )}
                      
                      {selectedPerson.gender && (
                        <div className="bg-slate-700/50 rounded-xl p-3 lg:p-4 text-center">
                          <User className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-slate-300 font-bold text-sm lg:text-base">{selectedPerson.gender}</div>
                          <div className="text-slate-400 text-xs lg:text-sm">Gender</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4 lg:space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-3 lg:space-y-4">
                      <h3 className="text-lg lg:text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                        Case Information
                      </h3>
                      
                      {selectedPerson.contactNumber && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
                          <div>
                            <div className="text-slate-300 font-medium text-sm lg:text-base">Contact Number</div>
                            <div className="text-slate-400 text-sm">{selectedPerson.contactNumber}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedPerson.address && (
                        <div className="flex items-start space-x-3">
                          <Home className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 mt-0.5" />
                          <div>
                            <div className="text-slate-300 font-medium text-sm lg:text-base">Address</div>
                            <div className="text-slate-400 text-sm">{selectedPerson.address}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Missing/Discovery Details */}
                    <div className="space-y-3 lg:space-y-4">
                      <h3 className="text-lg lg:text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                        {'name' in selectedPerson ? 'Missing Details' : 'Discovery Details'}
                      </h3>
                      
                      {selectedPerson.placeLastSeen && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 mt-0.5" />
                          <div>
                            <div className="text-slate-300 font-medium text-sm lg:text-base">
                              {'name' in selectedPerson ? 'Last Seen At' : 'Found Location'}
                            </div>
                            <div className="text-slate-400 text-sm">{selectedPerson.placeLastSeen}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedPerson.physicalFeatures && (
                        <div>
                          <div className="text-slate-300 font-medium text-sm lg:text-base mb-2">Physical Features</div>
                          <div className="text-slate-400 text-sm bg-slate-700/30 rounded-xl p-3 lg:p-4">
                            {selectedPerson.physicalFeatures}
                          </div>
                        </div>
                      )}
                      
                      {selectedPerson.clothingDescription && (
                        <div>
                          <div className="text-slate-300 font-medium text-sm lg:text-base mb-2">Clothing Description</div>
                          <div className="text-slate-400 text-sm bg-slate-700/30 rounded-xl p-3 lg:p-4">
                            {selectedPerson.clothingDescription}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Report Information */}
                    {selectedPerson.reportFiledBy && (
                      <div className="space-y-3 lg:space-y-4">
                        <h3 className="text-lg lg:text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                          Report Information
                        </h3>
                        
                        {selectedPerson.reportFiledBy.policeStation && (
                          <div>
                            <div className="text-slate-300 font-medium text-sm lg:text-base">Police Station</div>
                            <div className="text-slate-400 text-sm">{selectedPerson.reportFiledBy.policeStation}</div>
                          </div>
                        )}
                        
                        {selectedPerson.reportFiledBy.name && (
                          <div>
                            <div className="text-slate-300 font-medium text-sm lg:text-base">Reported By</div>
                            <div className="text-slate-400 text-sm">
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
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-slate-600">
                  <button
                    onClick={closeModal}
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors text-sm lg:text-base"
                  >
                    Close
                  </button>
                  <button 
                    onClick={openFoundModal}
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 text-sm lg:text-base"
                  >
                    Update Status to {('name' in selectedPerson) ? 'Found' : 'Identified'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Found/Identified Details Modal */}
        {isFoundModalOpen && selectedPerson && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-600/50 max-w-2xl w-full">
              <div className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 lg:mb-6">
                  <div>
                    <h2 className="text-lg lg:text-2xl font-bold text-slate-200 mb-2">
                      Update Status to {('name' in selectedPerson) ? 'Found' : 'Identified'}
                    </h2>
                    <p className="text-slate-400 text-sm lg:text-base">
                      Updating status for {'name' in selectedPerson ? selectedPerson.name : 'Unidentified Body'}
                    </p>
                  </div>
                  <button
                    onClick={closeFoundModal}
                    className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4 lg:space-y-6">
                  {/* Found Date */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-2 text-sm lg:text-base">
                      {('name' in selectedPerson) ? 'Found Date' : 'Identification Date'} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={foundDate}
                      onChange={(e) => setFoundDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-2 text-sm lg:text-base">
                      {('name' in selectedPerson) ? 'Found Location' : 'Identification Location'} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={foundLocation}
                      onChange={(e) => setFoundLocation(e.target.value)}
                      placeholder={`Enter the location where ${('name' in selectedPerson) ? 'the person was found' : 'the body was identified'}`}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                      required
                    />
                  </div>

                  {/* Contact Type Selection */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-3 text-sm lg:text-base">
                      Contact Information <span className="text-red-400">*</span>
                    </label>
                    <div className="flex space-x-3 lg:space-x-4 mb-3 lg:mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setContactType('email');
                          setContactValue('');
                        }}
                        className={`flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-medium transition-all duration-300 text-sm lg:text-base ${
                          contactType === 'email'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                        }`}
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContactType('phone');
                          setContactValue('');
                        }}
                        className={`flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-medium transition-all duration-300 text-sm lg:text-base ${
                          contactType === 'phone'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                        }`}
                      >
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone
                      </button>
                    </div>

                    {/* Contact Input */}
                    {contactType === 'email' ? (
                      <input
                        type="email"
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                        required
                      />
                    ) : (
                      <input
                        type="tel"
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                        required
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 font-medium mb-2 text-sm lg:text-base">
                      Police Station Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={foundPolice}
                      onChange={(e) => setFoundPolice(e.target.value)}
                      placeholder="Enter police station name"
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-slate-600">
                  <button
                    onClick={closeFoundModal}
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateToFound}
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2 text-sm lg:text-base"
                  >
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
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