import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import {
  fireEvent,
  mapResourceAccessToAppliedPermissions,
  screen,
  waitFor,
  within,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { entryPointUriPath, PERMISSIONS } from '../../constants';
import { PRODUCT_LABELS_CONTAINER } from '../../label-utils';
import { renderApplicationWithRoutesAndRedux } from '../../test-utils';

const mockServer = setupServer();
afterEach(() => mockServer.resetHandlers());
beforeAll(() => {
  mockServer.listen({
    onUnhandledRequest: 'error',
  });
});
afterAll(() => {
  mockServer.close();
});

const SAMPLE_LABELS = [
  {
    id: 'co-sale-1',
    key: 'flash-sale-20',
    version: 3,
    container: PRODUCT_LABELS_CONTAINER,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastModifiedAt: '2026-01-02T00:00:00.000Z',
    value: {
      id: 'flash-sale-20',
      name: 'Flash Sale 20%',
      text: 'SALE -20%',
      enabled: true,
      position: 'top-left',
      customCss: 'background: #dc2626; color: #ffffff;',
      priority: 10,
      targetMode: 'products',
      productIds: ['prod-1'],
      products: [{ id: 'prod-1', key: 'aurora-lamp', name: 'Aurora Lamp' }],
    },
  },
  {
    id: 'co-brand-2',
    key: 'lumina-featured',
    version: 1,
    container: PRODUCT_LABELS_CONTAINER,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastModifiedAt: '2026-01-01T00:00:00.000Z',
    value: {
      id: 'lumina-featured',
      name: 'Lumina Spotlight',
      text: 'LUMINA PICK',
      enabled: false,
      position: 'bottom-right',
      customCss: 'background: #0f172a; color: #ffffff;',
      priority: 5,
      targetMode: 'attribute',
      productIds: [],
      attributeRule: {
        attributeName: 'brand',
        operator: 'equals',
        value: 'Lumina',
      },
    },
  },
];

const renderApp = (
  options: Partial<TRenderAppWithReduxOptions> = {},
  includeManagePermissions = true
) => {
  const route = options.route || `/my-project/${entryPointUriPath}/labels`;
  return renderApplicationWithRoutesAndRedux({
    route,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions(
        [
          PERMISSIONS.View,
          includeManagePermissions ? PERMISSIONS.Manage : '',
        ].filter(Boolean)
      ),
    },
    ...options,
  });
};

function installDefaultCatalogHandlers() {
  mockServer.use(
    graphql.query('FetchProductsForLabels', (_req, res, ctx) =>
      res(
        ctx.data({
          products: {
            total: 2,
            count: 2,
            offset: 0,
            results: [
              {
                id: 'prod-1',
                key: 'aurora-lamp',
                masterData: {
                  current: {
                    nameAllLocales: [{ locale: 'en-US', value: 'Aurora Lamp' }],
                    masterVariant: { sku: 'AUR-01', images: [] },
                  },
                  staged: null,
                },
              },
              {
                id: 'prod-2',
                key: 'stone-chair',
                masterData: {
                  current: {
                    nameAllLocales: [{ locale: 'en-US', value: 'Stone Chair' }],
                    masterVariant: { sku: 'STO-01', images: [] },
                  },
                  staged: null,
                },
              },
            ],
          },
        })
      )
    ),
    graphql.query('FetchProductTypesForLabels', (_req, res, ctx) =>
      res(
        ctx.data({
          productTypes: {
            total: 1,
            results: [
              {
                id: 'pt-default',
                key: 'lighting',
                name: 'Lighting',
                attributeDefinitions: {
                  results: [
                    {
                      name: 'brand',
                      labelAllLocales: [{ locale: 'en-US', value: 'Brand' }],
                      type: { name: 'text' },
                    },
                    {
                      name: 'badge',
                      labelAllLocales: [{ locale: 'en-US', value: 'Badge' }],
                      type: {
                        name: 'enum',
                        values: {
                          results: [{ key: 'new', label: 'New Arrival' }],
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        })
      )
    )
  );
}

describe('ProductLabels MC application', () => {
  it('renders labels table and supports search & status filtering', async () => {
    mockServer.use(
      graphql.query('FetchProductLabels', (_req, res, ctx) =>
        res(
          ctx.data({
            customObjects: {
              total: SAMPLE_LABELS.length,
              count: SAMPLE_LABELS.length,
              offset: 0,
              results: SAMPLE_LABELS,
            },
          })
        )
      )
    );

    renderApp();

    await screen.findByText('Flash Sale 20%');
    expect(screen.getByText('Lumina Spotlight')).toBeInTheDocument();
    expect(screen.getByText('Top left')).toBeInTheDocument();
    expect(screen.getByText('Bottom right')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      /filter labels by name, key, or text/i
    );
    fireEvent.change(searchInput, { target: { value: 'Lumina' } });

    expect(screen.queryByText('Flash Sale 20%')).not.toBeInTheDocument();
    expect(screen.getByText('Lumina Spotlight')).toBeInTheDocument();
  });

  it('creates a new product label and submits serialized Custom Object config', async () => {
    let submittedDraft: Record<string, unknown> | undefined;

    installDefaultCatalogHandlers();
    mockServer.use(
      graphql.query('FetchProductLabels', (_req, res, ctx) =>
        res(
          ctx.data({
            customObjects: {
              total: 0,
              count: 0,
              offset: 0,
              results: [],
            },
          })
        )
      ),
      graphql.mutation('UpsertProductLabel', (req, res, ctx) => {
        submittedDraft = req.variables.draft as Record<string, unknown>;
        return res(
          ctx.data({
            createOrUpdateCustomObject: {
              id: 'co-new',
              key: submittedDraft.key,
              version: 1,
              container: PRODUCT_LABELS_CONTAINER,
              createdAt: '2026-03-01T00:00:00.000Z',
              lastModifiedAt: '2026-03-01T00:00:00.000Z',
              value: JSON.parse(String(submittedDraft.value)),
            },
          })
        );
      })
    );

    renderApp({
      route: `/my-project/${entryPointUriPath}/labels/new`,
    });

    const nameInput = await screen.findByLabelText(/internal name/i);
    fireEvent.change(nameInput, { target: { value: 'Winter Promo' } });

    const textInput = screen.getByLabelText(/label text/i);
    fireEvent.change(textInput, { target: { value: 'HOT DEAL' } });

    const manualProductInput = screen.getByPlaceholderText(
      /or paste a commercetools product id or key/i
    );
    fireEvent.change(manualProductInput, { target: { value: 'prod-1' } });
    fireEvent.click(screen.getByRole('button', { name: /add id \/ key/i }));

    const previewBadge = screen.getByTestId('live-label-preview');
    expect(previewBadge).toHaveTextContent('HOT DEAL');

    const createButtons = screen.getAllByRole('button', {
      name: /create label/i,
    });
    fireEvent.click(createButtons[createButtons.length - 1]);

    const notification = await screen.findByRole('alertdialog');
    within(notification).getByText(/winter promo/i);

    expect(submittedDraft).toBeDefined();
    expect(submittedDraft?.container).toBe(PRODUCT_LABELS_CONTAINER);
    expect(submittedDraft?.key).toBe('winter-promo');
    const savedConfig = JSON.parse(String(submittedDraft?.value));
    expect(savedConfig.text).toBe('HOT DEAL');
    expect(savedConfig.position).toBe('top-left');
    expect(savedConfig.productIds).toEqual(['prod-1']);
    expect(savedConfig.customCss).toContain('background');
  });

  it('edits an existing label, updates attribute targeting, and deletes with confirmation', async () => {
    let updatedDraft: Record<string, unknown> | undefined;
    let deletedVars: Record<string, unknown> | undefined;
    let currentLabel = { ...SAMPLE_LABELS[0] };

    installDefaultCatalogHandlers();
    mockServer.use(
      graphql.query('FetchProductLabels', (_req, res, ctx) =>
        res(
          ctx.data({
            customObjects: {
              total: 1,
              count: 1,
              offset: 0,
              results: [currentLabel],
            },
          })
        )
      ),
      graphql.query('FetchProductLabelDetails', (_req, res, ctx) =>
        res(
          ctx.data({
            customObject: currentLabel,
          })
        )
      ),
      graphql.mutation('UpsertProductLabel', (req, res, ctx) => {
        updatedDraft = req.variables.draft as Record<string, unknown>;
        currentLabel = {
          ...currentLabel,
          version: currentLabel.version + 1,
          lastModifiedAt: '2026-03-02T00:00:00.000Z',
          value: JSON.parse(String(updatedDraft.value)),
        };
        return res(
          ctx.data({
            createOrUpdateCustomObject: currentLabel,
          })
        );
      }),
      graphql.mutation('DeleteProductLabel', (req, res, ctx) => {
        deletedVars = req.variables as Record<string, unknown>;
        return res(
          ctx.data({
            deleteCustomObject: {
              id: currentLabel.id,
              key: currentLabel.key,
            },
          })
        );
      })
    );

    renderApp({
      route: `/my-project/${entryPointUriPath}/labels/flash-sale-20`,
    });

    const textInput = (await screen.findByLabelText(
      /label text/i
    )) as HTMLInputElement;
    expect(textInput.value).toBe('SALE -20%');

    fireEvent.change(textInput, { target: { value: 'VIP -30%' } });
    fireEvent.click(screen.getByRole('button', { name: /save label/i }));

    const updateNotification = await screen.findByRole('alertdialog');
    within(updateNotification).getByText(/updated/i);

    expect(updatedDraft?.version).toBe(3);
    expect(JSON.parse(String(updatedDraft?.value)).text).toBe('VIP -30%');

    const deleteButton = screen.getByRole('button', { name: /delete label/i });
    fireEvent.click(deleteButton);

    const dialog = await screen.findByRole('dialog', {
      name: /delete product label/i,
    });
    const confirmDelete = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(deletedVars).toEqual({
        container: PRODUCT_LABELS_CONTAINER,
        key: 'flash-sale-20',
        version: 4,
      });
    });

    await waitFor(() => {
      const notifications = screen.getAllByRole('alertdialog');
      expect(
        notifications.some((node) => /deleted/i.test(node.textContent || ''))
      ).toBe(true);
    });
  });

  it('supports configuring attribute-based labels and bottom-right placement', async () => {
    let submittedDraft: Record<string, unknown> | undefined;

    installDefaultCatalogHandlers();
    mockServer.use(
      graphql.query('FetchProductLabels', (_req, res, ctx) =>
        res(
          ctx.data({
            customObjects: {
              total: 0,
              count: 0,
              offset: 0,
              results: [],
            },
          })
        )
      ),
      graphql.mutation('UpsertProductLabel', (req, res, ctx) => {
        submittedDraft = req.variables.draft as Record<string, unknown>;
        return res(
          ctx.data({
            createOrUpdateCustomObject: {
              id: 'co-attr',
              key: submittedDraft.key,
              version: 1,
              container: PRODUCT_LABELS_CONTAINER,
              createdAt: '2026-03-01T00:00:00.000Z',
              lastModifiedAt: '2026-03-01T00:00:00.000Z',
              value: JSON.parse(String(submittedDraft.value)),
            },
          })
        );
      })
    );

    renderApp({
      route: `/my-project/${entryPointUriPath}/labels/new`,
    });

    fireEvent.change(await screen.findByLabelText(/internal name/i), {
      target: { value: 'Lumina Brand Badge' },
    });
    fireEvent.change(screen.getByLabelText(/label text/i), {
      target: { value: 'LUMINA OFFICIAL' },
    });

    const positionSelect = screen.getByLabelText(/position on product image/i);
    fireEvent.focus(positionSelect);
    fireEvent.keyDown(positionSelect, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByText('Bottom right'));

    const targetRuleSelect = screen.getByLabelText(/target rule/i);
    fireEvent.focus(targetRuleSelect);
    fireEvent.keyDown(targetRuleSelect, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByText('Products sharing an attribute'));

    const attributePicker = screen.getByLabelText(/product attribute/i);
    fireEvent.focus(attributePicker);
    fireEvent.keyDown(attributePicker, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByText(/brand \(brand\)/i));

    const attributeValueInput = await screen.findByLabelText(
      /attribute value/i
    );
    fireEvent.change(attributeValueInput, { target: { value: 'Lumina' } });

    fireEvent.change(screen.getByLabelText(/custom css declarations/i), {
      target: {
        value: 'background: #1d4ed8; color: #ffffff; border-radius: 8px;',
      },
    });

    const createButtons = screen.getAllByRole('button', {
      name: /create label/i,
    });
    fireEvent.click(createButtons[createButtons.length - 1]);

    const notification = await screen.findByRole('alertdialog');
    within(notification).getByText(/lumina brand badge/i);

    const savedConfig = JSON.parse(String(submittedDraft?.value));
    expect(savedConfig.position).toBe('bottom-right');
    expect(savedConfig.targetMode).toBe('attribute');
    expect(savedConfig.attributeRule).toEqual(
      expect.objectContaining({
        attributeName: 'brand',
        operator: 'equals',
        value: 'Lumina',
      })
    );
    expect(savedConfig.customCss).toContain('#1d4ed8');
  });

  it('disables write actions when user only has View permission', async () => {
    installDefaultCatalogHandlers();
    mockServer.use(
      graphql.query('FetchProductLabels', (_req, res, ctx) =>
        res(
          ctx.data({
            customObjects: {
              total: 1,
              count: 1,
              offset: 0,
              results: [SAMPLE_LABELS[0]],
            },
          })
        )
      ),
      graphql.query('FetchProductLabelDetails', (_req, res, ctx) =>
        res(
          ctx.data({
            customObject: SAMPLE_LABELS[0],
          })
        )
      )
    );

    renderApp(
      {
        route: `/my-project/${entryPointUriPath}/labels/flash-sale-20`,
      },
      false
    );

    const textInput = await screen.findByLabelText(/label text/i);
    expect(textInput).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: /save label/i })).toBeDisabled();
  });
});
