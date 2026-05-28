import {  BranchType } from "./branch.type";
import { StudyType } from "./study.type";


export type StudyRateType = {
    id: string,
    study_id: string,
    branch_id: string,
    fee: number,
    emergency_fee: number,
    study: StudyType,
    branch: BranchType,
}