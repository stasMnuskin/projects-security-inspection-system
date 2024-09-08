import React from 'react';
import { Container,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box 
} from '@mui/material';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function FaultReport({ faults }) {
  const exportPDF = () => {
    const unit = "pt";
    const size = "A4";
    const orientation = "portrait";

    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(15);
    doc.text("דו״ח תקלות", 40, 40);

    const headers = [["מזהה", "אתר", "תיאור", "סטטוס", "חומרה", "זמן דיווח"]];

    const data = faults.map(fault => [
      fault.id, 
      fault.siteName,
      fault.description,
      fault.status,
      fault.severity,
      new Date(fault.reportedTime).toLocaleString()
    ]);

    let content = {
      startY: 50,
      head: headers,
      body: data
    };

    doc.autoTable(content);
    doc.save("fault_report.pdf");
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דו״ח תקלות
      </Typography>
      <Button onClick={exportPDF} variant="contained" color="primary" sx={{ mb: 2 }}>
        ייצא ל-PDF
      </Button>
      <TableContainer component={Paper} elevation={3}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>מזהה</TableCell>
              <TableCell>אתר</TableCell>
              <TableCell>תיאור</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>חומרה</TableCell>
              <TableCell>זמן דיווח</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.id}</TableCell>
                <TableCell>{fault.siteName}</TableCell>
                <TableCell>{fault.description}</TableCell>
                <TableCell>{fault.status}</TableCell>
                <TableCell>{fault.severity}</TableCell>
                <TableCell>{new Date(fault.reportedTime).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    </Container>
    
  );
}

export default FaultReport;