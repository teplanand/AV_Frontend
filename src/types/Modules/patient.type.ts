export interface PatientType {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  gender: number | null;

  mobile: string | null;
  mobile_ccode: string | null;
  mobile_dialCode: string | null;

  alternative_mobile: string | null;
  alternative_mobile_ccode: string | null;
  alternative_mobile_dialCode: string | null;

  address: string | null;
  city_id: number | null;
  pin_code: string | null;

  birth_date: string | null;
  anniversary_date: string | null;

  old_patient_id: number | null;
  old_branch_id: number | null;

  created_date: string;
  modified_date: string | null;
  created_by: number | null;

  status: number;
  is_active: boolean;
}
