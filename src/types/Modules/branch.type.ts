export interface BranchType {
  id: number;
  name: string;
  short_name: string;

  legal_name: string;
  address: string;
  city_id: number | null;
  pin_code: string | null;

  email: string | null;
  mobile: string | null;
  mobile_ccode: string;
  mobile_dialCode: string;

  alternative_mobile: string | null;
  alternative_mobile_ccode: string;
  alternative_mobile_dialCode: string;

  gst_number: string | null;

  branch_group_id: number;
  company_id: number;
  document_id: number | null;

  latitude: string | null;
  longitude: string | null;

  is_ambulance: boolean;
  is_active: boolean;

  created_date: string;
  modified_date: string | null;
  created_by: number | null;

  status: number;
}
