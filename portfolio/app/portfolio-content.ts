import englishMessages from "./messages/en.json";
import swedishMessages from "./messages/sv.json";

export type Locale = "en" | "sv";
export type PortfolioAppId = "projects" | "about" | "resume" | "contact" | "settings";

export type PortfolioApp = {
  name: string;
  category: string;
  summary: string;
  description: string;
  paragraphs?: string[];
  sections: {
    title: string;
    body: string;
    items?: string[];
  }[];
};

export type LocaleMessages = {
  page: {
    title: string;
    description: string;
    tabletLabel: string;
    documentTitle: string;
    launcherTitle: string;
    appsLabel: string;
  };
  boot: {
    status: string;
  };
  welcome: {
    eyebrow: string;
    heading: string;
    description: string;
    themeLabel: string;
    languageLabel: string;
    enter: string;
  };
  scene: {
    label: string;
    openTablet: string;
    closeTablet: string;
    loading: string;
  };
  aria: {
    lockScreen: string;
    clock: string;
    time: string;
    lockTablet: string;
    back: string;
    appView: string;
    switchToLight: string;
    switchToDark: string;
  };
  pattern: {
    groupLabel: string;
    dotLabel: string;
    unlocked: string;
    tryAgain: string;
    nextDot: string;
    ready: string;
    clear: string;
    enter: string;
  };
  settings: {
    languageHeading: string;
    languageDescription: string;
    english: string;
    swedish: string;
    themeHeading: string;
    themeDescription: string;
    darkMode: string;
    lightMode: string;
  };
  contact: {
    heading: string;
    linkedinLabel: string;
    linkedinDescription: string;
    emailLabel: string;
    phoneLabel: string;
    profileImageAlt: string;
  };
  cv: {
    actionsLabel: string;
    preview: string;
    download: string;
    previewTitle: string;
    back: string;
  };
  apps: Record<PortfolioAppId, PortfolioApp>;
};

const messages: Record<Locale, LocaleMessages> = {
  en: englishMessages,
  sv: swedishMessages,
};

export const portfolioAppIds: PortfolioAppId[] = [
  "about",
  "resume",
  "projects",
  "contact",
  "settings",
];

export const cvFiles = {
  html: "/cv/GIP%20Resum%C3%A9%20html/GIPResum.html",
  pdf: "/cv/GIP%20Resum%C3%A9.pdf",
};

export const contactDetails = {
  linkedin: "https://www.linkedin.com/in/benjamin-terdin-708905315/",
  email: "benne.terdin@gmail.com",
  phoneDisplay: "0739625153",
  phoneHref: "+46739625153",
};

export type ProjectShowcaseItem = {
  title: string;
  url: string;
  image: string;
  accent: string;
};

export const projectShowcase: ProjectShowcaseItem[] = [
  {
    title: "Veg by Camping",
    url: "https://vegbycamping.com",
    image: "/projects/vegbycamping.png",
    accent: "#82d38d",
  },
  {
    title: "City Verkstan",
    url: "https://cityverkstan.se",
    image: "/projects/cityverkstan.jpg",
    accent: "#7dc2ff",
  },
  {
    title: "Bergudden",
    url: "https://bergudden.com",
    image: "/projects/bergudden.jpg",
    accent: "#f4b066",
  },
  {
    title: "Bergudden Skatter",
    url: "https://berguddenskatter.se",
    image: "/projects/berguddenskatter.png",
    accent: "#d69bf8",
  },
  {
    title: "Hypear",
    url: "https://hypear.se",
    image: "/projects/hypear.PNG",
    accent: "#ff8c8c",
  },
  {
    title: "Tech0",
    url: "https://tech0.se",
    image: "/projects/tech0.jpg",
    accent: "#8ce0c1",
  },
];

export function getMessages(locale: Locale) {
  return messages[locale];
}