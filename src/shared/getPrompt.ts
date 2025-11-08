export const outlinePrompt = (topic: string, difficulty: string) => {
  return `        
Return ONLY valid JSON:

{
  "title": "${topic}",
  "difficulty": "${difficulty}",
  "description": "<4-6 sentences course overview>",
  "chapters": [
    { "title": "<Title>", "description": "<6-8 sentence article>", "is_study_case": <boolean>, "score": <number> },
  ]
}

Chapter requirements:
- 5–8 chapters.
- Each chapter must have a title and description.
- Description should be 6-8 sentences long.
- Include a boolean field "is_study_case" to indicate if the chapter is a study case.
- Study case chapter is only one and should be the last chapter.

Scoring rules:
- Set "score" to 0 for all chapters where "is_study_case" is false.
- For the one "is_study_case": true chapter, assign a "score" (e.g., 50, 100, or 150).
- "total_possible_score" MUST be the sum of all "score" values from all chapters.

Rules:
- JSON only (no markdown).
- 5–8 chapters.
- No placeholders.
`;
};

export const chapterPrompt = (
  courseName: string,
  courseDesc: string,
  chapterName: string,
  chapterDesc: string,
  chapterOrderIndex: number,
  isStudyCase: boolean,
  chapterScore: number, 
) => {
  return `
    Expand ONE chapter for the course named "${courseName}".

    Return ONLY a valid Markdown string as the final output.
    - Maximum heading level is ## (no #).
    - Wrap the entire content starting with ## Chapter ${chapterOrderIndex}: ${chapterName}.
    - Do NOT include <html>, <head>, or <body>.
    - Use semantic Markdown tags like ##, ###, -, 1., \`inline code\`, and fenced code blocks.
    - Do NOT return JSON, HTML tags, or extra explanations.
    - The response must be pure Markdown.

    Context:
    - Is Chapter a study case: ${isStudyCase}
    - Score for this chapter: ${chapterScore} // <-- KONTEKS BARU
    - Course overview: ${courseDesc}  
    - Chapter order index: ${chapterOrderIndex}  
    - Chapter: ${chapterName}  
    - Chapter summary: ${chapterDesc}

    Content requirements (for non-study case chapters):
    1. What (introduction to the topic)  
    2. Why (importance and relevance)  
    3. Tools/Libraries (if applicable)  
    4. Steps/Concepts (ordered explanation)  
    5. Real Example (code or case study)  
    6. Summary (key takeaways)

    Content requirements (for study case chapters):
    1. What (introduction to the study case)  
    2. Why (importance and relevance of the study case)
    3. The Task (Clearly define the project/problem to solve. Must result in a submittable link like a GitHub repo, deployment, GDrive doc, etc.)
    4. Your Reward (State clearly: "Upon successful review and approval of your submission, you will earn ${chapterScore} points.")
    5. Tools/Libraries (if applicable)  
    6. Steps/Concepts (suggested steps to complete the task)

    Special formatting rules:
    - Inline code snippets inside a sentence → \`inline code\`
    - Full multi-line code examples → 
      \`\`\`language
      ...code here...
      \`\`\`
`;
};