import { writeBatch, doc,collection,getDocs,orderBy,query } from "firebase/firestore";
import { firestoreDb } from "../firebase/firestore/config";

export function generateSlugId(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Previews all subtopics grouped by topicId in console
 */
export function previewBulkSubtopics(subjectId, topicsPayload) {
  console.group(`%c Previewing Subtopics for Subject: "${subjectId}"`, "color: #00b4d8; font-weight: bold;");

  topicsPayload.forEach((t) => {
    console.group(`Topic ID: "${t.topicId}" (${t.subtopics.length} subtopics)`);
    const preview = t.subtopics.map((sub) => ({
      subtopicId: generateSlugId(sub.name),
      name: sub.name,
      sequence: Number(sub.sequence)
    }));
    console.table(preview);
    console.groupEnd();
  });

  console.groupEnd();
}

/**
 * Commits all subtopics across multiple topics, chunking to respect Firestore's 500 batch limit
 */
export async function insertBulkSubtopics(subjectId, topicsPayload) {
  let batch = writeBatch(firestoreDb);
  let opCount = 0;

  for (const topic of topicsPayload) {
    const { topicId, subtopics } = topic;

    for (const subtopic of subtopics) {
      const subtopicId = generateSlugId(subtopic.name);
      const subtopicRef = doc(
        firestoreDb,
        "master_gs_subjects",
        subjectId,
        "topics",
        topicId,
        "subtopics",
        subtopicId
      );

      batch.set(subtopicRef, {
        name: subtopic.name,
        sequence: Number(subtopic.sequence)
      });
      opCount++;

      if (opCount === 500) {
        await batch.commit();
        batch = writeBatch(firestoreDb);
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
}


export async function importTopicId(subjectId) {
  let batch = collection(firestoreDb,"master_gs_subjects",subjectId,"topics")
  const topicsQuery = query(batch, orderBy("sequence", "asc"));

  let opCount = 0;
const querySnapshot = await getDocs(topicsQuery);

querySnapshot.forEach((doc) => {  console.log("Document ID:", doc.id);})
    
  }

