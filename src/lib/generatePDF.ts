import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ReportData = {
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  pieChartElement: HTMLElement | null;
  lineChartElement: HTMLElement | null;
  recentSales: {
    tableNumber: string;
    space: string;
    customerName: string | null;
    createdAt: string;
    total: number;
  }[];
};

export async function generatePDF(data: ReportData) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Add header
  pdf.setFontSize(20);
  pdf.text("Sathi ko Chiya - Sales Report", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Add date range
  pdf.setFontSize(12);
  if (data.dateRange.from && data.dateRange.to) {
    const dateText = `Report Period: ${data.dateRange.from.toLocaleDateString()} - ${data.dateRange.to.toLocaleDateString()}`;
    pdf.text(dateText, pageWidth / 2, yPos, { align: "center" });
  } else {
    pdf.text("Report Period: All Time", pageWidth / 2, yPos, {
      align: "center",
    });
  }
  yPos += 20;

  // Add summary section
  pdf.setFontSize(14);
  pdf.text("Summary", 20, yPos);
  yPos += 10;

  pdf.setFontSize(12);
  const summaryData = [
    ["Total Sales:", data.totalSales.toString()],
    ["Total Revenue:", `Rs. ${data.totalRevenue.toFixed(2)}`],
    ["Total Expenses:", `Rs. ${data.totalExpenses.toFixed(2)}`],
    [
      "Net Profit:",
      `Rs. ${(data.totalRevenue - data.totalExpenses).toFixed(2)}`,
    ],
  ];

  summaryData.forEach((row) => {
    pdf.text(row[0], 30, yPos);
    pdf.text(row[1], 100, yPos);
    yPos += 8;
  });
  yPos += 10;

  // Add charts if available
  if (data.pieChartElement && data.lineChartElement) {
    // Sales by Menu Item chart
    pdf.text("Sales by Menu Item", 20, yPos);
    yPos += 10;
    const pieChartCanvas = await html2canvas(data.pieChartElement);
    const pieChartImage = pieChartCanvas.toDataURL("image/png");
    pdf.addImage(pieChartImage, "PNG", 20, yPos, 80, 60);

    // Sales Over Time chart
    pdf.text("Sales Over Time", pageWidth / 2 + 10, yPos - 10);
    const lineChartCanvas = await html2canvas(data.lineChartElement);
    const lineChartImage = lineChartCanvas.toDataURL("image/png");
    pdf.addImage(lineChartImage, "PNG", pageWidth / 2 + 10, yPos, 80, 60);
    yPos += 70;
  }

  // Add recent sales table
  yPos += 10;
  pdf.text("Recent Sales", 20, yPos);
  yPos += 10;

  // Table headers
  const headers = ["Table", "Space", "Customer", "Date", "Total"];
  const columnWidths = [20, 25, 40, 35, 30];
  let xPos = 20;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(xPos, yPos - 5, pageWidth - 40, 8, "F");
  headers.forEach((header, index) => {
    pdf.text(header, xPos, yPos);
    xPos += columnWidths[index];
  });
  yPos += 8;

  // Table rows
  data.recentSales.forEach((sale) => {
    // Check if we need a new page
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    xPos = 20;
    pdf.text(sale.tableNumber, xPos, yPos);
    xPos += columnWidths[0];
    pdf.text(sale.space, xPos, yPos);
    xPos += columnWidths[1];
    pdf.text(sale.customerName || "N/A", xPos, yPos);
    xPos += columnWidths[2];
    pdf.text(new Date(sale.createdAt).toLocaleDateString(), xPos, yPos);
    xPos += columnWidths[3];
    pdf.text(`Rs. ${sale.total.toFixed(2)}`, xPos, yPos);
    yPos += 8;
  });

  // Add footer
  pdf.setFontSize(10);
  const footerText = `Generated on ${new Date().toLocaleString()}`;
  pdf.text(footerText, pageWidth / 2, 285, { align: "center" });

  return pdf;
}
