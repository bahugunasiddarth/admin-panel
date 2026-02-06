import { format } from "date-fns";
import { Product } from "./types";

export const calculateDeliveryRange = (availability: string, orderDate?: any) => {
  // Use provided order date or fallback to now
  const baseDate = orderDate?.toDate ? orderDate.toDate() : new Date();
  
  let minDays = 0;
  let maxDays = 0;

  if (availability === 'READY TO SHIP') {
    minDays = 8;
    maxDays = 10;
  } else {
    // MADE TO ORDER
    minDays = 25;
    maxDays = 28;
  }

  const minDate = new Date(baseDate);
  minDate.setDate(baseDate.getDate() + minDays);

  const maxDate = new Date(baseDate);
  maxDate.setDate(baseDate.getDate() + maxDays);

  return {
    estimatedRange: `${format(minDate, 'dd MMM')} - ${format(maxDate, 'dd MMM')}`,
    isOverdue: new Date() > maxDate,
    maxDate
  };
};