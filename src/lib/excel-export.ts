import ExcelJS from 'exceljs';
import { PrescriptionData, ShiftDetail } from './firestore-service';

export async function exportPrescriptionToExcel(prescription: PrescriptionData): Promise<void> {
  const institutionName = process.env.NEXT_PUBLIC_INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';
  const logoPath = process.env.NEXT_PUBLIC_INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const workbook = new ExcelJS.Workbook();
  let safeSheetName = prescription.patientName.replace(/[\\/?*[\]]/g, '').substring(0, 31);
  if (!safeSheetName) safeSheetName = 'Prescricao';

  let imageId: number | undefined;

  if (logoPath) {
    try {
      let ext = 'png';
      if (logoPath.toLowerCase().endsWith('.jpg') || logoPath.toLowerCase().endsWith('.jpeg')) ext = 'jpeg';
      const res = await fetch(logoPath);
      if (res.ok) {
        const arrBuffer = await res.arrayBuffer();
        imageId = workbook.addImage({
          buffer: arrBuffer,
          extension: ext as 'png' | 'jpeg',
        });
      }
    } catch (e) {
      console.warn('Não foi possível carregar logo para Excel:', e);
    }
  }

  const worksheet = workbook.addWorksheet(safeSheetName);
  buildPrescriptionSheet(worksheet, prescription, formattedDate, institutionName, imageId);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `Prescricao_${prescription.patientName.replace(/\s+/g, '_')}.xlsx`);
}

export async function exportShiftToExcel(shift: ShiftDetail, fullPrescriptions: PrescriptionData[]): Promise<void> {
  const institutionName = process.env.NEXT_PUBLIC_INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';
  const logoPath = process.env.NEXT_PUBLIC_INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  const workbook = new ExcelJS.Workbook();
  let imageId: number | undefined;

  if (logoPath) {
    try {
      let ext = 'png';
      if (logoPath.toLowerCase().endsWith('.jpg') || logoPath.toLowerCase().endsWith('.jpeg')) ext = 'jpeg';
      const res = await fetch(logoPath);
      if (res.ok) {
        const arrBuffer = await res.arrayBuffer();
        imageId = workbook.addImage({
          buffer: arrBuffer,
          extension: ext as 'png' | 'jpeg',
        });
      }
    } catch (e) {
      console.warn('Não foi possível carregar logo para Excel:', e);
    }
  }

  const usedSheetNames = new Set<string>();

  for (let idx = 0; idx < fullPrescriptions.length; idx++) {
    const p = fullPrescriptions[idx];
    let baseName = p.patientName.replace(/[\\/?*[\]]/g, '').substring(0, 25) || `Paciente_${idx + 1}`;
    let sheetName = baseName;
    let counter = 1;
    while (usedSheetNames.has(sheetName)) {
      sheetName = `${baseName}_${counter}`.substring(0, 31);
      counter++;
    }
    usedSheetNames.add(sheetName);

    const formattedDate = new Date(p.prescriptionDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    const worksheet = workbook.addWorksheet(sheetName);
    buildPrescriptionSheet(worksheet, p, formattedDate, institutionName, imageId);
  }

  const shiftDateFormatted = new Date(shift.shiftDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `Plantao_${shiftDateFormatted}.xlsx`);
}

function buildPrescriptionSheet(
  worksheet: ExcelJS.Worksheet,
  prescription: PrescriptionData,
  formattedDate: string,
  institutionName: string,
  imageId?: number
) {
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.margins = {
    left: 0.39,
    right: 0.39,
    top: 0.39,
    bottom: 0.39,
    header: 0.3,
    footer: 0.3,
  };

  worksheet.getColumn('A').width = 80;
  worksheet.getColumn('B').width = 40;

  // Linha 1: Título Instituição
  worksheet.mergeCells('A1:B1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = institutionName;
  titleCell.font = { name: 'Arial', size: 20, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 70;

  if (imageId !== undefined) {
    worksheet.addImage(imageId, {
      tl: { col: 0.1, row: 0.1 },
      ext: { width: 70, height: 70 },
    });
  }

  titleCell.border = {
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    top: { style: 'medium' },
  };

  // Linha 2: Prescrição Médica e Data
  const r2a = worksheet.getCell('A2');
  r2a.value = 'PRESCRIÇÃO MÉDICA';
  r2a.font = { name: 'Arial', size: 12, bold: true };
  r2a.alignment = { horizontal: 'center', vertical: 'middle' };
  r2a.border = { left: { style: 'medium' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  const r2b = worksheet.getCell('B2');
  r2b.value = `DATA: ${formattedDate}`;
  r2b.font = { name: 'Arial', size: 12, bold: true };
  r2b.alignment = { horizontal: 'center', vertical: 'middle' };
  r2b.border = { right: { style: 'medium' }, bottom: { style: 'thin' } };
  worksheet.getRow(2).height = 25;

  // Linha 3: Nome do Paciente e Horário
  const r3a = worksheet.getCell('A3');
  r3a.value = `NOME: ${prescription.patientName.toUpperCase()}`;
  r3a.font = { name: 'Arial', size: 11, bold: true };
  r3a.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  r3a.border = { left: { style: 'medium' }, right: { style: 'thin' }, bottom: { style: 'medium' } };

  const r3b = worksheet.getCell('B3');
  r3b.value = 'HORÁRIO DA MEDICAÇÃO';
  r3b.font = { name: 'Arial', size: 11, bold: true };
  r3b.alignment = { horizontal: 'center', vertical: 'middle' };
  r3b.border = { right: { style: 'medium' }, bottom: { style: 'medium' } };
  worksheet.getRow(3).height = 25;

  // Itens e Linhas Vazias (Mínimo 20)
  let rowIndex = 4;
  let itemIndex = 1;
  const activeItems = (prescription.items || []).filter((i) => i.isEnabled);

  for (const item of activeItems) {
    const isProtocol = item.templateItem?.isProtocol;
    let textContent = `${itemIndex}- ${item.description.toUpperCase()}`;

    if (isProtocol && item.templateItem?.protocolDetail) {
      textContent += `\n${item.templateItem.protocolDetail}`;
    }

    const rA = worksheet.getCell(`A${rowIndex}`);
    const rB = worksheet.getCell(`B${rowIndex}`);

    rA.value = textContent;
    rA.font = { name: 'Arial', size: 10, bold: true };
    rA.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
    rA.border = { left: { style: 'medium' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    rB.border = { right: { style: 'medium' }, bottom: { style: 'thin' } };
    worksheet.getRow(rowIndex).height = isProtocol && item.templateItem?.protocolDetail ? 40 : 25;

    rowIndex++;
    itemIndex++;
  }

  const emptyRows = Math.max(0, 20 - activeItems.length);
  for (let i = 0; i < emptyRows; i++) {
    const rA = worksheet.getCell(`A${rowIndex}`);
    const rB = worksheet.getCell(`B${rowIndex}`);

    rA.border = { left: { style: 'medium' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rB.border = { right: { style: 'medium' }, bottom: { style: 'thin' } };
    worksheet.getRow(rowIndex).height = 25;
    rowIndex++;
  }

  // Linha Final: Assinatura e Carimbo
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  const signature = worksheet.getCell(`A${rowIndex}`);
  signature.value = 'Assinatura e carimbo:';
  signature.font = { name: 'Arial', size: 10, bold: true };
  signature.alignment = { horizontal: 'left', vertical: 'top', indent: 1 };
  signature.border = {
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' },
    top: { style: 'medium' },
  };
  worksheet.getRow(rowIndex).height = 60;
}

function downloadBlob(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
