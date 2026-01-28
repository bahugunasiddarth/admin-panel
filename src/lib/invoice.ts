'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { OrderItemDoc } from '@/lib/types';

// Helper to safely parse numbers from strings/numbers
const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper to format addresses safely (handles strings vs objects)
const formatAddress = (addr: any, name: string) => {
    const lines = [name || 'Customer']; 
    
    if (!addr) {
        lines.push('N/A');
    } else if (typeof addr === 'string') {
        lines.push(addr);
    } else {
        // Handle object safely
        if (addr.street || addr.addressLine1 || addr.line1) 
            lines.push(addr.street || addr.addressLine1 || addr.line1);
        
        const cityStateZip = [
            addr.city || addr.town,
            addr.state || addr.province || addr.region,
            addr.zip || addr.postalCode || addr.pincode
        ].filter(Boolean).join(', ');
        
        if (cityStateZip) lines.push(cityStateZip);
        if (addr.country) lines.push(addr.country);
    }
    return lines.join('\n');
};

export function generateInvoicePdf(order: any, items: OrderItemDoc[]) {
  const doc = new jsPDF();

  // --- 1. HEADER ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('TAX INVOICE', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Khushi Gems and Jewels', 14, 26); 
  doc.text('anilsoni7104@gmail.com', 14, 30); 

  // --- 2. INVOICE DETAILS ---
  const orderId = order.orderId ? order.orderId.toUpperCase() : (order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A');
  
  let orderDate = 'N/A';
  if (order.orderDate) {
      // Handle both Firestore Timestamp and JS Date
      const dateObj = order.orderDate.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
      orderDate = format(dateObj, 'PPP');
  }

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const rightX = 196;
  doc.text(`Invoice No: #${orderId}`, rightX, 20, { align: 'right' });
  doc.text(`Date: ${orderDate}`, rightX, 25, { align: 'right' });
  doc.text(`Status: ${order.orderStatus || 'N/A'}`, rightX, 30, { align: 'right' });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 38, 196, 38);

  // --- 3. ADDRESSES ---
  const yAddr = 48;
  const customerName = order.customer?.name || 'Valued Customer';
  
  // Billing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Billed To:', 14, yAddr);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  const billingText = formatAddress(order.billingAddress, customerName);
  doc.text(billingText, 14, yAddr + 6);

  // Shipping
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Shipped To:', 110, yAddr);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const shippingText = formatAddress(order.shippingAddress, customerName);
  doc.text(shippingText, 110, yAddr + 6);

  // --- 4. ITEMS TABLE with GST ---
  let totalTax = 0;
  let subTotalBeforeTax = 0;

  const tableBody = items.map((item: any) => {
      // 1. Get Price (Check all possible fields)
      const price = parseNumber(item.itemPrice || item.price || item.unitPrice || item.amount || 0);
      const quantity = parseNumber(item.quantity || item.qty || 0);
      
      // 2. GST Logic
      let gstPercent = 0;

      // Check explicit tax fields first
      if (item.gst || item.tax) {
          gstPercent = parseNumber(item.gst || item.tax);
      } 
      // Check explicit type
      else if (item.type === 'gold' || item.type === 'silver') {
          gstPercent = 3;
      }
      // Check Name for keywords
      else if (item.name && /gold|silver|diamond|ring|chain|necklace/i.test(item.name)) {
          gstPercent = 3;
      }
      // FALLBACK: If price exists, default to 3% (Jewelry Standard)
      else if (price > 0) {
          gstPercent = 3;
      }
      
      const baseTotal = price * quantity;
      const taxAmount = (baseTotal * gstPercent) / 100;
      const totalItem = baseTotal + taxAmount;

      subTotalBeforeTax += baseTotal;
      totalTax += taxAmount;

      return [
          item.name || 'Item',
          quantity,
          `Rs. ${price.toFixed(2)}`,
          `${gstPercent}%`,
          `Rs. ${taxAmount.toFixed(2)}`,
          `Rs. ${totalItem.toFixed(2)}`
      ];
  });

  // Generate Table
  autoTable(doc, {
    startY: 85,
    head: [['Item', 'Qty', 'Unit Price', 'GST %', 'GST Amt', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
        0: { cellWidth: 'auto' }, 
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
    },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // --- 5. TOTALS SUMMARY ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = 140; 
  const valueX = 196;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text('Subtotal:', summaryX, finalY);
  doc.text(`Rs. ${subTotalBeforeTax.toFixed(2)}`, valueX, finalY, { align: 'right' });

  doc.text('Total GST:', summaryX, finalY + 6);
  doc.text(`Rs. ${totalTax.toFixed(2)}`, valueX, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', summaryX, finalY + 14);
  doc.text(`Rs. ${(subTotalBeforeTax + totalTax).toFixed(2)}`, valueX, finalY + 14, { align: 'right' });

  // --- 6. FOOTER ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for shopping with Khushi Jewels!', 105, doc.internal.pageSize.height - 15, { align: 'center' });

  doc.save(`invoice_${orderId}.pdf`);
}