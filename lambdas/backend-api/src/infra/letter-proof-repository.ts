import { LetterFileRepository } from './letter-file-repository';

export type LetterProofMetadata = {
  templateId: string;
  fileName: string;
  supplier: string;
};

export class LetterProofRepository extends LetterFileRepository {
  static parseQuarantineKey(key: string): LetterProofMetadata {
    const keyParts = key.split('/');

    if (keyParts.length !== 4 && keyParts.length !== 5) {
      throw new Error(
        `Invalid object key "${key}": expected 4 or 5 path segments, got ${keyParts.length}`
      );
    }

    const [fileType, supplier, templateId, fileName] =
      keyParts.length === 5 ? keyParts.slice(1) : keyParts;

    const extension = fileName.split('.').at(-1);

    if (fileType !== 'proofs' || extension?.toLowerCase() !== 'pdf') {
      throw new Error(`Unexpected object key "${key}"`);
    }

    return {
      templateId,
      fileName,
      supplier,
    };
  }

  static getInternalKey(owner: string, templateId: string, fileName: string) {
    return `proofs/${owner}/${templateId}/${fileName}`;
  }

  static getDownloadKey(owner: string, templateId: string, fileName: string) {
    return `${owner}/proofs/${templateId}/${fileName}`;
  }
}
