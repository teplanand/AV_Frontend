import { InvestigationType } from "./investigation.type"
import { InvestigationStudyType } from "./investigationStudy.type"
import { PaymentType } from "./paymentType.type"
import { ReferralDoctor } from "./referenceDoctor.type"


export type AnesthesiaPaymentReceiveType = {
    id: number
    investigation_id: number
    investigation_study_id: number
    reference_doctor_id: number
    payment_type_id: number
    amount: number
    investigation: InvestigationType
    investigation_study: InvestigationStudyType
    reference_doctor: ReferralDoctor
    payment_type: PaymentType
    is_active: boolean
    status: number
}