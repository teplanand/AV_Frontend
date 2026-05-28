export type InvestigationRefundReceipt = {
    id: number;
    receipt_no: number
    investigation_id: number
    investigation_invoice_id: number
    investigation_invoice_credit_note_ids: Array<number>
    payment_type_id: number
    amount: number
    is_active: boolean
}