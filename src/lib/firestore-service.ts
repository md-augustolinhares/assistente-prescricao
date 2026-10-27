import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

export interface TemplateItem {
  id: string;
  position: number;
  description: string;
  baseText?: string;
  route?: string | null;
  frequency?: string | null;
  conditionText?: string | null;
  category: string;
  isProtocol?: boolean;
  protocolDetail?: string | null;
  enabledByDefault?: boolean;
  defaultScheduleType?: string;
  variants?: string;
  isEditable?: boolean;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
}

export interface CatalogItemData {
  id: string;
  name: string;
  fullDescription: string;
  category: string;
  variants?: string | null;
}

export interface ShiftData {
  id: string;
  shiftDate: string;
  notes: string | null;
  _count: {
    prescriptions: number;
  };
}

export interface PrescriptionSummary {
  id: string;
  patientName: string;
  position: number;
  template: {
    name: string;
  };
  _count: {
    items: number;
  };
}

export interface ShiftDetail {
  id: string;
  shiftDate: string;
  notes: string | null;
  prescriptions: PrescriptionSummary[];
}

export interface PrescriptionItemRow {
  id?: string;
  position: number;
  description: string;
  baseText?: string;
  route?: string | null;
  frequency?: string | null;
  conditionText?: string | null;
  scheduleType: string;
  isEnabled: boolean;
  isManual: boolean;
  templateItemId?: string | null;
  catalogItemId?: string | null;
  templateItem?: {
    id: string;
    category: string;
    isProtocol: boolean;
    protocolDetail: string | null;
    variants: string;
    isEditable: boolean;
  } | null;
}

export interface PrescriptionData {
  id: string;
  patientName: string;
  prescriptionDate: string;
  shiftId: string;
  templateId?: string;
  template: {
    name: string;
  };
  items: PrescriptionItemRow[];
}

// ==========================================
// 1. PLANTÕES (SHIFTS)
// ==========================================

export async function getShifts(): Promise<ShiftData[]> {
  const shiftsCol = collection(db, 'shifts');
  const q = query(shiftsCol, orderBy('shiftDate', 'desc'));
  const snap = await getDocs(q);

  // Buscar todas as prescrições para contagem rápida
  const prescSnap = await getDocs(collection(db, 'prescriptions'));
  const countsByShift: Record<string, number> = {};
  prescSnap.forEach((d) => {
    const sId = d.data().shiftId;
    countsByShift[sId] = (countsByShift[sId] || 0) + 1;
  });

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      shiftDate: data.shiftDate,
      notes: data.notes || null,
      _count: {
        prescriptions: countsByShift[d.id] || 0,
      },
    };
  });
}

export async function getShiftById(id: string): Promise<ShiftDetail | null> {
  const shiftRef = doc(db, 'shifts', id);
  const shiftSnap = await getDoc(shiftRef);
  if (!shiftSnap.exists()) return null;

  const shiftData = shiftSnap.data();

  // Buscar prescrições deste plantão
  const prescQ = query(
    collection(db, 'prescriptions'),
    where('shiftId', '==', id)
  );
  const prescSnap = await getDocs(prescQ);

  const prescriptions: PrescriptionSummary[] = prescSnap.docs.map((d) => {
    const pData = d.data();
    return {
      id: d.id,
      patientName: pData.patientName,
      position: pData.position || 0,
      template: {
        name: pData.templateName || pData.template?.name || 'Prescrição Clínica',
      },
      _count: {
        items: Array.isArray(pData.items) ? pData.items.length : 0,
      },
    };
  });

  // Ordenar prescrições por posição
  prescriptions.sort((a, b) => a.position - b.position);

  return {
    id: shiftSnap.id,
    shiftDate: shiftData.shiftDate,
    notes: shiftData.notes || null,
    prescriptions,
  };
}

export async function createShift(shiftDate: string, notes?: string): Promise<string> {
  const newRef = doc(collection(db, 'shifts'));
  const isoDate =
    shiftDate.length === 10
      ? new Date(`${shiftDate}T12:00:00Z`).toISOString()
      : new Date(shiftDate).toISOString();

  await setDoc(newRef, {
    id: newRef.id,
    shiftDate: isoDate,
    notes: notes?.trim() || null,
    createdAt: new Date().toISOString(),
  });

  return newRef.id;
}

export async function updateShift(
  id: string,
  params: { shiftDate?: string; notes?: string | null }
): Promise<void> {
  const shiftRef = doc(db, 'shifts', id);
  const updateData: Record<string, any> = {};

  let isoDate: string | undefined;
  if (params.shiftDate) {
    isoDate =
      params.shiftDate.length === 10
        ? new Date(`${params.shiftDate}T12:00:00Z`).toISOString()
        : new Date(params.shiftDate).toISOString();
    updateData.shiftDate = isoDate;
  }

  if (params.notes !== undefined) {
    updateData.notes = params.notes?.trim() || null;
  }

  await updateDoc(shiftRef, updateData);

  // Sincronizar data em todas as prescrições filhas
  if (isoDate) {
    const prescQ = query(collection(db, 'prescriptions'), where('shiftId', '==', id));
    const prescSnap = await getDocs(prescQ);
    const batch = writeBatch(db);
    prescSnap.forEach((pDoc) => {
      batch.update(pDoc.ref, { prescriptionDate: isoDate });
    });
    await batch.commit();
  }
}

export async function duplicateShift(shiftId: string, newDate: string): Promise<string> {
  const original = await getShiftById(shiftId);
  if (!original) throw new Error('Plantão original não encontrado');

  const newShiftRef = doc(collection(db, 'shifts'));
  const isoDate =
    newDate.length === 10
      ? new Date(`${newDate}T12:00:00Z`).toISOString()
      : new Date(newDate).toISOString();

  const batch = writeBatch(db);

  batch.set(newShiftRef, {
    id: newShiftRef.id,
    shiftDate: isoDate,
    notes: original.notes,
    createdAt: new Date().toISOString(),
  });

  // Buscar prescrições completas para clonar
  const prescQ = query(collection(db, 'prescriptions'), where('shiftId', '==', shiftId));
  const prescSnap = await getDocs(prescQ);

  prescSnap.forEach((pDoc) => {
    const pData = pDoc.data();
    const newPrescRef = doc(collection(db, 'prescriptions'));
    batch.set(newPrescRef, {
      ...pData,
      id: newPrescRef.id,
      shiftId: newShiftRef.id,
      prescriptionDate: isoDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  await batch.commit();
  return newShiftRef.id;
}

export async function deleteShift(id: string): Promise<void> {
  const batch = writeBatch(db);

  // Deletar o plantão
  batch.delete(doc(db, 'shifts', id));

  // Deletar prescrições vinculadas
  const prescQ = query(collection(db, 'prescriptions'), where('shiftId', '==', id));
  const prescSnap = await getDocs(prescQ);
  prescSnap.forEach((pDoc) => {
    batch.delete(pDoc.ref);
  });

  await batch.commit();
}

// ==========================================
// 2. PRESCRIÇÕES (PRESCRIPTIONS)
// ==========================================

export async function getPrescriptionById(id: string): Promise<PrescriptionData | null> {
  const pRef = doc(db, 'prescriptions', id);
  const snap = await getDoc(pRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    patientName: data.patientName,
    prescriptionDate: data.prescriptionDate,
    shiftId: data.shiftId,
    templateId: data.templateId,
    template: {
      name: data.templateName || data.template?.name || 'Prescrição Clínica',
    },
    items: data.items || [],
  };
}

export async function getShiftFullPrescriptions(shiftId: string): Promise<PrescriptionData[]> {
  const prescQ = query(
    collection(db, 'prescriptions'),
    where('shiftId', '==', shiftId)
  );
  const prescSnap = await getDocs(prescQ);

  const prescriptions: (PrescriptionData & { position: number })[] = prescSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      patientName: data.patientName,
      prescriptionDate: data.prescriptionDate,
      shiftId: data.shiftId,
      position: data.position || 0,
      templateId: data.templateId,
      template: {
        name: data.templateName || data.template?.name || 'Prescrição Clínica',
      },
      items: data.items || [],
    };
  });

  prescriptions.sort((a, b) => a.position - b.position);
  return prescriptions;
}

export async function createPrescription(
  shiftId: string,
  templateId: string,
  patientName: string
): Promise<string> {
  const tplRef = doc(db, 'templates', templateId);
  const tplSnap = await getDoc(tplRef);
  if (!tplSnap.exists()) throw new Error('Modelo não encontrado');

  const tplData = tplSnap.data();
  const shiftRef = doc(db, 'shifts', shiftId);
  const shiftSnap = await getDoc(shiftRef);
  const shiftDate = shiftSnap.exists() ? shiftSnap.data().shiftDate : new Date().toISOString();

  // Calcular posição
  const prescQ = query(collection(db, 'prescriptions'), where('shiftId', '==', shiftId));
  const prescSnap = await getDocs(prescQ);
  const position = prescSnap.size + 1;

  const newPrescRef = doc(collection(db, 'prescriptions'));

  const items: PrescriptionItemRow[] = (tplData.items || []).map((it: TemplateItem) => ({
    id: doc(collection(db, 'temp')).id,
    templateItemId: it.id,
    catalogItemId: null,
    position: it.position,
    description: it.description,
    baseText: it.baseText || it.description,
    route: it.route || '',
    frequency: it.frequency || '',
    conditionText: it.conditionText || '',
    scheduleType: it.defaultScheduleType || 'HORARIO',
    isEnabled: it.enabledByDefault ?? true,
    isManual: false,
    templateItem: {
      id: it.id,
      category: it.category,
      isProtocol: it.isProtocol ?? false,
      protocolDetail: it.protocolDetail ?? null,
      variants: it.variants || '[]',
      isEditable: it.isEditable ?? true,
    },
  }));

  await setDoc(newPrescRef, {
    id: newPrescRef.id,
    shiftId,
    templateId,
    templateName: tplData.name,
    patientName: patientName.toUpperCase().trim(),
    prescriptionDate: shiftDate,
    position,
    items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return newPrescRef.id;
}

export async function updatePrescriptionItems(
  id: string,
  items: PrescriptionItemRow[]
): Promise<void> {
  const pRef = doc(db, 'prescriptions', id);
  await updateDoc(pRef, {
    items,
    updatedAt: new Date().toISOString(),
  });
}

export async function updatePatientName(id: string, patientName: string): Promise<string> {
  const cleanName = patientName.toUpperCase().trim();
  const pRef = doc(db, 'prescriptions', id);
  await updateDoc(pRef, {
    patientName: cleanName,
    updatedAt: new Date().toISOString(),
  });
  return cleanName;
}

export async function duplicatePrescription(id: string): Promise<string> {
  const original = await getPrescriptionById(id);
  if (!original) throw new Error('Prescrição não encontrada');

  const prescQ = query(collection(db, 'prescriptions'), where('shiftId', '==', original.shiftId));
  const prescSnap = await getDocs(prescQ);
  const position = prescSnap.size + 1;

  const newRef = doc(collection(db, 'prescriptions'));
  await setDoc(newRef, {
    ...original,
    id: newRef.id,
    patientName: `${original.patientName} (CÓPIA)`,
    position,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return newRef.id;
}

export async function deletePrescription(id: string): Promise<void> {
  await deleteDoc(doc(db, 'prescriptions', id));
}

// ==========================================
// 3. MODELOS CLÍNICOS (TEMPLATES)
// ==========================================

export async function getTemplates(): Promise<TemplateData[]> {
  const snap = await getDocs(collection(db, 'templates'));
  const templates: TemplateData[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.description || null,
      items: data.items || [],
    };
  });

  // Priorizar "Prescrição Geral" no topo
  templates.sort((a, b) => {
    if (a.name.toLowerCase().includes('prescrição geral') || a.name.toLowerCase().includes('prescricao geral')) return -1;
    if (b.name.toLowerCase().includes('prescrição geral') || b.name.toLowerCase().includes('prescricao geral')) return 1;
    return a.name.localeCompare(b.name);
  });

  return templates;
}

export async function getTemplateById(id: string): Promise<TemplateData | null> {
  const snap = await getDoc(doc(db, 'templates', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    description: data.description || null,
    items: (data.items || []).sort((a: any, b: any) => a.position - b.position),
  };
}

export async function updateTemplateItems(id: string, items: TemplateItem[]): Promise<void> {
  const tRef = doc(db, 'templates', id);
  await updateDoc(tRef, {
    items,
    updatedAt: new Date().toISOString(),
  });
}

// ==========================================
// 4. CATÁLOGO GERAL (CATALOG)
// ==========================================

export async function getCatalogItems(): Promise<CatalogItemData[]> {
  const snap = await getDocs(query(collection(db, 'catalog'), orderBy('name', 'asc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      fullDescription: data.fullDescription,
      category: data.category,
      variants: data.variants || '[]',
    };
  });
}

export async function createCatalogItem(item: Omit<CatalogItemData, 'id'>): Promise<string> {
  const newRef = doc(collection(db, 'catalog'));
  await setDoc(newRef, {
    id: newRef.id,
    name: item.name.trim(),
    fullDescription: item.fullDescription.trim(),
    category: item.category,
    variants: item.variants || '[]',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return newRef.id;
}

export async function updateCatalogItem(id: string, item: Partial<CatalogItemData>): Promise<void> {
  const cRef = doc(db, 'catalog', id);
  await updateDoc(cRef, {
    ...item,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'catalog', id));
}
