import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#18181b',
          color: '#f4f4f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '16px',
          }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '420px', marginBottom: '20px', lineHeight: 1.5 }}>
            An unexpected error occurred in ScribeCraft. You can try recovering or reloading the application.
          </p>
          {this.state.error?.message && (
            <pre style={{
              backgroundColor: '#121214',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#f87171',
              maxWidth: '520px',
              overflowX: 'auto',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 14px' }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 14px' }}
            >
              <RotateCcw size={14} style={{ marginRight: '6px' }} />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

