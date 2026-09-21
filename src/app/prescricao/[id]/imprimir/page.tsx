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
      <div className="max-w-[280mm] mx-auto bg-white border border-slate-300 print:border-none p-4 print:p-0 shadow-sm print:shadow-none min-h-[190mm]">
        {/* Cabeçalho Oficial com Brasão e Nome da Prefeitura */}
        <div className="border border-black flex items-center p-2">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center ml-1 mr-3">
            {/* Tag img nativa para garantir carregamento e renderização na impressora */}
            <img
              src={logoPath}
              alt="Brasão Municipal"
              className="w-14 h-14 object-contain"
            />
          </div>
          <div className="flex-1 text-center pr-16">
            <h1 className="text-base font-black uppercase tracking-wider text-black leading-tight">
              {institutionName}
            </h1>
            {institutionSubtitle && (
              <h2 className="text-[11px] font-bold uppercase text-neutral-800 tracking-wider mt-0.5">
                {institutionSubtitle}
              </h2>
            )}
          </div>
        </div>

        {/* Faixa: Prescrição Médica e Data */}
        <div className="border-x border-b border-black grid grid-cols-12 text-xs font-bold">
          <div className="col-span-8 p-1.5 text-center uppercase tracking-wider">
            PRESCRIÇÃO MÉDICA
          </div>
          <div className="col-span-4 p-1.5 border-l border-black flex items-center justify-between px-4">
            <span>DATA:</span>
            <span className="font-mono text-xs">{formattedDate}</span>
          </div>
        </div>

        {/* Faixa: Nome do Paciente e Horário da Medicação */}
        <div className="border-x border-b border-black grid grid-cols-12 text-xs font-bold">
          <div className="col-span-8 p-1.5 flex items-center gap-2 px-2.5">
            <span className="text-neutral-700">NOME:</span>
            <span className="text-sm font-black tracking-wide uppercase">
              {prescription.patientName}
            </span>
          </div>
          <div className="col-span-4 p-1.5 border-l border-black text-center uppercase tracking-wider text-[11px]">
            HORÁRIO DA MEDICAÇÃO
          </div>
        </div>

        {/* Tabela de Itens e Horários */}
        <div className="border-x border-black divide-y divide-black text-[11px]">
          {prescription.items.map((item, index) => {
            const isProtocol = item.templateItem?.isProtocol;

            return (
              <div
                key={item.id}
                className="grid grid-cols-12 min-h-[25px] items-stretch leading-tight"
              >
                {/* Coluna da Prescrição Médica */}
                <div className="col-span-8 p-1.5 border-r border-black font-bold uppercase flex flex-col justify-center">
                  <div>
                    <span className="inline-block w-6 font-mono text-xs font-black">
                      {index + 1}-
                    </span>
                    <span>{item.description}</span>
                  </div>

                  {/* Protocolo Escalonado (Ex: Insulina) */}
                  {isProtocol && item.templateItem?.protocolDetail && (
                    <div className="pl-6 text-[10px] font-mono font-semibold text-neutral-800 mt-0.5 tracking-tighter">
                      {item.templateItem.protocolDetail}
                    </div>
                  )}
                </div>

                {/* Coluna Única de Horário da Enfermagem (sem subdivisões) */}
                <div className="col-span-4 bg-white"></div>
              </div>
            );
          })}

          {/* Linhas em branco adicionais para preencher a folha até o fim */}
          {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
            <div
              key={`empty-${emptyIdx}`}
              className="grid grid-cols-12 min-h-[25px] items-stretch"
            >
              <div className="col-span-8 p-1.5 border-r border-black font-mono text-[11px] text-neutral-400">
                {prescription.items.length + emptyIdx + 1}-
              </div>
              <div className="col-span-4 bg-white"></div>
            </div>
          ))}
        </div>

        {/* Rodapé: Assinatura e Carimbo (No canto inferior esquerdo conforme modelo Excel) */}
        <div className="border border-black p-2 min-h-[48px] flex items-start justify-between text-xs font-bold">
          <span className="tracking-wide">Assinatura e carimbo:</span>
          <span className="text-[10px] font-normal text-neutral-400 no-print">
            {prescription.template.name}
          </span>
        </div>
      </div>

      {/* Regras CSS para Impressão */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 8mm;
          }
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
