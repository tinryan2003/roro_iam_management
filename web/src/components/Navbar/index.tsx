'use client'
import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import LogoutButton from '@/components/LogoutButton'
import { useTokenExpiration } from '@/hooks/useTokenExpiration'
import { useInternalNotifications } from '@/hooks/useInternalNotifications'

const Navbar = () => {
    const { data: session, status } = useSession();
    // Initialize token expiration monitoring - this handles auto-logout automatically
    useTokenExpiration();
    
    // Internal notifications hook
    const { notifications, unreadCount, markAsRead } = useInternalNotifications();
    
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Token expiration is now handled by useTokenExpiration hook
    // No need for manual checking here as the hook handles auto-logout


    // Function to handle dropdown toggles with mutual exclusivity
    const toggleDropdown = (dropdown: 'profile' | 'notifications' | 'mobile') => {
        switch (dropdown) {
            case 'profile':
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationsOpen(false);
                break;
            case 'notifications':
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileMenuOpen(false);
                break;
            case 'mobile':
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfileMenuOpen(false);
                setIsNotificationsOpen(false);
                break;
        }
    };

    

    return (
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            {/* Mobile Menu Button & Logo */}
            <div className="flex items-center gap-3">
                {/* Mobile menu button - only visible on mobile */}
                <button 
                    className="sm:hidden smooth-hover p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-ring"
                    onClick={() => toggleDropdown('mobile')}
                    aria-label="Toggle Mobile Menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                </button>        
            </div>

            {/* Right Side Icons - Always positioned on the right */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 ml-auto">
                {/* Notifications */}
                <div className="relative">
                    <button 
                        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleDropdown('notifications')}
                        aria-label="Notifications"
                    >
                        <Image 
                            src="/bell.svg"
                            alt="Notifications"
                            width={20}
                            height={20}
                            className="w-5 h-5 lg:w-6 lg:h-6"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                            {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : '0'}
                        </div>
                    </button>
                    
                    {isNotificationsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map((notification) => (
                                        <div 
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                                                notification.read ? 'border-transparent' : 'border-blue-500'
                                            }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className={`font-medium ${
                                                notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                            }`}>
                                                {notification.title}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {notification.message.length > 60 
                                                    ? notification.message.substring(0, 60) + '...' 
                                                    : notification.message}
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                {new Date(notification.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <Link href="/list/notification" className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    View all notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
                {/* Profile */}
                <div className="relative">
                    <button 
                        className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleDropdown('profile')}
                        aria-label="User Profile"
                    >
                        <Image
                            src="/person-circle.svg"
                            alt="User Profile"
                            width={20}
                            height={20}
                            className="w-5 h-5 lg:w-6 lg:h-6 rounded-full"
                        />
                    </button>
                    
                    {isProfileMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            {status === "authenticated" && session?.user ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {session.user.name || 'User'}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {session.user.email || 'No email'}
                                        </div>
                                    </div>
                            <div className="py-2">
                                {session.user.role?.includes("CUSTOMER") ? (
                                    <Link href="/profile/customer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        Profile
                                    </Link>
                                ) : (
                                    <Link href="/profile/employee" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        Profile
                                    </Link>
                                )}
                                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Settings
                                </Link>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                        <LogoutButton
                                            redirectTo={session.user.role?.includes("CUSTOMER") ? "/customer-sign-in" : "/employee-sign-in"}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-4">
                                    <Link href="/sign-in" className="block px-4 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                        Sign In
                                </Link>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="sm:hidden fixed inset-0 top-[60px] bg-white dark:bg-gray-900 z-40 border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4">

                        {/* Mobile Navigation */}
                        <nav className="space-y-2">
                            <Link href="/" className="block px-4 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                Home
                            </Link>
                            <Link href="/settings" className="block px-4 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                Settings
                            </Link>
                            <Link href="/help" className="block px-4 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                Help
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Navbar;