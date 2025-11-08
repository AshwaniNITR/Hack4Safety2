
// app/page.tsx
"use client";

import { useState } from "react";
import { Upload, User, MapPin, Camera, FileText, Send } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function MissingPersonForm() {
  const [formData, setFormData] = useState({
    gender: "",
    address: "",
    clothingDescription: "",
    physicalFeatures: "",
    reportedByName: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeSection, setActiveSection] = useState(0);
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
  status: string;
  reportFiledBy?: {
    name?: string;
    designation?: string;
    policeStation?: string;
  };
  createdAt: string;
}
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that an image has been uploaded
    if (!image) {
      setMessage({
        type: "error",
        text: "Please upload a photo before submitting.",
      });
      setActiveSection(2); // Navigate to photo upload section
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      // Append image
      if (image) {
        formDataToSend.append("image", image);
      }

      const [response1] = await Promise.all([
        fetch("/api/missingPerson", {
          method: "POST",
          body: formDataToSend,
        }),
      ]);

      const result1 = await response1.json();
     

      if (response1.ok) {
        setMessage({
          type: "success",
          text: "Missing person report filed successfully! Our AI system is now processing the data.",
        });
        // Reset form
        setFormData({
          gender: "",
          address: "",
          clothingDescription: "",
          physicalFeatures: "",
          reportedByName: "",
        });
        setImage(null);
        setImagePreview("");
        setActiveSection(0);
      } else {
        setMessage({
          type: "error",
          text: result1.error || "Failed to file report",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { icon: User, title: "Personal Info", color: "from-blue-500 to-cyan-500" },
    {
      icon: MapPin,
      title: "Missing Details",
      color: "from-cyan-500 to-green-500",
    },
    {
      icon: Camera,
      title: "Photo Upload",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: FileText,
      title: "Reporter Info",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-[Orbitron]">
      <Navbar />
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-300/60 rounded-full animate-pulse delay-200" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              File Missing Person Report
            </span>
          </h1>
          <p className="text-xl text-slate-300 font-light">
            Help us reunite families with AI-powered facial recognition
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                      activeSection === index
                        ? `bg-gradient-to-r ${section.color} border-transparent scale-110`
                        : "border-slate-600 bg-slate-800/50 text-slate-400"
                    }`}
                    onClick={() => setActiveSection(index)}
                  >
                    <Icon
                      size={20}
                      className={
                        activeSection === index
                          ? "text-white"
                          : "text-slate-400"
                      }
                    />
                  </div>
                  {index < sections.length - 1 && (
                    <div
                      className={`w-16 h-0.5 transition-all duration-300 ${
                        activeSection > index
                          ? "bg-gradient-to-r from-cyan-400 to-blue-400"
                          : "bg-slate-600"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {message.text && (
            <div
              className={`m-6 p-4 rounded-xl border ${
                message.type === "success"
                  ? "bg-green-900/20 border-green-500/30 text-green-300"
                  : "bg-red-900/20 border-red-500/30 text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            {/* Personal Information */}
            <div
              className={`space-y-6 transition-all duration-500 ${
                activeSection === 0 ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">               

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 transition-all duration-300"
                  >
                    <option value="" className="bg-slate-800">
                      Select Gender
                    </option>
                    <option value="Male" className="bg-slate-800">
                      Male
                    </option>
                    <option value="Female" className="bg-slate-800">
                      Female
                    </option>
                    <option value="Other" className="bg-slate-800">
                      Other
                    </option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-400 transition-all duration-300"
                    placeholder="Complete residential address"
                  />
                </div>
              </div>
            </div>

            {/* Missing Details */}
            <div
              className={`space-y-6 transition-all duration-500 ${
                activeSection === 1 ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  Missing Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               

             

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Clothing Description
                  </label>
                  <textarea
                    name="clothingDescription"
                    value={formData.clothingDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-400 transition-all duration-300 resize-none"
                    placeholder="Describe what the person was wearing..."
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Physical Features
                  </label>
                  <textarea
                    name="physicalFeatures"
                    value={formData.physicalFeatures}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-400 transition-all duration-300 resize-none"
                    placeholder="Height, weight, scars, tattoos, distinctive features..."
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div
              className={`space-y-6 transition-all duration-500 ${
                activeSection === 2 ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Camera className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  Photo Upload
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Upload Photo <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center transition-all duration-300 hover:border-cyan-400/50 hover:bg-slate-800/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300 font-medium">
                      Click to upload a photo
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      High-quality facial photo recommended for better AI
                      matching
                    </p>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-6 text-center">
                    <p className="text-slate-300 mb-4">Photo Preview</p>
                    <div className="inline-block p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-64 h-64 object-cover rounded-xl border-2 border-slate-600/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Information */}
            <div
              className={`space-y-6 transition-all duration-500 ${
                activeSection === 3 ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  Report Filed By
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="reportedByName"
                    value={formData.reportedByName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-400 transition-all duration-300"
                    placeholder="Reporter's name"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() =>
                  setActiveSection((prev) => Math.max(0, prev - 1))
                }
                disabled={activeSection === 0}
                className="px-6 py-3 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
              >
                Previous
              </button>

              {activeSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection((prev) =>
                      Math.min(sections.length - 1, prev + 1)
                    )
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                >
                  <Send size={18} />
                  <span>{loading ? "Processing..." : "Submit Report"}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* AI Features Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Our AI system will process this information and cross-reference with
            our database of unidentified persons
          </p>
        </div>
      </div>
    </div>
  );
}
