import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application rendering failed.', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error">
          <section className="app-error__card">
            <h1>Something went wrong</h1>
            <p>This page could not be displayed. Reload the application or return home.</p>
            <a href="/">Return to AgriHerd</a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
