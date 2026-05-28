import {  BranchType } from "./branch.type";
import { PatientType } from "./patient.type";
import { ReferralDoctor } from "./referenceDoctor.type";
import { StudyType } from "./study.type";


export interface AppointmentResponse {
    success: boolean;
    message: string;
    data: {
        total: number;
        data: Appointment[];
    };
}

export interface Appointment {
    id: number;
    appointment_date_time: string; // ISO datetime
    branch_id: number;
    trust_referral_doctor_id: number | null;
    referral_doctor_id: number | null;
    study_id: number | null;

    appointment_status: number;
    patient_mobility: number;
    condition: number;

    mou: string | null;
    created_date: string;
    modified_date: string | null;

    status: number;
    is_emergency: boolean | null;
    is_active: boolean;

    created_by: number | null;

    patient_id: number;

    patient: PatientType | null;
    branch: BranchType | null;
    study: StudyType | null
    referral_doctor: ReferralDoctor | null;
    trust_referral_doctor: ReferralDoctor | null;
}
