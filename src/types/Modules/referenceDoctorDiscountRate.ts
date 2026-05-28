import {  BranchType } from "./branch.type";
import { ReferralDoctor } from "./referenceDoctor.type";
import { StudyType } from "./study.type";
import { StudyCategoryType } from "./studyCategory.type";


export type ReferenceDoctorDiscountRateType = {
    id: number,
    reference_doctor_id: number,
    branch_id: number,
    category_id: number,
    item_master_id: number,
    normal_fee: number,
    emergency_fee: number,
    commission: number,
    start_date: Date | string,
    is_active: boolean;
    branch?: BranchType,
    item_master?: StudyType,
    category?: StudyCategoryType,
    reference_doctor?: ReferralDoctor,
    branch_name?: string,
    category_name?: string,
    item_master_name?: string,
    reference_doctor_name?: string
}