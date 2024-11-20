import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const exportToCSV = (data, filename) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (data, filename) => {
  const doc = new jsPDF();
  doc.text("Entrepreneur Dashboard Report", 14, 15);
  
  let yOffset = 30;

  // Add open faults table
  doc.text("Open Faults", 14, yOffset);
  doc.autoTable({
    startY: yOffset + 5,
    head: [["Component", "Status", "Reported Time", "Description", "Site Name"]],
    body: data.openFaults.map(fault => [
      fault.location,
      fault.status,
      new Date(fault.reportedTime).toLocaleString(),
      fault.description,
      fault.siteName
    ]),
  });

  yOffset = doc.lastAutoTable.finalY + 10;

  // Add recurring faults table
  doc.text("Recurring Faults", 14, yOffset);
  doc.autoTable({
    startY: yOffset + 5,
    head: [["Component", "Description", "Occurrences", "Site Name"]],
    body: data.recurringFaults.map(fault => [
      fault.location,
      fault.description,
      fault.occurrences,
      fault.siteName
    ]),
  });

  yOffset = doc.lastAutoTable.finalY + 10;

  // Add site statistics table
  doc.text("Site Statistics", 14, yOffset);
  doc.autoTable({
    startY: yOffset + 5,
    head: [["Site", "Fault Count", "Open Faults", "Avg Repair Time", "Recurring Faults", "Avg Response Time"]],
    body: data.siteStatistics.map(stat => [
      stat.name,
      stat.faultCount,
      stat.openFaultCount,
      `${stat.averageRepairTime.toFixed(2)} hours`,
      stat.recurringFaultCount,
      `${stat.averageResponseTime.toFixed(2)} hours`
    ]),
  });

  doc.save(filename);
};

export const exportToExcel = (data, filename) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const convertToCSV = (data) => {
  const header = "Component,Status,Reported Time,Description,Site Name\n";
  const rows = data.map(fault => 
    `${fault.location},${fault.status},${new Date(fault.reportedTime).toLocaleString()},${fault.description},${fault.siteName}`
  ).join("\n");
  return header + rows;
};