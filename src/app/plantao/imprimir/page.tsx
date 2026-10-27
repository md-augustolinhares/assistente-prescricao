'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PrintButton } from '@/components/prescription/print-button';
import {
  getShiftById,
  getShiftFullPrescriptions,
  ShiftDetail,
  PrescriptionData,
} from '@/lib/firestore-service';

function PrintShiftContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const [shiftData, prescList] = await Promise.all([
          getShiftById(id),
          getShiftFullPrescriptions(id),
        ]);
        setShift(shiftData);
        setPrescriptions(prescList);
      } catch (err) {
        console.error('Erro ao carregar plantão para impressão:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Carregando lote para impressão...</p>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Plantão não encontrado</h2>
          <p className="text-sm text-slate-500 mb-4">O plantão solicitado não existe ou foi removido.</p>
          <Link
            href="/"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            &larr; Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const institutionName =
    process.env.NEXT_PUBLIC_INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';
  const logoPath =
    process.env.NEXT_PUBLIC_INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans antialiased flex flex-col gap-8 print:gap-0 print:block">
      {/* Barra superior de ações */}
      <div className="max-w-[297mm] w-full mx-auto flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/plantao?id=${shift.id}`}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            &larr; Voltar ao Plantão
          </Link>
          <span className="text-xs text-slate-400">
            Impressão em Lote ({prescriptions.length} pacientes)
          </span>
        </div>

        <PrintButton />
      </div>

      {prescriptions.map((prescription) => {
        const enabledItems = prescription.items
          ? prescription.items
              .filter((it) => it.isEnabled)
              .sort((a, b) => a.position - b.position)
          : [];

        const TOTAL_ROWS = 20;
        const emptyRowsCount = Math.max(0, TOTAL_ROWS - enabledItems.length);
        const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });

        return (
          <div
            key={prescription.id}
            className="print-page max-w-[297mm] w-full mx-auto bg-white p-4 print:p-0 shadow-sm print:shadow-none min-h-[210mm] text-black border border-slate-300 print:border-none"
          >
            <table className="w-full border-collapse border-2 border-black text-[10pt]">
              <thead>
                <tr>
                  <th colSpan={2} className="relative text-center h-24 border-b-2 border-black">
                    <img
                      src={logoPath}
                      alt="Logotipo da Instituição"
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
                {enabledItems.map((item, index) => {
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
                    <tr key={item.id || index} className="h-[22px]">
                      <td className="w-[65%] border-r-2 border-b border-black pl-1 font-semibold uppercase">
                        {index + 1}- {normalPart} <span className="font-bold">{renderedBold}</span>
                        {isProtocol && item.templateItem?.protocolDetail && (
                          <div className="text-center text-[9pt] font-normal mt-0.5">
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
            min-height: 100vh;
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

export default function PrintShiftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 text-slate-500">Carregando...</div>}>
      <PrintShiftContent />
    </Suspense>
  );
}
