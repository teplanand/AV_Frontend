export type SettingType = {
    id: number;
    invoice_prefix: string | null
    credit_note_prefix: string | null
    receipt_prefix: string | null
    refund_receipt_prefix: string | null
    financial_year: string | null;
    is_active: boolean;
}