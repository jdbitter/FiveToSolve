import rawWords from "./raw/FiveLetterWords.txt?raw";
import rawAnswers from "./raw/FiveLetterAnswers.txt?raw";

export const ValidFiveLetterWords = new Set(rawWords.split(/\r?\n/).map(word => word.trim().toUpperCase()).filter(Boolean));
export const FiveLetterAnswers = new Set(rawAnswers.split(/\r?\n/).map(word => word.trim().toUpperCase()).filter(Boolean));
export const FiveLetterAnswersArray = Array.from(FiveLetterAnswers);