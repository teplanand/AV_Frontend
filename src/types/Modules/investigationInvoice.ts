export type InvestigationInvoiceType = {
    id: number
    investigation_id : number
    invoice_no : string
    invoice_amount : number
    invoice_discount : number
    invoice_net_amount : number
    is_active: boolean
    created_date: string
}