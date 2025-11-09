"use client"
import { useState, useEffect } from 'react';
import { Search, MapPin, User, RefreshCw, Clock, Shield, Navigation, Target } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function SearchResultsDisplay() {
  interface SearchResults {
    searchParams: {
      lat: number;
      lon: number;
      gender: string;
      age: number;
    };
    totalCandidates: number;
    timestamp: string;
    matches: MissingPersonDoc[];
  }

  const [data, setData] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  interface MissingPersonDoc {
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
    distanceKm?: number;
    similarity?: number;
    addresslat?: number;
    addresslon?: number;
    imageUrl: string;
    finalScore?: number;
    embedding: number[];
    status: string;
    reportFiledBy?: {
      name?: string;
      designation?: string;
      policeStation?: string;
    };
    createdAt: string;
  }

  const fetchResults = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reverselookup', {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch results');
      }

      setData(result);
    } catch (err: unknown) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-500 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-pink-500';
  };

  const getStatusColor = (status: string) => {
    return status === "Found" 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
      : 'bg-gradient-to-r from-red-500 to-pink-500';
  };
const handleDeadDb = async () => {
  try {
    // Step 1: Get data from localStorage
    const initialRes = localStorage.getItem("result1");
    
    if (!initialRes) {
      throw new Error('No result1 data found in localStorage');
    }
    
    // Parse the JSON string back to an object
    const dataToSend = JSON.parse(initialRes);
    
    // Step 2: Send the data to senddead API via POST
    const sendDeadRes = await fetch("/api/senddead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend), // Re-stringify for fetch
    });
    
    if (!sendDeadRes.ok) {
      throw new Error(`Failed to send data: ${sendDeadRes.statusText}`);
    }
    
    const result = await sendDeadRes.json();
    console.log("✅ Data sent successfully:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Error in handleDeadDb:", error);
    throw error;
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-[Orbitron]">
      <Navbar/>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-300/60 rounded-full animate-pulse delay-200" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                AI Match Results
              </span>
            </h1>
            <p className="text-xl text-slate-300 font-light">
              Reverse Lookup Search Analysis
            </p>
          </div>
          <button
            onClick={fetchResults}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 mx-auto lg:mx-0"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Scanning...' : 'Refresh Results'}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl mb-8 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Search Error:</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">AI System Scanning Database...</p>
            <p className="text-slate-400 text-sm mt-2">Processing facial embeddings and location data</p>
          </div>
        )}

        {data && (
          <>
            {/* Search Metadata */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center space-x-3">
                <Target className="w-6 h-6 text-cyan-400" />
                <span>Search Parameters</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-sm">Coordinates</span>
                  </div>
                  <p className="text-slate-200 font-semibold text-lg">
                    {data.searchParams.lat.toFixed(4)}, {data.searchParams.lon.toFixed(4)}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-400 text-sm">Gender Filter</span>
                  </div>
                  <p className="text-slate-200 font-semibold text-lg capitalize">{data.searchParams.gender}</p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400 text-sm">Age Filter</span>
                  </div>
                  <p className="text-slate-200 font-semibold text-lg">{data.searchParams.age} years</p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-400 text-sm">Candidates Found</span>
                  </div>
                  <p className="text-slate-200 font-semibold text-lg">{data.totalCandidates}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-400 border-t border-slate-600/50 pt-4">
                <Clock size={16} />
                <span className="text-sm">Last scan: {formatDate(data.timestamp)}</span>
              </div>
            </div>

            {/* Matches */}
            {data.matches && data.matches.length > 0 ? (
              <div>
                <h2 className="text-3xl font-bold text-slate-200 mb-6 flex items-center space-x-3">
                  <Navigation className="w-7 h-7 text-cyan-400" />
                  <span>Top {data.matches.length} AI Matches</span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.matches.map((match, index) => (
                    <div
                      key={match._id}
                      className="group bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500"
                    >
                      {/* Header with Image and Score */}
                      <div className="relative">
                        <div className="h-48 bg-slate-700/50 overflow-hidden">
                          {match.imageUrl ? (
                            <img
                              src={match.imageUrl}
                              alt={match.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-16 h-16 text-slate-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Score Badge */}
                        <div className="absolute top-4 right-4">
                          <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getScoreColor(match.finalScore!)} text-white font-bold shadow-lg`}>
                            {(match.finalScore! * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                        </div>

                        {/* Rank Badge */}
                        <div className="absolute bottom-4 left-4">
                          <span className="px-3 py-1 bg-slate-900/80 text-cyan-300 text-sm font-bold rounded-full backdrop-blur-sm">
                            Match #{index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-cyan-300 transition-colors">
                          {match.name || 'Unknown Identity'}
                        </h3>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-slate-400">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">
                              {match.gender || 'N/A'}, {match.age ? `${match.age} yrs` : 'Age N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-slate-400">
                            <MapPin className="w-4 h-4 text-green-400" />
                            <span className="text-sm">
                              {match.distanceKm
                                ? `${match.distanceKm.toFixed(1)} km`
                                : 'Dist N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Address */}
                        {match.address && (
                          <div className="text-sm text-slate-400 mb-4">
                            <span className="font-medium text-slate-300">Last Location: </span>
                            {match.address.length > 60 
                              ? `${match.address.substring(0, 60)}...` 
                              : match.address
                            }
                          </div>
                        )}

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-cyan-400 font-bold text-sm">
                              {(match.similarity! * 100).toFixed(0)}%
                            </div>
                            <div className="text-slate-400 text-xs">Face Match</div>
                          </div>
                          
                          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-green-400 font-bold text-sm">
                              {((1 - Math.min(match.distanceKm!, 100) / 100) * 100).toFixed(0)}%
                            </div>
                            <div className="text-slate-400 text-xs">Location</div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center justify-between text-slate-500 text-xs border-t border-slate-600/50 pt-3">
                          <span>Missing since {new Date(match.dateMissing).toLocaleDateString()}</span>
                          {match.reportFiledBy?.policeStation && (
                            <span>{match.reportFiledBy.policeStation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
                <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-300 text-lg mb-2">No AI Matches Found</p>
                <p className="text-slate-400">Try adjusting search parameters or check back later</p>
              </div>
            )}
          </>
        )}
       <button
       onClick={handleDeadDb}
  className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-800 
             text-white font-semibold shadow-lg hover:from-red-700 hover:to-red-900 
             hover:shadow-red-500/30 transition-all duration-300 ease-in-out 
             active:scale-95 mt-6"
>
  Couldnt find? Send it to us
</button>

        {!loading && !error && !data && (
          <div className="text-center py-20 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
            <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-300 text-lg mb-2">Ready for Search</p>
            <p className="text-slate-400">Perform a reverse lookup search to see AI matching results</p>
          </div>
        )}
      </div>
    </div>
  );
}