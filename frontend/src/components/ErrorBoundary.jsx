import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          margin: '2rem auto',
          maxWidth: '600px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            {this.props.title || "Something went wrong"}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {this.state.error?.message || "An unexpected error occurred while loading this section."}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={this.handleReset}>
              Retry / Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
