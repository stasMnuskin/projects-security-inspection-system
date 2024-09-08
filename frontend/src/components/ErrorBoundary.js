import React from 'react';
import { Typography, Container } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
          <Typography variant="h4" color="error" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>Something went wrong.</Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'primary.main' }}>{this.state.error && this.state.error.toString()}</Typography>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;