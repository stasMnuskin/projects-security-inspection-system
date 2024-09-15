import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPdf = (faults, siteName) => {
  const doc = new jsPDF();
  doc.text(`Fault Report for ${siteName}`, 14, 15);
  
  const rows = faults.map(fault => [
    fault.id,
    fault.description,
    fault.status,
    new Date(fault.createdAt).toLocaleDateString(),
  ]);

  doc.autoTable({
    head: [['ID', 'Description', 'Status', 'Created At']],
    body: rows,
    startY: 20
  });

  doc.save(`fault_report_${siteName}.pdf`);
};

export const exportToExcel = (faults, siteName) => {
  const ws = XLSX.utils.json_to_sheet(faults);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Faults");
  XLSX.writeFile(wb, `fault_report_${siteName}.xlsx`);
};