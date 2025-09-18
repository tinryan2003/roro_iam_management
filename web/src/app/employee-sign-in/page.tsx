"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNavbar from "@/components/PublicNavbar";
import { ArrowRight, Shield, Users, BarChart3 } from "lucide-react";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleKeycloakSignIn = async () => {
    setIsLoading(true);
    try {    
      await signIn("employee-keycloak", { callbackUrl: "/home" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicNavbar />
      
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl w-full items-center">
          {/* Left side - Login Form */}
          <div className="animate-fade-in-up">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Staff Access Portal
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Secure authentication for RORO management system access. Staff members can register their own accounts.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 smooth-transition hover:shadow-2xl">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Employee Portal Authentication
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Enterprise-grade security for staff access (Employee Realm)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleKeycloakSignIn}
                      disabled={isLoading}
                      className="btn-smooth group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="loading-smooth -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="animate-pulse">Authenticating...</span>
                        </div>
                      ) : (
                        <span className="flex items-center">
                          Staff Login
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Contact your administrator for account access
                    </p>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button 
                        onClick={() => router.push('/customer-sign-in')}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium smooth-transition"
                      >
                        Go to Customer Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="animate-fade-in-up lg:animate-slide-in-right">
            <div className="text-center lg:text-left mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Internal Management Platform
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Access comprehensive tools designed for RORO operations staff and management.
              </p>
            </div>

            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="stagger-item card-hover bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-transform duration-300 group-hover:scale-110">
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>`
                </div>
              </div>

              {/* Feature 2 */}
              <div className="stagger-item card-hover bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg transition-transform duration-300 group-hover:scale-110">
                      <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                      Staff Management
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      Manage staff schedules, assignments, and access permissions across all RORO operations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="stagger-item card-hover bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg transition-transform duration-300 group-hover:scale-110">
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                      Real-time Analytics
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      Monitor operations with live dashboards, performance metrics, and detailed reporting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Secure & Compliant
              </h4>
              <p className="text-blue-700 dark:text-blue-200 text-sm">
                Our platform meets maritime industry security standards with enterprise-grade encryption and audit trails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;