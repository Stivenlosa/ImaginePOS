import { usePaymentNotifications }
  from "../../app/hooks/usePaymentNotifications";

export default function PaymentAnnouncer() {

  usePaymentNotifications();

  return null;
}