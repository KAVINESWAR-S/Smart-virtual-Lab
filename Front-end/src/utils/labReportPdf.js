import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDateTime(d) {
    try {
        return new Date(d).toLocaleString();
    } catch {
        return String(d);
    }
}

export function generateLabReportPdf({ experiment, student, submission }) {
    const doc = new jsPDF();

    const title = `Lab Report: ${experiment?.title || 'Experiment'}`;
    doc.setFontSize(16);
    doc.text(title, 14, 18);

    doc.setFontSize(10);
    doc.text(`Student: ${student?.name || 'N/A'} (${student?.email || 'N/A'})`, 14, 26);
    doc.text(`Generated: ${formatDateTime(Date.now())}`, 14, 32);

    autoTable(doc, {
        startY: 38,
        head: [['Field', 'Value']],
        body: [
            ['Experiment code', experiment?.code || '—'],
            ['Aim', experiment?.aim || '—'],
            ['Quiz score', submission?.quizScore != null ? `${submission.quizScore}/${experiment?.quiz?.length || '—'}` : '—'],
            ['Manual grade', submission?.grade != null ? `${submission.grade}/10` : '—'],
            ['Attempts used', submission?.attemptsUsed != null ? String(submission.attemptsUsed) : '—'],
            ['Submitted at', submission?.submittedAt ? formatDateTime(submission.submittedAt) : '—'],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] }, // slate-ish
    });

    const afterSummaryY = doc.lastAutoTable?.finalY || 38;

    autoTable(doc, {
        startY: afterSummaryY + 8,
        head: [['Components required']],
        body: (experiment?.components?.length ? experiment.components : ['—']).map((c) => [String(c)]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
    });

    const afterComponentsY = doc.lastAutoTable?.finalY || afterSummaryY + 8;

    autoTable(doc, {
        startY: afterComponentsY + 8,
        head: [['Procedure']],
        body: (experiment?.procedure?.length ? experiment.procedure : ['—']).map((step, idx) => [`${idx + 1}. ${step}`]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
    });

    const afterProcedureY = doc.lastAutoTable?.finalY || afterComponentsY + 8;

    const metrics = submission?.metricsSnapshot;
    autoTable(doc, {
        startY: afterProcedureY + 8,
        head: [['Measurements (snapshot)', 'Value']],
        body: [
            ['Loop', metrics?.validation?.hasClosedLoop ? 'Closed' : 'Open'],
            ['Short circuit', metrics?.validation?.hasShortCircuit ? 'Detected' : 'No'],
            ['Max current (A)', metrics?.analog?.maxCurrentA === Infinity ? '∞' : String(metrics?.analog?.maxCurrentA ?? '—')],
            ['Min resistance (Ω)', metrics?.analog?.minResistanceOhm != null ? String(metrics.analog.minResistanceOhm) : '—'],
            ['Battery voltage (V)', metrics?.analog?.batteryVoltage != null ? String(metrics.analog.batteryVoltage) : '—'],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
    });

    return doc;
}

