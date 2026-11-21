package in.thecreatestudio.backend.proposal;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import in.thecreatestudio.backend.config.AppProperties;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

/**
 * Renders proposals to PDF. The same layout is used for the preview (unsigned) and the
 * final agreement, which adds both signatures and an audit certificate page.
 */
@Service
class PdfService {

    private static final Color TEAL = new Color(0x0A, 0x43, 0x4B);
    private static final Color YELLOW = new Color(0xFF, 0xE0, 0x1B);
    private static final Color GREY = new Color(0x55, 0x60, 0x62);
    private static final DateTimeFormatter TS =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a 'IST'", Locale.ENGLISH).withZone(Proposal.BUSINESS_ZONE);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final Font h1 = new Font(Font.HELVETICA, 20, Font.BOLD, TEAL);
    private final Font h2 = new Font(Font.HELVETICA, 12, Font.BOLD, TEAL);
    private final Font body = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
    private final Font small = new Font(Font.HELVETICA, 8, Font.NORMAL, GREY);
    private final Font label = new Font(Font.HELVETICA, 8, Font.BOLD, GREY);
    private final Font bold = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);

    private final AppProperties props;

    PdfService(AppProperties props) {
        this.props = props;
    }

    byte[] render(Proposal p, List<ProposalEvent> events, boolean finalCopy) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 50, 50, 70, 60);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new Branding(p, finalCopy));
            doc.addTitle(p.getNumber() + " — " + p.getTitle());
            doc.addAuthor(props.companyName());
            doc.open();

            doc.add(new Paragraph(p.getTitle(), h1));
            doc.add(spacer(4));
            doc.add(new Paragraph("Proposal " + p.getNumber()
                    + (p.getValidUntil() != null ? "   ·   Valid until " + DATE.format(p.getValidUntil()) : ""), small));
            doc.add(spacer(14));

            PdfPTable parties = new PdfPTable(2);
            parties.setWidthPercentage(100);
            parties.addCell(partyCell("FROM", props.companyName(), "Digital Marketing · Websites · Mobile Apps"));
            String client = p.getClientName()
                    + (blank(p.getClientCompany()) ? "" : "\n" + p.getClientCompany())
                    + "\n" + p.getClientEmail()
                    + (blank(p.getClientPhone()) ? "" : "\n" + p.getClientPhone());
            parties.addCell(partyCell("PREPARED FOR", client, null));
            doc.add(parties);

            section(doc, "Overview", p.getSummary());
            section(doc, "Scope of Work & Deliverables", p.getScope());

            doc.add(heading("Investment"));
            PdfPTable money = new PdfPTable(new float[] {3, 2});
            money.setWidthPercentage(100);
            moneyRow(money, "Total project fee", formatMoney(p.getAmountPaise(), p.getCurrency()), true);
            if (p.getAdvancePaise() > 0) {
                moneyRow(money, "Advance payable on acceptance", formatMoney(p.getAdvancePaise(), p.getCurrency()), false);
                moneyRow(money, "Balance", formatMoney(p.getAmountPaise() - p.getAdvancePaise(), p.getCurrency()), false);
            }
            doc.add(money);

            section(doc, "Terms & Conditions", p.getTerms());

            doc.add(heading("Acceptance & Signatures"));
            PdfPTable sigs = new PdfPTable(2);
            sigs.setWidthPercentage(100);
            sigs.setSpacingBefore(6);
            sigs.addCell(signatureCell("For " + props.companyName(), p.getOwnerSignerName(), p.getOwnerSignature(), p.getOwnerSignedAt()));
            sigs.addCell(signatureCell("Client", p.getClientSignerName(), p.getClientSignature(), p.getClientSignedAt()));
            doc.add(sigs);

            if (finalCopy) {
                doc.newPage();
                certificate(doc, p, events);
            }
            doc.close();
        } catch (DocumentException e) {
            throw new IllegalStateException("Could not render PDF", e);
        }
        return out.toByteArray();
    }

    // ------------------------------------------------------------------ sections

    private void certificate(Document doc, Proposal p, List<ProposalEvent> events) throws DocumentException {
        doc.add(new Paragraph("Signature Certificate", h1));
        doc.add(spacer(6));
        doc.add(new Paragraph("This page records how and when this agreement was signed electronically.", small));
        doc.add(spacer(12));

        PdfPTable t = new PdfPTable(new float[] {2, 5});
        t.setWidthPercentage(100);
        kv(t, "Document", p.getNumber() + " — " + p.getTitle());
        kv(t, "Content fingerprint (SHA-256)", p.getContentHash());
        kv(t, "Signed by (company)", p.getOwnerSignerName() + " · " + ts(p.getOwnerSignedAt()) + " · IP " + nz(p.getOwnerSignedIp()));
        kv(t, "Signed by (client)", p.getClientSignerName() + " <" + p.getClientEmail() + "> · " + ts(p.getClientSignedAt())
                + " · IP " + nz(p.getClientSignedIp()));
        kv(t, "Terms accepted", ts(p.getTermsAcceptedAt()));
        kv(t, "Client device", nz(p.getClientUserAgent()));
        doc.add(t);

        doc.add(heading("Audit trail"));
        PdfPTable a = new PdfPTable(new float[] {2.2f, 1.6f, 1.2f, 3});
        a.setWidthPercentage(100);
        for (String h : new String[] {"Time", "Event", "By", "Details"}) a.addCell(headerCell(h));
        for (ProposalEvent e : events) {
            a.addCell(cell(ts(e.getCreatedAt()), small));
            a.addCell(cell(e.getType().replace('_', ' '), small));
            a.addCell(cell(e.getActor(), small));
            a.addCell(cell((e.getIp() == null ? "" : "IP " + e.getIp() + " ") + nz(e.getDetail()), small));
        }
        doc.add(a);
        doc.add(spacer(10));
        doc.add(new Paragraph("The content fingerprint is computed from the proposal text, amounts and validity at the time the company "
                + "signed it. Any change to that content would produce a different fingerprint.", small));
    }

    private void section(Document doc, String title, String text) throws DocumentException {
        doc.add(heading(title));
        for (String para : text.split("\\r?\\n")) {
            Paragraph p = new Paragraph(para.isBlank() ? " " : para, body);
            p.setLeading(14);
            p.setSpacingAfter(2);
            doc.add(p);
        }
    }

    private Paragraph heading(String text) {
        Paragraph p = new Paragraph(text.toUpperCase(Locale.ENGLISH), h2);
        p.setSpacingBefore(16);
        p.setSpacingAfter(6);
        return p;
    }

    private PdfPCell partyCell(String title, String value, String sub) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingBottom(8);
        c.addElement(new Paragraph(title, label));
        c.addElement(new Paragraph(value, bold));
        if (sub != null) c.addElement(new Paragraph(sub, small));
        return c;
    }

    private void moneyRow(PdfPTable t, String k, String v, boolean strong) {
        PdfPCell a = cell(k, strong ? bold : body);
        PdfPCell b = cell(v, strong ? bold : body);
        b.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(a);
        t.addCell(b);
    }

    private PdfPCell signatureCell(String role, String name, String dataUrl, Instant at) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.TOP);
        c.setBorderColor(Color.LIGHT_GRAY);
        c.setPadding(8);
        c.addElement(new Paragraph(role.toUpperCase(Locale.ENGLISH), label));
        if (dataUrl != null) {
            try {
                Image img = Image.getInstance(SignatureImage.decode(dataUrl));
                img.scaleToFit(170, 60);
                c.addElement(img);
            } catch (Exception e) {
                c.addElement(new Paragraph("[signature]", body));
            }
            c.addElement(new Paragraph(nz(name), bold));
            c.addElement(new Paragraph("Signed electronically · " + ts(at), small));
        } else {
            c.addElement(spacer(40));
            c.addElement(new Paragraph("Awaiting signature", small));
        }
        return c;
    }

    private void kv(PdfPTable t, String k, String v) {
        t.addCell(cell(k, label));
        t.addCell(cell(v, small));
    }

    private PdfPCell headerCell(String text) {
        PdfPCell c = cell(text, label);
        c.setBackgroundColor(new Color(0xEE, 0xF3, 0xF3));
        return c;
    }

    private PdfPCell cell(String text, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(nz(text), f));
        c.setBorderColor(new Color(0xDD, 0xE3, 0xE4));
        c.setPadding(6);
        return c;
    }

    private static Paragraph spacer(float h) {
        Paragraph p = new Paragraph(" ");
        p.setLeading(h);
        return p;
    }

    static String formatMoney(long paise, String currency) {
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.forLanguageTag("en-IN"));
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        String symbol = "INR".equals(currency) ? "Rs. " : currency + " ";
        return symbol + nf.format(paise / 100.0);
    }

    private static String ts(Instant i) {
        return i == null ? "—" : TS.format(i);
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    /** Header band (brand) and footer (page number + document id) on every page. */
    private class Branding extends PdfPageEventHelper {
        private final Proposal p;
        private final boolean finalCopy;

        Branding(Proposal p, boolean finalCopy) {
            this.p = p;
            this.finalCopy = finalCopy;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Rectangle page = document.getPageSize();
            cb.saveState();
            cb.setColorFill(TEAL);
            cb.rectangle(0, page.getHeight() - 40, page.getWidth(), 40);
            cb.fill();
            cb.setColorFill(YELLOW);
            cb.rectangle(50, page.getHeight() - 30, 34, 18);
            cb.fill();
            cb.restoreState();
            Font the = new Font(Font.HELVETICA, 10, Font.BOLD, TEAL);
            Font create = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase("THE", the), 54, page.getHeight() - 25, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(new Chunk("CREATE STUDIO", create)), 90, page.getHeight() - 26, 0);
            String status = finalCopy ? "SIGNED AGREEMENT" : (p.getStatus() == ProposalStatus.DRAFT ? "DRAFT PREVIEW" : "PROPOSAL");
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(status, new Font(Font.HELVETICA, 8, Font.BOLD, YELLOW)),
                    page.getWidth() - 50, page.getHeight() - 25, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(p.getNumber(), small), 50, 30, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase("Page " + writer.getPageNumber(), small),
                    page.getWidth() - 50, 30, 0);
        }
    }

}
