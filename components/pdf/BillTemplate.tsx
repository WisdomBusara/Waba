
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice, PdfSettings } from '../../types';
import { DEFAULT_PDF_SETTINGS } from '../../lib/pdfSettings';

// Convert styles to a function to accept dynamic theme color
const createStyles = (settings: PdfSettings) => {
    const themeColor = settings.themeColor || DEFAULT_PDF_SETTINGS.themeColor;
    return StyleSheet.create({
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
        borderBottomColor: themeColor,
        paddingBottom: 10,
      },
      companyDetails: {
        textAlign: 'left',
      },
      companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: themeColor,
        fontFamily: 'Helvetica-Bold',
      },
      logo: {
        height: 40,
        marginBottom: 5,
        maxWidth: 150,
      },
      invoiceTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#1e3a8a', // Keeping this dark blue for contrast
        fontFamily: 'Helvetica-Bold',
      },
      invoiceInfo: {
        fontSize: 10,
        textAlign: 'right',
        color: '#555555',
      },
      customerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
      },
      billTo: {
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: 'Helvetica-Bold',
      },
      table: {
        width: '100%',
        marginBottom: 30,
      },
      tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      tableHeaderCell: {
        padding: 8,
        fontWeight: 'bold',
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
      },
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      tableCell: {
        padding: 8,
        fontSize: 10,
      },
      descriptionCell: { width: '55%' },
      quantityCell: { width: '15%', textAlign: 'right' },
      unitPriceCell: { width: '15%', textAlign: 'right' },
      totalCell: { width: '15%', textAlign: 'right' },
      totals: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
      },
      totalsContainer: {
        width: '40%',
      },
      totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
      },
      totalDueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        marginTop: 8,
        backgroundColor: `${themeColor}20`, // Lighter version of theme color
        borderRadius: 4,
      },
      totalsLabel: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
      },
      totalDueLabel: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
        color: themeColor,
      },
      totalDueValue: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
        color: themeColor,
      },
      footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        color: '#888888',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
      },
    });
};

interface BillTemplateProps {
  invoice: Invoice;
  settings?: PdfSettings;
}

const BillTemplate: React.FC<BillTemplateProps> = ({ invoice, settings = DEFAULT_PDF_SETTINGS }) => {
    const styles = createStyles(settings);
    const footerText = (settings.footerText || DEFAULT_PDF_SETTINGS.footerText!)
        .replace('{ACCOUNT_NUMBER}', invoice.customerAccount);

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.companyDetails}>
              {settings.logo ? (
                <Image src={settings.logo} style={styles.logo} />
              ) : (
                <Text style={styles.companyName}>WABA</Text>
              )}
              <Text>P.O. Box 12345-00100, Nairobi</Text>
              <Text>Phone: +254 700 000 000</Text>
              <Text>Email: billing@splashdash.co.ke</Text>
            </View>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceInfo}>Invoice #: {invoice.id}</Text>
              <Text style={styles.invoiceInfo}>Date: {invoice.issueDate}</Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <View>
              <Text style={styles.billTo}>Bill To:</Text>
              <Text>{invoice.customerName}</Text>
              <Text>{invoice.customerAddress}</Text>
              <Text>Account #: {invoice.customerAccount}</Text>
            </View>
            <View style={{textAlign: 'right'}}>
                <Text style={styles.billTo}>Due Date:</Text>
                <Text>{invoice.dueDate}</Text>
            </View>
          </View>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Quantity</Text>
              <Text style={[styles.tableHeaderCell, styles.unitPriceCell]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total (KES)</Text>
            </View>
            {invoice.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.descriptionCell]}>{item.description}</Text>
                    <Text style={[styles.tableCell, styles.quantityCell]}>{item.quantity.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.unitPriceCell]}>{item.unitPrice.toLocaleString()}</Text>
                    <Text style={[styles.tableCell, styles.totalCell]}>{item.total.toLocaleString()}</Text>
                </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalsContainer}>
                <View style={styles.totalsRow}>
                    <Text>Subtotal</Text>
                    <Text>{invoice.subtotal.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</Text>
                </View>
                <View style={styles.totalsRow}>
                    <Text>Penalties</Text>
                    <Text>{invoice.penalties.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</Text>
                </View>
                <View style={styles.totalDueRow}>
                    <Text style={styles.totalDueLabel}>Total Due</Text>
                    <Text style={styles.totalDueValue}>{invoice.total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</Text>
                </View>
            </View>
          </View>
          
          <View style={styles.footer}>
            {footerText.split('\n').map((line, index) => (
                <Text key={index}>{line}</Text>
            ))}
          </View>
        </Page>
      </Document>
    );
}

export default BillTemplate;
