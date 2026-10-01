import { createContext } from "@maninthecoat/react";

export type Theme = "light" | "dark";

export const ThemeContext = createContext<Theme>("light");
