export interface DueDateStatus {
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  isDueThisWeek: boolean;
  daysUntilDue: number;
  status: 'overdue' | 'due-today' | 'due-tomorrow' | 'due-this-week' | 'due-future' | 'no-due-date';
}

export const getDueDateStatus = (dueDate: string | undefined, status: string): DueDateStatus => {
  if (!dueDate || status === 'DONE') {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      isDueThisWeek: false,
      daysUntilDue: Infinity,
      status: 'no-due-date'
    };
  }

  const due = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  // Reset times for accurate date comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const timeDiff = due.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const isOverdue = due < today && due.toDateString() !== today.toDateString();
  const isDueToday = due.toDateString() === today.toDateString();
  const isDueTomorrow = due.toDateString() === tomorrow.toDateString();
  const isDueThisWeek = due <= endOfWeek && due >= today;

  let statusType: DueDateStatus['status'] = 'due-future';
  
  if (isOverdue) statusType = 'overdue';
  else if (isDueToday) statusType = 'due-today';
  else if (isDueTomorrow) statusType = 'due-tomorrow';
  else if (isDueThisWeek) statusType = 'due-this-week';

  return {
    isOverdue,
    isDueToday,
    isDueTomorrow,
    isDueThisWeek,
    daysUntilDue,
    status: statusType
  };
};

export const getDueDateBadgeColor = (status: DueDateStatus['status']) => {
  switch (status) {
    case 'overdue':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    case 'due-today':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    case 'due-tomorrow':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    case 'due-this-week':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case 'due-future':
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

export const getDueDateIcon = (status: DueDateStatus['status']) => {
  switch (status) {
    case 'overdue':
      return '🚨';
    case 'due-today':
      return '📅';
    case 'due-tomorrow':
      return '⏰';
    case 'due-this-week':
      return '📆';
    case 'due-future':
      return '📋';
    default:
      return '📅';
  }
};

export const getDueDateText = (dueDate: string, status: DueDateStatus['status'], daysUntilDue: number) => {
  switch (status) {
    case 'overdue':
      return `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
    case 'due-today':
      return 'Due today';
    case 'due-tomorrow':
      return 'Due tomorrow';
    case 'due-this-week':
      return `Due in ${daysUntilDue} days`;
    case 'due-future':
      return `Due ${new Date(dueDate).toLocaleDateString()}`;
    default:
      return `Due ${new Date(dueDate).toLocaleDateString()}`;
  }
};