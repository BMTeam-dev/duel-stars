import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import { db } from '../firestore/db';
import { listenerError } from '../firestore/listenerError';

// Anotação privada de cada duelo (deck usado, o que aconteceu...), em
// users/{uid}/duelNotes/{duelId}. Só o dono vê - ver firestore.rules.
export const DUEL_NOTE_MAX_LENGTH = 280;

const notesOf = (uid: string) => collection(db, 'users', uid, 'duelNotes');

// Texto vazio apaga a anotação.
export function saveDuelNote(uid: string, duelId: string, text: string): Promise<void> {
  const ref = doc(notesOf(uid), duelId);
  const trimmed = text.trim();
  return trimmed ? setDoc(ref, { text: trimmed, updatedAt: serverTimestamp() }) : deleteDoc(ref);
}

export function subscribeDuelNote(
  uid: string,
  duelId: string,
  onChange: (text: string) => void,
): () => void {
  return onSnapshot(
    doc(notesOf(uid), duelId),
    snapshot => onChange(snapshot.data()?.text ?? ''),
    listenerError('subscribeDuelNote'),
  );
}

// O "in" do Firestore aceita até 30 ids por consulta.
const IN_LIMIT = 30;

// Anotações dos duelos visíveis numa lista (Perfil, Histórico): duelId -> texto.
export function useDuelNotes(uid: string | undefined, duelIds: string[]): Record<string, string> {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const key = duelIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (!uid || ids.length === 0) {
      setNotes({});
      return;
    }
    const chunks: Record<string, string>[] = [];
    const unsubscribes: (() => void)[] = [];
    for (let i = 0; i < ids.length; i += IN_LIMIT) {
      const index = chunks.length;
      chunks.push({});
      unsubscribes.push(
        onSnapshot(
          query(notesOf(uid), where(documentId(), 'in', ids.slice(i, i + IN_LIMIT))),
          snapshot => {
            chunks[index] = Object.fromEntries(snapshot.docs.map(d => [d.id, d.data().text as string]));
            setNotes(Object.assign({}, ...chunks));
          },
          listenerError('useDuelNotes'),
        ),
      );
    }
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [uid, key]);

  return notes;
}
