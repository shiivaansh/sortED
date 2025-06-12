import React, { lazy, Suspense, memo } from 'react';
import { Loader } from 'lucide-react';

// Lazy load heavy components
const AIHub = lazy(() => import('../pages/AIHub'));
const EnhancedGPAPredictor = lazy(() => import('../pages/EnhancedGPAPredictor'));
const TeacherReports = lazy(() => import('../pages/teacher/TeacherReports'));

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = memo(({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
));

// HOC for lazy loading with custom loading message
export const withLazyLoading = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
  loadingMessage?: string
) => {
  return memo((props: any) => (
    <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  ));
};

// Optimized components
export const OptimizedAIHub = withLazyLoading(AIHub, 'Loading AI Hub...');
export const OptimizedGPAPredictor = withLazyLoading(EnhancedGPAPredictor, 'Loading GPA Predictor...');
export const OptimizedTeacherReports = withLazyLoading(TeacherReports, 'Loading Reports...');

// Memoized expensive components
export const MemoizedStudentCard = memo(({ student, onClick }: {
  student: any;
  onClick: (student: any) => void;
}) => (
  <div
    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    onClick={() => onClick(student)}
  >
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
        {student.name.charAt(0)}
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{student.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {student.studentId} • {student.class}
        </p>
      </div>
    </div>
  </div>
));

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  React.useEffect(() => {
    // Monitor page load performance
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Page Load Time:', entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      return () => observer.disconnect();
    }
  }, []);
};

// Virtual scrolling for large lists
export const VirtualizedList: React.FC<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
}> = memo(({ items, renderItem, itemHeight, containerHeight }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleStart * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});