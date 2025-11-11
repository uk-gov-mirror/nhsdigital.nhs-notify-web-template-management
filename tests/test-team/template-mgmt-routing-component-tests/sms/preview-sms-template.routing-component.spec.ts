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
import { RoutingPreviewSmsTemplatePage } from 'pages/routing/sms/preview-sms-template-page';

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
    SMS: TemplateFactory.createSmsTemplate(
      randomUUID(),
      user,
      'SMS template name'
    ),
  };
}

test.describe('Routing - Preview SMS template page', () => {
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
      page: new RoutingPreviewSmsTemplatePage(page),
      id: messagePlanId,
      additionalIds: [templates.SMS.id],
      baseURL,
    };
    await assertSkipToMainContent(props);
    await assertHeaderLogoLink(props);
    await assertFooterLinks(props);
    await assertSignOutLink(props);
    await assertGoBackLink({
      ...props,
      expectedUrl: `${baseURL}/templates/message-plans/choose-text-message-template/${messagePlanId}`,
    });
  });

  test('loads the SMS template', async ({ page, baseURL }) => {
    const previewSmsTemplatePage = new RoutingPreviewSmsTemplatePage(page);
    await previewSmsTemplatePage.loadPage(messagePlanId, templates.SMS.id);
    await expect(page).toHaveURL(
      `${baseURL}/templates/message-plans/choose-text-message-template/${messagePlanId}/preview-template/${templates.SMS.id}`
    );

    await expect(previewSmsTemplatePage.pageHeading).toContainText(
      templates.SMS.name
    );

    await expect(page.getByText(templates.SMS.id)).toBeVisible();

    await expect(page.locator('[id="preview-content-message"]')).toHaveText(
      templates.SMS.message || ''
    );
  });

  test.describe('redirects to invalid template page', () => {
    test('when template cannot be found', async ({ page, baseURL }) => {
      const previewSmsTemplatePage = new RoutingPreviewSmsTemplatePage(page);

      await previewSmsTemplatePage.loadPage(messagePlanId, notFoundTemplateId);

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template ID is invalid', async ({ page, baseURL }) => {
      const previewSmsTemplatePage = new RoutingPreviewSmsTemplatePage(page);

      await previewSmsTemplatePage.loadPage(messagePlanId, invalidTemplateId);

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template is not SMS', async ({ page, baseURL }) => {
      const previewSmsTemplatePage = new RoutingPreviewSmsTemplatePage(page);

      await previewSmsTemplatePage.loadPage(messagePlanId, templates.EMAIL.id);

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });
  });
});
