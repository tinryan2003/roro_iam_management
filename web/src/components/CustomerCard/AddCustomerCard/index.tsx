"use client";

import React, { useState } from 'react';
import { Plus, X, Eye, EyeOff, Calendar, Building2, MapPin, CheckCircle } from 'lucide-react';
import { useCreateCustomer } from '@/hooks/useApi';

interface CustomerFormData {
  // Account fields
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  // Customer fields
  customerCode: string;
  companyName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

interface AddCustomerCardProps {
  onCustomerAdded?: () => void;
  buttonText?: string;
  buttonClassName?: string;
}

const AddCustomerCard: React.FC<AddCustomerCardProps> = ({ 
  onCustomerAdded, 
  buttonText = "Add Customer",
  buttonClassName = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createCustomer, loading } = useCreateCustomer();
  
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    customerCode: '',
    companyName: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Enhanced Password validation to match typical Keycloak policies
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const password = formData.password;
      const passwordErrors = [];
      
      if (password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('at least one uppercase letter');
      }
      
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('at least one lowercase letter');
      }
      
      if (!/[0-9]/.test(password)) {
        passwordErrors.push('at least one number');
      }
      
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        passwordErrors.push('at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }

    // Phone number validation (optional but if provided, validate format)
    if (formData.phoneNumber.trim() && !/^[+]?[0-9\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Date of birth validation
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    // Customer code validation (optional but if provided, validate format)
    if (formData.customerCode.trim() && !/^[A-Z0-9\-_]+$/.test(formData.customerCode)) {
      newErrors.customerCode = 'Customer code must contain only uppercase letters, numbers, hyphens, and underscores';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // Country validation
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Postal code validation (required by Keycloak)
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateCustomerCode = () => {
    const prefix = 'CUST';
    const timestamp = Date.now().toString().slice(-4);
    const code = `${prefix}${timestamp}`;
    handleInputChange('customerCode', code);
  };

  // Password strength checker for real-time feedback
  const getPasswordStrength = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'Uppercase letter' },
      { met: /[a-z]/.test(password), text: 'Lowercase letter' },
      { met: /[0-9]/.test(password), text: 'Number' },
      { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Special character' }
    ];
    
    const metCount = requirements.filter(req => req.met).length;
    return { requirements, strength: metCount, maxStrength: requirements.length };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const customerData = {
        ...formData,
        phoneNumber: formData.phoneNumber || undefined,
        customerCode: formData.customerCode || undefined,
        companyName: formData.companyName || undefined,
        // postalCode is required, so don't set to undefined
        // Format date as ISO string without time (YYYY-MM-DD)
        dateOfBirth: formData.dateOfBirth
      };
      
      // Debug logging for form data
      console.log('📝 Form data before submit:', {
        ...customerData,
        password: '[REDACTED]'
      });
      
      // Validate required fields one more time
      const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName', 'address', 'city', 'country', 'postalCode', 'dateOfBirth'];
      const missingFields = requiredFields.filter(field => !customerData[field as keyof typeof customerData]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        setErrors({ submit: `Missing required fields: ${missingFields.join(', ')}` });
        return;
      }
      
      await createCustomer(customerData);
      
      setSuccess(true);
      setTimeout(() => {
        handleSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      
      // Parse specific validation errors and map them to form fields
      const specificErrors = parseValidationErrors(errorMessage);
      if (Object.keys(specificErrors).length > 0) {
        setErrors(specificErrors);
      } else {
        setErrors({ submit: errorMessage });
      }
    }
  };

  const parseValidationErrors = (errorMessage: string): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    
    // Map common backend validation errors to specific form fields
    if (errorMessage.includes('Username already exists') || errorMessage.includes('User already exists with username')) {
      fieldErrors.username = 'This username is already taken. Please choose a different username.';
    }
    
    if (errorMessage.includes('Email already exists') || errorMessage.includes('User already exists with same email')) {
      fieldErrors.email = 'This email address is already registered. Please use a different email.';
    }
    
    if (errorMessage.includes('Invalid email format')) {
      fieldErrors.email = 'Please enter a valid email address.';
    }
    
    if (errorMessage.includes('Invalid username format')) {
      fieldErrors.username = 'Username should contain only letters, numbers, and allowed special characters.';
    }
    
    if (errorMessage.includes('Password does not meet') || errorMessage.includes('invalid password')) {
      fieldErrors.password = 'Password does not meet the security requirements. Please ensure it has at least 8 characters with proper complexity.';
    }
    
    // Handle specific field requirements from structured error responses
    if (errorMessage.includes('Address is required')) {
      fieldErrors.address = 'Address is required.';
    }
    
    if (errorMessage.includes('Postal code is required')) {
      fieldErrors.postalCode = 'Postal code is required.';
    }
    
    if (errorMessage.includes('City is required')) {
      fieldErrors.city = 'City is required.';
    }
    
    if (errorMessage.includes('Country is required')) {
      fieldErrors.country = 'Country is required.';
    }
    
    if (errorMessage.includes('Phone number is required')) {
      fieldErrors.phoneNumber = 'Phone number is required.';
    }
    
    if (errorMessage.includes('Date of birth is required')) {
      fieldErrors.dateOfBirth = 'Date of birth is required.';
    }
    
    if (errorMessage.includes('Missing required field')) {
      fieldErrors.submit = 'Please fill in all required fields and try again.';
    }
    
    if (errorMessage.includes('Invalid input format')) {
      fieldErrors.submit = 'Some fields contain invalid data. Please check your information and try again.';
    }
    
    // If no specific field errors found but it's a validation error, show general message
    if (Object.keys(fieldErrors).length === 0 && errorMessage.includes('Validation failed')) {
      fieldErrors.submit = 'Please check your information and ensure all fields are filled correctly.';
    }
    
    return fieldErrors;
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    resetForm();
    onCustomerAdded?.();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
      customerCode: '',
      companyName: '',
      address: '',
      city: '',
      country: '',
      postalCode: ''
    });
    setErrors({});
    setSuccess(false);
    setShowPassword(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${buttonClassName}`}
      >
        <Plus className="h-4 w-4" />
        {buttonText}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content - Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {errors.submit}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Customer created successfully!
                </div>
              )}

              {/* Account Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Account Information
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="text-red-500">*</span> Required fields for Keycloak user creation
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter username"
                    />
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number (optional)"
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                        }`}
                        aria-label="Select date of birth"
                        title="Date of Birth"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => {
                            const { strength } = getPasswordStrength(formData.password);
                            return (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded ${
                                  i < strength 
                                    ? strength <= 2 ? 'bg-red-500' : strength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {getPasswordStrength(formData.password).requirements.map((req, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-1 ${
                                req.met ? 'text-green-600' : 'text-gray-500'
                              }`}
                            >
                              <span className="text-xs">{req.met ? '✓' : '○'}</span>
                              <span>{req.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Customer Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.customerCode}
                        onChange={(e) => handleInputChange('customerCode', e.target.value.toUpperCase())}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.customerCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter customer code (optional)"
                      />
                      <button
                        type="button"
                        onClick={generateCustomerCode}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                    {errors.customerCode && <p className="text-red-500 text-sm mt-1">{errors.customerCode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.companyName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter company name (optional)"
                      />
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full address"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter city"
                      />
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter country"
                    />
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.postalCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter postal code"
                    />
                    {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddCustomerCard; 