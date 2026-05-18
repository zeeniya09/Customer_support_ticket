import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 260 }}>
        <Navbar />
        <main style={{ padding: 32 }} className="animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
