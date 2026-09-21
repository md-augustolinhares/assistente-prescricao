import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/prescription/print-button';

export const dynamic = 'force-dynamic';

export default async function PrintPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      template: true,
      items: {
        where: { isEnabled: true },
        orderBy: { position: 'asc' },
        include: {
          templateItem: true,
        },
      },
    },
  });

  if (!prescription) {
    notFound();
  }

  const institutionName =
    process.env.INSTITUTION_NAME || 'PREFEITURA MUNICIPAL DE SANTA BÁRBARA D\'OESTE';
  const institutionSubtitle =
    process.env.INSTITUTION_SUBTITLE || 'PRONTO ATENDIMENTO';
  const logoPath =
    process.env.INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }
  );

  // Meta de linhas na folha A4 em modo paisagem para preencher com linhas em branco
  const TOTAL_ROWS = 20;
  const emptyRowsCount = Math.max(0, TOTAL_ROWS - prescription.items.length);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans antialiased">
      {/* Barra superior de ações (apenas na tela) */}
      <div className="max-w-[280mm] mx-auto mb-4 flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/prescricao/${prescription.id}`}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            &larr; Voltar ao Editor
          </Link>
          <span className="text-xs text-slate-400">
            Layout fiel à planilha oficial • Formato A4 Paisagem
          </span>
        </div>

        <PrintButton />
      </div>

      {/* Folha de Prescrição A4 Landscape */}
      <div className="max-w-[297mm] mx-auto bg-white p-4 print:p-0 shadow-sm print:shadow-none min-h-[210mm] text-black">
        <table className="w-full border-collapse border-2 border-black text-[10pt]">
          <thead>
            {/* Linha do Logo e Título */}
            <tr>
              <th colSpan={2} className="relative text-center h-24 border-b-2 border-black">
                <img
                  src={logoPath}
                  alt="Brasão Municipal"
                  className="absolute left-4 top-2 h-20 w-auto object-contain"
                />
                <h1 className="text-[20pt] font-bold">{institutionName}</h1>
              </th>
            </tr>
            
            {/* Linha: Prescrição e Data */}
            <tr className="h-8">
              <th className="w-[65%] text-center font-bold text-[12pt] border-r-2 border-b border-black">
                PRESCRIÇÃO MÉDICA
              </th>
              <th className="w-[35%] text-center font-bold text-[12pt] border-b border-black">
                DATA: {formattedDate}
              </th>
            </tr>
            
            {/* Linha: Nome e Horário da Medicação */}
            <tr className="h-8">
              <th className="w-[65%] text-left font-bold text-[11pt] border-r-2 border-b-2 border-black pl-1">
                NOME: <span className="uppercase">{prescription.patientName}</span>
              </th>
              <th className="w-[35%] text-center font-bold text-[11pt] border-b-2 border-black">
                HORÁRIO DA MEDICAÇÃO
              </th>
            </tr>
          </thead>
          
          <tbody>
            {/* Itens da Prescrição */}
            {prescription.items.map((item, index) => {
              const isProtocol = item.templateItem?.isProtocol;
              const hasCondition = !!item.conditionText || item.scheduleType === 'ACM' || item.scheduleType === 'SN';
              
              // We need to bold the condition part if possible.
              // item.description already contains the full text. We can bold the condition/schedule type part if we do some splitting or just use the modular fields!
              // Since we have modular fields: baseText, route, frequency, conditionText, scheduleType
              
              let boldPart = '';
              let normalPart = '';

              if (item.scheduleType === 'ACM') {
                boldPart = 'ACM';
              } else if (item.scheduleType === 'SN') {
                boldPart = 'SN';
              } else if (item.scheduleType === 'CONDICIONAL' && item.conditionText) {
                boldPart = item.conditionText;
              }

              // Since the description is already assembled, we can just split it if it ends with the boldPart
              let finalDesc = item.description;
              let renderedBold = '';
              
              if (boldPart && finalDesc.endsWith(boldPart)) {
                normalPart = finalDesc.slice(0, -boldPart.length);
                renderedBold = boldPart;
              } else {
                normalPart = finalDesc;
              }

              return (
                <>
                  <tr key={item.id} className="h-[22px]">
                    <td className="w-[65%] border-r-2 border-b border-black pl-1 font-semibold uppercase">
                      {index + 1}- {normalPart} <span className="font-bold">{renderedBold}</span>
                    </td>
                    <td className="w-[35%] border-b border-black"></td>
                  </tr>
                  {/* Protocolo Escalonado */}
                  {isProtocol && item.templateItem?.protocolDetail && (
                    <tr key={`${item.id}-protocol`} className="h-[22px]">
                      <td className="w-[65%] border-r-2 border-b border-black text-center text-[9pt] px-2">
                        {item.templateItem.protocolDetail}
                      </td>
                      <td className="w-[35%] border-b border-black"></td>
                    </tr>
                  )}
                </>
              );
            })}

            {/* Linhas vazias */}
            {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
              <tr key={`empty-${emptyIdx}`} className="h-[22px]">
                <td className="w-[65%] border-r-2 border-b border-black"></td>
                <td className="w-[35%] border-b border-black"></td>
              </tr>
            ))}
            
            {/* Linha final da assinatura */}
            <tr className="h-12 border-t-2 border-black">
              <td colSpan={2} className="align-top font-bold pl-1 pt-1 border-none">
                Assinatura e carimbo:
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Regras CSS para Impressão */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
