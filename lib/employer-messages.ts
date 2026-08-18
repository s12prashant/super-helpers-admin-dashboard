export const employerMessagePresets = [
  { value: "shortlist", label: "Shortlist message" },
  { value: "welcome", label: "Welcome message" },
  { value: "queries", label: "Queries message" },
  { value: "payment", label: "Payment options" },
  { value: "profile", label: "Profile added message" },
  { value: "requirements", label: "Ask for requirements and queries" },
  { value: "professional", label: "Curate message professionally" },
  { value: "simple", label: "Simple message" },
  { value: "custom", label: "Custom message" },
] as const;

export type EmployerMessagePreset = (typeof employerMessagePresets)[number]["value"];

export const defaultCustomEmployerMessage =
  "Hello {name},\n\nThank you for connecting with SuperHelper. Please let us know how we can help you today.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper";

const employerMessages: Record<Exclude<EmployerMessagePreset, "custom">, string> = {
  shortlist:
    "Hello {name},\n\nWe have shortlisted your requirement and our team will help you find the right SuperHelper soon.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  welcome:
    "Hello {name},\n\nWelcome to SuperHelper! We are happy to help you find reliable professionals for your requirements.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  queries:
    "Hello {name},\n\nWe are following up on your query. Please reply to this message with any questions, and our team will assist you.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  payment:
    "Hello {name},\n\nYou can review the available SuperHelper payment options with our team. Please reply here and we will guide you through the next steps.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  profile:
    "Hello {name},\n\nYour employer profile has been added on SuperHelper. You can now share your requirements and connect with suitable professionals.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  requirements:
    "Hello {name},\n\nPlease share your requirements, preferred schedule, location, and any questions. Our team will recommend the best available options.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  professional:
    "Hello {name},\n\nThank you for choosing SuperHelper. We would be pleased to understand your requirement and connect you with the most suitable professional. Please reply with the details at your convenience.\n\nVisit us: https://superhelper.in\n\nRegards,\nTeam SuperHelper",
  simple:
    "Hello {name},\n\nHow can SuperHelper help you today?\n\nhttps://superhelper.in\n\nTeam SuperHelper",
};

export function getEmployerMessage(preset: EmployerMessagePreset, customMessage = defaultCustomEmployerMessage) {
  return preset === "custom" ? customMessage : employerMessages[preset];
}

export function personalizeEmployerMessage(message: string, name: string | null) {
  return message.replaceAll("{name}", name?.trim() || "there");
}