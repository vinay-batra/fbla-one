/**
 * The "Which FBLA event is for me?" questions. Pure data: the scorer
 * (scoring.ts) decides what each answer is worth, this file only decides what
 * a student is asked and how each choice is worded on its card.
 */

export type Grade = "9" | "10" | "11" | "12";
export type Style = "test" | "talk" | "present" | "build";
export type TeamPref = "solo" | "team" | "either";
export type Subject =
  | "money"
  | "business"
  | "marketing"
  | "tech"
  | "design"
  | "speaking"
  | "law"
  | "careers";
export type Speaking = "love" | "prepared" | "avoid";
export type Time = "light" | "steady" | "deep";
export type Experience = "none" | "some" | "lots";

export type Answers = {
  grade?: Grade;
  style?: Style;
  team?: TeamPref;
  subjects: Subject[];
  speaking?: Speaking;
  time?: Time;
  experience?: Experience;
};

export const EMPTY_ANSWERS: Answers = { subjects: [] };

export type QuestionId = Exclude<keyof Answers, "subjects"> | "subjects";

export type Choice = {
  value: string;
  label: string;
  hint?: string;
  /** How the answer reads in the "Your answers" line on the results page. */
  short?: string;
};

export type Question = {
  id: QuestionId;
  prompt: string;
  /** One line under the prompt. */
  note?: string;
  /** Multi-select questions take up to `max` answers. */
  multi?: { max: number };
  choices: Choice[];
};

/** Short names, used inside the "why it fits" sentence. */
export const SUBJECT_LABEL: Record<Subject, string> = {
  money: "accounting and money",
  business: "business and management",
  marketing: "marketing and sales",
  tech: "tech and coding",
  design: "design and media",
  speaking: "communication and speaking",
  law: "law and economics",
  careers: "careers and leadership",
};

export const QUESTIONS: Question[] = [
  {
    id: "grade",
    prompt: "What grade are you in?",
    note: "Some events are only open to 9th and 10th graders.",
    choices: [
      { value: "9", label: "9th grade", hint: "Freshman" },
      { value: "10", label: "10th grade", hint: "Sophomore" },
      { value: "11", label: "11th grade", hint: "Junior" },
      { value: "12", label: "12th grade", hint: "Senior" },
    ],
  },
  {
    id: "style",
    prompt: "How do you like to compete?",
    note: "Pick the one that sounds most like you.",
    choices: [
      { value: "test", label: "Take a test", hint: "Study hard, then prove it on a multiple-choice exam" },
      { value: "talk", label: "Talk on the spot", hint: "Get a scenario, think fast, and handle it live" },
      { value: "present", label: "Prepare and present", hint: "Plan something ahead and pitch it to judges" },
      { value: "build", label: "Build something", hint: "Code, design, or produce a real thing" },
    ],
  },
  {
    id: "team",
    prompt: "Solo or with a team?",
    choices: [
      { value: "solo", label: "On my own", short: "Solo", hint: "My prep, my score" },
      { value: "team", label: "With a team", short: "Team", hint: "Two or three of us, splitting the work" },
      { value: "either", label: "Either is fine", short: "Solo or team", hint: "Whatever fits the event" },
    ],
  },
  {
    id: "subjects",
    prompt: "Which subjects pull you in?",
    note: "Pick up to two.",
    multi: { max: 2 },
    choices: [
      { value: "money", label: "Accounting and money" },
      { value: "business", label: "Business and management" },
      { value: "marketing", label: "Marketing and sales" },
      { value: "tech", label: "Tech and coding" },
      { value: "design", label: "Design and media" },
      { value: "speaking", label: "Communication and speaking" },
      { value: "law", label: "Law and economics" },
      { value: "careers", label: "Careers and leadership" },
    ],
  },
  {
    id: "speaking",
    prompt: "How do you feel about speaking in front of judges?",
    choices: [
      { value: "love", label: "Bring it on", short: "Loves speaking", hint: "I like being in front of a room" },
      { value: "prepared", label: "Fine if I can rehearse", short: "Speaks if rehearsed", hint: "Give me time to prepare what I say" },
      { value: "avoid", label: "I'd rather not", short: "Would rather not speak", hint: "Let my work or my score do the talking" },
    ],
  },
  {
    id: "time",
    prompt: "How much time can you put in this season?",
    choices: [
      { value: "light", label: "A little", short: "A little time", hint: "An hour or two a week, more near regionals" },
      { value: "steady", label: "A steady amount", short: "Steady time", hint: "A few hours every week" },
      { value: "deep", label: "A lot", short: "Lots of time", hint: "I want a real project to work on all season" },
    ],
  },
  {
    id: "experience",
    prompt: "Have you taken business, finance, or tech classes?",
    note: "Classes at school count, not FBLA itself.",
    choices: [
      { value: "none", label: "Not yet", short: "No classes yet", hint: "This would be new to me" },
      { value: "some", label: "One or two", short: "One or two classes", hint: "I know the basics" },
      { value: "lots", label: "Several", short: "Several classes", hint: "I've taken a few years of them" },
    ],
  },
];

/** The current answer(s) for a question, as the selected choice values. */
export function selectedValues(a: Answers, id: QuestionId): string[] {
  if (id === "subjects") return a.subjects;
  const v = a[id];
  return v ? [v] : [];
}
