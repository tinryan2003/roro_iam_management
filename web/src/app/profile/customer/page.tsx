"use client";

import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, User, Mail, Phone, Calendar, CheckCircle, AlertCircle, Shield, MapPin, Building, Globe } from 'lucide-react';
import { useCurrentCustomerUser } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';
import { useCustomerProfile } from '@/hooks/useProfile';


interface EditFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  companyName: string;
  dateOfBirth?: string;
}

const CustomerProfilePage = () => {
  const { customer, loading, error, isAuthenticated } = useCurrentCustomerUser();



  
  const { updateCustomerProfile, isUpdating } = useCustomerProfile();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    companyName: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Initialize form data when user data loads
  useEffect(() => {
    if (customer) {
      setEditForm({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        username: customer.username || '',
        email: customer.email || '',
        phone: customer.phone || '',
        dateOfBirth: customer.dateOfBirth || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        postalCode: customer.postalCode || '',
        companyName: customer.companyName || ''
      });
    }
  }, [customer]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (customer) {
      setEditForm({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        username: customer.username || '',
        email: customer.email || '',
        phone: customer.phone || '',
        dateOfBirth: customer.dateOfBirth || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        postalCode: customer.postalCode || '',
        companyName: customer.companyName || ''
      });
    }
  };

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!editForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/.test(editForm.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }
    
    if (!editForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/.test(editForm.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }

    // Email validation
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await updateCustomerProfile(editForm);
      
      if (result.success) {
        setIsEditing(false);
        setNotification({
          type: 'success',
          message: result.message || 'Profile updated successfully'
        });
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update profile'
        });
        // Clear notification after 10 seconds for errors
        setTimeout(() => setNotification(null), 10000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      setTimeout(() => setNotification(null), 10000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {customer?.firstName && customer?.lastName 
                      ? `${customer.firstName} ${customer.lastName}`
                      : session?.user?.name || 'User'
                    }
                  </h2>
                  <p className="text-blue-100">
                    {session?.user?.role?.[0] || 'User'}
                  </p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {isEditing ? (
              /* Edit Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        validationErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        validationErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editForm.dateOfBirth || ''}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Select your date of birth"
                      title="Date of Birth"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={editForm.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editForm.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={editForm.postalCode}
                      onChange={handleInputChange}
                      pattern="[0-9]{5,9}"
                      title="Postal code must be 5-9 digits"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter 5-9 digit postal code"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be 5-9 digits (e.g., 12345 or 123456789)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={editForm.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your country"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Display Mode */
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.firstName && customer?.lastName 
                              ? `${customer.firstName} ${customer.lastName}`
                              : 'Not provided'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.email || session?.user?.email || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.companyName || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                          <p className="text-gray-900 dark:text-white">
                            {session?.user?.role?.[0] || 'User'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.address || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.city || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.postalCode || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer?.country || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
                <p className="text-gray-900 dark:text-white">
                  {customer?.username || 'Not available'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage; 