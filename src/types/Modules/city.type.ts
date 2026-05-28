import { CountryType } from "./country.type";
import { StateType } from "./state.type";

export type CityType = {
    id: number;
    name: string;
    state_id: number;
    country_id: number;
    state: StateType,
    country: CountryType,
}