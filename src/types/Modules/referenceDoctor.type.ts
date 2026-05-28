import { ReferenceDoctorDiscountRateType } from "./referenceDoctorDiscountRate";


export interface ReferralDoctor {
    id: number;

    first_name: string;
    middle_name: string | null;
    last_name: string;

    email: string | null;
    mobile: string | null;
    alternative_mobile: string | null;

    ccode_mobile: string | null;
    ccode_other: string | null;

    address: string | null;
    city_id: number | null;
    pin_code: string | null;

    qualification: string;

    birth_date: string | null;
    anniversary_date: string | null;

    trust_id: number | null;
    is_trust: boolean;

    branch_id: number[]; // array in API ✔️

    give_commission_on_discount: boolean;
    give_commission_on_emergency_day: boolean;
    give_commission_on_emergency_night: boolean;

    report_name: boolean;
    advance_pacs_scan_link: boolean;

    digital_sign: string | null;

    created_date: string;
    modified_date: string | null;
    created_by: number | null;

    status: number;
    is_active: boolean;
    reference_doctor_discount_rates: ReferenceDoctorDiscountRateType
}
