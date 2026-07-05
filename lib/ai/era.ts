import { GoogleGenerativeAI } from '@google/generative-ai';

async function generate(prompt: string): Promise<string | null> {
  const key = process.env.GOOGLE_AI_KEY;
  if (!key) return null;
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('ERA error:', error);
    return null;
  }
}

const ERA_UNAVAILABLE = 'ERA is not set up yet — add a Google AI key in your deployment settings to enable AI insights.';

export const ERA = {
  async improveDescription(draft: string, eventName: string): Promise<string> {
    const result = await generate(`You are helping an event organizer improve their event description.
Event name: "${eventName}"
Their draft: "${draft}"

Improve this description to be more engaging and compelling. Keep the organizer's voice and intent. Keep it under 200 words. Return only the improved description, no commentary.`);
    return result ?? draft;
  },

  async answerQuestion(question: string, event: {
    name: string; description: string; date: string;
    venue: string; agenda?: string;
  }): Promise<string> {
    const result = await generate(`You are an AI assistant for the event "${event.name}".
Event details:
- Date: ${event.date}
- Venue: ${event.venue}
- Description: ${event.description}
- Agenda: ${event.agenda ?? 'Not provided'}

Attendee question: "${question}"

Answer helpfully and concisely in 1-3 sentences. If you don't know, say "Please contact the organizer for this information." Never make up details.`);
    return result ?? 'Please contact the organizer for this information.';
  },

  async matchAttendees(
    profileA: { name: string; role: string; company: string; interests: string[] },
    profileB: { name: string; role: string; company: string; interests: string[] }
  ): Promise<{ score: number; reason: string }> {
    const result = await generate(`You are a conference networking matchmaker.
Given two attendees, produce a match score (0-1) and a one-sentence reason why they should meet. Be specific. Output JSON only.

Attendee A: ${JSON.stringify(profileA)}
Attendee B: ${JSON.stringify(profileB)}

Output format: {"score": 0.85, "reason": "Both are building fintech products and attending the AI session tomorrow."}`);
    if (!result) return { score: 0.5, reason: 'Similar professional backgrounds.' };
    try {
      return JSON.parse(result) as { score: number; reason: string };
    } catch {
      return { score: 0.5, reason: 'Similar professional backgrounds.' };
    }
  },

  async narrateAnalytics(stats: {
    eventName: string; totalRegistered: number; totalCheckedIn: number;
    checkInRate: number; topSessions?: string[]; cardDownloads: number;
  }): Promise<string> {
    const result = await generate(`You are an event analytics assistant for Eventera.
Event: "${stats.eventName}"
Stats: ${JSON.stringify(stats)}

Write 2-3 sentences of plain-English insight about this event's performance. Be specific, mention the numbers, and give one actionable recommendation. No bullet points. Conversational tone.`);
    return result ?? ERA_UNAVAILABLE;
  },

  async generateReport(event: {
    name: string; date: string; venue: string;
    totalRegistered: number; totalCheckedIn: number;
    checkInRate: number; revenue: number;
    topSessions: string[]; cardDownloads: number;
    attendeeFeedback?: string;
  }): Promise<string> {
    const result = await generate(`Generate a professional post-event report for "${event.name}".
Data: ${JSON.stringify(event)}

Structure:
1. Executive Summary (2 sentences)
2. Attendance & Engagement (key numbers)
3. Session Highlights
4. Eventera Card Impact (${event.cardDownloads} cards downloaded)
5. Key Takeaways & Recommendations

Keep it professional, data-driven, and under 400 words. Ready to send to stakeholders.`);
    return result ?? ERA_UNAVAILABLE;
  },

  async writeCampaign(
    event: { name: string; date: string; venue: string; description: string },
    type: 'email' | 'whatsapp'
  ): Promise<string> {
    const format = type === 'whatsapp'
      ? 'WhatsApp message (under 160 characters, friendly, include event name and date)'
      : 'email (subject line on first line, then body, professional but warm, under 150 words)';
    const result = await generate(`Write a ${format} to promote this event.
Event: ${JSON.stringify(event)}

The message should drive registrations. Use the Eventera Card as a hook: "Register now and get your personalized Eventera Card." Return only the message content, no commentary.`);
    return result ?? ERA_UNAVAILABLE;
  },

  async translate(content: string, targetLanguage: string): Promise<string> {
    const result = await generate(`Translate the following event content to ${targetLanguage}. Keep proper nouns, event names, and brand names unchanged. Return only the translation.

Content: "${content}"`);
    return result ?? content;
  },
};
