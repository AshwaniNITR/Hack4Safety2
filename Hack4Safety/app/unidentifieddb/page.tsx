"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Filter, MapPin, Calendar, User, Shield, Eye, X, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";


interface DeadPerson {
  _id: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  contactNumber?: string;
  dateMissing: string;
  placeLastSeen?: string;
  clothingDescription?: string;
  physicalFeatures?: string;
  imageUrl: string;
  status: "Unidentified" | "Identified";
  solvedAt?: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: string;
}

export default function UnidentifiedPersonsPage() {
  const [persons, setPersons] = useState<DeadPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<DeadPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUnidentifiedPersons();
  }, []);

  const fetchUnidentifiedPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/findalldead");
      
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data: DeadPerson[] = await response.json();
      
      // Filter only unidentified persons
      const unidentified = data.filter(
        (person) => person.status === "Unidentified"
      );
      
      setPersons(unidentified);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const toggleExpand = (personId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(personId)) {
      newExpanded.delete(personId);
    } else {
      newExpanded.add(personId);
    }
    setExpandedCards(newExpanded);
  };

  const openModal = (person: DeadPerson) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredPersons = persons.filter(person =>
    person.placeLastSeen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.physicalFeatures?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.clothingDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.reportFiledBy?.policeStation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading Unidentified Cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl backdrop-blur-xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Database Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Unidentified Persons
            </span>
          </h1>
          <p className="text-xl text-slate-300 font-light">
            Cases awaiting identification through AI facial recognition
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by location, features, clothing, or police station..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-400 backdrop-blur-xl transition-all duration-300"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between">
            <p className="text-slate-300">
              Showing <span className="font-bold text-cyan-300">{filteredPersons.length}</span> of{' '}
              <span className="font-bold text-blue-300">{persons.length}</span> unidentified cases
              {searchTerm && (
                <span className="text-cyan-300"> matching "{searchTerm}"</span>
              )}
            </p>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>All cases require identification</span>
              </span>
            </div>
          </div>
        </div>

        {/* No Results */}
        {!loading && !error && filteredPersons.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50">
            <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-300 text-lg mb-2">No unidentified persons found</p>
            {searchTerm && (
              <p className="text-slate-400">Try adjusting your search terms</p>
            )}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && filteredPersons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredPersons.map((person) => {
              const isExpanded = expandedCards.has(person._id);
              return (
                <div
                  key={person._id}
                  className="group bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer"
                  onClick={() => openModal(person)}
                >
                  {/* Image with Status */}
                  <div className="relative h-48 bg-slate-700/50 overflow-hidden">
                    <Image
                      src={person.imageUrl}
                      alt="Unidentified person"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                        {person.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(person);
                        }}
                        className="px-3 py-1 bg-slate-900/80 text-slate-300 rounded-lg backdrop-blur-sm hover:bg-slate-800/90 transition-colors flex items-center space-x-1"
                      >
                        <Eye size={14} />
                        <span className="text-xs">View Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-sm">{formatDate(person.dateMissing)}</span>
                      </div>
                      
                      {person.placeLastSeen && (
                        <div className="flex items-center space-x-2 text-slate-400">
                          <MapPin size={14} />
                          <span className={isExpanded ? 'text-sm' : 'text-sm line-clamp-1'}>
                            {isExpanded ? person.placeLastSeen : truncateText(person.placeLastSeen, 8)}
                          </span>
                        </div>
                      )}
                      
                      {person.age && (
                        <div className="flex items-center space-x-2 text-slate-400">
                          <User size={14} />
                          <span className="text-sm">{person.age} years {person.gender && `• ${person.gender}`}</span>
                        </div>
                      )}

                      {/* AI Identification Needed */}
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Shield size={14} />
                        <span className="text-red-400 text-xs font-medium">
                          AI Identification Required
                        </span>
                      </div>
                      
                      {person.physicalFeatures && (
                        <div className="text-slate-400">
                          <span className="font-medium text-slate-300 text-sm">Features: </span>
                          <span className="text-sm">
                            {isExpanded ? person.physicalFeatures : truncateText(person.physicalFeatures, 12)}
                          </span>
                          {person.physicalFeatures.split(' ').length > 12 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(person._id);
                              }}
                              className="ml-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {person.clothingDescription && (
                        <div className="text-slate-400">
                          <span className="font-medium text-slate-300 text-sm">Clothing: </span>
                          <span className="text-sm">
                            {isExpanded ? person.clothingDescription : truncateText(person.clothingDescription, 10)}
                          </span>
                          {person.clothingDescription.split(' ').length > 10 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(person._id);
                              }}
                              className="ml-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-600/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-200 mb-2">
                    Unidentified Person Case
                  </h2>
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full">
                      {selectedPerson.status}
                    </span>
                    <span>Reported on {formatDate(selectedPerson.createdAt)}</span>
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
                    <Image
                      src={selectedPerson.imageUrl}
                      alt="Unidentified person"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPerson.age && (
                      <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <User className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                        <div className="text-slate-300 font-bold">{selectedPerson.age} years</div>
                        <div className="text-slate-400 text-sm">Estimated Age</div>
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

                  {/* AI Action Required */}
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-5 h-5 text-red-400" />
                      <div className="text-slate-300 font-medium">AI Identification Required</div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      This case requires facial recognition matching with missing persons database
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {/* Case Information */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                      Case Information
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
                        <div>
                          <div className="text-slate-300 font-medium">Date Reported Missing</div>
                          <div className="text-slate-400">{formatDate(selectedPerson.dateMissing)}</div>
                        </div>
                      </div>
                      
                      {selectedPerson.placeLastSeen && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-green-400 mt-0.5" />
                          <div>
                            <div className="text-slate-300 font-medium">Last Known Location</div>
                            <div className="text-slate-400">{selectedPerson.placeLastSeen}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Description */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-200 border-b border-slate-600 pb-2">
                      Physical Description
                    </h3>
                    
                    {selectedPerson.physicalFeatures && (
                      <div>
                        <div className="text-slate-300 font-medium mb-2">Distinctive Features</div>
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
              
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}