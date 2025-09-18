"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import PublicNavbar from "@/components/PublicNavbar";
import { 
  ArrowRight, 
  Ship, 
  Car, 
  Shield,
  Users,
  CheckCircle,
  Calendar,
  MapPin
} from "lucide-react";

const CustomerSignInPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);


  const handleKeycloakSignIn = async () => {
    setIsLoading(true);
    try {
      // Check if there's a redirect URL stored
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin') || '/customer';
      sessionStorage.removeItem('redirectAfterLogin'); // Clean up
      
      await signIn("customer-keycloak", { callbackUrl: redirectAfterLogin });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };



  const features = [
    {
      icon: <Ship className="h-6 w-6" />,
      title: "Ferry Booking",
      description: "Book ferry tickets for vehicles and passengers with real-time availability"
    },
    {
      icon: <Car className="h-6 w-6" />,
      title: "Vehicle Management",
      description: "Register and manage your vehicles for ferry transport"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Booking History",
      description: "View and manage your past and upcoming ferry bookings"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Route Information",
      description: "Check schedules and routes for all available ferry services"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicNavbar />
      
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-7xl w-full items-center">
          
          {/* Left side - Customer Login Form */}
          <div className="animate-fade-in-up order-2 lg:order-1">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left mb-8">
                <div className="flex justify-center lg:justify-start mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                    <Ship className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Customer Portal
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Access your ferry booking account. Book tickets, manage vehicles, and track your travel history.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 smooth-transition hover:shadow-3xl">
                <div className="space-y-6">
                  
                  {/* Login Section Header */}
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Customer Authentication
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Secure authentication for customer access (Customer Realm)
                    </p>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-1"></span>
                      Using dedicated customer realm
                    </div> 
                  </div>

                  {/* Keycloak Sign In Button */}
                  <div className="space-y-4">
                    <button
                      onClick={handleKeycloakSignIn}
                      disabled={isLoading}
                      className="btn-smooth group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Authenticating...</span>
                        </div>
                      ) : (
                        <span className="flex items-center">
                          Customer Login/ Registration
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      )}
                    </button>                
                  </div>

                  {/* Quick Access Links */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                      <button 
                        onClick={() => router.push('/ferry-timeline')}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium smooth-transition"
                      >
                        Browse Schedules
                      </button>
                      <button 
                        onClick={() => router.push('/contact')}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium smooth-transition"
                      >
                        Need Help?
                      </button>
                      <button 
                        onClick={() => router.push('/employee-sign-in')}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium smooth-transition"
                      >
                        Employee Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Features & Benefits */}
          <div className="animate-fade-in-up lg:animate-slide-in-right order-1 lg:order-2">
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ferry Booking Made Simple
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                Access our comprehensive ferry booking system with real-time schedules, 
                secure payments, and easy vehicle management.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 smooth-transition hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 smooth-transition">
                      <div className="text-blue-600 dark:text-blue-400">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Trusted by thousands of customers
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Customer Support</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Secure Booking</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50+</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Ferry Routes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignInPage; 