import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        template: true,
        items: {
          where: { isEnabled: true },
          orderBy: { position: 'asc' },
          include: { templateItem: true },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      );
    }

    const institutionName =
      process.env.INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';

    const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: '2-digit', year: '2-digit' }
    );

    const workbook = new ExcelJS.Workbook();
    // Nome do paciente (max 31 caracteres) para o nome da planilha
    let safeSheetName = prescription.patientName.replace(/[\\/?*[\]]/g, '').substring(0, 31);
    if (!safeSheetName) safeSheetName = 'Prescricao';
    
    const worksheet = workbook.addWorksheet(safeSheetName);

    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 9; // A4
    worksheet.pageSetup.margins = {
      left: 0.39, right: 0.39,
      top: 0.39, bottom: 0.39,
      header: 0.3, footer: 0.3
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
    r3a.alignment = { horizontal: 'left', vertical: 'middle' };
    // Ajuste: O alinhamento esquerdo precisa de um pequeno indent para imitar o padding
    r3a.alignment.indent = 1;
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

    for (const item of prescription.items) {
      let finalDesc = item.description;
      const isProtocol = item.templateItem?.isProtocol;
      
      let boldPart = '';
      if (item.scheduleType === 'ACM') {
        boldPart = 'ACM';
      } else if (item.scheduleType === 'SN') {
        boldPart = 'SN';
      } else if (item.scheduleType === 'CONDICIONAL' && item.conditionText) {
        boldPart = item.conditionText;
      }

      // No ExcelJS nós podemos fazer rich text se quisermos negrito parcial,
      // mas para simplificar usaremos tudo normal e apenas a célula em uppercase.
      // Se tiver protocolo, concatenamos com uma quebra de linha.
      let textContent = `${itemIndex}- ${finalDesc.toUpperCase()}`;
      
      if (isProtocol && item.templateItem?.protocolDetail) {
        textContent += `\n${item.templateItem.protocolDetail}`;
      }

      const rA = worksheet.getCell(`A${rowIndex}`);
      const rB = worksheet.getCell(`B${rowIndex}`);

      rA.value = textContent;
      rA.font = { name: 'Arial', size: 10, bold: false };
      // Simulate the uppercase and bold for the item
      rA.font = { name: 'Arial', size: 10, bold: true };
      
      rA.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
      rA.border = { left: { style: 'medium' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      rB.border = { right: { style: 'medium' }, bottom: { style: 'thin' } };
      
      // Ajuste de altura dependendo se tem texto de protocolo (multilinhas)
      worksheet.getRow(rowIndex).height = (isProtocol && item.templateItem?.protocolDetail) ? 40 : 25;

      rowIndex++;
      itemIndex++;
    }

    const emptyRows = Math.max(0, 20 - prescription.items.length);
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
    signature.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' }, top: { style: 'medium' } };
    worksheet.getRow(rowIndex).height = 60;

    const buffer = await workbook.xlsx.writeBuffer();

    const response = new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Prescricao_${prescription.patientName.replace(/\s+/g, '_')}.xlsx"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Falha ao exportar excel' }, { status: 500 });
  }
}
