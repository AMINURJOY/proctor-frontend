import { useLocation } from 'react-router';

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split('/')[1];

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#e0e7ff' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0b2652" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2 className="text-3xl mb-2 capitalize" style={{ color: '#0b2652' }}>
          {pageName} Page
        </h2>
        <p className="text-gray-600">
          This section is under development
        </p>
      </div>
    </div>
  );
}
