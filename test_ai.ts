import { loadReviews } from "./lib/reviews.ts";
import { summariseThemes } from "./lib/themes.ts";
import { generateChatAnswer } from "./lib/chatbot.ts";


async function test() {
  const reviews = loadReviews();
  const themes = summariseThemes(reviews);
  try {
    const response = await generateChatAnswer("What prevents users from exploring new categories?", themes);
    console.log("SUCCESS:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
