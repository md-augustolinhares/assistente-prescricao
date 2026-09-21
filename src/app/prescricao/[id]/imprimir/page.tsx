import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans">
      {/* Botões de Ação (Apenas na tela, ocultos na impressão) */}
      <div className="max-w-[280mm] mx-auto mb-4 flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/prescricao/${prescription.id}`}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            &larr; Voltar ao Editor
          </Link>
          <span className="text-xs text-slate-400">
            Layout configurado para folha A4 em modo Paisagem (Horizontal)
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
        >
          <span>🖨️</span>
          <span>Imprimir Agora (Ctrl + P)</span>
        </button>
      </div>

      {/* Folha de Prescrição A4 Landscape */}
      <div className="max-w-[280mm] mx-auto bg-white border border-slate-300 print:border-none p-6 print:p-4 shadow-sm print:shadow-none min-h-[190mm] flex flex-col justify-between">
        <div>
          {/* Cabeçalho Oficial */}
          <div className="border border-black flex items-center p-3 mb-0 border-b-2">
            <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center mr-4">
              <Image
                src={logoPath}
                alt="Brasão Institucional"
                width={70}
                height={70}
                className="object-contain max-h-16"
                priority
              />
            </div>
            <div className="flex-1 text-center pr-12">
              <h1 className="text-base font-extrabold uppercase tracking-wide">
                {institutionName}
              </h1>
              {institutionSubtitle && (
                <h2 className="text-xs font-bold uppercase text-neutral-800 tracking-wider mt-0.5">
                  {institutionSubtitle}
                </h2>
              )}
            </div>
          </div>

          {/* Faixa: Prescrição Médica e Data */}
          <div className="border-x border-b border-black grid grid-cols-12 text-xs font-bold">
            <div className="col-span-8 p-1.5 bg-neutral-100 uppercase tracking-wider flex items-center">
              PRESCRIÇÃO MÉDICA
            </div>
            <div className="col-span-4 p-1.5 border-l border-black flex items-center justify-between">
              <span>DATA:</span>
              <span className="font-mono text-sm">{formattedDate}</span>
            </div>
          </div>

          {/* Faixa: Nome do Paciente e Título da Coluna de Horários */}
          <div className="border-x border-b-2 border-black grid grid-cols-12 text-xs font-bold">
            <div className="col-span-8 p-1.5 flex items-center gap-2">
              <span className="text-neutral-600">NOME:</span>
              <span className="text-sm font-black tracking-wide">
                {prescription.patientName}
              </span>
            </div>
            <div className="col-span-4 p-1.5 border-l border-black text-center bg-neutral-50 tracking-wider text-[11px]">
              HORÁRIO DA MEDICAÇÃO
            </div>
          </div>

          {/* Grade de Itens da Prescrição e Colunas de Horários */}
          <div className="border-x border-b border-black divide-y divide-black text-[11px]">
            {prescription.items.map((item, index) => {
              const isProtocol = item.templateItem?.isProtocol;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 min-h-[26px] items-stretch leading-snug"
                >
                  {/* Coluna do Item Prescrito (Colunas A-J) */}
                  <div className="col-span-8 p-1.5 font-bold uppercase flex flex-col justify-center">
                    <div>
                      <span className="inline-block w-6 font-mono text-xs">
                        {index + 1}-
                      </span>
                      <span>{item.description}</span>
                    </div>

                    {/* Detalhes de Protocolo Escalonado (ex: Insulina) */}
                    {isProtocol && item.templateItem?.protocolDetail && (
                      <div className="pl-6 text-[10px] font-mono font-semibold text-neutral-800 mt-0.5">
                        {item.templateItem.protocolDetail}
                      </div>
                    )}
                  </div>

                  {/* Coluna da Enfermagem (Colunas K-P para horários manuais) */}
                  <div className="col-span-4 border-l border-black grid grid-cols-6 divide-x divide-neutral-300">
                    <div className="h-full"></div>
                    <div className="h-full"></div>
                    <div className="h-full"></div>
                    <div className="h-full"></div>
                    <div className="h-full"></div>
                    <div className="h-full"></div>
                  </div>
                </div>
              );
            })}

            {/* Linhas em branco adicionais se a lista for curta para manter padrão estético */}
            {Array.from({
              length: Math.max(0, 14 - prescription.items.length),
            }).map((_, emptyIdx) => (
              <div
                key={`empty-${emptyIdx}`}
                className="grid grid-cols-12 h-6 items-stretch"
              >
                <div className="col-span-8 p-1 text-neutral-300 font-mono text-[10px]">
                  {prescription.items.length + emptyIdx + 1}-
                </div>
                <div className="col-span-4 border-l border-black grid grid-cols-6 divide-x divide-neutral-300">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé: Assinatura e Carimbo */}
        <div className="mt-6 pt-6 flex items-end justify-between text-xs font-bold border-t border-black/20">
          <div className="text-[10px] text-neutral-400 font-normal">
            Impresso via Assistente de Prescrição • Modelo: {prescription.template.name}
          </div>
          <div className="text-right">
            <div className="w-72 border-b border-black mb-1"></div>
            <p className="tracking-wide">Assinatura e carimbo do médico:</p>
          </div>
        </div>
      </div>

      {/* Regras CSS para Forçar Paisagem e Remover Margens no Navegador */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
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
      `}} />
    </div>
  );
}
