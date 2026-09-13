import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { base44 } from '@/api/base44Client';

export const generatePlanPDF = async (planData, phases, patient) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; margin-bottom: 10px; font-size: 28px; color: #1f2937;">Rehabilitation Plan</h1>
      <div style="text-align: center; margin-bottom: 30px; color: #6b7280;">
        <p style="margin: 5px 0;"><strong>${planData.title}</strong></p>
        <p style="margin: 5px 0;">Patient: ${patient?.full_name || 'N/A'}</p>
        <p style="margin: 5px 0;">Plan Duration: ${planData.start_date} to ${planData.target_end_date || 'TBD'}</p>
      </div>

      ${planData.description ? `
        <div style="margin-bottom: 30px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #9333ea;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Plan Overview</h3>
          <p style="margin: 0; line-height: 1.6;">${planData.description}</p>
        </div>
      ` : ''}

      ${phases.map((phase, phaseIdx) => `
        <div style="page-break-inside: avoid; margin-bottom: 40px;">
          <h2 style="border-bottom: 3px solid #9333ea; padding-bottom: 10px; margin-bottom: 20px; color: #1f2937; font-size: 20px;">
            Phase ${phase.phase_number}: ${phase.name}
          </h2>

          ${phase.description ? `
            <div style="margin-bottom: 20px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${phase.description}</p>
            </div>
          ` : ''}

          <div style="margin-bottom: 20px; font-size: 13px; color: #6b7280;">
            <strong>Duration:</strong> ${phase.duration_weeks} weeks
          </div>

          <h3 style="margin-bottom: 15px; color: #1f2937; font-size: 16px;">Weekly Exercise Schedule</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Day</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Type</th>
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Exercise</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Sets</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Reps</th>
              </tr>
            </thead>
            <tbody>
              ${phase.daily_schedule?.map((day, dayIdx) => {
                const dayExercises = day.exercises || [];
                const typeColor = day.type === 'rest' ? '#e5e7eb' : day.type === 'training' ? '#ede9fe' : '#dbeafe';
                const typeBgColor = day.type === 'rest' ? '#f9fafb' : day.type === 'training' ? '#faf5ff' : '#f0f9ff';
                
                if (dayExercises.length === 0) {
                  return `
                    <tr style="background-color: ${typeBgColor}; border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px; color: #374151; font-weight: 500;">${day.day}</td>
                      <td style="padding: 12px; color: #6b7280;"><span style="background-color: ${typeColor}; padding: 4px 8px; border-radius: 3px; text-transform: capitalize;">${day.type}</span></td>
                      <td style="padding: 12px; color: #9ca3af;">-</td>
                      <td style="padding: 12px; text-align: center; color: #9ca3af;">-</td>
                      <td style="padding: 12px; text-align: center; color: #9ca3af;">-</td>
                    </tr>
                  `;
                }

                return dayExercises.map((exercise, exIdx) => `
                  <tr style="background-color: ${exIdx === 0 ? typeBgColor : 'white'}; border-bottom: 1px solid #e5e7eb;">
                    ${exIdx === 0 ? `<td style="padding: 12px; color: #374151; font-weight: 500;">${day.day}</td>` : '<td style="padding: 12px;"></td>'}
                    ${exIdx === 0 ? `<td style="padding: 12px; color: #6b7280;"><span style="background-color: ${typeColor}; padding: 4px 8px; border-radius: 3px; text-transform: capitalize;">${day.type}</span></td>` : '<td style="padding: 12px;"></td>'}
                    <td style="padding: 12px; color: #374151;">
                       ${exercise.superset_group ? `<span style="color: #b45309; font-weight: bold; margin-right: 6px;">${exercise.superset_group}${exercise.superset_position})</span>` : ''}
                       <strong>${exercise.name || 'Unnamed'}</strong>
                       ${exercise.description ? `<br><span style="color: #6b7280; font-size: 12px;">${exercise.description}</span>` : ''}
                       ${exercise.weight ? `<br><span style="color: #2563eb; font-size: 11px;">⚖️ Weight: ${exercise.weight}</span>` : ''}
                       ${exercise.hold ? `<br><span style="color: #9333ea; font-size: 11px;">⏱️ Hold: ${exercise.hold}</span>` : ''}
                       ${exercise.tempo ? `<br><span style="color: #16a34a; font-size: 11px;">🔄 Tempo: ${exercise.tempo}</span>` : ''}
                       ${exercise.duration ? `<br><span style="color: #ea580c; font-size: 11px;">⏳ Duration: ${exercise.duration}</span>` : ''}
                     </td>
                     <td style="padding: 12px; text-align: center; color: #374151; font-weight: 500;">${exercise.sets}</td>
                     <td style="padding: 12px; text-align: center; color: #374151; font-weight: 500;">${exercise.reps}</td>
                  </tr>
                `).join('');
              }).join('')}
            </tbody>
          </table>

          ${phase.exit_criteria && phase.exit_criteria.length > 0 ? `
            <h3 style="margin-bottom: 12px; color: #1f2937; font-size: 16px;">Exit Criteria</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                ${phase.exit_criteria.map(criteria => `
                  <li style="margin-bottom: 8px; line-height: 1.5;">
                    <strong>${criteria.criterion}</strong><br>
                    <span style="color: #6b7280; font-size: 13px;">Target: ${criteria.target_value}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
        <p style="margin: 0;">This rehabilitation plan should be followed under the supervision of a qualified healthcare professional.</p>
        <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    return pdf;
  } finally {
    document.body.removeChild(container);
  }
};

export const uploadAndEmailPDF = async (pdf, planData, patientEmail, patientName) => {
  try {
    // Generate PDF blob
    const pdfBlob = pdf.output('blob');

    // Upload PDF
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: pdfBlob
    });

    // Send email with PDF link
    await base44.integrations.Core.SendEmail({
      to: patientEmail,
      subject: `Your Rehabilitation Plan: ${planData.title}`,
      body: `Hi ${patientName},

Your rehabilitation plan "${planData.title}" has been generated and is ready for download.

Plan Details:
- Duration: ${planData.start_date} to ${planData.target_end_date || 'TBD'}
- Format: Weekly exercise schedule with exit criteria

You can access and download your plan using the link provided.

Follow the exercises as prescribed by your clinician and track your progress daily.

If you have any questions, please contact your clinician.

Best regards,
Your Healthcare Team`
    });

    return uploadResult;
  } catch (error) {
    console.error('Error uploading/emailing PDF:', error);
    throw error;
  }
};