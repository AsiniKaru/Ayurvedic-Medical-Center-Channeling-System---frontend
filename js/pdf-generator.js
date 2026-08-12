/**
 * Hela Osu Channeling System - PDF Generator & Print Engine
 * Handles e-Receipts and Digital Prescription document rendering
 */

class PDFGenerator {
    /**
     * Generate HTML for E-Channeling Receipt
     */
    renderReceiptHTML(appointment) {
        return `
            <div class="printable-document" id="receipt-doc">
                <div class="doc-header-banner">
                    <div>
                        <h2 style="color: #0d7a5f; margin-bottom: 0.25rem;">🌿 HELA OSU WEDA GEDARA</h2>
                        <p style="font-size: 0.85rem; color: #64748b;">Official E-Channeling Receipt & Token Voucher</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: #0d7a5f; color: white; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 800;">
                            TOKEN #${appointment.tokenNo}
                        </span>
                        <p style="font-size: 0.8rem; margin-top: 0.4rem; color: #475569;">Receipt No: ${appointment.id}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 10px;">
                    <div>
                        <h4 style="color: #334155; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.5rem;">Patient Details</h4>
                        <p><strong>Name:</strong> ${appointment.patientName}</p>
                        <p><strong>Phone:</strong> ${appointment.patientPhone}</p>
                        <p><strong>Booking ID:</strong> ${appointment.id}</p>
                    </div>
                    <div>
                        <h4 style="color: #334155; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.5rem;">Appointment Details</h4>
                        <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
                        <p><strong>Specialization:</strong> ${appointment.specialization}</p>
                        <p><strong>Hospital:</strong> ${appointment.hospital}</p>
                        <p><strong>Date & Time:</strong> ${appointment.date} | ${appointment.timeSlot}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #f1f5f9; text-align: left;">
                            <th style="padding: 0.75rem; border-bottom: 1px solid #cbd5e1;">Description</th>
                            <th style="padding: 0.75rem; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">Doctor Channeling Fee</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${appointment.doctorFee.toLocaleString()}.00</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">Hospital & Processing Fee</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${appointment.hospitalFee.toLocaleString()}.00</td>
                        </tr>
                        <tr style="background: #f8fafc; font-weight: bold; font-size: 1.1rem; color: #0d7a5f;">
                            <td style="padding: 0.85rem;">Total Paid</td>
                            <td style="padding: 0.85rem; text-align: right;">Rs. ${appointment.totalFee.toLocaleString()}.00</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 60px; height: 60px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; border-radius: 6px; text-align: center;">
                            [QR CODE<br>VERIFIED]
                        </div>
                        <p style="font-size: 0.8rem; color: #64748b;">
                            Payment Status: <strong style="color: #10b981;">${appointment.paymentStatus} (${appointment.paymentMethod})</strong><br>
                            Issue Date: ${appointment.createdAt}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 0.85rem; font-weight: bold; color: #0d7a5f;">Hela Osu Verified Voucher</p>
                        <p style="font-size: 0.75rem; color: #94a3b8;">Present this token voucher at hospital reception</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for Digital Medical Prescription
     */
    renderPrescriptionHTML(appointment) {
        const p = appointment.prescription;
        if (!p) return '<p>No prescription issued for this appointment yet.</p>';

        const medicinesHTML = p.medicines.map((med, idx) => `
            <tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0d7a5f;">${idx + 1}. ${med.name}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">${med.dosage}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">${med.duration}</td>
            </tr>
        `).join('');

        return `
            <div class="printable-document" id="prescription-doc">
                <div class="doc-header-banner">
                    <div>
                        <h2 style="color: #0d7a5f; margin-bottom: 0.25rem;">🌿 HELA OSU CLINICAL PRESCRIPTION</h2>
                        <p style="font-size: 0.85rem; color: #64748b;">Digital Health Record & Medical Advice</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-weight: bold; color: #334155;">${appointment.doctorName}</p>
                        <p style="font-size: 0.8rem; color: #0d7a5f;">${appointment.specialization}</p>
                        <p style="font-size: 0.75rem; color: #64748b;">${appointment.hospital}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
                    <div><strong>Patient Name:</strong> ${appointment.patientName}</div>
                    <div><strong>Date:</strong> ${p.issuedDate || appointment.date}</div>
                    <div><strong>Token #:</strong> ${appointment.tokenNo}</div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #1e293b; border-bottom: 2px solid #0d7a5f; padding-bottom: 0.3rem; margin-bottom: 0.6rem;">Clinical Diagnosis</h4>
                    <p style="background: #ecfdf5; padding: 0.85rem; border-radius: 6px; color: #065f46; font-weight: 500;">
                        ${p.diagnosis}
                    </p>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #1e293b; border-bottom: 2px solid #0d7a5f; padding-bottom: 0.3rem; margin-bottom: 0.6rem;">Prescribed Medicines & Dosage</h4>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
                        <thead>
                            <tr style="background: #f1f5f9; text-align: left; font-size: 0.85rem;">
                                <th style="padding: 0.75rem;">Medicine / Herbal Recipe</th>
                                <th style="padding: 0.75rem;">Dosage & Frequency</th>
                                <th style="padding: 0.75rem;">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${medicinesHTML}
                        </tbody>
                    </table>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #1e293b; border-bottom: 2px solid #0d7a5f; padding-bottom: 0.3rem; margin-bottom: 0.6rem;">Special Instructions & Dietary Advice</h4>
                    <p style="color: #475569; line-height: 1.6;">${p.doctorNotes || 'Take medications regularly as directed. Avoid oily foods and maintain good hydration.'}</p>
                </div>

                <div style="display: flex; align-items: flex-end; justify-content: space-between; padding-top: 1.5rem; border-top: 1px solid #cbd5e1;">
                    <div style="font-size: 0.75rem; color: #94a3b8;">
                        Digital Signature Authenticated by Hela Osu System.<br>
                        Reg No: ${appointment.doctorId}
                    </div>
                    <div style="text-align: center;">
                        <div style="font-family: cursive; font-size: 1.2rem; color: #0d7a5f;">${appointment.doctorName}</div>
                        <div style="font-size: 0.75rem; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 0.25rem;">Doctor's Signature</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Trigger browser print or download window for target element
     */
    printDocument(elementId) {
        const target = document.getElementById(elementId);
        if (!target) return;

        const printWindow = window.open('', '_blank', 'height=700,width=900');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hela Osu Document Print</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #0f172a; }
                        .printable-document { border: 1px solid #cbd5e1; padding: 30px; border-radius: 8px; }
                        @media print {
                            body { padding: 0; }
                            .printable-document { border: none; }
                        }
                    </style>
                </head>
                <body>
                    ${target.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

window.pdfGen = new PDFGenerator();
