"use client";
import { useState, ChangeEvent } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AddDeadPersonForm() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    address: '',
    contactNumber: '',
    dateMissing: '',
    clothingDescription: '',
    physicalFeatures: '',
    reportFiledBy: {
      name: '',
      designation: '',
      policeStation: ''
    }
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('reportFiledBy.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        reportFiledBy: { ...prev.reportFiledBy, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      
      // Append all form fields
      (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
        if (key === 'reportFiledBy') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (formData[key]) {
          data.append(key, formData[key] as string);
        }
      });
      
      if (image) {
        data.append('image', image);
      }

      const response = await fetch('/api/adddead', {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Record added successfully!' });
        // Reset form
        setFormData({
          age: '',
          gender: '',
          address: '',
          contactNumber: '',
          dateMissing: '',
          clothingDescription: '',
          physicalFeatures: '',
          reportFiledBy: { name: '', designation: '', policeStation: '' }
        });
        setImage(null);
        setImagePreview('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add record' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Add Missing Person Record</h1>
          <p className="text-slate-600 mb-8">Fill in the details to register a missing person case</p>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Missing Details */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b">Missing Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Missing *</label>
                  <input
                    type="date"
                    name="dateMissing"
                    value={formData.dateMissing}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Clothing Description</label>
                  <textarea
                    name="clothingDescription"
                    value={formData.clothingDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm  font-medium text-slate-700 mb-2">Physical Features</label>
                  <textarea
                    name="physicalFeatures"
                    value={formData.physicalFeatures}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b">Photo *</h2>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-w-xs max-h-64 rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setImage(null); setImagePreview(''); }}
                      className="absolute top-2 right-2 bg-red-500 text-black rounded-full p-2 hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="text-slate-400 mb-2" size={48} />
                    <span className="text-sm text-slate-600 mb-1">Click to upload image</span>
                    <span className="text-xs text-slate-400">PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Report Filed By */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b">Report Filed By</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="reportFiledBy.name"
                    value={formData.reportFiledBy.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                  <input
                    type="text"
                    name="reportFiledBy.designation"
                    value={formData.reportFiledBy.designation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Police Station</label>
                  <input
                    type="text"
                    name="reportFiledBy.policeStation"
                    value={formData.reportFiledBy.policeStation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-black py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}