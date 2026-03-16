import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { RecentPayment } from '../../types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    paddingBottom: 10,
  },
  companyDetails: {
    textAlign: 'left',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
  receiptTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#14532d',
    fontFamily: 'Helvetica-Bold',
  },
  receiptInfo: {
    fontSize: 10,
    textAlign: 'right',
    color: '#555555',
  },
  paymentInfo: {
    marginBottom: 30,
  },
  paidBy: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    padding: 20,
    marginBottom: 30,
  },
  summaryText: {
    fontSize: 12,
    marginBottom: 10,
  },
  amountPaid: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14532d',
    fontFamily: 'Helvetica-Bold',
  },
  detailsTable: {
      width: '100%',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailsLabel: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#888888',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface ReceiptTemplateProps {
  payment: RecentPayment;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ payment }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.companyDetails}>
          <Text style={styles.companyName}>WABA</Text>
          <Text>P.O. Box 12345-00100, Nairobi</Text>
          <Text>Phone: +254 700 000 000</Text>
        </View>
        <View>
          <Text style={styles.receiptTitle}>RECEIPT</Text>
          <Text style={styles.receiptInfo}>Receipt #: RPT-{payment.id}</Text>
          <Text style={styles.receiptInfo}>Date: {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paidBy}>Payment From:</Text>
        <Text>{payment.customerName}</Text>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Amount Paid:</Text>
        <Text style={styles.amountPaid}>
            {payment.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
        </Text>
      </View>

      <View style={styles.detailsTable}>
        <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Payment For Invoice</Text>
            <Text>{payment.invoiceId}</Text>
        </View>
        <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Payment Method</Text>
            <Text>{payment.method}</Text>
        </View>
         <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Transaction Date</Text>
            <Text>{payment.date}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text>Thank you for your payment!</Text>
        <Text>Your account balance has been updated.</Text>
      </View>
    </Page>
  </Document>
);

export default ReceiptTemplate;