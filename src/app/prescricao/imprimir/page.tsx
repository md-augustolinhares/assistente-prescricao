'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PrintButton } from '@/components/prescription/print-button';
import {
  getPrescriptionById,
  resolveInstitutionForShift,
  PrescriptionData,
  Institution,
} from '@/lib/firestore-service';

function PrintPrescriptionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getPrescriptionById(id);
        setPrescription(data);
        if (data?.shiftId) {
          const inst = await resolveInstitutionForShift(data.shiftId);
          setInstitution(inst);
        }
      } catch (err) {
        console.error('Erro ao carregar prescrição:', err);
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
          <p className="text-slate-500 text-sm">Carregando folha para impressão...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Prescrição não encontrada</h2>
          <p className="text-sm text-slate-500 mb-4">A prescrição solicitada não existe ou foi removida.</p>
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
    institution?.name || process.env.NEXT_PUBLIC_INSTITUTION_NAME || 'HOSPITAL MUNICIPAL DE EXEMPLO';
  const logoPath =
    institution?.logoDataUrl || process.env.NEXT_PUBLIC_INSTITUTION_LOGO_PATH || '/logos/default-logo.svg';

  const formattedDate = new Date(prescription.prescriptionDate).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }
  );

  const enabledItems = prescription.items
    ? prescription.items
        .filter((it) => it.isEnabled)
        .sort((a, b) => a.position - b.position)
    : [];

  const TOTAL_ROWS = 20;
  const emptyRowsCount = Math.max(0, TOTAL_ROWS - enabledItems.length);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans antialiased">
      {/* Barra superior de ações */}
      <div className="max-w-[280mm] mx-auto mb-4 flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/prescricao?id=${prescription.id}`}
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
            <tr>
              <th colSpan={2} className="relative text-center h-24 border-b-2 border-black px-4">
                <img
                  src={logoPath}
                  alt="Logotipo da Instituição"
                  className="absolute left-4 top-2 h-20 w-auto object-contain max-w-[120px]"
                />
                <h1 className="text-[20pt] font-bold leading-tight">{institutionName}</h1>
                {institution?.subtitle && (
                  <p className="text-[10pt] font-semibold tracking-wider text-slate-700 uppercase mt-0.5">
                    {institution.subtitle}
                  </p>
                )}
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

export default function PrintPrescriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 text-slate-500">Carregando...</div>}>
      <PrintPrescriptionContent />
    </Suspense>
  );
}
