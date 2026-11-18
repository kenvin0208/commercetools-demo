import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import {
  mapResourceAccessToAppliedPermissions,
  screen,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { entryPointUriPath, PERMISSIONS } from '../../constants';
import ApplicationRoutes from '../../routes';
import { renderApplicationWithRedux } from '../../test-utils';

const mockServer = setupServer();
beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

const renderApp = (options: Partial<TRenderAppWithReduxOptions> = {}) => {
  const route = options.route || `/my-project/${entryPointUriPath}`;
  const { history } = renderApplicationWithRedux(<ApplicationRoutes />, {
    route,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
      ]),
    },
    ...options,
  });
  return { history };
};

it('should render the Store Locator page', async () => {
  mockServer.use(
    graphql.query('FetchStores', (_req, res, ctx) =>
      res(
        ctx.data({
          stores: {
            total: 0,
            count: 0,
            offset: 0,
            exists: false,
            results: [],
          },
        })
      )
    ),
    graphql.query('FetchStoreLocatorType', (_req, res, ctx) =>
      res(ctx.data({ typeDefinition: null }))
    )
  );
  renderApp();
  await screen.findByText('Store Locator');
  expect(await screen.findByText(/No stores yet/)).toBeInTheDocument();
});
