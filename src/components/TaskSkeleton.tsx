// src/components/TaskSkeleton.tsx
// Loading skeleton for tasks

export default function TaskSkeleton() {
  return (
    <div className="border p-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="flex items-center mt-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24 ml-3"></div>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <div className="h-8 bg-gray-200 rounded w-12"></div>
          <div className="h-8 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}