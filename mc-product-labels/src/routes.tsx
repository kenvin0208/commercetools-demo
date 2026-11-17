import type { ReactNode } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import Spacings from '@commercetools-uikit/spacings';
import ProductLabels from './components/product-labels';

type ApplicationRoutesProps = {
  children?: ReactNode;
};

const ApplicationRoutes = (_props: ApplicationRoutesProps) => {
  const match = useRouteMatch();

  return (
    <Spacings.Inset scale="l">
      <Switch>
        <Route path={`${match.path}/labels`}>
          <ProductLabels />
        </Route>
        <Redirect from={match.path} to={`${match.url}/labels`} />
      </Switch>
    </Spacings.Inset>
  );
};
ApplicationRoutes.displayName = 'ApplicationRoutes';

export default ApplicationRoutes;
