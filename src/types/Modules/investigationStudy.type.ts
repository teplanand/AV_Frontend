export type InvestigationStudyType = {
    id: number
    investigation_id: number
    study_id: number
    study_sub_category_id: number
    anesthesia_id: number
    anesthesia_doctor_id: number
    study_price: number
    anesthesia_price: number
    discount_amount: number
    final_amount: number
    is_free: boolean
    token_number: string
    note: string
    study_status: string
    cancel_flag: boolean
}