import { test, expect } from '@playwright/test';
import {
  assertFooterLinks,
  assertSignOutLink,
  assertHeaderLogoLink,
  assertSkipToMainContent,
  assertGoBackLink,
} from '../../helpers/template-mgmt-common.steps';
import {
  createAuthHelper,
  TestUser,
  testUsers,
} from 'helpers/auth/cognito-auth-helper';
import { TemplateStorageHelper } from 'helpers/db/template-storage-helper';
import { randomUUID } from 'node:crypto';
import { TemplateFactory } from 'helpers/factories/template-factory';
import { RoutingPreviewStandardLetterTemplatePage } from 'pages/routing/letter/preview-standard-letter-page';

const templateStorageHelper = new TemplateStorageHelper();

const messagePlanId = randomUUID();

const invalidTemplateId = 'invalid-id';
const notFoundTemplateId = randomUUID();

function createTemplates(user: TestUser) {
  return {
    EMAIL: TemplateFactory.createEmailTemplate(
      randomUUID(),
      user,
      'Email template name'
    ),
    LETTER: TemplateFactory.uploadLetterTemplate(
      randomUUID(),
      user,
      'Letter template name'
    ),
  };
}

test.describe('Routing - Preview Letter template page', () => {
  let templates: ReturnType<typeof createTemplates>;

  test.beforeAll(async () => {
    const user = await createAuthHelper().getTestUser(testUsers.User1.userId);

    templates = createTemplates(user);

    await templateStorageHelper.seedTemplateData(Object.values(templates));
  });

  test.afterAll(async () => {
    await templateStorageHelper.deleteSeededTemplates();
  });

  test('common page tests', async ({ page, baseURL }) => {
    const props = {
      page: new RoutingPreviewStandardLetterTemplatePage(page),
      id: messagePlanId,
      additionalIds: [templates.LETTER.id],
      baseURL,
    };
    await assertSkipToMainContent(props);
    await assertHeaderLogoLink(props);
    await assertFooterLinks(props);
    await assertSignOutLink(props);
    await assertGoBackLink({
      ...props,
      expectedUrl: `${baseURL}/templates/message-plans/choose-standard-english-letter-template/${messagePlanId}`,
    });
  });

  test('loads the Letter template', async ({ page, baseURL }) => {
    const previewLetterTemplatePage =
      new RoutingPreviewStandardLetterTemplatePage(page);
    await previewLetterTemplatePage.loadPage(
      messagePlanId,
      templates.LETTER.id
    );
    await expect(page).toHaveURL(
      `${baseURL}/templates/message-plans/choose-standard-english-letter-template/${messagePlanId}/preview-template/${templates.LETTER.id}`
    );

    await expect(previewLetterTemplatePage.pageHeading).toContainText(
      templates.LETTER.name
    );

    if (
      !templates.LETTER.campaignId ||
      !templates.LETTER.files?.pdfTemplate?.fileName ||
      !templates.LETTER.files?.testDataCsv?.fileName
    ) {
      throw new Error('Test data misconfiguration');
    }

    await expect(page.locator('[id="campaign-id"]')).toContainText(
      templates.LETTER.campaignId
    );

    await expect(
      page.getByText(templates.LETTER.files!.pdfTemplate!.fileName)
    ).toBeVisible();

    await expect(
      page.getByText(templates.LETTER.files!.testDataCsv!.fileName)
    ).toBeVisible();
  });

  test.describe('redirects to invalid template page', () => {
    test('when template cannot be found', async ({ page, baseURL }) => {
      const previewLetterTemplatePage =
        new RoutingPreviewStandardLetterTemplatePage(page);

      await previewLetterTemplatePage.loadPage(
        messagePlanId,
        notFoundTemplateId
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template ID is invalid', async ({ page, baseURL }) => {
      const previewLetterTemplatePage =
        new RoutingPreviewStandardLetterTemplatePage(page);

      await previewLetterTemplatePage.loadPage(
        messagePlanId,
        invalidTemplateId
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template is not letter', async ({ page, baseURL }) => {
      const previewLetterTemplatePage =
        new RoutingPreviewStandardLetterTemplatePage(page);

      await previewLetterTemplatePage.loadPage(
        messagePlanId,
        templates.EMAIL.id
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });
  });
});
