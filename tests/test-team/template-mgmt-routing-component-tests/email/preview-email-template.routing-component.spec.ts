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
import { RoutingPreviewEmailTemplatePage } from 'pages/routing/email/preview-email-page';

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
    APP: TemplateFactory.createNhsAppTemplate(
      randomUUID(),
      user,
      'App template name'
    ),
  };
}

test.describe('Routing - Preview email template page', () => {
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
      page: new RoutingPreviewEmailTemplatePage(page),
      id: messagePlanId,
      additionalIds: [templates.EMAIL.id],
      baseURL,
    };
    await assertSkipToMainContent(props);
    await assertHeaderLogoLink(props);
    await assertFooterLinks(props);
    await assertSignOutLink(props);
    await assertGoBackLink({
      ...props,
      expectedUrl: `${baseURL}/templates/message-plans/choose-email-template/${messagePlanId}`,
    });
  });

  test('loads the email template', async ({ page, baseURL }) => {
    const previewEmailTemplatePage = new RoutingPreviewEmailTemplatePage(page);
    await previewEmailTemplatePage.loadPage(messagePlanId, templates.EMAIL.id);
    await expect(page).toHaveURL(
      `${baseURL}/templates/message-plans/choose-email-template/${messagePlanId}/preview-template/${templates.EMAIL.id}`
    );

    await expect(previewEmailTemplatePage.pageHeading).toContainText(
      templates.EMAIL.name
    );

    await expect(page.getByText(templates.EMAIL.id)).toBeVisible();

    await expect(page.locator('[id="preview-content-subject"]')).toHaveText(
      templates.EMAIL.subject || ''
    );

    await expect(page.locator('[id="preview-content-message"]')).toHaveText(
      templates.EMAIL.message || ''
    );
  });

  test.describe('redirects to invalid template page', () => {
    test('when template cannot be found', async ({ page, baseURL }) => {
      const previewEmailTemplatePage = new RoutingPreviewEmailTemplatePage(
        page
      );

      await previewEmailTemplatePage.loadPage(
        messagePlanId,
        notFoundTemplateId
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template ID is invalid', async ({ page, baseURL }) => {
      const previewEmailTemplatePage = new RoutingPreviewEmailTemplatePage(
        page
      );

      await previewEmailTemplatePage.loadPage(messagePlanId, invalidTemplateId);

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template is not email', async ({ page, baseURL }) => {
      const previewEmailTemplatePage = new RoutingPreviewEmailTemplatePage(
        page
      );

      await previewEmailTemplatePage.loadPage(messagePlanId, templates.APP.id);

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });
  });
});
