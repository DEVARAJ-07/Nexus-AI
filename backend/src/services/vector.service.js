const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const geminiService = require("./gemini.service");
const prisma = require("../config/db");

const chunksDir = path.join(__dirname, "../../../uploads/chunks");
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

/**
 * Extracts raw text from a document based on its extension
 */
async function parseDocument(filePath, fileName) {
  const extension = path.extname(fileName).toLowerCase();
  
  if (extension === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } else {
    // Treat as plain text (.log, .txt, .json, etc.)
    return fs.readFileSync(filePath, "utf8");
  }
}

/**
 * Splits text into chunks of ~maxWords words, with overlap
 */
function splitTextIntoChunks(text, maxWords = 500, overlapWords = 50) {
  if (!text) return [];
  
  // Clean up whitespace and split into words
  const words = text.trim().replace(/\s+/g, " ").split(" ");
  if (words.length <= maxWords) return [text];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < words.length) {
    const chunkWords = words.slice(startIndex, startIndex + maxWords);
    chunks.push(chunkWords.join(" "));
    
    // Slide index forward by (maxWords - overlapWords)
    startIndex += (maxWords - overlapWords);
    
    // Break loop if the step size doesn't make progress
    if (maxWords - overlapWords <= 0) break;
  }

  return chunks;
}

/**
 * Process a document: parse text, split into chunks, generate embeddings, and store them
 */
async function ingestDocument(workspaceId, documentId, filePath, fileName) {
  try {
    const textContent = await parseDocument(filePath, fileName);
    const textChunks = splitTextIntoChunks(textContent, 500, 50);

    const chunkData = [];
    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const embedding = await geminiService.getEmbedding(chunkText);
      chunkData.push({
        id: `${documentId}-chunk-${i}`,
        text: chunkText,
        embedding
      });
    }

    // Save chunks to local JSON file
    const targetPath = path.join(chunksDir, `${documentId}.json`);
    fs.writeFileSync(targetPath, JSON.stringify(chunkData, null, 2), "utf8");
    
    console.log(`Successfully ingested document "${fileName}" (${textChunks.length} chunks) to ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`Error in ingestDocument for ${fileName}:`, error);
    throw error;
  }
}

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Query the semantic database for relevant chunks across workspace documents
 */
async function searchWorkspaceContext(workspaceId, queryText, limit = 5, documentId = null) {
  try {
    // 1. Get embedding for the query
    const queryEmbedding = await geminiService.getEmbedding(queryText);
    
    // 2. Fetch list of documents belonging to workspace
    const docs = await prisma.document.findMany({
      where: { 
        workspaceId, 
        status: "READY",
        ...(documentId ? { id: documentId } : {})
      }
    });

    const allMatches = [];

    // 3. Scan JSON chunk files for these documents
    for (const doc of docs) {
      const chunkPath = path.join(chunksDir, `${doc.id}.json`);
      if (fs.existsSync(chunkPath)) {
        try {
          const chunkFileContent = fs.readFileSync(chunkPath, "utf8");
          const chunks = JSON.parse(chunkFileContent);
          
          for (const chunk of chunks) {
            const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
            allMatches.push({
              text: chunk.text,
              documentName: doc.name,
              similarity
            });
          }
        } catch (fileErr) {
          console.error(`Error reading chunks file for document ${doc.name}:`, fileErr);
        }
      }
    }

    // 4. Sort by highest similarity
    allMatches.sort((a, b) => b.similarity - a.similarity);
    
    // 5. Take top matches
    return allMatches.slice(0, limit);
  } catch (error) {
    console.error("Error in searchWorkspaceContext:", error);
    return [];
  }
}

/**
 * Delete chunk files on document deletion
 */
function deleteDocumentChunks(documentId) {
  const chunkPath = path.join(chunksDir, `${documentId}.json`);
  if (fs.existsSync(chunkPath)) {
    fs.unlinkSync(chunkPath);
  }
}

module.exports = {
  ingestDocument,
  searchWorkspaceContext,
  deleteDocumentChunks
};
