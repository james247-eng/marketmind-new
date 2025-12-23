// ContentHistory.jsx
// View previously generated content

import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FileText } from 'lucide-react';
import './ContentHistory.css';

function ContentHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-area">
          <div className="page-header">
            <div>
              <h1>Content History</h1>
              <p>View and manage your previously generated content</p>
            </div>
          </div>

          <div className="empty-state">
            <FileText size={64} className="empty-icon" />
            <h2>No content yet</h2>
            <p>Generate your first piece of content to see it here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ContentHistory;