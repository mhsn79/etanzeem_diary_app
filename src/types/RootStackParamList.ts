import { RukunData } from "@/app/models/RukunData";
import { Person } from "@/app/models/Person";

// Define your navigation params
export type RootStackParamList = {
    // Home: undefined;
    'screens/RukunView': { rukun: RukunData | Person };
    'screens/RukunAddEdit': { rukun?: RukunData | Person };
    'screens/ProfileView': { profile?: RukunData | Person };
    'screens/ProfileEdit': { profile?: any };
    'screens/(stack)/RukanDetails': { rukun: RukunData };
    'screens/LoginScreen': undefined;
};
