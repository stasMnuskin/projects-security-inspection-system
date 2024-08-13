import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewInspection = () => {
  const [site, setSite] = useState('');
  const [type, setType] = useState('');
  const [details, setDetails] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/inspections`, 
        { site, type, details: JSON.parse(details) },
        { headers: { 'x-auth-token': token } }
      );
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating inspection', error.response?.data || error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        New Inspection
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="site"
          label="Site"
          name="site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="type"
          label="Type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="details"
          label="Details (JSON format)"
          name="details"
          multiline
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          Create Inspection
        </Button>
      </form>
    </Container>
  );
};

export default NewInspection;