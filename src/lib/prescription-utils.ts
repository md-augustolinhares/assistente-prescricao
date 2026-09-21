/**
 * Helper modular para renderizar e sincronizar a descrição de um item de prescrição
 * baseado em seus blocos: baseText, via, frequência, tipo de aprazamento e condição.
 */

export function renderItemDescription({
  baseText,
  route,
  frequency,
  scheduleType,
  conditionText,
}: {
  baseText: string;
  route?: string | null;
  frequency?: string | null;
  scheduleType?: string | null;
  conditionText?: string | null;
}): string {
  const cleanBase = (baseText || '').trim();
  const cleanRoute = (route || '').trim();
  const cleanFreq = (frequency || '').trim();
  const cleanCond = (conditionText || '').trim();

  const parts: string[] = [];

  if (cleanBase) parts.push(cleanBase);
  if (cleanRoute) parts.push(cleanRoute);
  if (cleanFreq) parts.push(cleanFreq);

  if (scheduleType === 'ACM') {
    parts.push('ACM');
  } else if (scheduleType === 'CONDICIONAL') {
    if (cleanCond) {
      parts.push(cleanCond);
    }
  } else if (scheduleType === 'SN') {
    if (cleanCond) {
      parts.push(cleanCond);
    } else {
      parts.push('SN');
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
