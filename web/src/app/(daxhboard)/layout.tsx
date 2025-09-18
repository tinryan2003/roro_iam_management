import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* LEFT SIDEBAR */}
      <div className="hidden sm:flex sm:w-16 md:w-20 lg:w-64 xl:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0">
        {/* Logo Section */}
        <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/home"
            className="flex w-full items-center justify-center lg:justify-start gap-2"
          >
            <Image 
              src="/logo.svg" 
              alt="RORO Management System Logo" 
              width={32} 
              height={32}
              className="w-8 h-8 lg:w-10 lg:h-10 object-contain flex-shrink-0"
              priority
            />
            <span className="hidden lg:block text-lg xl:text-xl font-bold text-gray-900 dark:text-white truncate">
              RORO System
            </span>
          </Link>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 p-2 lg:p-4 overflow-hidden">
          <Sidebar />
        </div>
      </div>
      
      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
