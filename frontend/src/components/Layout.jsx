import React from 'react';
import { FiActivity, FiLogOut } from 'react-icons/fi';

function Layout({ children, user, onLogout }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <FiActivity className="header-icon" />
          <h1>OneGeo</h1>
          <span className="header-subtitle">Well Log Analyzer</span>
        </div>
        {user && (
          <div className="header-user">
            <span className="user-name">{user.name}</span>
            <button className="btn btn-outline btn-small" onClick={onLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export default Layout;
