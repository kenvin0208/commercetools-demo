import { lazy } from 'react';

const ProductLabelDetails = lazy(
  () =>
    import(
      './product-label-details' /* webpackChunkName: "product-label-details" */
    )
);

export default ProductLabelDetails;
