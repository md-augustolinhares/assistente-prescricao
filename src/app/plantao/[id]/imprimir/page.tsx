import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/prescription/print-button';

export const dynamic = 'force-dynamic';

export default async function PrintShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      prescriptions: {
        orderBy: { position: 'asc' },
        include: {
          template: true,
          items: {
            where: { isEnabled: true },
            orderBy: { position: 'asc' },
            include: { templateItem: true },
          },
        },
      },
    },
  });

  if (!shift) {
    notFound();
  }

  const institutionName =
    process.env.INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';
  const logoPath =
    process.env.INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  const formattedShiftDate = new Date(shift.shiftDate).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans antialiased flex flex-col gap-8 print:gap-0 print:block">
      {/* Barra superior de ações */}
      <div className="max-w-[297mm] w-full mx-auto flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/plantao/${shift.id}`}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            &larr; Voltar ao Plantão
          </Link>
          <span className="text-xs text-slate-400">
            Impressão em Lote ({shift.prescriptions.length} pacientes)
          </span>
        </div>

        <PrintButton />
      </div>

      {shift.prescriptions.map((prescription, pIndex) => {
        const TOTAL_ROWS = 20;
        const emptyRowsCount = Math.max(0, TOTAL_ROWS - prescription.items.length);
        const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString('pt-BR');

        return (
          <div key={prescription.id} className="print-page max-w-[297mm] w-full mx-auto bg-white p-4 print:p-0 shadow-sm print:shadow-none min-h-[210mm] text-black border border-slate-300 print:border-none">
            <table className="w-full border-collapse border-2 border-black text-[10pt]">
              <thead>
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
                <tr className="h-8">
                  <th className="w-[65%] text-center font-bold text-[12pt] border-r-2 border-b border-black">
                    PRESCRIÇÃO MÉDICA
                  </th>
                  <th className="w-[35%] text-center font-bold text-[12pt] border-b border-black">
                    DATA: {formattedDate}
                  </th>
                </tr>
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
                {prescription.items.map((item, index) => {
                  const isProtocol = item.templateItem?.isProtocol;
                  
                  let boldPart = '';
                  let normalPart = '';

                  if (item.scheduleType === 'ACM') {
                    boldPart = 'ACM';
                  } else if (item.scheduleType === 'SN') {
                    boldPart = 'SN';
                  } else if (item.scheduleType === 'CONDICIONAL' && item.conditionText) {
                    boldPart = item.conditionText;
                  }

                  let finalDesc = item.description;
                  let renderedBold = '';
                  
                  if (boldPart && finalDesc.endsWith(boldPart)) {
                    normalPart = finalDesc.slice(0, -boldPart.length);
                    renderedBold = boldPart;
                  } else {
                    normalPart = finalDesc;
                  }

                  return (
                    <tr key={item.id} className="h-[22px]">
                      <td className="w-[65%] border-r-2 border-b border-black pl-1 font-semibold uppercase">
                        {index + 1}- {normalPart} <span className="font-bold">{renderedBold}</span>
                        {isProtocol && item.templateItem?.protocolDetail && (
                          <div className="text-center text-[9pt] font-normal px-2 block mt-1">
                            {item.templateItem.protocolDetail}
                          </div>
                        )}
                      </td>
                      <td className="w-[35%] border-b border-black"></td>
                    </tr>
                  );
                })}

                {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
                  <tr key={`empty-${emptyIdx}`} className="h-[22px]">
                    <td className="w-[65%] border-r-2 border-b border-black"></td>
                    <td className="w-[35%] border-b border-black"></td>
                  </tr>
                ))}
                
                <tr className="h-12 border-t-2 border-black">
                  <td colSpan={2} className="align-top font-bold pl-1 pt-1 border-none">
                    Assinatura e carimbo:
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

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
          .print-page {
            page-break-after: always;
            break-after: page;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `,
        }}
      />
    </div>
  );
}
