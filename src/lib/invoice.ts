'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { Order, OrderItemDoc } from '@/lib/types';

// Extend the jsPDF type to include the autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateInvoicePdf(order: Order, items: OrderItemDoc[]) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gleaming Admin', 14, 30);

  // Order Details
  const orderId = order.orderId ? order.orderId.slice(0, 6).toUpperCase() : order.id.slice(0, 6).toUpperCase();
  const orderDate = order.orderDate ? format(order.orderDate.toDate(), 'PPP') : 'N/A';
  doc.text(`Invoice #: ${orderId}`, 196, 22, { align: 'right' });
  doc.text(`Date: ${orderDate}`, 196, 30, { align: 'right' });
  
  doc.setLineWidth(0.1);
  doc.line(14, 35, 196, 35);

  // Addresses
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const billingAddress = order.billingAddress;
  const billingAddressText = [
    order.customer.name,
    billingAddress?.street,
    `${billingAddress?.city || ''}, ${billingAddress?.state || ''} ${billingAddress?.zip || ''}`,
    billingAddress?.country
  ].filter(Boolean).join('\n');
  doc.text(billingAddressText, 14, 52);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ship To:', 110, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const shippingAddress = order.shippingAddress;
  const shippingAddressText = [
    order.customer.name,
    shippingAddress?.street,
    `${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} ${shippingAddress?.zip || ''}`,
    shippingAddress?.country
  ].filter(Boolean).join('\n');
  doc.text(shippingAddressText, 110, 52);

  // Items Table
  const tableBody = items.map(item => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return [
          item.name,
          quantity,
          `₹${price.toFixed(2)}`,
          `₹${(price * quantity).toFixed(2)}`
      ];
  });

  doc.autoTable({
    startY: 80,
    head: [['Item', 'Quantity', 'Unit Price', 'Subtotal']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 150, finalY + 10, { align: 'left' });
  doc.text(`₹${(order.totalAmount || 0).toFixed(2)}`, 196, finalY + 10, { align: 'right' });
  
  // Footer
  doc.setLineWidth(0.1);
  doc.line(14, doc.internal.pageSize.height - 30, 196, doc.internal.pageSize.height - 30);
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, doc.internal.pageSize.height - 20, { align: 'center' });


  // Save the PDF
  doc.save(`invoice-${orderId}.pdf`);
}
