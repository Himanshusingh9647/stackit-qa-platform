// Utility functions for date formatting

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format: "Dec 15, 2024 at 2:30 PM"
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleDateString('en-US', options).replace(',', ' at');
};

export const formatDateTimeShort = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
  
  // If less than 1 hour, show relative time
  if (diffInMinutes < 60) {
    if (diffInMinutes < 1) {
      return 'Just now';
    }
    return `${Math.floor(diffInMinutes)} min ago`;
  }
  
  // If same day, show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }
  
  // If this year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Show full date
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatDateTimeRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.abs(now.getTime() - date.getTime()) / 1000;
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = diffInSeconds / 60;
  if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} min ago`;
  }
  
  const diffInHours = diffInMinutes / 60;
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = diffInHours / 24;
  if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} day${Math.floor(diffInDays) !== 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = diffInDays / 7;
  if (diffInWeeks < 4) {
    return `${Math.floor(diffInWeeks)} week${Math.floor(diffInWeeks) !== 1 ? 's' : ''} ago`;
  }
  
  // For older dates, show exact date
  return formatDateTime(dateString);
};
