// src/services/pyqService.js
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firestore/config';
import { db } from '../db/dexieDb';

const PYQ_COLLECTION = 'master_cse_prelims_pyq';

export async function savePrelimsPYQDirect({
  questionText,
  options,
  correctAnswerIndex,
  year,
  subjectId,
  topicId,
  subtopicId,
  explanation = '',
}) {
  // 1. Connection check
  if (!navigator.onLine) {
    throw new Error('Connection nahi hai! Internet aane ke baad dubara try karein.');
  }

  try {
    const pyqPayload = {
      questionText,
      options,
      correctAnswerIndex: Number(correctAnswerIndex),
      year: Number(year),
      subjectId,
      topicId: topicId || null,
      subtopicId: subtopicId || null,
      explanation,
      createdAt: new Date().toISOString(),
    };

    // 2. Direct save to Firestore
    const pyqColRef = collection(firestoreDb, PYQ_COLLECTION);
    const pyqDocRef = await addDoc(pyqColRef, pyqPayload);

    // 3. Agar subtopic mapped hai toh Firestore me prelimspyqcount increment karein
    if (subjectId && topicId && subtopicId) {
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
        prelimspyqcount: increment(1),
      });

      // 4. Firestore success ke baad Dexie cached subject me prelimspyqcount update karein
      const cachedSubject = await db.master_gs_subjects.get(subjectId);
      if (cachedSubject && Array.isArray(cachedSubject.topics)) {
        const updatedTopics = cachedSubject.topics.map((top) => {
          if (top.id === topicId && Array.isArray(top.subtopics)) {
            const updatedSubtopics = top.subtopics.map((st) => {
              if (st.id === subtopicId) {
                return {
                  ...st,
                  prelimspyqcount: (st.prelimspyqcount || 0) + 1,
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

    return pyqDocRef.id;
  } catch (error) {
    console.error('Firestore save failed:', error);
    throw new Error('Connection ya server issue hai. Internet check karke dubara try karein.');
  }
}