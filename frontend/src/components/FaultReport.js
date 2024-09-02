import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button 
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
    doc.text("Fault Report", 40, 40);

    const headers = [["ID", "Site", "Description", "Status", "Severity", "Reported Time"]];

    const data = faults.map(fault=> [
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
    <div>
      <Button onClick={exportPDF} variant="contained" color="primary">
        Export to PDF
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Reported Time</TableCell>
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
    </div>
  );
}

export default FaultReport;