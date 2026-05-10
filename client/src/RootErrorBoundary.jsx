import { Component } from 'react';

export default class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: '1.75rem',
            maxWidth: 640,
            margin: '0 auto',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.5,
          }}
        >
          <h1 style={{ fontSize: '1.2rem', marginTop: 0 }}>Something went wrong</h1>
          <p style={{ color: '#444' }}>
            The app crashed while loading. Open the browser developer console (F12 → Console) for
            details. If you just deployed a build, confirm JavaScript assets load (correct host and
            path) and that the API is reachable.
          </p>
          <pre
            style={{
              background: '#f4f4f5',
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.8rem',
              borderRadius: 8,
            }}
          >
            {this.state.error?.stack || String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
