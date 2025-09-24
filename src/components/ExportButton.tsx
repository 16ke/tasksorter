'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ExportButtonProps {
  currentFilters: {
    status?: string;
    priority?: string;
    categoryId?: string;
  };
  selectedTaskIds?: string[];
  totalTasksCount?: number;
}

interface ExportFilters {
  format: 'json' | 'csv';
  status: string;
  priority: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  exportMethod: 'selected' | 'filtered' | 'all';
}

export default function ExportButton({ currentFilters, selectedTaskIds = [], totalTasksCount = 0 }: ExportButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    format: 'csv',
    status: currentFilters.status || 'ALL',
    priority: currentFilters.priority || 'ALL',
    categoryId: currentFilters.categoryId || 'ALL',
    startDate: '',
    endDate: '',
    exportMethod: selectedTaskIds.length > 0 ? 'selected' : 'filtered'
  });

  const handleExport = async () => {
    if (!session) return;

    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add format and export method
      queryParams.append('format', filters.format);
      queryParams.append('exportMethod', filters.exportMethod);

      // Add filters based on export method
      if (filters.exportMethod === 'selected' && selectedTaskIds.length > 0) {
        // Export selected tasks - send task IDs
        selectedTaskIds.forEach(id => queryParams.append('taskIds', id));
      } else {
        // Export by filters - send filter parameters
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'ALL' && key !== 'format' && key !== 'exportMethod') {
            queryParams.append(key, value);
          }
        });
      }

      const response = await fetch(`/api/tasks/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (filters.format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate export counts for preview
  const getExportPreviewText = () => {
    switch (filters.exportMethod) {
      case 'selected':
        return `Export ${selectedTaskIds.length} selected task${selectedTaskIds.length !== 1 ? 's' : ''}`;
      case 'filtered':
        const filteredCount = Math.min(totalTasksCount, 1000); // Reasonable estimate
        return `Export ${filteredCount} task${filteredCount !== 1 ? 's' : ''} matching current filters`;
      case 'all':
        return `Export all ${totalTasksCount} tasks`;
      default:
        return 'Export tasks';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 border border-gold-lg font-body"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Tasks
        {selectedTaskIds.length > 0 && (
          <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full border border-gold">
            {selectedTaskIds.length}
          </span>
        )}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-gold-lg rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground font-elegant">Export Tasks</h3>
            
            {/* Export Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 border-gold-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200 font-medium font-body">
                {getExportPreviewText()}
              </div>
            </div>

            <div className="space-y-4">
              {/* Export Method Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-body">
                  What to Export
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="selected"
                      checked={filters.exportMethod === 'selected'}
                      onChange={(e) => setFilters({ ...filters, exportMethod: e.target.value as 'selected' })}
                      disabled={selectedTaskIds.length === 0}
                      className="text-[var(--turquoise-500)] focus:ring-[var(--turquoise-500)] bg-card border-gold-lg"
                    />
                    <span className={`text-sm ${selectedTaskIds.length === 0 ? 'text-muted' : 'text-foreground'} font-body`}>
                      Selected tasks ({selectedTaskIds.length} selected)
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="filtered"
                      checked={filters.exportMethod === 'filtered'}
                      onChange={(e) => setFilters({ ...filters, exportMethod: e.target.value as 'filtered' })}
                      className="text-[var(--turquoise-500)] focus:ring-[var(--turquoise-500)] bg-card border-gold-lg"
                    />
                    <span className="text-sm text-foreground font-body">
                      Tasks matching current filters
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="all"
                      checked={filters.exportMethod === 'all'}
                      onChange={(e) => setFilters({ ...filters, exportMethod: e.target.value as 'all' })}
                      className="text-[var(--turquoise-500)] focus:ring-[var(--turquoise-500)] bg-card border-gold-lg"
                    />
                    <span className="text-sm text-foreground font-body">
                      All tasks ({totalTasksCount} total)
                    </span>
                  </label>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 font-body">
                  Format
                </label>
                <select
                  value={filters.format}
                  onChange={(e) => setFilters({ ...filters, format: e.target.value as 'json' | 'csv' })}
                  className="w-full p-2 rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent border-gold-lg font-body"
                >
                  <option value="csv">CSV (Excel compatible)</option>
                  <option value="json">JSON (Developer friendly)</option>
                </select>
              </div>

              {/* Filters (only show when exporting by filters) */}
              {filters.exportMethod === 'filtered' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 font-body">
                      Status Filter
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full p-2 rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent border-gold-lg font-body"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 font-body">
                      Priority Filter
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full p-2 rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent border-gold-lg font-body"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-body">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full p-2 rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent border-gold-lg font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-body">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full p-2 rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent border-gold-lg font-body"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleExport}
                disabled={isExporting || (filters.exportMethod === 'selected' && selectedTaskIds.length === 0)}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium border border-gold-lg font-body"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium border border-gold-lg font-body"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}