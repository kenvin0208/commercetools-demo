import { useIntl } from 'react-intl';
import Card from '@commercetools-uikit/card';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import {
  formatPositionLabel,
  parseCustomCss,
  type TProductLabelPosition,
} from '../../label-utils';

type TLiveProductCardPreviewProps = {
  text: string;
  position: TProductLabelPosition;
  customCss?: string;
};

const CORNER_STYLE: Record<
  TProductLabelPosition,
  { top?: number; bottom?: number; left?: number; right?: number }
> = {
  'top-left': { top: 10, left: 10 },
  'top-right': { top: 10, right: 10 },
  'bottom-left': { bottom: 10, left: 10 },
  'bottom-right': { bottom: 10, right: 10 },
};

const LiveProductCardPreview = ({
  text,
  position,
  customCss,
}: TLiveProductCardPreviewProps) => {
  const intl = useIntl();
  const parsedStyle = parseCustomCss(customCss);
  const displayText = text.trim() || 'LABEL TEXT';

  return (
    <Card theme="light" type="flat">
      <Spacings.Stack scale="s">
        <Text.Subheadline as="h4">
          {intl.formatMessage({
            id: 'ProductLabelPreview.title',
            defaultMessage: 'Live Product Card Preview',
          })}
        </Text.Subheadline>
        <Text.Detail tone="secondary">
          {intl.formatMessage(
            {
              id: 'ProductLabelPreview.positionHint',
              defaultMessage: 'Position: {position}',
            },
            { position: formatPositionLabel(position) }
          )}
        </Text.Detail>

        <div
          style={{
            width: '100%',
            maxWidth: 260,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 5',
              background:
                'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>

            <div
              style={{
                position: 'absolute',
                zIndex: 2,
                maxWidth: 'calc(100% - 20px)',
                ...CORNER_STYLE[position],
              }}
            >
              <span
                data-testid="live-label-preview"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderRadius: 6,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.18)',
                  ...parsedStyle,
                }}
              >
                {displayText}
              </span>
            </div>
          </div>

          <div style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.16em',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Sample Product
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Aurora Table Lamp
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              $129.00
            </div>
          </div>
        </div>
      </Spacings.Stack>
    </Card>
  );
};
LiveProductCardPreview.displayName = 'LiveProductCardPreview';

export default LiveProductCardPreview;
