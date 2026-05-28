export type CompanyType = {
    id?: number;
    name: string;
    legal_name: string;
    short_name: string;
    address: string;
    city_id: number | null;
    state_id: number | null;
    country_id: number | null;
    pincode: string;
    mobile: string
    ccode_mobile: string
    alternative_mobile: string
    ccode_other: string
    gst_number: string;
    email: string;
    document_id: number | null;
    status: boolean;
    logo_url: string | null
}