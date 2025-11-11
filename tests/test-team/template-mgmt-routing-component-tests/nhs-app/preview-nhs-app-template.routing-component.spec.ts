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
import { RoutingPreviewNhsAppTemplatePage } from 'pages/routing/nhs-app/preview-nhs-app-page';

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

test.describe('Routing - Preview app template page', () => {
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
      page: new RoutingPreviewNhsAppTemplatePage(page),
      id: messagePlanId,
      additionalIds: [templates.APP.id],
      baseURL,
    };
    await assertSkipToMainContent(props);
    await assertHeaderLogoLink(props);
    await assertFooterLinks(props);
    await assertSignOutLink(props);
    await assertGoBackLink({
      ...props,
      expectedUrl: `${baseURL}/templates/message-plans/choose-nhs-app-template/${messagePlanId}`,
    });
  });

  test('loads the NHS app template', async ({ page, baseURL }) => {
    const previewNhsAppTemplatePage = new RoutingPreviewNhsAppTemplatePage(
      page
    );
    await previewNhsAppTemplatePage.loadPage(messagePlanId, templates.APP.id);
    await expect(page).toHaveURL(
      `${baseURL}/templates/message-plans/choose-nhs-app-template/${messagePlanId}/preview-template/${templates.APP.id}`
    );

    await expect(previewNhsAppTemplatePage.pageHeading).toContainText(
      templates.APP.name
    );

    await expect(page.getByText(templates.APP.id)).toBeVisible();

    await expect(page.locator('[id="preview-content-message"]')).toHaveText(
      templates.APP.message || ''
    );
  });

  test.describe('redirects to invalid template page', () => {
    test('when template cannot be found', async ({ page, baseURL }) => {
      const previewNhsAppTemplatePage = new RoutingPreviewNhsAppTemplatePage(
        page
      );

      await previewNhsAppTemplatePage.loadPage(
        messagePlanId,
        notFoundTemplateId
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template ID is invalid', async ({ page, baseURL }) => {
      const previewNhsAppTemplatePage = new RoutingPreviewNhsAppTemplatePage(
        page
      );

      await previewNhsAppTemplatePage.loadPage(
        messagePlanId,
        invalidTemplateId
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });

    test('when template is not NHS app', async ({ page, baseURL }) => {
      const previewNhsAppTemplatePage = new RoutingPreviewNhsAppTemplatePage(
        page
      );

      await previewNhsAppTemplatePage.loadPage(
        messagePlanId,
        templates.EMAIL.id
      );

      await expect(page).toHaveURL(`${baseURL}/templates/invalid-template`);
    });
  });
});
