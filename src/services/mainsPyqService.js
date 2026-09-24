// src/services/mainsPyqService.js
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firestore/config';
import { db } from '../db/dexieDb';

const MAINS_PYQ_COLLECTION = 'master_cse_mains_pyq';

export async function saveMainsPYQDirect({
  questionText,
  year,
  marks,
  wordLimit,
  paperTag,
  mappings, // Array of { subjectId, topicId, subtopicId }
  modelAnswer = '',
}) {
  if (!navigator.onLine) {
    throw new Error('Connection nahi hai! Internet aane ke baad dubara try karein.');
  }

  try {
    const mainsPayload = {
      questionText,
      year: Number(year),
      marks: Number(marks),
      wordLimit: Number(wordLimit),
      paperTag: paperTag || null,
      mappings: mappings || [],
      modelAnswer,
      createdAt: new Date().toISOString(),
    };

    // 1. Direct save in master_cse_mains_pyq
    const colRef = collection(firestoreDb, MAINS_PYQ_COLLECTION);
    const docRef = await addDoc(colRef, mainsPayload);

    // 2. Har mapped subtopic document par mainspyqcount increment karein
    if (Array.isArray(mappings) && mappings.length > 0) {
      for (const mapItem of mappings) {
        const { subjectId, topicId, subtopicId } = mapItem;
        if (!subjectId || !topicId || !subtopicId) continue;

        // Firestore atomic increment
        const subtopicDocRef = doc(
          firestoreDb,
          'master_gs_subjects',
          subjectId,
          'topics',
          topicId,
          'subtopics',
          subtopicId
        );

        await updateDoc(subtopicDocRef, {
          mainspyqcount: increment(1),
        });

        // Dexie local cache update
        const cachedSubject = await db.master_gs_subjects.get(subjectId);
        if (cachedSubject && Array.isArray(cachedSubject.topics)) {
          const updatedTopics = cachedSubject.topics.map((top) => {
            if (top.id === topicId && Array.isArray(top.subtopics)) {
              const updatedSubtopics = top.subtopics.map((st) => {
                if (st.id === subtopicId) {
                  return {
                    ...st,
                    mainspyqcount: (st.mainspyqcount || 0) + 1,
                  };
                }
                return st;
              });
              return { ...top, subtopics: updatedSubtopics };
            }
            return top;
          });

          await db.master_gs_subjects.put({
            ...cachedSubject,
            topics: updatedTopics,
          });
        }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Mains Firestore save failed:', error);
    throw new Error('Connection ya server issue hai. Internet check karke dubara try karein.');
  }
}