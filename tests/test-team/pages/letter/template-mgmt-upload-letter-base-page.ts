import { Locator, Page } from '@playwright/test';
import { TemplateMgmtBasePage } from 'pages/template-mgmt-base-page';

export abstract class TemplateMgmtUploadLetterBasePage extends TemplateMgmtBasePage {
  submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.submitButton = page.getByRole('button', {
      name: 'Upload letter template file',
    });
  }

  abstract fillForm(input: {
    name: string;
    campaignId: string;
    filePath: string;
    language?: string;
  }): Promise<void>;
}
