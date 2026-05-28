export type InvestigationType = {
    id: number
    patient_id: number
    branch_id: number
    referral_doctor_id: number
    trust_referral_doctor_id: number
    mou: boolean
    patient_mobility: number
    condition: number
    is_emergency: boolean
    invoice_number: string
    invoice_amount: number
    invoice_discount: number
    invoice_net_amount: number
    created_date: string
    modified_date: string
}