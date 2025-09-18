"use client";

import PublicNavbar from "@/components/PublicNavbar";
import Image from "next/image";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About RORO Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn more about our comprehensive platform for managing roll-on/roll-off operations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              We are dedicated to revolutionizing ferry and RORO operations through innovative technology solutions that streamline processes, enhance safety, and improve customer experience.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Our platform serves ferry operators, port authorities, and maritime logistics companies worldwide, providing them with the tools they need to manage their operations efficiently and effectively.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/images/spct.png"
              alt="RORO Management System"
              width={300}
              height={300}
              className="h-64 w-64"
            />
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">15+</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Years Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Over 15 years of experience in maritime technology solutions.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">50+</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Global Clients
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Trusted by over 50 ferry operators and port authorities worldwide.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Support Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Round-the-clock technical support for all our clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 