import { DocumentType } from "./document.type";
import { StudyType } from "./study.type";

export type StudyDiagramType = {
    id: number;
    study_id: number;
    document_id: number;
    status: number;
    created_date: string | Date;
    modified_date: string | Date;
    is_active: boolean;
    study: StudyType;
    document: DocumentType
}