import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function FirstRunSetup() {
  const [needsSetup, setNeedsSetup] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminPassword: '',
    firstName: '',
    lastName: ''
  });
  const { setup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/check-setup').then(res => {
      if (!res.data.needsSetup) {
        navigate('/login');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setup(formData);
      toast.success('Setup completed!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Setup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">HCM Lite</h1>
          <h2 className="text-xl font-semibold text-gray-800">First Run Setup</h2>
          <p className="text-gray-600 mt-2">Set up your company and admin account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.adminEmail}
            onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Admin Password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.adminPassword}
            onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
            required
          />
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
