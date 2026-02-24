import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
