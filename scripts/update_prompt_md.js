const fs = require('fs');

const logPath = '/Users/komaladlakha/.gemini/antigravity-ide/brain/e996a27b-26e3-4d43-abc3-2828caeb173c/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let md = '# Conversation Knowledge Base\n\n';

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const step = JSON.parse(line);
    if (step.type === 'USER_INPUT' && step.content) {
      // Extract the content inside <USER_REQUEST> if it exists, otherwise use raw
      const match = step.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      const text = match ? match[1].trim() : step.content.trim();
      if (text) md += `## User Prompt\n\n${text}\n\n`;
    } else if (step.type === 'PLANNER_RESPONSE' && step.content) {
      md += `## Agent Response\n\n${step.content.trim()}\n\n`;
    }
  } catch(e) {}
}

fs.writeFileSync('/Users/komaladlakha/Documents/nextleap/graduationProject/prompt.md', md, 'utf8');
