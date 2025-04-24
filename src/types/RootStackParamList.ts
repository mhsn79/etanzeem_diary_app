import { RukunData } from "@/app/models/RukunData";

// Define your navigation params
export type RootStackParamList = {
    // Home: undefined;
    'screens/RukunView': { rukun?: RukunData | any };
    'screens/RukunAddEdit': { rukun?: RukunData | any };
    'screens/ProfileView': { profile?: RukunData | any };
    'screens/ProfileEdit': { profile?: any };
    'screens/(stack)/RukanDetails': { rukun: RukunData };
};
