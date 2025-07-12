import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2, MessageSquare, User, Sparkles } from 'lucide-react';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import socketService from '../utils/socket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { formatDateTimeRelative } from '../utils/dateUtils';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Join user room for real-time notifications
      socketService.connect();
      socketService.joinUserRoom(user.id);
      
      // Listen for new notifications
      socketService.onNewNotification((notificationData: any) => {
        // Add new notification to the list
        setNotifications(prev => [notificationData, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success('🔔 New notification received!');
      });
      
      return () => {
        socketService.leaveUserRoom(user.id);
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.question) {
      return `/question/${notification.question.id}`;
    }
    if (notification.answer?.question) {
      return `/question/${notification.answer.question.id}`;
    }
    return '#';
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.message.includes('answered')) {
      return <MessageSquare className="h-4 w-4 text-accent-500" />;
    }
    return <Sparkles className="h-4 w-4 text-accent-500" />;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 focus-ring ${
          unreadCount > 0 
            ? 'text-accent-600 bg-accent-50 hover:bg-accent-100' 
            : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100'
        } ${isOpen ? 'bg-accent-100 text-accent-600' : ''}`}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse-soft' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] font-bold shadow-elegant animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-lg rounded-xl shadow-elegant-xl border border-primary-200/50 z-50 max-h-[32rem] overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-6 border-b border-primary-200/50 bg-gradient-to-r from-primary-50 to-accent-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-bold text-primary-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-accent-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-accent-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-primary-600 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-primary-400" />
                </div>
                <p className="text-primary-600 font-medium">No notifications yet</p>
                <p className="text-primary-400 text-sm mt-1">You'll see new activity here</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative p-4 border-b border-primary-100/50 transition-all duration-200 hover:bg-primary-50/50 ${
                    !notification.isRead ? 'bg-gradient-to-r from-accent-50/50 to-primary-50/50' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      !notification.isRead ? 'bg-accent-100' : 'bg-primary-100'
                    }`}>
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={getNotificationLink(notification)}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                          setIsOpen(false);
                        }}
                        className="block group"
                      >
                        <p className="text-sm font-medium text-primary-900 leading-relaxed group-hover:text-accent-600 transition-colors">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-primary-500">
                          <span>{formatDateTimeRelative(notification.createdAt)}</span>
                          {notification.sender && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{notification.sender.username}</span>
                                {notification.sender.isAdmin && (
                                  <span className="text-accent-600 font-medium">(Admin)</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </Link>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 text-accent-600 hover:text-accent-700 hover:bg-accent-100 rounded transition-all"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-error hover:text-red-700 hover:bg-red-100 rounded transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-accent-500 rounded-full shadow-sm"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
